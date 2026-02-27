import asyncpg
from neo4j import GraphDatabase
import logging
import os
import warnings
from transformers import logging as transformers_logging, AutoTokenizer, AutoModel
import torch
import numpy as np

# Suppress ALL warnings before importing sentence-transformers
warnings.filterwarnings('ignore')
transformers_logging.set_verbosity_error()
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

from sentence_transformers import SentenceTransformer
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingModel:
    """Wrapper for both SentenceTransformer and HuggingFace models"""
    def __init__(self):
        self.model_name = settings.embedding_model
        self.is_hf_model = self.model_name.startswith('pplx-')
        
        if self.is_hf_model:
            # Use HuggingFace transformers for pplx models
            hf_model_name = "perplexity-ai/pplx-embed-v1-0.6B"
            
            import sys
            from io import StringIO
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            try:
                self.tokenizer = AutoTokenizer.from_pretrained(
                    hf_model_name,
                    token=settings.hf_token if settings.hf_token else None
                )
                self.model = AutoModel.from_pretrained(
                    hf_model_name,
                    token=settings.hf_token if settings.hf_token else None,
                    trust_remote_code=True
                )
                # Get actual dimension from model config
                self.dimension = self.model.config.hidden_size
                self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
                self.model.to(self.device)
                self.model.eval()
            finally:
                sys.stdout = old_stdout
            
            logger.info(f"Using HuggingFace embedding: {hf_model_name} (dim={self.dimension}) on {self.device}")
        else:
            # Load local SentenceTransformer model
            import sys
            from io import StringIO
            old_stdout = sys.stdout
            sys.stdout = StringIO()
            
            try:
                self.local_model = SentenceTransformer(
                    self.model_name,
                    use_auth_token=settings.hf_token if settings.hf_token else None
                )
                self.dimension = self.local_model.get_sentence_embedding_dimension()
            finally:
                sys.stdout = old_stdout
            logger.info(f"Using SentenceTransformer: {self.model_name}")
    
    def encode(self, text):
        """Encode text to embedding vector"""
        if self.is_hf_model:
            return self._encode_hf(text)
        else:
            return self.local_model.encode(text)
    
    def _encode_hf(self, text):
        """Encode using HuggingFace transformers"""
        try:
            with torch.no_grad():
                inputs = self.tokenizer(
                    text if isinstance(text, list) else [text],
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors='pt'
                ).to(self.device)
                
                outputs = self.model(**inputs)
                embeddings = outputs.last_hidden_state.mean(dim=1).cpu().numpy()
                
                return embeddings[0] if not isinstance(text, list) else embeddings
        except Exception as e:
            logger.error(f"HuggingFace embedding failed: {e}")
            return np.zeros(self.dimension)

class DatabaseManager:
    def __init__(self):
        self.pg_pool = None
        self.neo4j_driver = None
        
        # Set HuggingFace token if available
        if settings.hf_token and settings.hf_token != "your_hf_token_here":
            os.environ['HF_TOKEN'] = settings.hf_token
            os.environ['HUGGING_FACE_HUB_TOKEN'] = settings.hf_token
        
        # Initialize embedding model
        self.embedding_model = EmbeddingModel()
    
    async def init_postgres(self):
        try:
            self.pg_pool = await asyncpg.create_pool(settings.database_url)
            # Create required tables with all columns
            async with self.pg_pool.acquire() as conn:
                # Create vector extension first
                await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
                
                # Create documents table with all required columns
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS documents (
                        id SERIAL PRIMARY KEY,
                        filename VARCHAR(255) NOT NULL,
                        content TEXT,
                        metadata JSONB,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                
                # Check if chunks table exists and get current dimension
                table_exists = await conn.fetchval("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'chunks'
                    )
                """)
                
                if table_exists:
                    # Check current embedding dimension
                    current_dim = await conn.fetchval("""
                        SELECT atttypmod 
                        FROM pg_attribute 
                        WHERE attrelid = 'chunks'::regclass 
                        AND attname = 'embedding'
                    """)
                    
                    if current_dim and current_dim != self.embedding_model.dimension:
                        logger.warning(f"Embedding dimension changed: {current_dim} -> {self.embedding_model.dimension}")
                        logger.warning("Dropping and recreating chunks table...")
                        await conn.execute("DROP TABLE IF EXISTS chunks CASCADE")
                        table_exists = False
                
                if not table_exists:
                    # Create chunks table with correct dimension
                    await conn.execute(f"""
                        CREATE TABLE chunks (
                            id SERIAL PRIMARY KEY,
                            document_id INTEGER REFERENCES documents(id),
                            content TEXT NOT NULL,
                            embedding vector({self.embedding_model.dimension}),
                            chunk_index INTEGER,
                            metadata JSONB,
                            created_at TIMESTAMP DEFAULT NOW()
                        )
                    """)
                
                # Create holographic storage table
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS holographic_storage (
                        doc_id INTEGER PRIMARY KEY REFERENCES documents(id),
                        interference_pattern BYTEA,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                
                # Create feedback table
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS feedback (
                        id SERIAL PRIMARY KEY,
                        message_id BIGINT UNIQUE,
                        feedback_type VARCHAR(20) NOT NULL,
                        comment TEXT,
                        created_at TIMESTAMP DEFAULT NOW(),
                        updated_at TIMESTAMP DEFAULT NOW()
                    )
                """)
                
                # Ensure all columns exist (for existing tables)
                await conn.execute("ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB")
                await conn.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS metadata JSONB")
                await conn.execute("ALTER TABLE chunks ADD COLUMN IF NOT EXISTS chunk_index INTEGER")
                
            logger.info("PostgreSQL connection established and tables created")
        except Exception as e:
            logger.error(f"PostgreSQL connection failed: {e}")
            raise
    
    def init_neo4j(self):
        try:
            self.neo4j_driver = GraphDatabase.driver(
                settings.neo4j_url,
                auth=(settings.neo4j_user, settings.neo4j_password)
            )
            self.neo4j_database = settings.neo4j_database
            
            # Test connection and create constraints
            with self.neo4j_driver.session(database=self.neo4j_database) as session:
                # Test connection
                result = session.run("RETURN 1 as test")
                result.single()
                
                # Create constraints
                session.run("CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE")
                session.run("CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE")
                
            logger.info(f"✓ Neo4j connection established (database: {self.neo4j_database})")
        except Exception as e:
            logger.error(f"✗ Neo4j connection failed: {e}")
            logger.error(f"   URL: {settings.neo4j_url}")
            logger.error(f"   Database: {settings.neo4j_database}")
            self.neo4j_driver = None
            self.neo4j_database = None
    
    async def close(self):
        if self.pg_pool:
            await self.pg_pool.close()
        if self.neo4j_driver:
            self.neo4j_driver.close()

db_manager = DatabaseManager()
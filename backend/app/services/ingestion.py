import re
import asyncio
import numpy as np
import json
from typing import List, Dict, Any
from pypdf import PdfReader
from docx import Document
from app.core.database import db_manager
from app.core.config import settings
from app.services.holographic_storage import holographic_storage

class AgenticChunker:
    def __init__(self):
        self.min_chunk_size = 150
        self.max_chunk_size = 800
    
    async def extract_text(self, file_path: str) -> str:
        """Extract text from PDF or DOCX files"""
        if file_path.endswith('.pdf'):
            reader = PdfReader(file_path)
            return "\n".join([(page.extract_text() or "") for page in reader.pages])
        elif file_path.endswith('.docx'):
            doc = Document(file_path)
            return "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
    
    def semantic_chunking(self, text: str) -> List[str]:
        """
        Improved semantic chunking with multiple strategies
        """
        # Clean text first
        text = re.sub(r'\s+', ' ', text).strip()
        
        if len(text) < self.min_chunk_size:
            return [text] if text else []
        
        chunks = []
        
        # Strategy 1: Split by sentences first
        sentences = re.split(r'(?<=[.!?])\s+', text)
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # Check if adding this sentence exceeds max size
            potential_chunk = current_chunk + " " + sentence if current_chunk else sentence
            
            if len(potential_chunk) > self.max_chunk_size:
                # If current chunk is big enough, save it
                if len(current_chunk) >= self.min_chunk_size:
                    chunks.append(current_chunk.strip())
                    current_chunk = sentence
                else:
                    # If current chunk too small, force split the sentence
                    if len(sentence) > self.max_chunk_size:
                        # Split long sentence by words
                        words = sentence.split()
                        word_chunk = ""
                        for word in words:
                            if len(word_chunk + " " + word) > self.max_chunk_size:
                                if len(word_chunk) >= self.min_chunk_size:
                                    chunks.append(word_chunk.strip())
                                word_chunk = word
                            else:
                                word_chunk += " " + word if word_chunk else word
                        current_chunk = word_chunk
                    else:
                        current_chunk = potential_chunk
            else:
                current_chunk = potential_chunk
        
        # Add the last chunk
        if current_chunk.strip() and len(current_chunk) >= self.min_chunk_size:
            chunks.append(current_chunk.strip())
        
        # If no good chunks, create overlapping chunks
        if not chunks and len(text) > self.min_chunk_size:
            for i in range(0, len(text), self.max_chunk_size // 2):
                chunk = text[i:i + self.max_chunk_size]
                if len(chunk) >= self.min_chunk_size:
                    chunks.append(chunk)
        
        return chunks
    
    def extract_metadata(self, text: str, filename: str) -> Dict[str, Any]:
        """Extract metadata for MAGMA graphs"""
        metadata = {"filename": filename}
        
        # Extract authors (simple regex pattern)
        author_pattern = r'(?:Author[s]?|By):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'
        authors = re.findall(author_pattern, text, re.IGNORECASE)
        if authors:
            metadata["authors"] = authors
        
        # Extract dates
        date_pattern = r'\b(?:19|20)\d{2}\b'
        dates = re.findall(date_pattern, text)
        if dates:
            metadata["year"] = max(dates)  # Use most recent year
        
        # Extract institutions
        institution_pattern = r'University|Institute|Laboratory|College|School'
        institutions = re.findall(institution_pattern, text, re.IGNORECASE)
        if institutions:
            metadata["institutions"] = list(set(institutions))
        
        return metadata
    
    async def process_document(self, file_path: str) -> int:
        """Process document and store in MAGMA system"""
        text = await self.extract_text(file_path)
        filename = file_path.split('\\')[-1] if '\\' in file_path else file_path.split('/')[-1]
        metadata = self.extract_metadata(text, filename)
        doc_embedding = db_manager.embedding_model.encode(text).tolist()
        
        # Store document in PostgreSQL
        async with db_manager.pg_pool.acquire() as conn:
            doc_id = await conn.fetchval(
                "INSERT INTO documents (filename, content, metadata) VALUES ($1, $2, $3) RETURNING id",
                filename, text, json.dumps(metadata)
            )
            
            # Chunk and store
            chunks = self.semantic_chunking(text)
            chunk_ids = []
            
            for i, chunk in enumerate(chunks):
                embedding = db_manager.embedding_model.encode(chunk).tolist()
                # Convert embedding to string format for PostgreSQL vector
                embedding_vector = '[' + ','.join(map(str, embedding)) + ']'
                chunk_id = await conn.fetchval(
                    "INSERT INTO chunks (document_id, content, embedding, chunk_index, metadata) VALUES ($1, $2, $3::vector, $4, $5) RETURNING id",
                    doc_id, chunk, embedding_vector, i, json.dumps({"chunk_type": "semantic"})
                )
                chunk_ids.append((chunk_id, i))
        
        # Store in Neo4j graph database
        if db_manager.neo4j_driver:
            try:
                with db_manager.neo4j_driver.session(database=db_manager.neo4j_database) as session:
                    # Create document node
                    session.run("""
                        MERGE (d:Document {id: $doc_id})
                        SET d.filename = $filename, 
                            d.metadata = $metadata,
                            d.created_at = datetime()
                    """, doc_id=doc_id, filename=filename, metadata=json.dumps(metadata))
                    
                    # Create chunk nodes and relationships
                    for chunk_id, chunk_index in chunk_ids:
                        session.run("""
                            MATCH (d:Document {id: $doc_id})
                            MERGE (c:Chunk {id: $chunk_id})
                            SET c.document_id = $doc_id, 
                                c.chunk_index = $chunk_index,
                                c.created_at = datetime()
                            MERGE (d)-[:CONTAINS]->(c)
                        """, doc_id=doc_id, chunk_id=chunk_id, chunk_index=chunk_index)
                    
                    print(f"✓ Stored document {doc_id} with {len(chunk_ids)} chunks in Neo4j")
            except Exception as e:
                print(f"✗ Neo4j storage failed: {e}")
                # Continue even if Neo4j fails - data is in PostgreSQL
        
        # Store holographic representation of document
        await holographic_storage.encode_document_hologram(doc_id, np.array(doc_embedding))
        
        return doc_id

chunker = AgenticChunker()

import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import db_manager
from app.services.ingestion import chunker

async def test_upload():
    """Test document upload process"""
    print("Initializing databases...")
    await db_manager.init_postgres()
    db_manager.init_neo4j()
    
    print("Testing embedding model...")
    test_text = "This is a test sentence."
    embedding = db_manager.embedding_model.encode(test_text)
    print(f"Embedding shape: {embedding.shape}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_upload())

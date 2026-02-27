"""
Comprehensive System Test Script
Tests all components of the AI Research Agent
"""

import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

async def test_system():
    """Run comprehensive system tests"""
    
    print("=" * 80)
    print("AI RESEARCH AGENT - COMPREHENSIVE SYSTEM TEST")
    print("=" * 80)
    
    errors = []
    warnings = []
    
    # Test 1: Environment Variables
    print("\n[1/10] Testing Environment Variables...")
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        required_vars = [
            'DATABASE_URL',
            'NEO4J_URL',
            'NEO4J_USER',
            'NEO4J_PASSWORD',
            'GEMINI_API_KEY'
        ]
        
        for var in required_vars:
            value = os.getenv(var)
            if not value or value == f"your_{var.lower()}_here":
                errors.append(f"Missing or invalid {var}")
            else:
                print(f"  ✓ {var}: {'*' * 10}")
        
        if not errors:
            print("  ✓ All environment variables configured")
    except Exception as e:
        errors.append(f"Environment test failed: {e}")
    
    # Test 2: Configuration
    print("\n[2/10] Testing Configuration...")
    try:
        from app.core.config import settings
        print(f"  ✓ Database URL: {settings.database_url[:30]}...")
        print(f"  ✓ Neo4j URL: {settings.neo4j_url}")
        print(f"  ✓ Gemini Model: {settings.drafter_model}")
        print(f"  ✓ Embedding Model: {settings.embedding_model}")
    except Exception as e:
        errors.append(f"Configuration test failed: {e}")
    
    # Test 3: Database Manager
    print("\n[3/10] Testing Database Manager...")
    try:
        from app.core.database import db_manager
        print(f"  ✓ Embedding model loaded: {type(db_manager.embedding_model).__name__}")
    except Exception as e:
        errors.append(f"Database manager test failed: {e}")
    
    # Test 4: PostgreSQL Connection
    print("\n[4/10] Testing PostgreSQL Connection...")
    try:
        await db_manager.init_postgres()
        async with db_manager.pg_pool.acquire() as conn:
            result = await conn.fetchval("SELECT 1")
            if result == 1:
                print("  ✓ PostgreSQL connection successful")
                
                # Check tables
                tables = await conn.fetch("""
                    SELECT table_name FROM information_schema.tables 
                    WHERE table_schema = 'public'
                """)
                table_names = [t['table_name'] for t in tables]
                
                required_tables = ['documents', 'chunks', 'holographic_storage', 'feedback']
                for table in required_tables:
                    if table in table_names:
                        print(f"  ✓ Table '{table}' exists")
                    else:
                        warnings.append(f"Table '{table}' not found")
    except Exception as e:
        errors.append(f"PostgreSQL test failed: {e}")
    
    # Test 5: Neo4j Connection
    print("\n[5/10] Testing Neo4j Connection...")
    try:
        db_manager.init_neo4j()
        if db_manager.neo4j_driver:
            with db_manager.neo4j_driver.session(database=db_manager.neo4j_database) as session:
                result = session.run("RETURN 1 as test")
                if result.single()["test"] == 1:
                    print("  ✓ Neo4j connection successful")
                    print(f"  ✓ Database: {db_manager.neo4j_database}")
        else:
            warnings.append("Neo4j driver not initialized")
    except Exception as e:
        warnings.append(f"Neo4j test failed: {e}")
    
    # Test 6: Embedding Model
    print("\n[6/10] Testing Embedding Model...")
    try:
        test_text = "This is a test sentence for embedding."
        embedding = db_manager.embedding_model.encode(test_text)
        print(f"  ✓ Embedding generated: shape {embedding.shape}")
        print(f"  ✓ Embedding dimension: {len(embedding)}")
    except Exception as e:
        errors.append(f"Embedding model test failed: {e}")
    
    # Test 7: Gemini API
    print("\n[7/10] Testing Gemini API...")
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content("Say 'test successful' in 2 words")
        print(f"  ✓ Gemini API working")
        print(f"  ✓ Response: {response.text[:50]}...")
    except Exception as e:
        errors.append(f"Gemini API test failed: {e}")
    
    # Test 8: Document Ingestion
    print("\n[8/10] Testing Document Ingestion...")
    try:
        from app.services.ingestion import chunker
        test_text = "This is a test document. " * 100
        chunks = chunker.semantic_chunking(test_text)
        print(f"  ✓ Chunking works: {len(chunks)} chunks created")
        
        metadata = chunker.extract_metadata(test_text, "test.pdf")
        print(f"  ✓ Metadata extraction works")
    except Exception as e:
        errors.append(f"Document ingestion test failed: {e}")
    
    # Test 9: Retrieval Services
    print("\n[9/10] Testing Retrieval Services...")
    try:
        from app.services.quantum_retrieval import quantum_retriever
        from app.services.neuromorphic_memory import neuromorphic_memory
        from app.services.holographic_storage import holographic_storage
        from app.services.swarm_retrieval import swarm_retriever
        from app.services.temporal_causality import temporal_engine
        
        print(f"  ✓ Quantum retriever loaded")
        print(f"  ✓ Neuromorphic memory loaded")
        print(f"  ✓ Holographic storage loaded")
        print(f"  ✓ Swarm retriever loaded")
        print(f"  ✓ Temporal engine loaded")
    except Exception as e:
        errors.append(f"Retrieval services test failed: {e}")
    
    # Test 10: Speculative RAG
    print("\n[10/10] Testing Speculative RAG...")
    try:
        from app.services.gemini_speculative_rag import gemini_speculative_rag
        if gemini_speculative_rag.available:
            print(f"  ✓ Gemini Speculative RAG available")
        else:
            warnings.append("Gemini Speculative RAG not available")
    except Exception as e:
        errors.append(f"Speculative RAG test failed: {e}")
    
    # Cleanup
    print("\n[Cleanup] Closing connections...")
    try:
        await db_manager.close()
        print("  ✓ Connections closed")
    except Exception as e:
        warnings.append(f"Cleanup warning: {e}")
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    if not errors and not warnings:
        print("✓ ALL TESTS PASSED - System is fully operational!")
        print("\nYou can now:")
        print("1. Start the backend: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080")
        print("2. Upload documents via /upload endpoint")
        print("3. Query documents via /query endpoint")
        return True
    
    if warnings:
        print(f"\n⚠️  WARNINGS ({len(warnings)}):")
        for warning in warnings:
            print(f"  - {warning}")
    
    if errors:
        print(f"\n✗ ERRORS ({len(errors)}):")
        for error in errors:
            print(f"  - {error}")
        print("\nPlease fix the errors above before running the system.")
        return False
    
    print("\n✓ TESTS PASSED with warnings - System should work but check warnings")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_system())
    sys.exit(0 if success else 1)

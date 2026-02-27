import asyncio
import sys
from sqlalchemy import create_engine, text
from neo4j import GraphDatabase
from app.core.config import settings

# Fix Windows encoding
sys.stdout.reconfigure(encoding='utf-8')

async def test_postgresql():
    """Test PostgreSQL connection"""
    try:
        engine = create_engine(settings.database_url)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print("[OK] PostgreSQL Connected!")
            print(f"     Version: {version[:50]}...")
            return True
    except Exception as e:
        print(f"[FAIL] PostgreSQL Connection Failed: {e}")
        return False

def test_neo4j():
    """Test Neo4j connection"""
    try:
        driver = GraphDatabase.driver(
            settings.neo4j_url,
            auth=(settings.neo4j_user, settings.neo4j_password)
        )
        with driver.session(database=settings.neo4j_database) as session:
            result = session.run("RETURN 'Connection successful' AS message")
            message = result.single()["message"]
            print("[OK] Neo4j Connected!")
            print(f"     Message: {message}")
        driver.close()
        return True
    except Exception as e:
        print(f"[FAIL] Neo4j Connection Failed: {e}")
        return False

async def main():
    print("Testing Database Connections...\n")
    
    pg_status = await test_postgresql()
    print()
    neo4j_status = test_neo4j()
    
    print("\n" + "="*50)
    if pg_status and neo4j_status:
        print("[SUCCESS] All databases connected!")
    else:
        print("[ERROR] Some database connections failed")
    print("="*50)

if __name__ == "__main__":
    asyncio.run(main())

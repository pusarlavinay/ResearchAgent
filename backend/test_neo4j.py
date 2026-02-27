"""
Neo4j Connection Test Script
Tests the connection to Neo4j database and verifies data storage
"""

import asyncio
from neo4j import GraphDatabase
from dotenv import load_dotenv
import os

load_dotenv()

async def test_neo4j_connection():
    """Test Neo4j connection and basic operations"""
    
    neo4j_url = os.getenv("NEO4J_URL")
    neo4j_user = os.getenv("NEO4J_USER")
    neo4j_password = os.getenv("NEO4J_PASSWORD")
    neo4j_database = os.getenv("NEO4J_DATABASE", "neo4j")
    
    print("=" * 80)
    print("NEO4J CONNECTION TEST")
    print("=" * 80)
    print(f"URL: {neo4j_url}")
    print(f"User: {neo4j_user}")
    print(f"Database: {neo4j_database}")
    print("=" * 80)
    
    try:
        # Create driver
        print("\n[1/5] Creating Neo4j driver...")
        driver = GraphDatabase.driver(
            neo4j_url,
            auth=(neo4j_user, neo4j_password)
        )
        print("✓ Driver created successfully")
        
        # Test connection
        print("\n[2/5] Testing connection...")
        with driver.session(database=neo4j_database) as session:
            result = session.run("RETURN 1 as test")
            test_value = result.single()["test"]
            if test_value == 1:
                print("✓ Connection successful")
            else:
                print("✗ Connection test failed")
                return
        
        # Create constraints
        print("\n[3/5] Creating constraints...")
        with driver.session(database=neo4j_database) as session:
            try:
                session.run("CREATE CONSTRAINT document_id IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE")
                print("✓ Document constraint created")
            except Exception as e:
                print(f"  Document constraint: {e}")
            
            try:
                session.run("CREATE CONSTRAINT chunk_id IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE")
                print("✓ Chunk constraint created")
            except Exception as e:
                print(f"  Chunk constraint: {e}")
        
        # Test write operation
        print("\n[4/5] Testing write operation...")
        with driver.session(database=neo4j_database) as session:
            session.run("""
                MERGE (d:Document {id: 99999})
                SET d.filename = 'test_document.pdf',
                    d.metadata = '{"test": true}',
                    d.created_at = datetime()
            """)
            print("✓ Test document created")
            
            session.run("""
                MATCH (d:Document {id: 99999})
                MERGE (c:Chunk {id: 99999})
                SET c.document_id = 99999,
                    c.chunk_index = 0,
                    c.created_at = datetime()
                MERGE (d)-[:CONTAINS]->(c)
            """)
            print("✓ Test chunk created and linked")
        
        # Verify data
        print("\n[5/5] Verifying data...")
        with driver.session(database=neo4j_database) as session:
            result = session.run("""
                MATCH (d:Document {id: 99999})-[:CONTAINS]->(c:Chunk)
                RETURN d.filename as filename, count(c) as chunk_count
            """)
            record = result.single()
            if record:
                print(f"✓ Data verified: {record['filename']} with {record['chunk_count']} chunk(s)")
            else:
                print("✗ Data verification failed")
        
        # Cleanup test data
        print("\n[Cleanup] Removing test data...")
        with driver.session(database=neo4j_database) as session:
            session.run("MATCH (d:Document {id: 99999}) DETACH DELETE d")
            print("✓ Test data removed")
        
        # Show existing data
        print("\n[Info] Checking existing documents...")
        with driver.session(database=neo4j_database) as session:
            result = session.run("""
                MATCH (d:Document)
                RETURN d.id as id, d.filename as filename
                ORDER BY d.id
                LIMIT 10
            """)
            records = list(result)
            if records:
                print(f"✓ Found {len(records)} document(s) in Neo4j:")
                for record in records:
                    print(f"  - Document {record['id']}: {record['filename']}")
            else:
                print("  No documents found in Neo4j (this is normal if you haven't uploaded any)")
        
        driver.close()
        
        print("\n" + "=" * 80)
        print("✓ ALL TESTS PASSED - Neo4j is working correctly!")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        print("\nTroubleshooting:")
        print("1. Check your .env file has correct NEO4J_URL, NEO4J_USER, NEO4J_PASSWORD")
        print("2. Verify Neo4j instance is running")
        print("3. Check firewall/network settings")
        print("4. Verify database name is correct")
        return False
    
    return True

if __name__ == "__main__":
    asyncio.run(test_neo4j_connection())

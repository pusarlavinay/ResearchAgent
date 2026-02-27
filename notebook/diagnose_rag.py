"""
RAG System Diagnostic - Find the root cause of 17.5% accuracy
"""
import requests
import sys

BACKEND_URL = "http://localhost:8080"

def diagnose_rag_system():
    """Run comprehensive diagnostics"""
    
    print("\n" + "="*80)
    print("RAG SYSTEM DIAGNOSTIC")
    print("="*80)
    
    issues = []
    
    # 1. Check backend connectivity
    print("\n1 Checking backend connectivity...")
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=5)
        if response.status_code == 200:
            print("    Backend is running")
        else:
            print(f"    Backend returned status {response.status_code}")
            issues.append("Backend not healthy")
    except Exception as e:
        print(f"    Cannot connect to backend: {e}")
        issues.append("Backend not accessible")
        return issues
    
    # 2. Check documents in database
    print("\n2 Checking documents in database...")
    try:
        response = requests.get(f"{BACKEND_URL}/documents", timeout=5)
        if response.status_code == 200:
            docs = response.json()
            doc_count = len(docs) if isinstance(docs, list) else docs.get('count', 0)
            print(f"    Documents in database: {doc_count}")
            if doc_count == 0:
                print("    CRITICAL: No documents uploaded!")
                issues.append("No documents in database - upload PDFs first")
            else:
                print("    Documents exist")
        else:
            print(f"     Cannot check documents: {response.status_code}")
    except Exception as e:
        print(f"     Cannot check documents: {e}")
    
    # 3. Test query endpoint
    print("\n3 Testing query endpoint...")
    try:
        test_query = "test query"
        response = requests.post(
            f"{BACKEND_URL}/query",
            json={'query': test_query},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("    Query endpoint works")
            
            # Check response structure
            has_answer = 'answer' in result or 'response' in result
            has_sources = 'sources' in result or 'retrieved_documents' in result
            
            print(f"    Has answer field: {has_answer}")
            print(f"    Has sources field: {has_sources}")
            
            if has_answer:
                answer = result.get('answer', result.get('response', ''))
                print(f"    Answer length: {len(answer)} chars")
                if len(answer) < 10:
                    print("    Answer too short - generation may be broken")
                    issues.append("Answer generation producing empty/short responses")
            else:
                print("    No answer field in response")
                issues.append("Response missing answer field")
            
            if has_sources:
                sources = result.get('sources', result.get('retrieved_documents', []))
                print(f"    Retrieved sources: {len(sources)}")
                if len(sources) == 0:
                    print("    No sources retrieved - retrieval is broken")
                    issues.append("Retrieval returning 0 documents")
                else:
                    print("    Retrieval working")
                    # Check source content
                    if sources and len(sources) > 0:
                        first_source = sources[0]
                        has_content = 'content' in first_source or 'text' in first_source
                        print(f"    Sources have content: {has_content}")
                        if not has_content:
                            issues.append("Retrieved sources missing content field")
            else:
                print("    No sources field in response")
                issues.append("Response missing sources field")
                
        else:
            print(f"    Query failed with status {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            issues.append(f"Query endpoint error: {response.status_code}")
            
    except Exception as e:
        print(f"    Query test failed: {e}")
        issues.append(f"Query endpoint exception: {str(e)}")
    
    # 4. Check API keys
    print("\n4 Checking API configuration...")
    import os
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        print(f"    GEMINI_API_KEY is set ({gemini_key[:10]}...)")
    else:
        print("    GEMINI_API_KEY not set")
        issues.append("GEMINI_API_KEY environment variable missing")
    
    # Summary
    print("\n" + "="*80)
    print("DIAGNOSTIC SUMMARY")
    print("="*80)
    
    if not issues:
        print("\nNo critical issues found!")
        print("\nPossible causes of low accuracy:")
        print("  1. Poor document quality or chunking")
        print("  2. Embedding model not suitable for your domain")
        print("  3. Generation prompt not enforcing context usage")
        print("  4. Low-quality documents being retrieved")
    else:
        print(f"\nFound {len(issues)} critical issues:\n")
        for i, issue in enumerate(issues, 1):
            print(f"  {i}. {issue}")
        
        print("\nRECOMMENDED FIXES:")
        
        if "No documents in database" in str(issues):
            print("\n   UPLOAD DOCUMENTS:")
            print("     1. Place PDF files in backend/data/ folder")
            print("     2. Use the upload endpoint or UI to add documents")
            print("     3. Verify with: GET /documents")
        
        if "Retrieval returning 0 documents" in str(issues):
            print("\n   FIX RETRIEVAL:")
            print("     1. Check if embeddings are being generated")
            print("     2. Verify vector database (pgvector) is working")
            print("     3. Check similarity threshold settings")
        
        if "Answer generation" in str(issues):
            print("\n   FIX GENERATION:")
            print("     1. Verify GEMINI_API_KEY is valid")
            print("     2. Check generation prompts")
            print("     3. Ensure context is being passed to LLM")
        
        if "GEMINI_API_KEY" in str(issues):
            print("\n   SET API KEY:")
            print("     1. Get key from: https://makersuite.google.com/app/apikey")
            print("     2. Set in .env file: GEMINI_API_KEY=your_key_here")
            print("     3. Restart backend")
    
    print("\n" + "="*80)
    print("NEXT STEPS:")
    print("="*80)
    print("\n1. Fix all critical issues above")
    print("2. Install production dependencies:")
    print("   pip install rank-bm25 sentence-transformers")
    print("3. Use the production RAG service:")
    print("   python backend/app/services/production_rag.py")
    print("4. Re-run metrics test:")
    print("   python notebook/test_rag_metrics.py")
    print("\n")
    
    return issues


if __name__ == "__main__":
    issues = diagnose_rag_system()
    sys.exit(len(issues))  # Exit code = number of issues


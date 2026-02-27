"""
Startup Validation Script
Quick health check before starting the server
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

def validate_startup():
    """Validate system before startup"""
    
    print("🚀 AI Research Agent - Startup Validation")
    print("=" * 60)
    
    issues = []
    
    # 1. Check .env file
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        issues.append("❌ .env file not found")
        return False
    
    load_dotenv()
    print("✓ .env file loaded")
    
    # 2. Check critical environment variables
    critical_vars = {
        'DATABASE_URL': 'PostgreSQL connection',
        'NEO4J_URL': 'Neo4j connection',
        'NEO4J_USER': 'Neo4j authentication',
        'NEO4J_PASSWORD': 'Neo4j authentication',
        'GEMINI_API_KEY': 'AI model access',
    }
    
    for var, description in critical_vars.items():
        value = os.getenv(var)
        if not value or 'your_' in value.lower():
            issues.append(f"❌ {var} not configured ({description})")
        else:
            print(f"✓ {var} configured")
    
    # 3. Check optional but recommended
    optional_vars = {
        'HF_TOKEN': 'HuggingFace downloads',
    }
    
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if not value or 'your_' in value.lower():
            print(f"⚠️  {var} not set ({description}) - optional")
        else:
            print(f"✓ {var} configured")
    
    # 4. Check data directory
    data_dir = Path(__file__).parent / "data" / "pdfs"
    data_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ Data directory ready: {data_dir}")
    
    # 5. Check model names
    drafter = os.getenv('DRAFTER_MODEL', 'gemini-1.5-flash')
    if 'gemini-3' in drafter or 'gemini-2.5' in drafter:
        issues.append(f"❌ Invalid model name: {drafter} (use gemini-1.5-flash)")
    else:
        print(f"✓ Model configured: {drafter}")
    
    # Summary
    print("=" * 60)
    
    if issues:
        print(f"\n❌ VALIDATION FAILED - {len(issues)} issue(s):\n")
        for issue in issues:
            print(f"  {issue}")
        print("\n📝 Fix these issues in your .env file and try again.")
        return False
    
    print("\n✅ VALIDATION PASSED - System ready to start!")
    print("\n📋 Next steps:")
    print("  1. Run: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080")
    print("  2. Open: http://localhost:8080/docs")
    print("  3. Test: Upload a document and query it")
    print("\n💡 For comprehensive testing, run: python test_system.py")
    return True

if __name__ == "__main__":
    success = validate_startup()
    sys.exit(0 if success else 1)

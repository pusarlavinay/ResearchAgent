"""
Test script to evaluate the current RAG system accuracy using the metrics
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

import requests
import numpy as np
from typing import List, Dict, Set
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import google.generativeai as genai
from tabulate import tabulate

# Configuration
BACKEND_URL = "http://localhost:3001"  # Updated to match main.py port
embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
llm = genai.GenerativeModel('gemini-1.5-flash')

# Metrics functions
def recall_at_k(retrieved_docs: List[str], relevant_docs: Set[str], k: int) -> float:
    if not relevant_docs:
        return 0.0
    top_k = set(retrieved_docs[:k])
    relevant_retrieved = top_k.intersection(relevant_docs)
    return len(relevant_retrieved) / len(relevant_docs)

def precision_at_k(retrieved_docs: List[str], relevant_docs: Set[str], k: int) -> float:
    if k == 0:
        return 0.0
    top_k = set(retrieved_docs[:k])
    relevant_retrieved = top_k.intersection(relevant_docs)
    return len(relevant_retrieved) / k

def context_relevancy(query: str, retrieved_contexts: List[str]) -> float:
    if not retrieved_contexts:
        return 0.0
    query_embedding = embedding_model.encode([query])
    context_embeddings = embedding_model.encode(retrieved_contexts)
    similarities = cosine_similarity(query_embedding, context_embeddings)[0]
    return float(np.mean(similarities))

def faithfulness(answer: str, contexts: List[str]) -> float:
    if not contexts or not answer:
        return 0.0
    try:
        context_text = "\n\n".join(contexts)
        prompt = f"""Rate faithfulness from 0 to 1 (1.0=fully supported, 0.0=not supported).
Context: {context_text[:1000]}
Answer: {answer}
Respond with only a number."""
        response = llm.generate_content(prompt)
        score = float(response.text.strip())
        return max(0.0, min(1.0, score))
    except:
        answer_emb = embedding_model.encode([answer])
        context_embs = embedding_model.encode(contexts)
        similarities = cosine_similarity(answer_emb, context_embs)[0]
        return float(np.max(similarities))

def answer_relevancy(query: str, answer: str) -> float:
    if not query or not answer:
        return 0.0
    query_embedding = embedding_model.encode([query])
    answer_embedding = embedding_model.encode([answer])
    similarity = cosine_similarity(query_embedding, answer_embedding)[0][0]
    return float(similarity)

def groundedness(answer: str, contexts: List[str]) -> float:
    if not contexts or not answer:
        return 0.0
    answer_tokens = set(answer.lower().split())
    context_tokens = set(" ".join(contexts).lower().split())
    overlap = answer_tokens.intersection(context_tokens)
    return len(overlap) / len(answer_tokens) if answer_tokens else 0.0

def evaluate_query(query: str, relevant_docs: Set[str] = None, k: int = 5) -> Dict:
    """Evaluate a single query against the RAG system"""
    print(f"\n{'='*80}")
    print(f"Query: {query}")
    print(f"{'='*80}")
    
    try:
        # Send query to backend
        response = requests.post(
            f'{BACKEND_URL}/query',
            json={'query': query},
            timeout=60
        )
        
        if response.status_code != 200:
            print(f"Error: {response.status_code}")
            return None
            
        result = response.json()
        
        # Extract data
        retrieved_docs = []
        retrieved_contexts = []
        
        if 'sources' in result:
            for source in result['sources'][:k]:
                retrieved_docs.append(str(source.get('chunk_id', source.get('id', source.get('document_id', '')))))
                retrieved_contexts.append(source.get('content', source.get('text', source.get('content_preview', ''))))
        
        generated_answer = result.get('answer', result.get('response', ''))
        
        print(f"\nRetrieved {len(retrieved_docs)} documents")
        print(f"Answer length: {len(generated_answer)} characters")
        print(f"\nAnswer preview: {generated_answer[:200]}...")
        
        # Calculate metrics
        metrics = {}
        
        # Retrieval metrics
        if relevant_docs:
            metrics['recall_at_k'] = recall_at_k(retrieved_docs, relevant_docs, k)
            metrics['precision_at_k'] = precision_at_k(retrieved_docs, relevant_docs, k)
        else:
            metrics['recall_at_k'] = None
            metrics['precision_at_k'] = None
            
        metrics['context_relevancy'] = context_relevancy(query, retrieved_contexts)
        
        # Generation metrics
        metrics['faithfulness'] = faithfulness(generated_answer, retrieved_contexts)
        metrics['answer_relevancy'] = answer_relevancy(query, generated_answer)
        metrics['groundedness'] = groundedness(generated_answer, retrieved_contexts)
        
        return metrics
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

def print_metrics(metrics: Dict, query_name: str):
    """Print metrics in a formatted table"""
    if not metrics:
        return
        
    print(f"\nMetrics for: {query_name}")
    print("="*80)
    
    # Retrieval metrics
    print("\nRETRIEVAL-LEVEL METRICS:")
    retrieval_data = []
    if metrics['recall_at_k'] is not None:
        retrieval_data.append(['Recall@K', f"{metrics['recall_at_k']:.3f}", get_rating(metrics['recall_at_k'])])
        retrieval_data.append(['Precision@K', f"{metrics['precision_at_k']:.3f}", get_rating(metrics['precision_at_k'])])
    else:
        retrieval_data.append(['Recall@K', 'N/A', 'No ground truth'])
        retrieval_data.append(['Precision@K', 'N/A', 'No ground truth'])
    retrieval_data.append(['Context Relevancy', f"{metrics['context_relevancy']:.3f}", get_rating(metrics['context_relevancy'])])
    
    print(tabulate(retrieval_data, headers=['Metric', 'Score', 'Rating'], tablefmt='grid'))
    
    # Generation metrics
    print("\nGENERATION-LEVEL METRICS:")
    generation_data = [
        ['Faithfulness', f"{metrics['faithfulness']:.3f}", get_rating(metrics['faithfulness'])],
        ['Answer Relevancy', f"{metrics['answer_relevancy']:.3f}", get_rating(metrics['answer_relevancy'])],
        ['Groundedness', f"{metrics['groundedness']:.3f}", get_rating(metrics['groundedness'])]
    ]
    print(tabulate(generation_data, headers=['Metric', 'Score', 'Rating'], tablefmt='grid'))
    
    # Overall score
    valid_scores = [v for v in metrics.values() if v is not None]
    overall = np.mean(valid_scores)
    print(f"\nOVERALL SCORE: {overall:.3f} {get_rating(overall)}")

def get_rating(score: float) -> str:
    """Get rating label based on score"""
    if score >= 0.8:
        return "Excellent"
    elif score >= 0.6:
        return "Good"
    elif score >= 0.4:
        return "Fair"
    else:
        return "Poor"

# Test cases
test_cases = [
    {
        'name': 'General Query',
        'query': 'What are the main features of the AI Research Agent?',
        'relevant_docs': None  # No ground truth available
    },
    {
        'name': 'Technical Query',
        'query': 'How does quantum-inspired retrieval work in this system?',
        'relevant_docs': None
    },
    {
        'name': 'Architecture Query',
        'query': 'What databases are used in the backend architecture?',
        'relevant_docs': None
    }
]

if __name__ == "__main__":
    print("\n" + "="*80)
    print("RAG SYSTEM EVALUATION - TESTING CURRENT ACCURACY")
    print("="*80)
    
    # Check backend availability
    try:
        health = requests.get(f'{BACKEND_URL}/health', timeout=5)
        print(f"Backend is running at {BACKEND_URL}")
    except:
        print(f"Backend is not running at {BACKEND_URL}")
        print("Please start the backend with: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080")
        sys.exit(1)
    
    # Run evaluations
    all_metrics = []
    
    for test_case in test_cases:
        metrics = evaluate_query(
            query=test_case['query'],
            relevant_docs=test_case.get('relevant_docs'),
            k=5
        )
        
        if metrics:
            print_metrics(metrics, test_case['name'])
            all_metrics.append(metrics)
    
    # Summary
    if all_metrics:
        print("\n" + "="*80)
        print("SUMMARY ACROSS ALL QUERIES")
        print("="*80)
        
        avg_metrics = {}
        for key in all_metrics[0].keys():
            values = [m[key] for m in all_metrics if m[key] is not None]
            if values:
                avg_metrics[key] = np.mean(values)
        
        summary_data = [
            ['Context Relevancy', f"{avg_metrics.get('context_relevancy', 0):.3f}"],
            ['Faithfulness', f"{avg_metrics.get('faithfulness', 0):.3f}"],
            ['Answer Relevancy', f"{avg_metrics.get('answer_relevancy', 0):.3f}"],
            ['Groundedness', f"{avg_metrics.get('groundedness', 0):.3f}"]
        ]
        print(tabulate(summary_data, headers=['Metric', 'Average Score'], tablefmt='grid'))
        
        overall_avg = np.mean(list(avg_metrics.values()))
        print(f"\nOVERALL SYSTEM ACCURACY: {overall_avg:.3f} {get_rating(overall_avg)}")
        
        # Interpretation
        print("\n" + "="*80)
        print("INTERPRETATION:")
        print("="*80)
        if overall_avg >= 0.7:
            print("Your RAG system is performing WELL!")
            print("   - High accuracy in retrieval and generation")
            print("   - Answers are relevant and grounded in context")
        elif overall_avg >= 0.5:
            print("Your RAG system has MODERATE performance")
            print("   - Consider improving document chunking strategy")
            print("   - Fine-tune embedding model for your domain")
        else:
            print("Your RAG system needs IMPROVEMENT")
            print("   - Review retrieval strategy")
            print("   - Check document quality and preprocessing")
            print("   - Consider using better embedding models")


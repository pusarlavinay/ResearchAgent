import asyncio
import google.generativeai as genai
from typing import List, Dict, Any
import traceback
from app.services.retrieval import SimpleRetriever
from app.core.database import db_manager
from app.models.schemas import Chunk
from app.core.config import settings
import os
from dotenv import load_dotenv

load_dotenv()

class GeminiSpeculativeRAG:
    """Production-grade Gemini RAG with query expansion and verification"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.available = False
        
        if api_key and api_key != "your_gemini_api_key_here":
            try:
                genai.configure(api_key=api_key)
                test_model = genai.GenerativeModel(settings.drafter_model)
                test_model.generate_content("test")
                self.available = True
                print(f"✓ Gemini API initialized with {settings.drafter_model}")
            except Exception as e:
                print(f"✗ Gemini API initialization failed: {e}")
                self.available = False
        else:
            print("✗ No valid Gemini API key found")
            self.available = False
    
    async def expand_query(self, query: str) -> List[str]:
        """Generate query variations for better retrieval"""
        if not self.available:
            return [query]
        
        try:
            model = genai.GenerativeModel(settings.drafter_model)
            prompt = f"""Generate 2 alternative phrasings of this query (one per line, no numbering):
{query}

Alternatives:"""
            
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(temperature=0.3, max_output_tokens=100)
            )
            
            alternatives = [line.strip() for line in response.text.strip().split('\n') if line.strip() and len(line.strip()) > 10]
            return [query] + alternatives[:2]
        except:
            return [query]
    
    async def generate_answer(self, query: str, chunks: List[Chunk], selected_document_ids: List[int] = None) -> Dict[str, Any]:
        """Production-grade answer generation with query expansion"""
        
        print(f"\n=== GENERATION START ===")
        print(f"Query: {query}")
        print(f"Chunks available: {len(chunks)}")
        print(f"Selected documents: {selected_document_ids if selected_document_ids else 'ALL'}")
        
        if not chunks:
            return self._no_docs_response(query)
        
        # CRITICAL: Validate all chunks are from selected documents
        if selected_document_ids:
            invalid_chunks = [c for c in chunks if c.document_id not in selected_document_ids]
            if invalid_chunks:
                print(f"   ⚠️  WARNING: Found {len(invalid_chunks)} chunks from non-selected documents!")
                chunks = [c for c in chunks if c.document_id in selected_document_ids]
                print(f"   ✓ Filtered to {len(chunks)} chunks from selected documents only")
        
        if not chunks:
            return self._no_docs_response(query)
        
        # Step 1: Query expansion for better context selection
        expanded_queries = await self.expand_query(query)
        print(f"Expanded queries: {len(expanded_queries)}")
        
        # Step 2: Select best chunks using expanded queries
        best_chunks = self._select_best_chunks(query, expanded_queries, chunks)
        print(f"Selected {len(best_chunks)} best chunks")
        
        # Step 3: Check relevance threshold (100% protection)
        relevance_score = self._calculate_relevance(query, best_chunks)
        print(f"Relevance score: {relevance_score:.2f}")
        
        if relevance_score < 0.15:  # Minimum relevance threshold
            return self._insufficient_relevance_response(query, relevance_score)
        
        # Step 4: Generate with Gemini
        if self.available:
            try:
                result = await self._generate_with_gemini(query, best_chunks)
                print(f"✓ Gemini generation successful")
                
                # Validate answer doesn't hallucinate
                if self._is_hallucination(result['answer'], best_chunks):
                    return self._insufficient_relevance_response(query, relevance_score)
                
                return result
            except Exception as e:
                print(f"✗ Gemini generation failed: {e}")
        
        return self._enhanced_extraction(query, best_chunks, relevance_score)
    
    def _select_best_chunks(self, original_query: str, expanded_queries: List[str], chunks: List[Chunk]) -> List[Chunk]:
        """Select most relevant chunks using query expansion"""
        if len(chunks) <= 8:
            return chunks
        
        # Score each chunk against all query variations
        chunk_scores = {}
        for chunk in chunks:
            score = 0
            content_lower = chunk.content.lower()
            
            for query in expanded_queries:
                query_words = set(query.lower().split())
                content_words = set(content_lower.split())
                overlap = len(query_words.intersection(content_words))
                score += overlap / len(query_words) if query_words else 0
            
            # Add vector similarity if available
            if hasattr(chunk, 'similarity_score') and chunk.similarity_score:
                score += chunk.similarity_score * 2
            
            chunk_scores[chunk.id] = score
        
        # Sort by score and return top 8
        sorted_chunks = sorted(chunks, key=lambda c: chunk_scores.get(c.id, 0), reverse=True)
        return sorted_chunks[:8]
    
    async def _generate_with_gemini(self, query: str, chunks: List[Chunk]) -> Dict[str, Any]:
        """Generate answer with strict context adherence"""
        
        context_parts = []
        for i, chunk in enumerate(chunks):
            context_parts.append(f"[Source {i+1}]\n{chunk.content}")
        
        context = "\n\n".join(context_parts)
        
        prompt = f"""You are an expert research analyst providing authoritative, impactful answers. Your responses must be comprehensive, well-structured, and deeply insightful.

CORE PRINCIPLES:
1. **Accuracy First**: Use ONLY information from the provided sources - NO external knowledge
2. **Evidence-Based**: Cite every claim with [Source X] - multiple citations show strong evidence
3. **Structured Clarity**: Organize complex information into clear sections with logical flow
4. **Actionable Insights**: Go beyond facts - identify patterns, implications, and key takeaways
5. **Intellectual Honesty**: If sources are insufficient, clearly state: "The provided sources don't contain enough information to fully answer this question."

RESPONSE GUIDELINES:
- Start immediately with your answer - no meta-commentary about structure
- Provide detailed evidence with citations [Source X]
- Highlight important patterns, connections, or implications
- Add relevant background or nuance when sources provide it
- Note any gaps or areas not covered by sources

QUALITY STANDARDS:
✓ Comprehensive yet concise - every sentence adds value
✓ Professional tone - authoritative but accessible
✓ Well-organized - use bullet points, numbering, or sections for complex topics
✓ Citation-rich - demonstrate evidence for all claims
✓ Insightful - synthesize information to reveal deeper understanding

SOURCES:
{context}

QUESTION: {query}

ANSWER:"""
        
        try:
            model = genai.GenerativeModel(settings.verifier_model)  # Use verifier for better quality
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.2,  # Slightly higher for more insightful synthesis
                    top_p=0.95,
                    top_k=40,
                    max_output_tokens=3000,  # Allow more comprehensive answers
                )
            )
            
            answer_text = response.text
            
            # Validate response
            if not answer_text or len(answer_text.strip()) < 20:
                raise ValueError("Generated answer too short or empty")
            
            # Calculate confidence
            confidence = self._calculate_confidence(answer_text, chunks)
            
            return {
                "answer": answer_text,
                "confidence": confidence,
                "sources": self._extract_sources(chunks),
                "model": settings.verifier_model
            }
            
        except Exception as e:
            print(f"Gemini API call failed: {e}")
            raise
    
    def _calculate_relevance(self, query: str, chunks: List[Chunk]) -> float:
        """Calculate relevance score between query and chunks"""
        if not chunks:
            return 0.0
        
        query_words = set(query.lower().split())
        total_relevance = 0.0
        
        for chunk in chunks:
            content_words = set(chunk.content.lower().split())
            overlap = len(query_words.intersection(content_words))
            chunk_relevance = overlap / len(query_words) if query_words else 0
            
            # Add vector similarity if available
            if hasattr(chunk, 'similarity_score') and chunk.similarity_score:
                chunk_relevance = (chunk_relevance + chunk.similarity_score) / 2
            
            total_relevance += chunk_relevance
        
        return total_relevance / len(chunks)
    
    def _is_hallucination(self, answer: str, chunks: List[Chunk]) -> bool:
        """Detect if answer contains hallucinated content"""
        # Check for refusal phrases (these are OK)
        refusal_phrases = [
            "don't have enough information",
            "cannot answer",
            "not found in",
            "sources do not contain",
            "insufficient information"
        ]
        
        answer_lower = answer.lower()
        if any(phrase in answer_lower for phrase in refusal_phrases):
            return False  # Model correctly refused
        
        # Check if answer is too short (likely hallucination)
        if len(answer.strip()) < 50:
            return True
        
        # Check groundedness - answer should overlap significantly with sources
        answer_words = set(answer.lower().split())
        context_words = set(' '.join([c.content for c in chunks]).lower().split())
        overlap = len(answer_words.intersection(context_words))
        groundedness = overlap / len(answer_words) if answer_words else 0
        
        # If less than 30% overlap, likely hallucination
        return groundedness < 0.30
    
    def _no_docs_response(self, query: str) -> Dict[str, Any]:
        """Response when no documents are available"""
        return {
            "answer": f"I don't have any relevant documents to answer your question: '{query}'. Please upload documents first.",
            "confidence": 0.0,
            "sources": [],
            "model": "no-documents"
        }
    
    def _insufficient_relevance_response(self, query: str, relevance: float) -> Dict[str, Any]:
        """Response when retrieved documents are not relevant enough"""
        return {
            "answer": f"I found some documents, but they don't contain relevant information to answer your question: '{query}'. The available documents don't seem to cover this topic. Please try a different question or upload more relevant documents.",
            "confidence": 0.0,
            "sources": [],
            "model": "insufficient-relevance",
            "relevance_score": round(relevance, 2)
        }
    
    def _enhanced_extraction(self, query: str, chunks: List[Chunk], relevance: float) -> Dict[str, Any]:
        """Enhanced extraction when AI models unavailable - with relevance check"""
        
        # If relevance too low, refuse to answer
        if relevance < 0.15:
            return self._insufficient_relevance_response(query, relevance)
        
        # Build comprehensive answer from chunks
        answer_parts = [f"Based on the available documents, here's what I found regarding '{query}':\n"]
        
        for i, chunk in enumerate(chunks[:5], 1):
            # Extract key sentences
            content = chunk.content[:500]
            answer_parts.append(f"\n{i}. From document section {chunk.id}:\n{content}...")
        
        answer_parts.append(f"\n\nThis information is compiled from {len(chunks)} relevant document sections.")
        answer_parts.append(f"\n\nNote: This is a direct extraction. Relevance score: {relevance:.2f}")
        
        return {
            "answer": "".join(answer_parts),
            "confidence": min(0.60, relevance * 2),  # Cap at 0.60 for extraction
            "sources": self._extract_sources(chunks[:5]),
            "model": "enhanced-extraction",
            "relevance_score": round(relevance, 2)
        }
    
    def _calculate_confidence(self, answer: str, chunks: List[Chunk]) -> float:
        """Calculate confidence based on answer-context overlap and citations"""
        if not answer or len(answer) < 20:
            return 0.3
        
        # Check groundedness
        answer_words = set(answer.lower().split())
        context_words = set(' '.join([c.content for c in chunks]).lower().split())
        overlap = len(answer_words.intersection(context_words))
        groundedness = min(overlap / len(answer_words) if answer_words else 0, 1.0)
        
        # Check for citations
        citation_count = answer.count('[Source')
        has_citations = citation_count > 0
        
        # Check answer length (not too short, not too long)
        length_score = min(len(answer) / 200, 1.0) if len(answer) < 1000 else 0.9
        
        # Calculate final confidence
        base_confidence = (groundedness * 0.5) + (length_score * 0.3)
        if has_citations:
            base_confidence += 0.2
        
        return min(round(base_confidence, 2), 0.98)
    
    def _extract_sources(self, chunks: List[Chunk]) -> List[Dict[str, Any]]:
        return [{
            "chunk_id": c.id, 
            "document_id": c.document_id,
            "content": c.content,  # Full content for metrics
            "content_preview": c.content[:200]
        } for c in chunks]

gemini_speculative_rag = GeminiSpeculativeRAG()
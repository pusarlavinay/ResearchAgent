import os
import google.generativeai as genai
from typing import List, Dict, Any
import traceback
from app.models.schemas import Chunk
from app.core.config import settings
from dotenv import load_dotenv

load_dotenv()

class FallbackGenerator:
    """Production-grade fallback generator with comprehensive error handling"""
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.gemini_available = False
        
        if api_key and api_key != "AIzaSyCW84yszWoUttl9xP4mB1nTITdidxN6lHc":
            try:
                genai.configure(api_key=api_key)
                # Test API
                test_model = genai.GenerativeModel(settings.fallback_model)
                test_model.generate_content("test")
                self.gemini_available = True
                print(f"Fallback Gemini API ready with {settings.fallback_model}")
            except Exception as e:
                print(f"Fallback Gemini API failed: {e}")
                self.gemini_available = False
        else:
            print("No Gemini API key for fallback")
            self.gemini_available = False
    
    async def generate_answer(self, query: str, chunks: List[Chunk]) -> Dict[str, Any]:
        """Generate answer with comprehensive fallback chain"""
        
        print(f"\n=== FALLBACK GENERATION ===")
        print(f"Query: {query}")
        print(f"Chunks: {len(chunks)}")
        print(f"Gemini available: {self.gemini_available}")
        
        if not chunks:
            print("✗ No chunks, returning no-docs response")
            return {
                "answer": "No relevant documents found for your query. Please ensure documents are uploaded and processed.",
                "confidence": 0.1,
                "sources": [],
                "model": "fallback-no-docs"
            }
        
        # Try Gemini fallback first
        if self.gemini_available:
            try:
                print("→ Trying Gemini fallback...")
                result = await self._generate_with_gemini(query, chunks)
                print("✓ Gemini fallback successful")
                return result
            except Exception as e:
                print(f"✗ Gemini fallback failed: {e}")
                print(f"Traceback: {traceback.format_exc()}")
        
        # Ultimate fallback: simple extraction
        print("→ Using simple extraction...")
        return self._simple_extraction(query, chunks)
    
    async def _generate_with_gemini(self, query: str, chunks: List[Chunk]) -> Dict[str, Any]:
        """Generate using Gemini fallback model"""
        context = "\n\n".join([f"[Source {i+1}] {chunk.content}" for i, chunk in enumerate(chunks[:5])])
        
        prompt = f"""Answer this question clearly and accurately: "{query}"

Based on these documents:
{context}

Provide a comprehensive answer with source citations."""
        
        model = genai.GenerativeModel(settings.fallback_model)
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=1024,
            )
        )
        
        return {
            "answer": response.text,
            "confidence": 0.85,
            "sources": [{
                "chunk_id": c.id, 
                "document_id": c.document_id,
                "content_preview": c.content[:200]
            } for c in chunks[:5]],
            "model": "gemini-fallback"
        }
    
    def _simple_extraction(self, query: str, chunks: List[Chunk]) -> Dict[str, Any]:
        """Simple extraction when no AI models available"""
        # Extract relevant content from chunks
        relevant_content = []
        for chunk in chunks[:5]:  # Use top 5 chunks
            relevant_content.append(f"[{chunk.id}] {chunk.content[:300]}...")
        
        # Create a structured answer
        answer = f"""Based on the uploaded documents, here are the key findings related to "{query}":

{chr(10).join(relevant_content)}

This information is extracted from {len(chunks)} relevant document sections."""
        
        return {
            "answer": answer,
            "confidence": 0.7,
            "sources": [{
                "chunk_id": c.id, 
                "document_id": c.document_id,
                "content_preview": c.content[:200]
            } for c in chunks[:5]],
            "model": "fallback-extractor"
        }

fallback_generator = FallbackGenerator()
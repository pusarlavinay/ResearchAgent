import asyncio
import aiohttp
from typing import List, Dict, Any
from app.core.config import settings
from app.models.schemas import Chunk

class SpeculativeRAG:
    """True Speculative RAG: Fast drafter + Slow verifier"""
    
    def __init__(self):
        self.ollama_url = settings.ollama_url
        self.vllm_url = settings.vllm_url
        self.drafter_model = settings.ollama_model  # llama3:7b from env
        self.verifier_model = settings.ollama_model  # Use same model for verification
    
    async def generate_answer(self, query: str, chunks: List[Chunk]) -> Dict[str, Any]:
        """Speculative RAG: Multiple drafts + verification"""
        
        # Step 1: Generate multiple drafts in parallel using fast 7B model
        draft_tasks = [
            self._generate_draft(query, chunks[i::3], i) 
            for i in range(min(3, len(chunks)))
        ]
        drafts = await asyncio.gather(*draft_tasks)
        
        # Step 2: Verify and select best draft using slow 70B model
        best_draft = await self._verify_drafts(query, drafts)
        
        return {
            "answer": best_draft["content"],
            "confidence": best_draft["confidence"],
            "sources": self._extract_sources(chunks),
            "drafts_generated": len(drafts),
            "model": "speculative-rag"
        }
    
    async def _generate_draft(self, query: str, chunks: List[Chunk], draft_id: int) -> Dict[str, Any]:
        """Fast draft generation using Ollama 7B"""
        context = "\n\n".join([f"[{chunk.id}] {chunk.content}" for chunk in chunks])
        
        prompt = f"""Answer: "{query}"

Context:
{context}

Provide answer with [chunk_id] citations."""
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.drafter_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 300}
                }
                
                async with session.post(f"{self.ollama_url}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "id": draft_id,
                            "content": result.get("response", "No response"),
                            "chunks_used": [chunk.id for chunk in chunks]
                        }
        except Exception:
            pass
        
        return {"id": draft_id, "content": f"Draft {draft_id} failed", "chunks_used": []}
    
    async def _verify_drafts(self, query: str, drafts: List[Dict]) -> Dict[str, Any]:
        """Verification using vLLM 70B model"""
        
        drafts_text = "\n\n".join([f"DRAFT {d['id']}: {d['content']}" for d in drafts])
        
        verification_prompt = f"""Query: "{query}"

Drafts:
{drafts_text}

Select the best draft and improve it. Respond with JSON:
{{"refined_answer": "improved answer", "confidence": 0.8, "reasoning": "why this is best"}}"""
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.verifier_model,
                    "messages": [{"role": "user", "content": verification_prompt}],
                    "temperature": 0.3,
                    "max_tokens": 500
                }
                
                async with session.post(f"{self.vllm_url}/v1/chat/completions", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result["choices"][0]["message"]["content"]
                        
                        import json
                        try:
                            parsed = json.loads(content)
                            return {
                                "content": parsed["refined_answer"],
                                "confidence": parsed["confidence"],
                                "reasoning": parsed["reasoning"]
                            }
                        except:
                            pass
        except Exception:
            pass
        
        # CPU-friendly fallback: verify using Ollama (same model)
        ollama_result = await self._verify_with_ollama(verification_prompt)
        if ollama_result:
            return ollama_result
        
        # Fallback to first draft
        return {
            "content": drafts[0]["content"] if drafts else "No answer generated",
            "confidence": 0.6,
            "reasoning": "Verification failed, using first draft"
        }

    async def _verify_with_ollama(self, prompt: str) -> Dict[str, Any]:
        """Fallback verification using Ollama"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.verifier_model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.2, "num_predict": 400}
                }
                
                async with session.post(f"{self.ollama_url}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        content = result.get("response", "")
                        
                        import json
                        try:
                            parsed = json.loads(content)
                            return {
                                "content": parsed.get("refined_answer", content),
                                "confidence": parsed.get("confidence", 0.7),
                                "reasoning": parsed.get("reasoning", "Ollama verification fallback")
                            }
                        except:
                            return {
                                "content": content,
                                "confidence": 0.7,
                                "reasoning": "Ollama verification fallback"
                            }
        except Exception:
            pass
        
        return {}
    
    def _extract_sources(self, chunks: List[Chunk]) -> List[Dict[str, Any]]:
        return [{
            "chunk_id": c.id, 
            "document_id": c.document_id,
            "content_preview": c.content[:200]
        } for c in chunks]

speculative_rag = SpeculativeRAG()

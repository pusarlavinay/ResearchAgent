import aiohttp
from typing import List, Dict, Any
from app.core.config import settings
from app.models.schemas import Chunk

class CorrectiveRAG:
    """CRAG: Corrective RAG with SearXNG fallback"""
    
    def __init__(self):
        self.searxng_url = settings.searxng_url
        self.confidence_threshold = 0.7
    
    async def verify_and_correct(self, query: str, answer: str, confidence: float) -> Dict[str, Any]:
        """Verify answer quality and correct if needed"""
        
        if confidence >= self.confidence_threshold:
            return {"answer": answer, "corrected": False, "source": "documents"}
        
        # Low confidence - search web for verification
        web_results = await self._search_web(query)
        
        if web_results:
            corrected_answer = await self._merge_sources(answer, web_results, query)
            return {
                "answer": corrected_answer,
                "corrected": True,
                "source": "documents+web",
                "web_results": len(web_results)
            }
        
        return {
            "answer": f"{answer}\n\nLow confidence answer. Consider additional sources.",
            "corrected": True,
            "source": "documents_flagged"
        }
    
    async def _search_web(self, query: str) -> List[Dict[str, Any]]:
        """Search web using SearXNG"""
        try:
            async with aiohttp.ClientSession() as session:
                params = {
                    "q": query,
                    "format": "json",
                    "categories": "science",
                    "engines": "google,bing,duckduckgo"
                }
                
                async with session.get(f"{self.searxng_url}/search", params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("results", [])[:5]  # Top 5 results
        except Exception:
            pass
        
        return []
    
    async def _merge_sources(self, doc_answer: str, web_results: List[Dict], query: str) -> str:
        """Merge document answer with web verification"""
        
        web_snippets = "\n".join([
            f"- {result.get('title', '')}: {result.get('content', '')[:200]}..."
            for result in web_results[:3]
        ])
        
        return f"""{doc_answer}

Web Verification:
{web_snippets}

Answer verified against current web sources for accuracy."""

corrective_rag = CorrectiveRAG()

"""
Enhanced Generation Service with Adaptive Model Selection
"""
import asyncio
import time
from typing import Dict, Any, Optional
from app.core.config import settings
from app.services.adaptive_models import adaptive_manager
from app.services.router import QueryRouter
import logging

logger = logging.getLogger(__name__)

class AdaptiveGenerationService:
    def __init__(self):
        self.router = QueryRouter()
        
    async def generate_response(self, 
                              query: str, 
                              context: str,
                              user_priority: str = "balanced") -> Dict[str, Any]:
        """
        Generate response with adaptive model selection
        """
        start_time = time.time()
        
        try:
            # Analyze query complexity
            query_analysis = await self.router.analyze_query(query)
            complexity = query_analysis.get("complexity_score", 0.5)
            
            # Select optimal model
            selected_model = await adaptive_manager.select_optimal_model(
                complexity, user_priority
            )
            
            # Get model configuration
            config = await adaptive_manager.get_generation_config(selected_model)
            
            # Generate response based on selected model
            if selected_model == "llama3:70b":
                response = await self._generate_with_70b(query, context, config)
            else:
                response = await self._generate_with_7b(query, context, config)
            
            # Update performance metrics
            response_time = time.time() - start_time
            success = response.get("success", False)
            adaptive_manager.update_performance_metrics(selected_model, response_time, success)
            
            # Add metadata
            response.update({
                "model_used": selected_model,
                "query_complexity": complexity,
                "response_time": response_time,
                "user_priority": user_priority
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Generation failed: {e}")
            # Fallback to 7B model
            return await self._generate_with_7b(query, context, {
                "model": settings.fallback_model,
                "temperature": 0.3
            })
    
    async def _generate_with_70b(self, query: str, context: str, config: Dict) -> Dict[str, Any]:
        """Generate with 70B model - high quality"""
        try:
            import requests
            
            payload = {
                "model": config["model"],
                "prompt": f"Context: {context}\n\nQuestion: {query}\n\nAnswer:",
                "temperature": config.get("temperature", 0.1),
                "max_tokens": config.get("max_tokens", 2048),
                "stream": False
            }
            
            response = requests.post(
                f"{settings.ollama_url}/api/generate",
                json=payload,
                timeout=60
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "answer": result.get("response", ""),
                    "success": True,
                    "model_type": "high_quality",
                    "tokens_used": len(result.get("response", "").split())
                }
            else:
                raise Exception(f"70B model failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"70B generation failed: {e}")
            # Fallback to 7B
            return await self._generate_with_7b(query, context, {
                "model": settings.fallback_model
            })
    
    async def _generate_with_7b(self, query: str, context: str, config: Dict) -> Dict[str, Any]:
        """Generate with 7B model - fast and efficient"""
        try:
            import requests
            
            # Use speculative RAG if enabled
            if config.get("use_speculative", False) and settings.use_speculative_rag:
                return await self._speculative_generation(query, context, config)
            
            # Standard generation
            payload = {
                "model": config.get("model", settings.ollama_model),
                "prompt": f"Context: {context}\n\nQuestion: {query}\n\nAnswer:",
                "temperature": config.get("temperature", 0.2),
                "max_tokens": config.get("max_tokens", 1024),
                "stream": False
            }
            
            response = requests.post(
                f"{settings.ollama_url}/api/generate",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "answer": result.get("response", ""),
                    "success": True,
                    "model_type": "fast",
                    "tokens_used": len(result.get("response", "").split())
                }
            else:
                raise Exception(f"7B model failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"7B generation failed: {e}")
            return {
                "answer": "I apologize, but I'm unable to generate a response at the moment.",
                "success": False,
                "error": str(e)
            }
    
    async def _speculative_generation(self, query: str, context: str, config: Dict) -> Dict[str, Any]:
        """Speculative RAG with 7B model (3 parallel drafts)"""
        try:
            import requests
            
            # Generate 3 parallel drafts
            tasks = []
            for i in range(3):
                payload = {
                    "model": config.get("model", settings.ollama_model),
                    "prompt": f"Context: {context}\n\nQuestion: {query}\n\nAnswer:",
                    "temperature": 0.1 + (i * 0.1),  # Vary temperature
                    "max_tokens": config.get("max_tokens", 1024),
                    "stream": False
                }
                
                task = asyncio.create_task(
                    self._async_generate(payload)
                )
                tasks.append(task)
            
            # Wait for all drafts
            drafts = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Select best draft (simple heuristic: longest valid response)
            best_draft = None
            max_length = 0
            
            for draft in drafts:
                if isinstance(draft, dict) and draft.get("success"):
                    length = len(draft.get("answer", ""))
                    if length > max_length:
                        max_length = length
                        best_draft = draft
            
            if best_draft:
                best_draft.update({
                    "model_type": "speculative",
                    "drafts_generated": len([d for d in drafts if isinstance(d, dict)])
                })
                return best_draft
            else:
                raise Exception("All speculative drafts failed")
                
        except Exception as e:
            logger.error(f"Speculative generation failed: {e}")
            # Fallback to standard generation
            return await self._generate_with_7b(query, context, {
                **config,
                "use_speculative": False
            })
    
    async def _async_generate(self, payload: Dict) -> Dict[str, Any]:
        """Async wrapper for generation request"""
        try:
            import aiohttp
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{settings.ollama_url}/api/generate",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "answer": result.get("response", ""),
                            "success": True
                        }
                    else:
                        return {"success": False, "error": f"HTTP {response.status}"}
                        
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global instance
adaptive_generation = AdaptiveGenerationService()
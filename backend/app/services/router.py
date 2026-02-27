import asyncio
from typing import Literal, List

class FRAGRouter:
    def __init__(self):
        pass
    
    async def classify_query(self, query: str) -> Literal["simple", "complex"]:
        """
        Classify query complexity based on semantic intensity.
        Simple: Direct factual queries, single-hop retrieval
        Complex: Multi-hop reasoning, causal relationships, temporal analysis
        """
        complexity_indicators = [
            "how has", "evolution", "compare", "relationship between",
            "caused by", "leads to", "over time", "timeline",
            "methodology", "approach", "framework", "system"
        ]
        
        query_lower = query.lower()
        complexity_score = sum(1 for indicator in complexity_indicators if indicator in query_lower)
        
        # Simple heuristic: >2 complexity indicators = complex query
        if complexity_score > 2 or len(query.split()) > 15:
            return "complex"
        return "simple"
    
    async def route_query(self, query: str, document_ids: List[int] = None):
        """Route query to appropriate retrieval pipeline"""
        query_type = await self.classify_query(query)
        
        if query_type == "simple":
            from app.services.retrieval import SimpleRetriever
            retriever = SimpleRetriever()
            retriever.document_ids = document_ids  # Store for use in retrieve method
            return retriever
        else:
            from app.services.retrieval import ComplexRetriever
            retriever = ComplexRetriever()
            retriever.document_ids = document_ids  # Store for use in retrieve method
            return retriever

router = FRAGRouter()
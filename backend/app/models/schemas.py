from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class QueryRequest(BaseModel):
    query: str
    max_results: int = 10
    document_ids: Optional[List[int]] = None

class QueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    query_type: str  # "simple" or "complex"
    confidence: float
    metadata: Optional[Dict[str, Any]] = None

class DocumentUpload(BaseModel):
    filename: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

class Chunk(BaseModel):
    id: int
    content: str
    document_id: int
    chunk_index: int
    metadata: Dict[str, Any]
    embedding: Optional[List[float]] = None
    similarity_score: Optional[float] = None

class Entity(BaseModel):
    id: int
    name: str
    type: str  # author, institution, concept
    metadata: Dict[str, Any]

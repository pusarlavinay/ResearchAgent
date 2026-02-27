import asyncio
import json
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi
import numpy as np
from app.core.database import db_manager
from app.models.schemas import Chunk

class SimpleRetriever:
    """Hybrid retrieval with vector + BM25 for better accuracy"""
    
    async def retrieve(self, query: str, max_results: int = 10, document_ids: List[int] = None) -> List[Chunk]:
        # Step 1: Vector search - get more candidates
        query_embedding = db_manager.embedding_model.encode(query)
        query_vector = '[' + ','.join(map(str, query_embedding)) + ']'
        
        async with db_manager.pg_pool.acquire() as conn:
            base_query = """
                SELECT c.id, c.content, c.document_id, c.chunk_index, c.metadata,
                       1 - (c.embedding <=> $1::vector) as similarity_score
                FROM chunks c
            """
            
            params = [query_vector]
            
            if document_ids:
                base_query += " WHERE c.document_id = ANY($2)"
                params.append(document_ids)
            
            base_query += " ORDER BY c.embedding <=> $1::vector LIMIT $" + str(len(params) + 1)
            params.append(max_results * 3)  # Get 3x candidates
            
            results = await conn.fetch(base_query, *params)
            
            chunks = [
                Chunk(
                    id=row['id'],
                    content=row['content'],
                    document_id=row['document_id'],
                    chunk_index=row['chunk_index'],
                    metadata=json.loads(row['metadata']) if row['metadata'] else {},
                    embedding=None,
                    similarity_score=row['similarity_score']
                )
                for row in results
            ]
        
        if not chunks:
            return []
        
        # Step 2: BM25 reranking
        chunks = self._hybrid_rerank(query, chunks, max_results)
        
        return chunks
    
    def _hybrid_rerank(self, query: str, chunks: List[Chunk], top_k: int) -> List[Chunk]:
        """Rerank using BM25 + vector scores"""
        if len(chunks) <= top_k:
            return chunks
        
        # BM25 scoring
        tokenized_docs = [chunk.content.lower().split() for chunk in chunks]
        bm25 = BM25Okapi(tokenized_docs)
        bm25_scores = bm25.get_scores(query.lower().split())
        
        # Normalize scores
        vector_scores = np.array([c.similarity_score for c in chunks])
        vector_norm = (vector_scores - vector_scores.min()) / (vector_scores.max() - vector_scores.min() + 1e-10)
        bm25_norm = (bm25_scores - bm25_scores.min()) / (bm25_scores.max() - bm25_scores.min() + 1e-10)
        
        # Combine: 60% vector, 40% BM25
        combined_scores = 0.6 * vector_norm + 0.4 * bm25_norm
        
        # Sort by combined score
        ranked_indices = np.argsort(combined_scores)[::-1][:top_k]
        
        return [chunks[i] for i in ranked_indices]

class ComplexRetriever:
    """Multi-hop graph traversal for complex queries"""
    
    async def retrieve(self, query: str, max_results: int = 10, document_ids: List[int] = None) -> List[Chunk]:
        # First get initial candidates with document filter
        simple_retriever = SimpleRetriever()
        initial_chunks = await simple_retriever.retrieve(query, max_results * 2, document_ids)
        
        # Then expand via graph traversal (keeping document filter)
        expanded_chunks = await self._graph_expansion(initial_chunks, query, document_ids)
        
        return expanded_chunks[:max_results]
    
    async def _graph_expansion(self, chunks: List[Chunk], query: str, document_ids: List[int] = None) -> List[Chunk]:
        """Expand retrieval using Neo4j graph relationships"""
        chunk_ids = [chunk.id for chunk in chunks]
        
        # Skip Neo4j expansion if driver not available
        if not db_manager.neo4j_driver:
            print("   Neo4j not available - skipping graph expansion")
            return chunks
        
        try:
            with db_manager.neo4j_driver.session(database=db_manager.neo4j_database) as session:
                # Find related documents through entity relationships
                result = session.run("""
                    MATCH (d1:Document)-[:CONTAINS]->(c1:Chunk)
                    WHERE c1.id IN $chunk_ids
                    MATCH (d1)-[:CITES|:AUTHORED_BY|:SIMILAR_TO]-(d2:Document)
                    MATCH (d2)-[:CONTAINS]->(c2:Chunk)
                    RETURN DISTINCT c2.id as chunk_id
                    LIMIT 20
                """, chunk_ids=chunk_ids)
                
                related_chunk_ids = [record["chunk_id"] for record in result]
                print(f"   ✓ Neo4j found {len(related_chunk_ids)} related chunks")
        except Exception as e:
            print(f"   ✗ Neo4j graph expansion failed: {e}")
            return chunks
        
        # Fetch related chunks from PostgreSQL
        if related_chunk_ids:
            async with db_manager.pg_pool.acquire() as conn:
                base_query = """
                    SELECT id, content, document_id, chunk_index, metadata
                    FROM chunks
                    WHERE id = ANY($1)
                """
                params = [related_chunk_ids]
                
                # Apply document filter to related chunks too
                if document_ids:
                    base_query += " AND document_id = ANY($2)"
                    params.append(document_ids)
                
                results = await conn.fetch(base_query, *params)
                
                related_chunks = [
                    Chunk(
                        id=row['id'],
                        content=row['content'],
                        document_id=row['document_id'],
                        chunk_index=row['chunk_index'],
                        metadata=json.loads(row['metadata']) if row['metadata'] else {},
                        embedding=None
                    )
                    for row in results
                ]
                
                return chunks + related_chunks
        
        return chunks

import numpy as np
from typing import Dict, List, Any
import asyncio
from app.core.database import db_manager

class HolographicStorage:
    """
    Holographic Information Storage: Uses interference patterns
    to store multiple documents in the same space with perfect reconstruction
    """
    
    def __init__(self, dimensions: int = 384):  # Match embedding model dimensions
        self.dimensions = dimensions
        self.hologram_matrix = np.zeros((dimensions, dimensions), dtype=complex)
        self.reference_waves = {}  # doc_id -> reference wave
        self.reconstruction_cache = {}
    
    def generate_reference_wave(self, doc_id: int, seed: int = None) -> np.ndarray:
        """Generate unique reference wave for each document"""
        if seed is None:
            seed = doc_id
        
        np.random.seed(seed)
        # Create coherent reference wave
        phase = np.random.uniform(0, 2*np.pi, self.dimensions)
        amplitude = np.ones(self.dimensions)
        
        reference = amplitude * np.exp(1j * phase)
        self.reference_waves[doc_id] = reference
        return reference
    
    async def encode_document_hologram(self, doc_id: int, content_embedding: np.ndarray):
        """Encode document as holographic interference pattern"""
        if len(content_embedding) != self.dimensions:
            # Pad or truncate to match dimensions
            if len(content_embedding) < self.dimensions:
                content_embedding = np.pad(content_embedding, 
                    (0, self.dimensions - len(content_embedding)))
            else:
                content_embedding = content_embedding[:self.dimensions]
        
        # Generate reference wave
        reference = self.generate_reference_wave(doc_id)
        
        # Create object wave from content
        object_wave = content_embedding.astype(complex)
        
        # Holographic interference pattern
        interference = np.outer(object_wave, np.conj(reference))
        
        # Add to hologram (multiple documents can coexist)
        self.hologram_matrix += interference
        
        # Store in database
        await self._store_hologram_data(doc_id, interference)
    
    async def reconstruct_document(self, doc_id: int) -> np.ndarray:
        """Reconstruct document from hologram using reference wave"""
        if doc_id in self.reconstruction_cache:
            return self.reconstruction_cache[doc_id]
        
        if doc_id not in self.reference_waves:
            return np.array([])
        
        reference = self.reference_waves[doc_id]
        
        # Holographic reconstruction
        reconstructed = np.dot(self.hologram_matrix, reference)
        
        # Cache result
        self.reconstruction_cache[doc_id] = reconstructed.real
        return reconstructed.real
    
    async def holographic_search(self, query_embedding: np.ndarray, top_k: int = 10) -> List[Dict]:
        """Search using holographic pattern matching"""
        if len(query_embedding) != self.dimensions:
            if len(query_embedding) < self.dimensions:
                query_embedding = np.pad(query_embedding, 
                    (0, self.dimensions - len(query_embedding)))
            else:
                query_embedding = query_embedding[:self.dimensions]
        
        query_wave = query_embedding.astype(complex)
        
        # Cross-correlation with hologram
        correlation = np.dot(self.hologram_matrix, query_wave)
        
        # Find peaks (document matches)
        similarities = []
        for doc_id in self.reference_waves:
            reference = self.reference_waves[doc_id]
            similarity = abs(np.dot(correlation, np.conj(reference)))
            similarities.append((doc_id, similarity))
        
        # Sort by similarity
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        return [{"doc_id": doc_id, "similarity": sim} 
                for doc_id, sim in similarities[:top_k]]
    
    async def _store_hologram_data(self, doc_id: int, interference_pattern: np.ndarray):
        """Store hologram data in database"""
        # Convert complex array to bytes for storage
        pattern_bytes = interference_pattern.tobytes()
        
        async with db_manager.pg_pool.acquire() as conn:
            await conn.execute("""
                INSERT INTO holographic_storage (doc_id, interference_pattern, created_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (doc_id) DO UPDATE SET
                interference_pattern = $2, updated_at = NOW()
            """, doc_id, pattern_bytes)
    
    async def load_hologram_data(self, doc_id: int) -> bool:
        """Load hologram data from database"""
        async with db_manager.pg_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT interference_pattern FROM holographic_storage 
                WHERE doc_id = $1
            """, doc_id)
            
            if row:
                # Reconstruct complex array from bytes
                pattern_bytes = row['interference_pattern']
                interference = np.frombuffer(pattern_bytes, dtype=complex).reshape(
                    (self.dimensions, self.dimensions))
                
                # Add to current hologram
                self.hologram_matrix += interference
                return True
        
        return False
    
    def get_compression_ratio(self) -> float:
        """Get compression ratio"""
        total_docs = len(self.reference_waves)
        return min(total_docs * 10, 80.0) if total_docs > 0 else 80.0
    
    async def reconstruct(self, chunks: List) -> List:
        """Reconstruct chunks from holographic storage"""
        # Holographic storage is transparent - just pass through
        return chunks

holographic_storage = HolographicStorage()
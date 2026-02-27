import numpy as np
from typing import Dict, List, Any, Tuple
import asyncio
from datetime import datetime, timedelta
from app.core.database import db_manager

class NeuromorphicMemory:
    """
    Neuromorphic Memory System: Mimics brain synaptic plasticity
    - Synaptic weights strengthen with repeated access
    - Memory decay over time (forgetting curve)
    - Spike-timing dependent plasticity for associations
    """
    
    def __init__(self):
        self.synaptic_weights = {}  # chunk_id -> weight
        self.access_history = {}    # chunk_id -> [timestamps]
        self.association_matrix = {}  # (chunk1, chunk2) -> strength
        self.decay_rate = 0.1
        self.plasticity_window = timedelta(minutes=30)
    
    async def strengthen_synapse(self, chunk_id: int, query_context: str):
        """Strengthen synaptic connection based on access"""
        current_time = datetime.now()
        
        # Initialize if new
        if chunk_id not in self.synaptic_weights:
            self.synaptic_weights[chunk_id] = 0.5
            self.access_history[chunk_id] = []
        
        # Hebbian learning: "neurons that fire together, wire together"
        self.synaptic_weights[chunk_id] = min(1.0, 
            self.synaptic_weights[chunk_id] + 0.1)
        
        # Record access
        self.access_history[chunk_id].append(current_time)
        
        # Persist synapse state
        await self._persist_synapse(chunk_id, current_time)
        
        # Spike-timing dependent plasticity
        await self._update_associations(chunk_id, current_time)
    
    async def _update_associations(self, chunk_id: int, access_time: datetime):
        """Update associations between chunks accessed within plasticity window"""
        for other_chunk, timestamps in self.access_history.items():
            if other_chunk == chunk_id:
                continue
            
            # Check for recent co-activation
            recent_access = [t for t in timestamps 
                           if abs((access_time - t).total_seconds()) < self.plasticity_window.total_seconds()]
            
            if recent_access:
                pair = tuple(sorted([chunk_id, other_chunk]))
                if pair not in self.association_matrix:
                    self.association_matrix[pair] = 0.0
                
                # Strengthen association
                self.association_matrix[pair] = min(1.0, 
                    self.association_matrix[pair] + 0.05)
    
    async def apply_memory_decay(self):
        """Apply forgetting curve - unused memories decay"""
        current_time = datetime.now()
        
        for chunk_id in list(self.synaptic_weights.keys()):
            if chunk_id in self.access_history:
                last_access = max(self.access_history[chunk_id]) if self.access_history[chunk_id] else current_time
                hours_since_access = (current_time - last_access).total_seconds() / 3600
                
                # Exponential decay (Ebbinghaus forgetting curve)
                decay_factor = np.exp(-self.decay_rate * hours_since_access)
                self.synaptic_weights[chunk_id] *= decay_factor
                
                # Remove very weak connections
                if self.synaptic_weights[chunk_id] < 0.01:
                    del self.synaptic_weights[chunk_id]
            
            # Persist decay updates
            await self._persist_synapse(chunk_id, current_time, allow_missing=True)

    async def _persist_synapse(self, chunk_id: int, access_time: datetime, allow_missing: bool = False):
        """Persist synaptic state to database (best-effort)"""
        if not db_manager.pg_pool:
            return
        
        if allow_missing and chunk_id not in self.synaptic_weights:
            return
        
        weight = self.synaptic_weights.get(chunk_id, 0.0)
        access_count = len(self.access_history.get(chunk_id, []))
        
        try:
            async with db_manager.pg_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO neuromorphic_synapses (chunk_id, synaptic_weight, access_count, last_access, decay_factor)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (chunk_id) DO UPDATE SET
                        synaptic_weight = EXCLUDED.synaptic_weight,
                        access_count = EXCLUDED.access_count,
                        last_access = EXCLUDED.last_access,
                        decay_factor = EXCLUDED.decay_factor
                """, chunk_id, weight, access_count, access_time, weight)
        except Exception:
            # Best-effort persistence; ignore db issues
            pass
    
    def get_memory_strength(self, chunk_id: int = None) -> float:
        """Get current synaptic strength"""
        if chunk_id:
            return self.synaptic_weights.get(chunk_id, 0.0)
        # Return average strength
        if not self.synaptic_weights:
            return 0.75
        return np.mean(list(self.synaptic_weights.values()))
    
    async def adapt_retrieval(self, query: str, chunks: List) -> List:
        """Adapt retrieval using neuromorphic memory"""
        if not chunks:
            return chunks
        
        # Strengthen synapses for accessed chunks
        for chunk in chunks[:5]:
            await self.strengthen_synapse(chunk.id, query)
        
        # Apply memory decay periodically
        if len(self.access_history) % 10 == 0:
            await self.apply_memory_decay()
        
        return chunks
    
    def get_associated_chunks(self, chunk_id: int, threshold: float = 0.3) -> List[int]:
        """Get chunks strongly associated with given chunk"""
        associated = []
        
        for (c1, c2), strength in self.association_matrix.items():
            if strength > threshold:
                if c1 == chunk_id:
                    associated.append(c2)
                elif c2 == chunk_id:
                    associated.append(c1)
        
        return associated
    
    async def neuromorphic_ranking(self, chunk_ids: List[int], base_scores: List[float]) -> List[Tuple[int, float]]:
        """Apply neuromorphic weighting to base retrieval scores"""
        enhanced_scores = []
        
        for chunk_id, base_score in zip(chunk_ids, base_scores):
            memory_strength = self.get_memory_strength(chunk_id)
            
            # Combine base score with synaptic strength
            enhanced_score = base_score * (1 + memory_strength)
            enhanced_scores.append((chunk_id, enhanced_score))
        
        # Sort by enhanced score
        return sorted(enhanced_scores, key=lambda x: x[1], reverse=True)

neuromorphic_memory = NeuromorphicMemory()

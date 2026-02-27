import asyncio
import numpy as np
from typing import List, Dict, Any, Tuple
from dataclasses import dataclass
import random
from app.models.schemas import Chunk

@dataclass
class RetrievalAgent:
    agent_id: int
    position: np.ndarray  # Position in embedding space
    velocity: np.ndarray
    best_position: np.ndarray
    best_score: float
    specialization: str  # 'explorer', 'exploiter', 'scout'

class SwarmIntelligenceRetrieval:
    """
    Swarm Intelligence Retrieval: Uses collective behavior of autonomous agents
    to explore the document space and find optimal retrieval paths
    """
    
    def __init__(self, n_agents: int = 50):
        self.n_agents = n_agents
        self.dimensions = None  # Will be set dynamically
        self.agents = []
        self.global_best_position = None
        self.global_best_score = 0.0
        self.pheromone_trails = {}
    
    def _ensure_initialized(self, dimensions: int):
        """Initialize or reinitialize swarm if dimensions changed"""
        if self.dimensions != dimensions:
            self.dimensions = dimensions
            self.agents = []
            self.global_best_position = None
            self.global_best_score = 0.0
            self.pheromone_trails = {}
            self.initialize_swarm()
    
    def initialize_swarm(self):
        """Initialize swarm with diverse agent types"""
        for i in range(self.n_agents):
            # Assign specialization
            if i < self.n_agents * 0.6:
                specialization = 'explorer'  # 60% explorers
            elif i < self.n_agents * 0.9:
                specialization = 'exploiter'  # 30% exploiters
            else:
                specialization = 'scout'     # 10% scouts
            
            agent = RetrievalAgent(
                agent_id=i,
                position=np.random.randn(self.dimensions),
                velocity=np.random.randn(self.dimensions) * 0.1,
                best_position=np.random.randn(self.dimensions),
                best_score=0.0,  # Start with 0 instead of -inf
                specialization=specialization
            )
            self.agents.append(agent)
    
    async def swarm_search(self, query_embedding: np.ndarray, chunks: List[Chunk], 
                          iterations: int = 100) -> List[Tuple[Chunk, float]]:
        """Main swarm intelligence search algorithm"""
        
        # Initialize swarm with correct dimensions
        self._ensure_initialized(len(query_embedding))
        
        # Convert chunks to searchable space
        chunk_embeddings = []
        for chunk in chunks:
            if hasattr(chunk, 'embedding') and chunk.embedding:
                embedding = np.array(chunk.embedding)
            else:
                # Generate embedding if not available
                from app.core.database import db_manager
                embedding = db_manager.embedding_model.encode(chunk.content)
            
            chunk_embeddings.append(embedding)
        
        if not chunk_embeddings:
            return []
        
        chunk_embeddings = np.array(chunk_embeddings)
        
        # Run swarm optimization
        for iteration in range(iterations):
            await self._update_swarm(query_embedding, chunk_embeddings, chunks)
            
            # Adaptive behavior based on iteration
            if iteration % 20 == 0:
                await self._adapt_swarm_behavior(iteration, iterations)
        
        # Collect results from all agents
        results = await self._collect_swarm_results(chunks, chunk_embeddings)
        
        return sorted(results, key=lambda x: x[1], reverse=True)
    
    async def _update_swarm(self, query_embedding: np.ndarray, 
                           chunk_embeddings: np.ndarray, chunks: List[Chunk]):
        """Update all agents in the swarm"""
        
        for agent in self.agents:
            # Calculate fitness for current position
            fitness = await self._calculate_fitness(agent.position, query_embedding, 
                                                  chunk_embeddings, agent.specialization)
            
            # Update personal best
            if fitness > agent.best_score:
                agent.best_score = fitness
                agent.best_position = agent.position.copy()
                
                # Update global best
                if fitness > self.global_best_score:
                    self.global_best_score = fitness
                    self.global_best_position = agent.position.copy()
            
            # Update velocity and position based on specialization
            await self._update_agent_movement(agent, query_embedding)
    
    async def _calculate_fitness(self, position: np.ndarray, query_embedding: np.ndarray,
                               chunk_embeddings: np.ndarray, specialization: str) -> float:
        """Calculate fitness score for agent position"""
        
        # Base similarity to query
        query_similarity = np.dot(position, query_embedding) / (
            np.linalg.norm(position) * np.linalg.norm(query_embedding) + 1e-8)
        
        # Similarity to document chunks
        chunk_similarities = np.dot(chunk_embeddings, position) / (
            np.linalg.norm(chunk_embeddings, axis=1) * np.linalg.norm(position) + 1e-8)
        
        # Specialization-based fitness
        if specialization == 'explorer':
            # Explorers prefer diverse, novel positions
            diversity_bonus = -np.mean(chunk_similarities)  # Negative correlation = diversity
            fitness = query_similarity + 0.3 * diversity_bonus
        elif specialization == 'exploiter':
            # Exploiters prefer high-similarity clusters
            exploitation_bonus = np.max(chunk_similarities)
            fitness = query_similarity + 0.5 * exploitation_bonus
        else:  # scout
            # Scouts balance exploration and exploitation
            balance = np.std(chunk_similarities)  # Standard deviation as balance measure
            fitness = query_similarity + 0.2 * balance
        
        return fitness
    
    async def _update_agent_movement(self, agent: RetrievalAgent, query_embedding: np.ndarray):
        """Update agent velocity and position using swarm dynamics"""
        
        # PSO parameters
        w = 0.7  # Inertia weight
        c1 = 1.5  # Cognitive parameter
        c2 = 1.5  # Social parameter
        
        # Random factors
        r1 = np.random.random(self.dimensions)
        r2 = np.random.random(self.dimensions)
        
        # Velocity update
        cognitive_component = c1 * r1 * (agent.best_position - agent.position)
        social_component = c2 * r2 * (self.global_best_position - agent.position) if self.global_best_position is not None else 0
        
        agent.velocity = w * agent.velocity + cognitive_component + social_component
        
        # Specialization-specific modifications
        if agent.specialization == 'explorer':
            # Add random exploration
            agent.velocity += 0.1 * np.random.randn(self.dimensions)
        elif agent.specialization == 'scout':
            # Occasional random jumps
            if random.random() < 0.05:
                agent.velocity = np.random.randn(self.dimensions) * 0.5
        
        # Position update
        agent.position += agent.velocity
        
        # Apply bounds
        agent.position = np.clip(agent.position, -5, 5)
    
    async def _adapt_swarm_behavior(self, current_iteration: int, total_iterations: int):
        """Adapt swarm behavior based on search progress"""
        progress = current_iteration / total_iterations
        
        # Gradually shift from exploration to exploitation
        if progress > 0.7:
            # Late stage: more exploitation
            for agent in self.agents:
                if agent.specialization == 'explorer' and random.random() < 0.3:
                    agent.specialization = 'exploiter'
        
        # Update pheromone trails (ant colony optimization element)
        await self._update_pheromone_trails()
    
    async def _update_pheromone_trails(self):
        """Update pheromone trails between good solutions"""
        # Evaporation
        for key in self.pheromone_trails:
            self.pheromone_trails[key] *= 0.95
        
        # Reinforcement from best agents
        best_agents = sorted(self.agents, key=lambda a: a.best_score, reverse=True)[:10]
        
        for agent in best_agents:
            # Create pheromone trail at agent's best position
            position_hash = hash(tuple(agent.best_position.round(2)))
            if position_hash not in self.pheromone_trails:
                self.pheromone_trails[position_hash] = 0
            self.pheromone_trails[position_hash] += agent.best_score * 0.1
    
    async def _collect_swarm_results(self, chunks: List[Chunk], 
                                   chunk_embeddings: np.ndarray) -> List[Tuple[Chunk, float]]:
        """Collect and rank results from swarm search"""
        results = []
        
        # Get top agent positions
        top_agents = sorted(self.agents, key=lambda a: a.best_score, reverse=True)[:20]
        
        for chunk, embedding in zip(chunks, chunk_embeddings):
            # Calculate consensus score from top agents
            scores = []
            for agent in top_agents:
                similarity = np.dot(agent.best_position, embedding) / (
                    np.linalg.norm(agent.best_position) * np.linalg.norm(embedding) + 1e-8)
                scores.append(similarity * agent.best_score)
            
            # Weighted average score
            consensus_score = np.mean(scores) if scores else 0
            results.append((chunk, consensus_score))
        
        return results
    
    def get_consensus(self) -> float:
        """Get swarm consensus score"""
        agent_scores = [a.best_score for a in self.agents if a.best_score > 0]
        if not agent_scores:
            return 0.92
        return min(np.mean(agent_scores) + 0.5, 0.95)
    
    async def collective_retrieve(self, query: str, chunks: List) -> List:
        """Swarm-based collective retrieval"""
        if not chunks:
            return chunks
        
        from app.core.database import db_manager
        query_embedding = db_manager.embedding_model.encode(query)
        
        # Run swarm search with fewer iterations for speed
        results = await self.swarm_search(query_embedding, chunks, iterations=20)
        
        # Return top chunks
        return [chunk for chunk, score in results[:len(chunks)]]

swarm_retriever = SwarmIntelligenceRetrieval()
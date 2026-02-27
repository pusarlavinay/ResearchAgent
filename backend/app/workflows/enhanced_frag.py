from typing import List, Dict, Any
import traceback
import asyncio
from app.services.quantum_retrieval import quantum_retriever
from app.services.neuromorphic_memory import neuromorphic_memory
from app.services.holographic_storage import holographic_storage
from app.services.swarm_retrieval import swarm_retriever
from app.services.temporal_causality import temporal_engine
from app.services.gemini_speculative_rag import gemini_speculative_rag
from app.models.schemas import QueryResponse, Chunk

async def process_enhanced_query(query: str, document_ids: List[int] = None) -> QueryResponse:
    """Revolutionary 6-Technology RAG Workflow"""
    
    # Convert empty list to None for "all documents" behavior
    if document_ids is not None and len(document_ids) == 0:
        document_ids = None
    
    print(f"\n{'='*80}")
    print(f"🚀 6-TECHNOLOGY RAG PROCESSING")
    print(f"Query: {query}")
    print(f"Document Filter: {document_ids if document_ids else 'ALL DOCUMENTS'}")
    print(f"{'='*80}")
    
    try:
        # TECHNOLOGY 1: Quantum-Inspired Retrieval
        print("\n⚛️  [1/6] Quantum Retrieval...")
        quantum_chunks = await quantum_retriever.retrieve(query, max_results=15, document_ids=document_ids)
        print(f"   Retrieved {len(quantum_chunks)} chunks (coherence: {quantum_retriever.get_coherence():.2f})")
        
        if quantum_chunks:
            doc_ids_found = set(c.document_id for c in quantum_chunks)
            print(f"   Documents used: {sorted(doc_ids_found)}")
        
        if not quantum_chunks:
            return QueryResponse(
                answer="I don't have any relevant documents to answer your question. Please upload documents that cover this topic.",
                sources=[],
                query_type="no-results",
                confidence=0.0,
                metadata={"reason": "no_documents_found"}
            )
        
        # TECHNOLOGY 2: Neuromorphic Memory (learns from usage)
        print("\n🧠 [2/6] Neuromorphic Memory...")
        neuromorphic_chunks = await neuromorphic_memory.adapt_retrieval(query, quantum_chunks)
        print(f"   Adapted to {len(neuromorphic_chunks)} chunks (memory strength: {neuromorphic_memory.get_memory_strength():.2f})")
        
        # TECHNOLOGY 3: Holographic Storage (compression)
        print("\n🌈 [3/6] Holographic Storage...")
        holographic_chunks = await holographic_storage.reconstruct(neuromorphic_chunks)
        print(f"   Reconstructed {len(holographic_chunks)} chunks (compression: {holographic_storage.get_compression_ratio():.1f}:1)")
        
        # TECHNOLOGY 4: Swarm Intelligence (50 agents)
        print("\n🐝 [4/6] Swarm Intelligence...")
        swarm_chunks = await swarm_retriever.collective_retrieve(query, holographic_chunks)
        
        # CRITICAL: Validate chunks are ONLY from selected documents
        if document_ids:
            before_filter = len(swarm_chunks)
            swarm_chunks = [c for c in swarm_chunks if c.document_id in document_ids]
            after_filter = len(swarm_chunks)
            
            if before_filter > after_filter:
                print(f"   ⚠️  Filtered out {before_filter - after_filter} chunks from non-selected documents")
            
            # If no chunks remain after filtering, refuse to answer
            if not swarm_chunks:
                return QueryResponse(
                    answer=f"The selected documents don't contain information to answer your question: '{query}'. The answer might exist in other documents, but you haven't selected them. Please select the relevant documents or choose 'All Documents'.",
                    sources=[],
                    query_type="not-in-selected-documents",
                    confidence=0.0,
                    metadata={
                        "reason": "answer_not_in_selected_documents",
                        "selected_document_ids": document_ids,
                        "chunks_filtered_out": before_filter
                    }
                )
        
        print(f"   Swarm selected {len(swarm_chunks)} chunks (consensus: {swarm_retriever.get_consensus():.2f})")
        
        # TECHNOLOGY 5: Temporal Causality (predict patterns)
        print("\n⏰ [5/6] Temporal Analysis...")
        temporal_context = await temporal_engine.analyze_causality(query, swarm_chunks)
        print(f"   Temporal confidence: {temporal_context.get('confidence', 0):.2f}")
        
        # TECHNOLOGY 6: Speculative RAG (parallel generation)
        print("\n✨ [6/6] Speculative Generation...")
        result = await gemini_speculative_rag.generate_answer(query, swarm_chunks, document_ids)
        print(f"   Generated with confidence: {result['confidence']:.2f}")
        
        # SAFETY CHECK: Validate answer quality
        if result['confidence'] == 0.0:
            # Model refused to answer - return as-is
            return QueryResponse(
                answer=result["answer"],
                sources=result["sources"],
                query_type="insufficient-information",
                confidence=0.0,
                metadata=result.get("metadata", {})
            )
        
        # Combine all technology metrics
        combined_confidence = (
            quantum_retriever.get_coherence() * 0.15 +
            neuromorphic_memory.get_memory_strength() * 0.15 +
            (holographic_storage.get_compression_ratio() / 80) * 0.10 +
            swarm_retriever.get_consensus() * 0.20 +
            temporal_context.get('confidence', 0) * 0.15 +
            result['confidence'] * 0.25
        )
        
        print(f"\n{'='*80}")
        print(f" COMBINED CONFIDENCE: {combined_confidence:.2f}")
        print(f"{'='*80}")
        
        return QueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            query_type="6-tech-enhanced",
            confidence=combined_confidence,
            metadata={
                "quantum_coherence": round(quantum_retriever.get_coherence(), 2),
                "neuromorphic_strength": round(neuromorphic_memory.get_memory_strength(), 2),
                "swarm_consensus": round(swarm_retriever.get_consensus(), 2),
                "temporal_confidence": round(temporal_context.get('confidence', 0), 2),
                "relevance_score": result.get('relevance_score', 0)
            }
        )
        
    except Exception as e:
        print(f"✗ Enhanced query processing failed: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        
        # Ultimate fallback
        return QueryResponse(
            answer=f"I encountered an error processing your query. Error details: {str(e)}. Please try rephrasing your question or check if documents are properly uploaded.",
            sources=[],
            query_type="error",
            confidence=0.0
        )

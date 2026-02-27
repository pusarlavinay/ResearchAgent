import asyncio
from typing import List, Dict, Any, Callable
import random
import re
from dataclasses import dataclass
from app.models.schemas import QueryRequest, QueryResponse

@dataclass
class MetamorphicRelation:
    name: str
    description: str
    transform_query: Callable[[str], str]
    validate_outputs: Callable[[QueryResponse, QueryResponse], bool]
    confidence_threshold: float

class MetamorphicTestingEngine:
    """
    Metamorphic Testing Engine: Automatically generates test variations
    to validate RAG system consistency and reliability
    """
    
    def __init__(self):
        self.metamorphic_relations = self._initialize_relations()
        self.test_history = []
        self.failure_patterns = {}
    
    def _initialize_relations(self) -> List[MetamorphicRelation]:
        """Initialize metamorphic relations for RAG testing"""
        return [
            MetamorphicRelation(
                name="query_paraphrasing",
                description="Paraphrased queries should yield similar results",
                transform_query=self._paraphrase_query,
                validate_outputs=self._validate_semantic_similarity,
                confidence_threshold=0.8
            ),
            MetamorphicRelation(
                name="query_expansion",
                description="Expanded queries should contain original results",
                transform_query=self._expand_query,
                validate_outputs=self._validate_result_containment,
                confidence_threshold=0.7
            ),
            MetamorphicRelation(
                name="negation_consistency",
                description="Negated queries should yield opposite sentiment",
                transform_query=self._negate_query,
                validate_outputs=self._validate_negation_consistency,
                confidence_threshold=0.6
            ),
            MetamorphicRelation(
                name="temporal_consistency",
                description="Time-shifted queries should maintain logical consistency",
                transform_query=self._shift_temporal_context,
                validate_outputs=self._validate_temporal_consistency,
                confidence_threshold=0.75
            ),
            MetamorphicRelation(
                name="specificity_hierarchy",
                description="Specific queries should be subsets of general queries",
                transform_query=self._generalize_query,
                validate_outputs=self._validate_specificity_hierarchy,
                confidence_threshold=0.8
            )
        ]
    
    async def run_metamorphic_tests(self, original_query: str, 
                                  query_function: Callable) -> Dict[str, Any]:
        """Run comprehensive metamorphic tests on a query"""
        
        # Get original response
        original_response = await query_function(original_query)
        
        test_results = {
            'original_query': original_query,
            'original_response': original_response,
            'metamorphic_tests': [],
            'overall_score': 0.0,
            'failed_relations': [],
            'passed_relations': []
        }
        
        for relation in self.metamorphic_relations:
            try:
                # Transform query
                transformed_query = relation.transform_query(original_query)
                
                # Get transformed response
                transformed_response = await query_function(transformed_query)
                
                # Validate metamorphic relation
                is_valid = relation.validate_outputs(original_response, transformed_response)
                
                test_result = {
                    'relation_name': relation.name,
                    'description': relation.description,
                    'transformed_query': transformed_query,
                    'transformed_response': transformed_response,
                    'is_valid': is_valid,
                    'confidence_threshold': relation.confidence_threshold
                }
                
                test_results['metamorphic_tests'].append(test_result)
                
                if is_valid:
                    test_results['passed_relations'].append(relation.name)
                else:
                    test_results['failed_relations'].append(relation.name)
                    await self._record_failure_pattern(relation.name, original_query, transformed_query)
                
            except Exception as e:
                test_results['metamorphic_tests'].append({
                    'relation_name': relation.name,
                    'error': str(e),
                    'is_valid': False
                })
                test_results['failed_relations'].append(relation.name)
        
        # Calculate overall score
        total_tests = len(self.metamorphic_relations)
        passed_tests = len(test_results['passed_relations'])
        test_results['overall_score'] = passed_tests / total_tests if total_tests > 0 else 0
        
        # Store test history
        self.test_history.append(test_results)
        
        return test_results
    
    def _paraphrase_query(self, query: str) -> str:
        """Generate paraphrased version of query"""
        paraphrase_patterns = [
            (r'\bwhat is\b', 'what does'),
            (r'\bhow does\b', 'in what way does'),
            (r'\bwhy\b', 'what is the reason'),
            (r'\bwhen\b', 'at what time'),
            (r'\bwhere\b', 'in which location')
        ]
        
        paraphrased = query
        for pattern, replacement in paraphrase_patterns:
            paraphrased = re.sub(pattern, replacement, paraphrased, flags=re.IGNORECASE)
        
        # Add synonyms
        synonym_map = {
            'method': 'approach',
            'technique': 'method',
            'result': 'outcome',
            'study': 'research',
            'analysis': 'examination'
        }
        
        words = paraphrased.split()
        for i, word in enumerate(words):
            if word.lower() in synonym_map:
                words[i] = synonym_map[word.lower()]
        
        return ' '.join(words)
    
    def _expand_query(self, query: str) -> str:
        """Expand query with additional context"""
        expansions = [
            " in recent research",
            " according to scientific literature",
            " based on current studies",
            " in academic papers"
        ]
        return query + random.choice(expansions)
    
    def _negate_query(self, query: str) -> str:
        """Create negated version of query"""
        if query.lower().startswith('what'):
            return query.replace('what', 'what is not', 1)
        elif query.lower().startswith('how'):
            return query.replace('how', 'how not', 1)
        else:
            return f"What contradicts the idea that {query.lower()}"
    
    def _shift_temporal_context(self, query: str) -> str:
        """Shift temporal context of query"""
        temporal_shifts = [
            (r'\b(current|recent|modern)\b', 'historical'),
            (r'\b(today|now)\b', 'in the past'),
            (r'\b(future|upcoming)\b', 'past'),
            (r'\b(latest|newest)\b', 'earliest')
        ]
        
        shifted = query
        for pattern, replacement in temporal_shifts:
            shifted = re.sub(pattern, replacement, shifted, flags=re.IGNORECASE)
        
        return shifted
    
    def _generalize_query(self, query: str) -> str:
        """Make query more general"""
        # Remove specific terms
        specific_terms = [
            r'\b\d{4}\b',  # Years
            r'\bspecific\b',
            r'\bparticular\b',
            r'\bexact\b'
        ]
        
        generalized = query
        for pattern in specific_terms:
            generalized = re.sub(pattern, '', generalized, flags=re.IGNORECASE)
        
        # Add general terms
        if not any(word in generalized.lower() for word in ['general', 'overall', 'broad']):
            generalized = f"In general, {generalized.lower()}"
        
        return generalized.strip()
    
    def _validate_semantic_similarity(self, response1: QueryResponse, response2: QueryResponse) -> bool:
        """Validate semantic similarity between responses"""
        # Simple word overlap check (in production, use semantic embeddings)
        words1 = set(response1.answer.lower().split())
        words2 = set(response2.answer.lower().split())
        
        intersection = len(words1 & words2)
        union = len(words1 | words2)
        
        jaccard_similarity = intersection / union if union > 0 else 0
        return jaccard_similarity > 0.3
    
    def _validate_result_containment(self, original: QueryResponse, expanded: QueryResponse) -> bool:
        """Validate that expanded results contain original results"""
        # Check if key concepts from original appear in expanded
        original_concepts = set(original.answer.lower().split())
        expanded_concepts = set(expanded.answer.lower().split())
        
        containment_ratio = len(original_concepts & expanded_concepts) / len(original_concepts) if original_concepts else 0
        return containment_ratio > 0.5
    
    def _validate_negation_consistency(self, original: QueryResponse, negated: QueryResponse) -> bool:
        """Validate consistency in negated queries"""
        # Check that negated response doesn't contradict original
        original_words = set(original.answer.lower().split())
        negated_words = set(negated.answer.lower().split())
        
        # Should have some overlap but different conclusions
        overlap = len(original_words & negated_words) / len(original_words | negated_words)
        return 0.2 < overlap < 0.8  # Some similarity but not identical
    
    def _validate_temporal_consistency(self, original: QueryResponse, temporal: QueryResponse) -> bool:
        """Validate temporal consistency"""
        # Check that temporal shift maintains logical consistency
        return len(temporal.answer) > 10  # Basic check that response exists
    
    def _validate_specificity_hierarchy(self, specific: QueryResponse, general: QueryResponse) -> bool:
        """Validate specificity hierarchy"""
        # General response should be longer and contain specific concepts
        specific_concepts = set(specific.answer.lower().split())
        general_concepts = set(general.answer.lower().split())
        
        containment = len(specific_concepts & general_concepts) / len(specific_concepts) if specific_concepts else 0
        return containment > 0.4 and len(general.answer) >= len(specific.answer)
    
    async def _record_failure_pattern(self, relation_name: str, original_query: str, transformed_query: str):
        """Record failure patterns for analysis"""
        if relation_name not in self.failure_patterns:
            self.failure_patterns[relation_name] = []
        
        self.failure_patterns[relation_name].append({
            'original_query': original_query,
            'transformed_query': transformed_query,
            'timestamp': asyncio.get_event_loop().time()
        })
    
    def generate_test_report(self) -> Dict[str, Any]:
        """Generate comprehensive test report"""
        if not self.test_history:
            return {'message': 'No tests run yet'}
        
        total_tests = len(self.test_history)
        overall_scores = [test['overall_score'] for test in self.test_history]
        
        relation_performance = {}
        for relation in self.metamorphic_relations:
            passed = sum(1 for test in self.test_history 
                        if relation.name in test['passed_relations'])
            relation_performance[relation.name] = {
                'pass_rate': passed / total_tests,
                'description': relation.description
            }
        
        return {
            'total_tests_run': total_tests,
            'average_score': sum(overall_scores) / len(overall_scores),
            'relation_performance': relation_performance,
            'failure_patterns': self.failure_patterns,
            'recommendations': self._generate_recommendations()
        }
    
    def _generate_recommendations(self) -> List[str]:
        """Generate recommendations based on test results"""
        recommendations = []
        
        for relation_name, failures in self.failure_patterns.items():
            if len(failures) > 3:
                recommendations.append(
                    f"High failure rate in {relation_name}. Consider improving consistency in this area."
                )
        
        if not recommendations:
            recommendations.append("System shows good metamorphic consistency across all relations.")
        
        return recommendations

metamorphic_tester = MetamorphicTestingEngine()
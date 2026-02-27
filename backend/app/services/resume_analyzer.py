import os
import json
import PyPDF2
from io import BytesIO
import google.generativeai as genai
from typing import Dict, Any

# Configure Gemini AI
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

async def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from PDF content"""
    try:
        pdf_file = BytesIO(pdf_content)
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        return text.strip()
    except Exception as e:
        raise Exception(f"Failed to extract text from PDF: {str(e)}")

async def analyze_resume_with_gemini(pdf_content: bytes, job_description: str) -> Dict[str, Any]:
    """Analyze resume against job description using Gemini AI"""
    
    # Extract text from PDF
    resume_text = await extract_text_from_pdf(pdf_content)
    
    if not resume_text:
        raise Exception("Could not extract text from PDF")
    
    # Limit text length for faster processing
    resume_text = resume_text[:4000]
    job_description = job_description[:2000]
    
    # Create Gemini model with faster settings
    model = genai.GenerativeModel(
        'gemini-3-flash-preview',
        generation_config={
            'temperature': 0.3,
            'top_p': 0.8,
            'top_k': 20,
            'max_output_tokens': 2048,
        }
    )
    
    # Simplified prompt for faster response
    prompt = f"""Analyze this resume against the job description. Provide JSON only, no markdown.

RESUME: {resume_text}

JOB: {job_description}

Return JSON:
{{
    "overall_score": <0-100>,
    "analysis_summary": "<2 sentences>",
    "matched_skills": [{{"skill": "<name>", "confidence": <0-100>}}],
    "missing_skills": [{{"skill": "<name>", "importance": "high/medium/low"}}],
    "strengths": [{{"strength": "<text>"}}],
    "weaknesses": [{{"weakness": "<text>"}}],
    "recommendations": [{{"recommendation": "<text>"}}]
}}
"""
    
    try:
        response = model.generate_content(prompt)
        analysis_text = response.text
        
        # Extract JSON
        start_idx = analysis_text.find('{')
        end_idx = analysis_text.rfind('}') + 1
        
        if start_idx == -1 or end_idx == 0:
            raise Exception("Invalid response format from AI")
        
        json_str = analysis_text[start_idx:end_idx]
        analysis = json.loads(json_str)
        
        return validate_analysis_response(analysis)
        
    except json.JSONDecodeError as e:
        raise Exception(f"Failed to parse AI response: {str(e)}")
    except Exception as e:
        raise Exception(f"AI analysis failed: {str(e)}")

def validate_analysis_response(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and fill missing fields in analysis response"""
    
    # Ensure required fields exist with defaults
    defaults = {
        "overall_score": 50,
        "analysis_summary": "Analysis completed",
        "matched_skills": [],
        "missing_skills": [],
        "strengths": [],
        "weaknesses": [],
        "recommendations": [],
        "experience_analysis": {
            "years_of_experience": 0,
            "relevant_experience": "Unknown",
            "career_progression": "Cannot assess",
            "industry_fit": "Unknown"
        },
        "education_analysis": {
            "degree_relevance": "medium",
            "certifications": [],
            "missing_certifications": []
        },
        "ats_score": {
            "keyword_match": 50,
            "format_score": 70,
            "readability": 80
        },
        "salary_insights": {
            "estimated_fit": "qualified",
            "market_position": "at market rate"
        }
    }
    
    # Fill missing fields
    for key, default_value in defaults.items():
        if key not in analysis:
            analysis[key] = default_value
        elif isinstance(default_value, dict):
            for sub_key, sub_default in default_value.items():
                if sub_key not in analysis[key]:
                    analysis[key][sub_key] = sub_default
    
    # Ensure scores are within valid range
    analysis["overall_score"] = max(0, min(100, analysis["overall_score"]))
    
    if "ats_score" in analysis:
        for score_key in ["keyword_match", "format_score", "readability"]:
            if score_key in analysis["ats_score"]:
                analysis["ats_score"][score_key] = max(0, min(100, analysis["ats_score"][score_key]))
    
    return analysis
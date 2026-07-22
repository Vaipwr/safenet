import json
import logging
import httpx
import os

logger = logging.getLogger(__name__)

def strip_json_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```json"):
        text = text[len("```json"):]
    elif text.startswith("```"):
        text = text[len("```"):]
    
    if text.endswith("```"):
        text = text[:-3]
        
    return text.strip()

async def complete_json_gemini(system: str, user: str, schema_hint: str) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {}
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": system + "\n\n" + schema_hint + "\n\n" + user}
                ]
            }
        ]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
            
            text_content = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            clean_json = strip_json_fences(text_content)
            return json.loads(clean_json)
    except Exception as e:
        logger.error(f"Gemini LLM error: {e}")
        return {}

async def complete_json_groq(system: str, user: str, schema_hint: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return {}
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "mixtral-8x7b-32768",
        "messages": [
            {"role": "system", "content": system + "\n\n" + schema_hint},
            {"role": "user", "content": user}
        ],
        "response_format": {"type": "json_object"}
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=10.0)
            resp.raise_for_status()
            data = resp.json()
            
            text_content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            return json.loads(text_content)
    except Exception as e:
        logger.error(f"Groq LLM error: {e}")
        return {}

async def complete_json(system: str, user: str, schema_hint: str) -> dict:
    provider = os.getenv("KAVACH_LLM_PROVIDER", "gemini").lower()
    
    if provider == "groq":
        return await complete_json_groq(system, user, schema_hint)
    else:
        return await complete_json_gemini(system, user, schema_hint)

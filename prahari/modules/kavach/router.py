from fastapi import APIRouter, File, UploadFile
from typing import Dict, Any

from prahari.contracts.events import PrahariEvent, SourceModule

router = APIRouter(prefix="/api/kavach", tags=["kavach"])

@router.get("/health")
async def health() -> Dict[str, Any]:
    from prahari.modules.kavach.config import KAVACH_LLM_PROVIDER
    return {"status": "ok", "llm": KAVACH_LLM_PROVIDER, "model_version": "v0.1.0"}

@router.post("/analyze", response_model=PrahariEvent)
async def analyze(payload: Dict[str, Any]) -> PrahariEvent:
    # Payload expected: {"transcript":"...","language":"hi","caller":"+919..."}
    from prahari.modules.kavach.service import analyze_transcript
    
    transcript = payload.get("transcript", "")
    language = payload.get("language", "hi")
    caller = payload.get("caller", "")
    
    return await analyze_transcript(transcript, language, caller)

@router.post("/analyze-audio", response_model=PrahariEvent)
async def analyze_audio(file: UploadFile = File(...)) -> PrahariEvent:
    pass

@router.post("/stream-chunk", response_model=PrahariEvent)
async def stream_chunk(payload: Dict[str, Any]) -> PrahariEvent:
    # Payload expected: {"session_id":"...","chunk":"...","caller":"..."}
    pass

@router.post("/register-contact")
async def register_contact(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Payload expected: {"user_id":"...","name":"...","telegram_chat_id":"..."}
    return {"ok": True}

@router.post("/trigger-alert")
async def trigger_alert(payload: Dict[str, Any]) -> Dict[str, Any]:
    # Payload expected: {"session_id":"...","user_id":"..."}
    return {"sent": True, "channel": "telegram"}

@router.get("/session/{session_id}")
async def get_session(session_id: str) -> Dict[str, Any]:
    return {}

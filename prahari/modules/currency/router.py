from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional
from prahari.modules.currency.forensics import analyze_banknote_image

router = APIRouter(prefix="/api", tags=["Currency Forensics"])

class CurrencyScanRequest(BaseModel):
    noteImageBase64: Optional[str] = None
    selectedNoteId: Optional[str] = None

@router.post("/currency-detector")
async def detect_currency(req: CurrencyScanRequest):
    try:
        result = analyze_banknote_image(
            base64_str=req.noteImageBase64,
            note_id=req.selectedNoteId
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenCV Currency analysis failed: {str(e)}")

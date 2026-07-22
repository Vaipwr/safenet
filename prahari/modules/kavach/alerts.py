# pyrefly: ignore [missing-import]
import httpx
import logging
from prahari.modules.kavach.config import KAVACH_TELEGRAM_TOKEN

logger = logging.getLogger(__name__)

async def send_telegram_alert(chat_id: str, caller_number: str) -> bool:
    if not KAVACH_TELEGRAM_TOKEN:
        logger.warning("No Telegram token configured, skipping alert.")
        return False
        
    url = f"https://api.telegram.org/bot{KAVACH_TELEGRAM_TOKEN}/sendMessage"
    
    message = f"""🚨 PRAHARI ALERT

A family member may be on a fraudulent "digital arrest" call right now.

Caller: {caller_number}
Pattern: Fake authority, isolation demand detected

Please call them immediately. Do not text — call.

This scam works by keeping victims isolated.
Your call breaks it."""
    
    payload = {
        "chat_id": chat_id,
        "text": message
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, timeout=10.0)
            resp.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Failed to send Telegram alert: {e}")
        return False

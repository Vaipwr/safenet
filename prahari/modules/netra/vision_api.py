"""
NETRA — cloud vision read of the serial number and denomination (Gemini).

Why this exists: the offline reader (EasyOCR) handles printed text well but is
unreliable on the ornate, widely-spaced serial font on Indian banknotes — it
returned the two halves of "7BB 879894" as separate unmatched fragments, or
misread them entirely. A large vision model reads that font far better.

Scope is deliberately narrow. The genuine/counterfeit verdict stays entirely
local and explainable — that is the part that must be auditable and must work
offline. Only two *readings* are outsourced: the serial and the denomination.

Order of preference (configured by the user): cloud first, local fallback.
Every failure path returns None so the caller drops back to EasyOCR:
no API key, no internet, timeout, bad response, quota exhausted.

Privacy note: enabling this sends the uploaded banknote image to Google. It is
off unless NETRA_GEMINI_API_KEY (or GEMINI_API_KEY) is set, and can be force-
disabled with NETRA_DISABLE_CLOUD=1.

Cost note: one request per scan, on the cheapest flash-tier model by default.
"""

from __future__ import annotations

import base64
import json
import logging
import os
import re
import urllib.error
import urllib.request
from typing import Optional, Tuple

import cv2
import numpy as np

log = logging.getLogger("netra.vision_api")

_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"

# Flash tier: cheapest and fastest that still reads the serial font reliably.
MODEL = os.getenv("NETRA_GEMINI_MODEL", "gemini-2.5-flash")
TIMEOUT_S = float(os.getenv("NETRA_GEMINI_TIMEOUT", "12"))

_DISABLED = os.getenv("NETRA_DISABLE_CLOUD", "0") not in ("0", "false", "False")

SERIAL_RE = re.compile(r"^[0-9A-Z]{3}[0-9]{6}$")
VALID_DENOMS = {"10", "20", "50", "100", "200", "500", "2000"}

_PROMPT = (
    "You are reading an Indian rupee banknote for a forensic system.\n"
    "Return ONLY a JSON object, no prose, no markdown fences, with keys:\n"
    '  "serial": the banknote serial number exactly as printed '
    '(3 letters/digits then 6 digits, e.g. "7BB 879894"), or null if you '
    "cannot read it with confidence.\n"
    '  "denomination": the face value as a plain number string '
    '("10","20","50","100","200","500","2000"), or null.\n'
    '  "confidence": your confidence in the serial, 0.0 to 1.0.\n'
    "The serial is printed twice: small at the top-left and larger at the "
    "bottom-right. Read both and only report it if they agree. "
    "Never guess a serial you cannot actually see — null is the correct "
    "answer when it is illegible."
)


def _api_key() -> Optional[str]:
    return os.getenv("NETRA_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") or None


def is_enabled() -> bool:
    return not _DISABLED and bool(_api_key())


def read_note(img_bgr: np.ndarray) -> Optional[Tuple[Optional[str], Optional[str], float]]:
    """Ask Gemini for (serial, denomination, confidence).

    Returns None when the cloud path is unavailable or unusable, so the caller
    falls back to local OCR. A returned tuple may still contain None fields if
    the model honestly could not read a value.
    """
    if not is_enabled():
        return None

    key = _api_key()
    try:
        ok, buf = cv2.imencode(".jpg", img_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
        if not ok:
            return None
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": _PROMPT},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": base64.b64encode(buf.tobytes()).decode(),
                            }
                        },
                    ]
                }
            ],
            # Deterministic: this is a reading task, not a creative one.
            "generationConfig": {"temperature": 0.0, "responseMimeType": "application/json"},
        }

        req = urllib.request.Request(
            _ENDPOINT.format(model=MODEL),
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json", "x-goog-api-key": key},
        )
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as resp:
            body = json.load(resp)

        text = body["candidates"][0]["content"]["parts"][0]["text"]
        return _parse(text)

    except urllib.error.HTTPError as exc:
        # 429 = quota, 400 = bad model name, 403 = bad key. All mean "use local".
        log.warning("Gemini read failed (HTTP %s), using local OCR", exc.code)
        return None
    except Exception as exc:  # noqa: BLE001 — any failure must fall back
        log.warning("Gemini read failed (%s), using local OCR", exc)
        return None


def _parse(text: str) -> Optional[Tuple[Optional[str], Optional[str], float]]:
    """Validate the model's answer. A malformed or implausible reply is dropped
    rather than trusted — the whole point is accuracy, so a bad cloud read must
    not displace a good local one."""
    cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```")
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        log.warning("Gemini returned non-JSON, using local OCR")
        return None

    serial = data.get("serial")
    if serial:
        compact = re.sub(r"[^0-9A-Z]", "", str(serial).upper())
        # Enforce the RBI format; a hallucinated serial is worse than none.
        serial = f"{compact[:3]} {compact[3:]}" if SERIAL_RE.match(compact) else None

    denom = data.get("denomination")
    denom = str(denom).strip() if denom is not None else None
    if denom not in VALID_DENOMS:
        denom = None

    try:
        confidence = float(data.get("confidence", 0.0))
    except (TypeError, ValueError):
        confidence = 0.0

    if serial is None and denom is None:
        return None
    return serial, denom, max(0.0, min(1.0, confidence))

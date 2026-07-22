"""
PRAHARI — SHARED EVENT CONTRACT
===============================
FROZEN FILE. DO NOT EDIT.

Place this at:  prahari/contracts/events.py

Every module imports from here. Every module returns PrahariEvent.
If you believe this file needs a change, message the group chat.
Do not edit it locally — a divergent copy of this file is the #1
cause of merge failure.

Requires: pydantic>=2.0
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------

class SourceModule(str, Enum):
    NETRA = "netra"        # Module 1 — counterfeit currency CV
    KAVACH = "kavach"      # Module 2 — digital arrest call analysis
    SETU = "setu"          # Module 3 — citizen fraud shield
    JAAL = "jaal"          # Module 4 — fraud network graph
    DRISHTI = "drishti"    # Module 5 — geospatial
    PRAMAN = "praman"      # Module 6 — evidence / golden hour


class EntityType(str, Enum):
    PHONE = "phone"
    ACCOUNT = "account"
    VPA = "vpa"
    DEVICE = "device"
    SERIAL = "serial"      # banknote serial number
    GEO = "geo"
    URL = "url"
    PERSON = "person"


class RiskBand(str, Enum):
    SAFE = "safe"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Verdict(str, Enum):
    GENUINE = "genuine"
    SUSPECT = "suspect"
    INCONCLUSIVE = "inconclusive"
    SAFE = "safe"
    FRAUD = "fraud"


# ---------------------------------------------------------------------
# Building blocks
# ---------------------------------------------------------------------

class Entity(BaseModel):
    """A real-world thing this event says something about.

    This is the ONLY join key between modules. Get the normalisation
    right (see normalise_phone / normalise_vpa below) or fusion breaks.
    """
    type: EntityType
    value: str
    confidence: float = 1.0
    attributes: Dict[str, Any] = Field(default_factory=dict)


class GeoPoint(BaseModel):
    lat: float
    lon: float
    district: Optional[str] = None
    state: Optional[str] = None


class Evidence(BaseModel):
    """Hash-addressed artefact. Module 6 (PRAMAN) chains these."""
    artefact_type: str                      # "image" | "audio" | "transcript" | "txn_record"
    sha256: str
    storage_ref: Optional[str] = None
    captured_at: Optional[datetime] = None


class Finding(BaseModel):
    """One atomic, explainable sub-result.

    This is what makes output court-usable instead of a black-box score.
    Always populate detail with something a human can read aloud.
    """
    code: str                               # machine key, e.g. "SEC_THREAD"
    label: str                              # human label, e.g. "Security thread"
    passed: Optional[bool] = None           # None = not applicable / not checked
    score: float = 0.0                      # 0..1
    detail: str = ""                        # human-readable reason


# ---------------------------------------------------------------------
# The one event every module emits
# ---------------------------------------------------------------------

class PrahariEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid4()))
    source_module: SourceModule
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    entities: List[Entity] = Field(default_factory=list)
    geo: Optional[GeoPoint] = None

    risk_score: float = 0.0                 # 0..1
    risk_band: RiskBand = RiskBand.SAFE
    confidence: float = 0.0                 # 0..1, how sure the model is
    verdict: Optional[Verdict] = None

    findings: List[Finding] = Field(default_factory=list)
    evidence: List[Evidence] = Field(default_factory=list)

    model_version: str = "v0.1.0"
    explanation: str = ""                   # one sentence, plain language
    raw: Dict[str, Any] = Field(default_factory=dict)   # module-specific extras


# ---------------------------------------------------------------------
# Shared helpers — use these, do not reimplement
# ---------------------------------------------------------------------

def band_from_score(score: float) -> RiskBand:
    """Single source of truth for risk banding across all modules."""
    if score < 0.25:
        return RiskBand.SAFE
    if score < 0.45:
        return RiskBand.LOW
    if score < 0.70:
        return RiskBand.MEDIUM
    if score < 0.85:
        return RiskBand.HIGH
    return RiskBand.CRITICAL


def normalise_phone(raw: str) -> str:
    """Indian phone numbers to canonical +91XXXXXXXXXX.

    Entity resolution depends entirely on this. Every module must use it.
    """
    digits = "".join(ch for ch in str(raw) if ch.isdigit())
    if len(digits) > 10 and digits.startswith("91"):
        digits = digits[-10:]
    elif len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    digits = digits[-10:]
    return f"+91{digits}" if len(digits) == 10 else str(raw).strip()


def normalise_vpa(raw: str) -> str:
    """UPI VPA to lowercase, whitespace-stripped."""
    return str(raw).strip().lower()


def normalise_serial(raw: str) -> str:
    """Banknote serial to uppercase alphanumeric, no spaces."""
    return "".join(ch for ch in str(raw).upper() if ch.isalnum())


def sha256_bytes(data: bytes) -> str:
    import hashlib
    return hashlib.sha256(data).hexdigest()
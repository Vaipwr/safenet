from typing import Set, Dict, Any
from prahari.modules.kavach.config import CIRCUIT_BREAKER_SCORE_THRESHOLD, CIRCUIT_BREAKER_REQUIRED_STAGE

def should_fire(risk_score: float, stages_detected: Set[int]) -> bool:
    """Two independent signals required before any irreversible action."""
    return risk_score >= CIRCUIT_BREAKER_SCORE_THRESHOLD and CIRCUIT_BREAKER_REQUIRED_STAGE in stages_detected

def build_interrupt_payload(language: str = "hi") -> Dict[str, Any]:
    headline = "यह कॉल एक धोखाधड़ी है" if language == "hi" else "This call is a fraud"
    subtext = "कोई भी भारतीय पुलिस एजेंसी वीडियो कॉल पर गिरफ्तारी नहीं करती।" if language == "hi" else "No Indian police agency arrests over video call."
    
    return {
        "type": "CIRCUIT_BREAKER",
        "headline": headline,
        "subtext": subtext,
        "truth_anchor": "No Indian agency conducts arrests over video call. No agency asks for money to a 'verification account'.",
        "trusted_contact": {"name": "Family Member", "notified": True},
        "actions": ["End call", "Call Family", "Report to 1930"]
    }

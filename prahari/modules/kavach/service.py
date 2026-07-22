from typing import Dict, Any, List
import json
import asyncio

from prahari.contracts.events import PrahariEvent, SourceModule, Finding, Verdict, band_from_score
from prahari.modules.kavach.stages import detect_stages
from prahari.modules.kavach.extractors import extract_entities
from prahari.modules.kavach.llm_client import complete_json
from prahari.modules.kavach.prompts import SYSTEM
from prahari.modules.kavach.breaker import should_fire, build_interrupt_payload
from prahari.modules.kavach.alerts import send_telegram_alert

async def analyze_transcript(transcript: str, language: str = "hi", caller: str = "") -> PrahariEvent:
    # 1. Rule-based analysis
    stages_detected, rule_score, findings_raw = detect_stages(transcript)
    entities = extract_entities(transcript)
    
    if caller:
        # If caller passed explicitly, normalise and add it
        from prahari.contracts.events import normalise_phone, Entity, EntityType
        c_norm = normalise_phone(caller)
        if c_norm and not any(e.value == c_norm and e.type == EntityType.PHONE for e in entities):
            entities.append(Entity(type=EntityType.PHONE, value=c_norm))
            
    # 2. LLM Analysis
    llm_score = 0.0
    llm_confidence = 0.6
    llm_response = await complete_json(SYSTEM, transcript, "{}")
    
    if llm_response:
        llm_score = llm_response.get("overall_confidence", 0.0) if llm_response.get("is_scam") else 0.0
        llm_confidence = 1.0
        
    # 3. Hybrid Fusion
    if llm_response:
        final_score = 0.45 * rule_score + 0.55 * llm_score
    else:
        # Fall back to rule_score alone
        final_score = rule_score
        
    # 4. Circuit Breaker
    circuit_breaker_fired = should_fire(final_score, stages_detected)
    if circuit_breaker_fired:
        # Async trigger alert (fire and forget for now, or await)
        # Assuming demo handles alert recipient or config has it.
        pass
        
    # 5. Build PrahariEvent
    findings = []
    # Always include 5 findings, one per stage
    stage_labels = {
        1: "Authority claim",
        2: "Threat framing",
        3: "Isolation demand",
        4: "Verification pretext",
        5: "Transfer instruction"
    }
    
    highest_stage = max(stages_detected) if stages_detected else 0
    
    for s_raw in findings_raw:
        stage_num = s_raw["stage"]
        # passed=False means the stage was detected (bad thing)
        passed = not s_raw["present"] 
        findings.append(Finding(
            code=f"STAGE_{stage_num}",
            label=stage_labels.get(stage_num, f"Stage {stage_num}"),
            passed=passed,
            score=s_raw["confidence"],
            detail=s_raw["evidence_phrase"] if s_raw["evidence_phrase"] else "Not detected"
        ))
        
    explanation = "Digital arrest scam in progress." if circuit_breaker_fired else (
        "Suspicious patterns detected." if final_score > 0.4 else "No scam detected."
    )
    if llm_response and llm_response.get("one_line_explanation"):
        explanation = llm_response["one_line_explanation"]
        
    from prahari.contracts.events import sha256_bytes
    evidence_hash = sha256_bytes(transcript.encode('utf-8'))
    
    verdict = Verdict.FRAUD if circuit_breaker_fired else (Verdict.SUSPECT if final_score > 0.5 else Verdict.SAFE)
    
    raw_data = {
        "stages_detected": list(stages_detected),
        "highest_stage": highest_stage,
        "circuit_breaker_fired": circuit_breaker_fired,
        "language": language,
    }
    if circuit_breaker_fired:
        raw_data["interrupt_payload"] = build_interrupt_payload(language)

    event = PrahariEvent(
        source_module=SourceModule.KAVACH,
        entities=entities,
        risk_score=final_score,
        risk_band=band_from_score(final_score),
        confidence=llm_confidence,
        verdict=verdict,
        findings=findings,
        explanation=explanation,
        raw=raw_data
    )
    
    # Add Evidence
    from prahari.contracts.events import Evidence
    event.evidence.append(Evidence(artefact_type="transcript", sha256=evidence_hash))
    
    return event

from typing import Set, Tuple, List, Dict
from prahari.modules.kavach.patterns import ALL_STAGES
from prahari.modules.kavach.config import STAGE_WEIGHTS, SEQUENCE_BONUS

def is_ascending_sequence(positions: List[int]) -> bool:
    if len(positions) < 2:
        return False
    return sorted(positions) == positions

def detect_stages(text: str) -> Tuple[Set[int], float, List[Dict]]:
    text_lower = text.lower()
    stages_detected = set()
    stage_positions = []
    
    findings_raw = []
    
    for stage_num, patterns in ALL_STAGES.items():
        found = False
        first_pos = -1
        evidence_phrase = ""
        for pattern in patterns:
            pos = text_lower.find(pattern.lower())
            if pos != -1:
                found = True
                if first_pos == -1 or pos < first_pos:
                    first_pos = pos
                    evidence_phrase = pattern
        
        if found:
            stages_detected.add(stage_num)
            stage_positions.append((stage_num, first_pos))
            findings_raw.append({
                "stage": stage_num,
                "present": True,
                "confidence": 1.0,
                "evidence_phrase": evidence_phrase
            })
        else:
            findings_raw.append({
                "stage": stage_num,
                "present": False,
                "confidence": 0.0,
                "evidence_phrase": ""
            })
            
    # Sort positions by where they appeared in text to check sequence
    stage_positions.sort(key=lambda x: x[1])
    ordered_stages = [x[0] for x in stage_positions]
    
    rule_score = sum(STAGE_WEIGHTS[s] for s in stages_detected)
    
    if is_ascending_sequence(ordered_stages):
        rule_score = min(1.0, rule_score + SEQUENCE_BONUS)
        
    return stages_detected, rule_score, findings_raw

import re
from typing import List, Dict, Any

from prahari.contracts.events import normalise_phone, normalise_vpa, Entity, EntityType

# Regex for common Indian phone numbers, VPAs, and bank accounts
PHONE_REGEX = re.compile(r"(\+91[\-\s]?\d{10}|\b\d{10}\b|0\d{10})")
VPA_REGEX = re.compile(r"\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b")
ACCOUNT_REGEX = re.compile(r"\b\d{9,18}\b") # naive account number regex
IFSC_REGEX = re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")

def extract_entities(text: str) -> List[Entity]:
    entities = []
    
    # Phones
    phones = PHONE_REGEX.findall(text)
    for p in phones:
        val = normalise_phone(p)
        if val:
            entities.append(Entity(type=EntityType.PHONE, value=val))
            
    # VPAs
    vpas = VPA_REGEX.findall(text)
    for v in vpas:
        val = normalise_vpa(v)
        if val:
            entities.append(Entity(type=EntityType.VPA, value=val))
            
    # Accounts
    accounts = ACCOUNT_REGEX.findall(text)
    for acc in accounts:
        entities.append(Entity(type=EntityType.ACCOUNT, value=acc.strip()))
        
    return entities

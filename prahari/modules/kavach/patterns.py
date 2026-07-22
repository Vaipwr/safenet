# STAGE 1 — Authority claim
STAGE_1 = [
    # Agencies
    "cbi", "central bureau", "enforcement directorate", "ed office",
    "customs", "trai", "narcotics control", "ncb", "cyber crime branch",
    "cyber cell", "mumbai police", "delhi police", "crime branch",
    # Roles
    "sub inspector", "investigating officer", "inspector", "commissioner",
    # Hindi / transliterated
    "पुलिस", "सीबीआई", "जांच अधिकारी",
    "police station se", "baat kar raha hoon", "adhikari",
]

# STAGE 2 — Threat framing
STAGE_2 = [
    "parcel", "courier", "consignment", "package in your name",
    "seized", "intercepted", "mdma", "drugs", "narcotics",
    "fake passport", "sim card issued", "aadhaar linked",
    "money laundering", "hawala", "fir registered", "case registered",
    "arrest warrant", "non-bailable", "lookout notice",
    "number will be blocked", "number will be disconnected",
    "गिरफ्तार", "वारंट", "मामला दर्ज",
]

# STAGE 3 — Isolation demand
STAGE_3 = [
    "do not disconnect", "stay on the call", "keep the call connected",
    "do not tell anyone", "do not inform your family", "confidential",
    "national security", "official secrets", "you are under surveillance",
    "keep your camera on", "video call", "skype", "join this meeting",
    "digital arrest", "virtual custody", "house arrest",
    "do not leave the room", "do not talk to anyone",
    "किसी को मत बताना", "फोन मत काटना",
]

# STAGE 4 — Verification pretext
STAGE_4 = [
    "verification", "verify your funds", "rbi account",
    "reserve bank", "supreme court", "monitored account",
    "refundable", "money will be returned", "clear your name",
    "prove your innocence", "security deposit", "settlement",
]

# STAGE 5 — Transfer instruction
STAGE_5 = [
    "ifsc", "account number", "beneficiary", "upi", "rtgs", "neft", "imps",
    "transfer the amount", "send the money", "within 30 minutes",
    "do it now", "immediately transfer", "scan this qr",
]

ALL_STAGES = {
    1: STAGE_1,
    2: STAGE_2,
    3: STAGE_3,
    4: STAGE_4,
    5: STAGE_5,
}

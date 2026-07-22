# MODULE 2 — KAVACH
## Digital Arrest Circuit Breaker
*Owner:* _____  ·  *Branch:* feat/kavach  ·  *Module ID:* kavach

> *Mission:* Call transcript in → scam stage detected → circuit breaker fires → the victim's family member's phone rings. Break the isolation before the money moves.

Read PRAHARI_Build_Documentation.md first. This document is your complete implementation spec.

*You own the demo's single most memorable moment.* When the second phone on the judging table buzzes with a family alert, that's your code. Build everything around making that work.

---

## 1. NON-NEGOTIABLE RULES

1. *You create and edit files ONLY inside modules/kavach/.* Nothing outside it. Ever.
2. *contracts/events.py is FROZEN.* Import from it, never edit it.
3. *Never touch* app/main.py, root requirements.txt, or another module's folder.
4. *Your dependencies* go in modules/kavach/requirements.txt only.
5. *Every endpoint returns PrahariEvent.* No custom shapes.
6. *Your module must run standalone.* python -m modules.kavach.demo works with the other modules deleted.
7. *Env vars prefixed KAVACH_* — KAVACH_LLM_PROVIDER, KAVACH_TELEGRAM_TOKEN, etc.
8. *Ship the stub in your first hour.*
9. Commit only to feat/kavach.

### ⚠️ One extra rule that matters for you specifically

*Build modules/kavach/llm_client.py as a clean, generic, provider-agnostic wrapper.* Module 3 (SETU) will import it later with zero changes. Do not bake digital-arrest logic into it — it takes a prompt and a schema, returns parsed JSON. Nothing else.

---

## 2. THE FROZEN CONTRACT

Copy contracts_events.py into prahari/contracts/events.py.

python
from contracts.events import (
    PrahariEvent, SourceModule, Entity, EntityType,
    Evidence, Finding, RiskBand, Verdict,
    band_from_score, normalise_phone, normalise_vpa, sha256_bytes,
)


*Your contract obligations:*

| Field | What you must put in it |
|---|---|
| source_module | SourceModule.KAVACH — always |
| entities | PHONE for the caller (via normalise_phone — *critical*, this is how JAAL links to you). Plus any ACCOUNT / VPA mentioned in the transcript. |
| verdict | Verdict.SAFE or Verdict.FRAUD |
| risk_score | 0.0 → 1.0 |
| risk_band | band_from_score(risk_score) |
| findings | *One Finding per stage* — 5 findings, always all 5, passed=False meaning "stage detected" |
| evidence | SHA-256 of the transcript text |
| explanation | "Digital arrest scam in progress — caller claims CBI authority and has demanded the victim stay on video call." |
| raw | {"stages_detected":[1,2,3], "highest_stage":3, "circuit_breaker_fired":true, "language":"hi", "matched_phrases":[...]} |

> *Note the inversion:* in your module Finding.passed = False means the stage was detected (a bad thing). Document it in a code comment so the frontend dev doesn't invert your colours.

---

## 3. YOUR DIRECTORY


prahari/
├── contracts/
│   └── events.py                  ← FROZEN, shared
└── modules/
    └── kavach/                    ← YOU OWN 100% OF THIS
        ├── __init__.py
        ├── router.py              # FastAPI APIRouter
        ├── service.py             # orchestration + fusion of rule/LLM scores
        ├── llm_client.py          # ⭐ generic — SETU will reuse this
        ├── stages.py              # the 5-stage detector
        ├── patterns.py            # keyword/regex banks (§6)
        ├── prompts.py             # LLM prompt templates
        ├── breaker.py             # two-signal circuit breaker logic
        ├── alerts.py              # Telegram family alert
        ├── asr.py                 # audio → text (Phase 6)
        ├── extractors.py          # pull phone / account / VPA from text
        ├── config.py              # KAVACH_* env vars, thresholds
        ├── demo.py                # standalone runner
        ├── requirements.txt
        ├── samples/               # transcripts: scam_hi.txt, legit_call.txt ...
        └── README.md


---

## 4. YOUR API SURFACE — build exactly these

python
# modules/kavach/router.py
from fastapi import APIRouter
router = APIRouter(prefix="/api/kavach", tags=["kavach"])


| Method | Path | Input | Returns |
|---|---|---|---|
| GET | /api/kavach/health | — | {"status":"ok","llm":"gemini","model_version":"..."} |
| POST | /api/kavach/analyze | {"transcript":"...","language":"hi","caller":"+919..."} | PrahariEvent |
| POST | /api/kavach/analyze-audio | multipart audio file | PrahariEvent |
| POST | /api/kavach/stream-chunk | {"session_id":"...","chunk":"...","caller":"..."} | PrahariEvent (cumulative) |
| POST | /api/kavach/register-contact | {"user_id":"...","name":"...","telegram_chat_id":"..."} | {"ok":true} |
| POST | /api/kavach/trigger-alert | {"session_id":"...","user_id":"..."} | {"sent":true,"channel":"telegram"} |
| GET | /api/kavach/session/{session_id} | — | full stage timeline for the UI |

/stream-chunk is what powers the live demo: the frontend feeds transcript lines one at a time, and the risk meter climbs on screen. Build it — it's what makes the demo feel alive rather than a form submission.

---

## 5. BUILD PHASES

### Phase 0 — Stub (45 min) ⚠️ FIRST
Hardcoded PrahariEvent with all 5 stage findings, risk_score: 0.91, breaker fired. Deploy. Unblock the frontend.

### Phase 1 — Rule-based stage detector (3 hrs) · patterns.py + stages.py
*This is your safety net and you build it before the LLM.* It needs no API key, no network, and cannot rate-limit you on stage. If the venue wifi dies during judging, this still works. Full keyword banks in §6.

### Phase 2 — LLM client (2 hrs) · llm_client.py
Generic wrapper. Provider selected by KAVACH_LLM_PROVIDER env var.
python
def complete_json(system: str, user: str, schema_hint: str) -> dict

- Primary: *Google AI Studio / Gemini* free tier (~1500 req/day, 1M TPM — best volume)
- Fallback: *Groq* free tier (30 RPM, ~1000 RPD — fastest)
- Must strip ` json ` fences before parsing
- Must catch every exception and return `{}` — **never let an LLM failure 500 your endpoint**

### Phase 3 — LLM stage classifier (2 hrs) · `prompts.py`
Ask for strict JSON: which stages present, confidence per stage, the phrases that triggered each. Prompt template in §7.

### Phase 4 — Hybrid fusion (1 hr) · `service.py`
python
final_score = 0.45 * rule_score + 0.55 * llm_score
# If the LLM is unavailable, fall back to rule_score alone
# and drop confidence to 0.6 — degrade, don't fail.


### Phase 5 — Circuit breaker (1 hr) · `breaker.py` ⭐
The two-signal rule. Details in §8.

### Phase 6 — Telegram alert (1.5 hrs) · `alerts.py`
Create a bot via **@BotFather** → get token → `requests.post` to `https://api.telegram.org/bot<TOKEN>/sendMessage`. That's the whole integration. Ten lines of code for your biggest demo moment.

### Phase 7 — Audio ingest (2 hrs, optional) · `asr.py`
`faster-whisper` locally, or **Bhashini** for Indian languages. Optional — a text transcript demo is completely acceptable and far lower risk.

### Phase 8 — Streaming simulation (1 hr)
Session state in a dict. Each chunk appends, re-scores, returns cumulative event.

---

## 6. THE FIVE-STAGE LADDER (`patterns.py`)

Indian digital arrest scams follow a remarkably fixed escalation. Detecting the *sequence* is far more robust than detecting keywords, because legitimate calls can contain individual keywords but never the full ladder.

### STAGE 1 — Authority claim
python
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


### STAGE 2 — Threat framing
python
STAGE_2 = [
    "parcel", "courier", "consignment", "package in your name",
    "seized", "intercepted", "mdma", "drugs", "narcotics",
    "fake passport", "sim card issued", "aadhaar linked",
    "money laundering", "hawala", "fir registered", "case registered",
    "arrest warrant", "non-bailable", "lookout notice",
    "number will be blocked", "number will be disconnected",
    "गिरफ्तार", "वारंट", "मामला दर्ज",
]


### STAGE 3 — Isolation demand ⚠️ THE CRITICAL STAGE
python
STAGE_3 = [
    "do not disconnect", "stay on the call", "keep the call connected",
    "do not tell anyone", "do not inform your family", "confidential",
    "national security", "official secrets", "you are under surveillance",
    "keep your camera on", "video call", "skype", "join this meeting",
    "digital arrest", "virtual custody", "house arrest",
    "do not leave the room", "do not talk to anyone",
    "किसी को मत बताना", "फोन मत काटना",
]

> **This is the stage that defines the crime.** No legitimate agency ever demands isolation. Stage 3 is required for the circuit breaker to fire.

### STAGE 4 — Verification pretext
python
STAGE_4 = [
    "verification", "verify your funds", "rbi account",
    "reserve bank", "supreme court", "monitored account",
    "refundable", "money will be returned", "clear your name",
    "prove your innocence", "security deposit", "settlement",
]


### STAGE 5 — Transfer instruction
python
STAGE_5 = [
    "ifsc", "account number", "beneficiary", "upi", "rtgs", "neft", "imps",
    "transfer the amount", "send the money", "within 30 minutes",
    "do it now", "immediately transfer", "scan this qr",
]


### Rule scoring
python
STAGE_WEIGHTS = {1: 0.10, 2: 0.20, 3: 0.35, 4: 0.20, 5: 0.15}

rule_score = sum(STAGE_WEIGHTS[s] for s in stages_detected)

# Sequence bonus: stages appearing in ascending order over the transcript
# is far stronger evidence than the same keywords scattered randomly.
if is_ascending_sequence(stage_positions):
    rule_score = min(1.0, rule_score + 0.15)


Also extract, using `extractors.py`, any phone numbers, account numbers, IFSC codes and UPI VPAs mentioned in the transcript. **Normalise phones with `normalise_phone()`** — this is exactly how JAAL will later link a scam call to a mule account. That link is the platform thesis. Get it right.

---

## 7. LLM PROMPT (`prompts.py`)

python
SYSTEM = """You are a fraud analyst specialising in Indian "digital arrest" scams,
where fraudsters impersonate CBI, ED, Customs, TRAI or police to place victims in
fake custody over video calls and extort money.

Analyse the call transcript. Return ONLY valid JSON, no markdown, no commentary.

Schema:
{
  "stages": [
    {"stage": 1, "present": true, "confidence": 0.0-1.0,
     "evidence_phrase": "the exact phrase that triggered this"}
  ],
  "overall_confidence": 0.0-1.0,
  "is_scam": true|false,
  "language_detected": "en|hi|ta|...",
  "entities": {"phones": [], "accounts": [], "vpas": [], "ifsc": []},
  "one_line_explanation": "plain language, readable by a 68-year-old"
}

Stage definitions:
1 = Authority claim (impersonating an agency or officer)
2 = Threat framing (parcel/drugs/Aadhaar/warrant/arrest)
3 = Isolation demand (stay on call, tell no one, keep camera on)
4 = Verification pretext (transfer to "verify", RBI account, refundable)
5 = Transfer instruction (specific account/UPI, urgency)

Be conservative. A legitimate bank or police call may contain isolated keywords.
Only mark a stage present if the intent genuinely matches.
"""


Always include all 5 stages in the response array, with `present: false` where absent — it makes downstream parsing trivial and stops the model from silently omitting fields.

---

## 8. THE CIRCUIT BREAKER (`breaker.py`) ⭐

The evaluation criteria explicitly demand a **very low false positive rate** for citizen-facing tools. So never fire on a single threshold. Implement this table exactly, and put it in the deck verbatim.

| Risk score | Extra condition | Action | Reversible? |
|---|---|---|---|
| 0.00–0.40 | — | Log only. Show nothing. | n/a |
| 0.40–0.70 | — | Passive notification-tray tip | Yes |
| 0.70–0.85 | — | In-app soft warning banner | Yes |
| **0.85+** | **AND Stage 3 detected** | **FULL-SCREEN INTERRUPT + FAMILY ALERT** | No |

python
def should_fire(risk_score: float, stages_detected: set[int]) -> bool:
    """Two independent signals required before any irreversible action."""
    return risk_score >= 0.85 and 3 in stages_detected


**Why two signals:** a high score alone could come from an unusual but legitimate call. Stage 3 — the isolation demand — has no legitimate equivalent. Requiring both means the irreversible action needs corroboration from two different detection paths. Say this sentence to the judges.

### The interrupt payload
python
{
  "type": "CIRCUIT_BREAKER",
  "headline": "यह कॉल एक धोखाधड़ी है",              # user's own language
  "subtext": "कोई भी भारतीय पुलिस एजेंसी वीडियो कॉल पर गिरफ्तारी नहीं करती।",
  "truth_anchor": "No Indian agency conducts arrests over video call. "
                  "No agency asks for money to a 'verification account'.",
  "trusted_contact": {"name": "Priya (daughter)", "notified": True},
  "actions": ["End call", "Call Priya", "Report to 1930"]
}


The `truth_anchor` line matters more than the risk score. A victim under three hours of psychological control will not act on a percentage. They act on a concrete, checkable fact.

### The family alert (`alerts.py`)

🚨 PRAHARI ALERT

Ramesh Kumar may be on a fraudulent "digital arrest" call right now.

Caller: +91 98XXXXXX21
Detected: 14:32, 20 July
Pattern: Fake CBI officer, isolation demand detected

Please call him immediately. Do not text — call.

This scam works by keeping victims isolated.
Your call breaks it.


That last line is the whole product thesis in seven words. Keep it.

---

## 9. TECH & DATA

| Need | Tool |
|---|---|
| LLM (volume) | **Google AI Studio / Gemini** free tier |
| LLM (speed) | **Groq** free tier |
| Fallback | **OpenRouter** free models |
| ASR (optional) | `faster-whisper`, **Bhashini ULCA**, AI4Bharat IndicWhisper |
| Alerts | **Telegram Bot API** (free, no approval, works instantly) |
| API | `fastapi`, `uvicorn`, `httpx` |

> **Use Telegram, not WhatsApp, for the demo.** WhatsApp Cloud API needs business verification you don't have time for. Telegram takes 5 minutes via @BotFather and looks identical on stage.

**Sample transcripts — write these yourself, ~8 of them:**
`scam_full_ladder_en.txt` · `scam_full_ladder_hi.txt` · `scam_early_stage.txt` (stages 1–2 only, must NOT fire) · `legit_bank_call.txt` · `legit_police_call.txt` (contains "police", must NOT fire) · `ambiguous.txt`

Those last three are your false-positive tests. **Write them first.** They're what stops you from building an over-eager classifier that fires on everything and embarrasses you in Q&A.

---

## 10. DEFINITION OF DONE

bash
python -m modules.kavach.demo --transcript samples/scam_full_ladder_hi.txt


- [ ] `/health` returns 200
- [ ] Full-ladder scam transcript → `risk_score > 0.85`, all 5 stages, breaker fires
- [ ] Legit bank call → `risk_score < 0.40`, breaker does NOT fire
- [ ] **Legit police call → breaker does NOT fire** (this is the important one)
- [ ] Early-stage transcript (stages 1–2) → warns but does NOT fire
- [ ] LLM key removed from env → still works on rules alone, `confidence` drops, no 500
- [ ] Telegram alert actually arrives on a real second phone
- [ ] `/stream-chunk` shows the score climbing across chunks
- [ ] Phone numbers normalised to `+91XXXXXXXXXX` in `entities`
- [ ] Runs with `modules/netra/` and `modules/jaal/` deleted

---

## 11. AI PROMPTING KIT


I'm building Module KAVACH of a hackathon project called PRAHARI.
It detects Indian "digital arrest" scams from call transcripts.

HARD CONSTRAINTS:
- Python 3.10+, FastAPI, httpx. LLM via Gemini or Groq free tier.
- I only write files inside modules/kavach/. Never suggest edits outside it.
- contracts/events.py is FROZEN — import PrahariEvent, Entity, Finding,
  Verdict, RiskBand, band_from_score, normalise_phone from it.
  Never modify or redefine those classes.
- Every endpoint returns a PrahariEvent. Never a bare dict.
- source_module is always SourceModule.KAVACH.
- Exactly 5 Findings, one per scam stage. Finding.passed=False means
  the stage WAS detected.
- Rule-based detection must work with NO network and NO API key.
  The LLM is an enhancement, never a dependency. Any LLM failure must
  degrade gracefully, never raise.
- Circuit breaker requires TWO signals: risk_score >= 0.85 AND stage 3.
- Config in modules/kavach/config.py. Env vars prefixed KAVACH_.
- llm_client.py must be generic and provider-agnostic — another module
  will import it unchanged. No digital-arrest logic inside it.

Here is contracts/events.py:
[paste the file]

Task: <your specific ask>


---

## 12. MERGE CHECKLIST

- [ ] `git status` shows changes only under `modules/kavach/`
- [ ] `git diff contracts/` is empty
- [ ] No edits to root `requirements.txt`
- [ ] `from modules.kavach.router import router` imports cleanly
- [ ] **No API keys or bot tokens committed** — `.env.example` only
- [ ] `llm_client.py` has zero digital-arrest-specific logic (SETU depends on this)
- [ ] `samples/` committed
- [ ] README has the 3-line run instruction

python
from modules.kavach.router import router as kavach_router
app.include_router(kavach_router)
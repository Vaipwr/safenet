# PRAHARI — AI for Digital Public Safety
### Complete Build Documentation
**Platform for Real-time Anti-fraud Heuristics, Alerting & Response Intelligence**

*(Prahari = "sentinel" in Hindi. Alternatives if the name is taken: TRINETRA, DRISHTI, SANKALP.)*

---

## 0. The One Idea That Wins This

Most teams will build **five separate demos** and call it a platform. Judges see through that instantly.

Your differentiator is one sentence:

> **One entity graph. Five sensors.**

Every module — counterfeit CV, scam-call detector, message classifier, transaction graph, geo layer — does *not* produce its own isolated result. Each one emits **observations about the same shared entity types**:

`phone_number` · `bank_account / UPI VPA` · `device_id / IMEI` · `note_serial_number` · `geo_point` · `case_id`

All five write into **one graph**. That means a counterfeit ₹500 note seized in Nuh and a scam call originating from a number linked to a mule account cluster in Bharatpur can surface as **the same investigation** — automatically.

That is literally what the problem statement asks for: *"multi-source, multi-agency intelligence problem."* Say this sentence in the first 30 seconds of your pitch.

---

## 1. Why India — The Context That Makes This Non-Generic

Do not build a generic fraud detector with an Indian flag on it. These are the India-specific realities your features must encode:

### Digital arrest scams
- Impersonated authorities are specific: **CBI, ED, Customs, TRAI, NCB, Mumbai/Delhi Police, Cyber Cell**
- The script is remarkably fixed: *"A parcel in your name containing MDMA/passports was intercepted at Mumbai airport"* → *"Your Aadhaar is linked to money laundering"* → *"Your number will be disconnected by TRAI in 2 hours"*
- Victim is placed under **"virtual custody"** — kept on Skype/WhatsApp video for hours or days, forbidden from contacting family
- Fake police station backdrops, fake uniforms, fake FIR numbers, forged Supreme Court letterheads
- Money goes to a *"RBI verification account"* or *"Supreme Court monitored account"*
- Primary targets: **elderly, retired government servants, NRIs, homemakers**
- **The weapon is isolation.** Every effective countermeasure must break isolation.

### Counterfeit currency (FICN)
- RBI's Mahatma Gandhi (New) Series has a **known, enumerable** set of security features — this makes CV tractable
- ₹500 is the dominant counterfeited denomination
- Banks must impound suspect notes; **5 or more fake notes in a single tender triggers an FIR**
- Rural branch tellers and field officers often work with **poor or no connectivity** → offline capability is not optional
- Notes with **repeating serial numbers across different seizures** are a printing-press fingerprint — this is a real investigative technique

### Money mule / fraud networks
- Mules recruited via **Telegram and job scams**, often students and gig workers
- Layering happens across **multiple banks in minutes**, then ATM cash-out or **USDT via P2P**
- Known geographic clusters: **Jamtara, Deoghar, Mewat/Nuh, Bharatpur, Alwar, Gurugram fringe**
- Cross-border compounds in **Myanmar, Cambodia, Laos** — with trafficked Indian nationals operating them

### The reporting reality
- **1930** — National Cyber Crime Helpline
- **cybercrime.gov.in** — NCRP (National Cybercrime Reporting Portal)
- **CFCFRMS** — the financial fraud reporting system that can **freeze funds**
- **I4C** — Indian Cyber Crime Coordination Centre (MHA)
- **Chakshu / Sanchar Saathi** (DoT) — report fraudulent communication; **TAFCOP** — check SIMs on your name
- **THE GOLDEN HOUR**: reporting within the first ~60 minutes dramatically increases the chance of freezing the money. After that, it's gone.

### Language
- Scam scripts are localised into **Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Gujarati, Punjabi, Odia, Assamese, Urdu**
- Many at-risk users are on **feature phones** or are **low-literacy** → voice and IVR are mandatory, not nice-to-have
- **Bhashini** (Government of India) gives you free ASR/TTS/translation for 22 scheduled languages. This is your single biggest India-specific unfair advantage.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — DELIVERY                                                 │
│  Citizen App │ WhatsApp/Telegram Bot │ IVR (voice) │                │
│  Officer Dashboard │ Bank Teller Kit │ Command Centre               │
└──────────────────────────────▲──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│  LAYER 4 — ACTION & EVIDENCE                                        │
│  Golden Hour Engine  │  Circuit Breaker  │  Alert Router            │
│  Evidence Packager (BSA §63 certificate, hash chain, audit log)     │
└──────────────────────────────▲──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│  LAYER 3 — FUSION CORE   ◄── THIS IS THE HEART                      │
│  Entity Resolution → Unified Entity Graph → Risk Scoring Engine     │
│  (phone · account/VPA · device · serial · geo · case)               │
└──────────────────────────────▲──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│  LAYER 2 — AI SENSORS                                               │
│  ① Currency CV  ② Call/Voice AI  ③ Text NLP  ④ Graph AI  ⑤ Geo AI   │
└──────────────────────────────▲──────────────────────────────────────┘
                               │
┌──────────────────────────────┴──────────────────────────────────────┐
│  LAYER 1 — INGESTION                                                │
│  Note images │ Call audio │ SMS/WhatsApp text │ Txn metadata │      │
│  Complaint records │ Seizure reports (with geotags)                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Universal event contract** — every sensor emits this exact shape. Define it on Day 1 and never change it:

```json
{
  "event_id": "uuid",
  "source_module": "currency_cv | call_ai | text_nlp | graph_ai | geo_ai",
  "timestamp": "ISO8601",
  "entities": [
    {"type": "phone", "value": "+91XXXXXXXXXX"},
    {"type": "vpa", "value": "xxx@okaxis"},
    {"type": "serial", "value": "5AB 123456"},
    {"type": "geo", "value": {"lat": 0.0, "lon": 0.0, "district": "..."}}
  ],
  "risk_score": 0.0,
  "confidence": 0.0,
  "evidence_refs": ["sha256:..."],
  "model_version": "v1.0.2",
  "explanation": "human-readable reason"
}
```

This single contract is what makes the fusion layer possible with almost no extra work. It's also a strong "Technical Excellence" talking point.

---

## 3. Module-by-Module Specification

---

### MODULE 1 — NETRA: Counterfeit Currency Field Kit

**What it does:** Scan a note with a phone camera or teller-desk camera → verdict in under 2 seconds, offline.

**Why it's not simple:** A denomination classifier is a college project. A **security-feature verifier** is a product. Don't classify "real vs fake" as one black box — that has no legal or operational value. Instead, **localise and score each individual RBI security feature.**

#### Workflow
```
1. Capture note image (front + back, guided overlay in UI)
2. Detect & rectify → perspective correction, crop to note boundary
3. Denomination classification (₹10/20/50/100/200/500)
4. Aspect-ratio & dimension check
   → each denomination has a fixed RBI-specified size; photocopied fakes
     frequently fail this. Pull exact dimensions from RBI's "Know Your
     Banknotes" page.
5. Security-feature localisation (object detection over these regions):
   ├── Security thread (windowed, colour-shift green→blue)
   ├── Micro-lettering ("RBI", "भारत", "India", denomination)
   ├── See-through register (numeral aligns front↔back)
   ├── Latent image of denominational numeral
   ├── Watermark region (Gandhi portrait + electrotype numeral)
   ├── Ashoka Pillar emblem
   ├── Colour-shifting ink on the numeral
   ├── Number panel — ascending-size numerals
   ├── Angular bleed lines (count differs per denomination)
   └── Denomination motif (₹500 Red Fort · ₹200 Sanchi Stupa ·
       ₹100 Rani ki Vav · ₹50 Hampi · ₹20 Ellora · ₹10 Konark)
6. Per-feature scoring → weighted composite
7. Serial number OCR → check against seizure database
8. Verdict: GENUINE / SUSPECT / INCONCLUSIVE + per-feature breakdown
9. If SUSPECT → geotag + timestamp + hash the image → push to graph & map
```

#### The three ideas that make judges sit up

**(a) Per-feature explainability.** Output isn't "87% fake." It's:
> *"Security thread: FAIL (no colour shift detected). Micro-lettering: FAIL (illegible at 4x). Watermark: PASS. Motif: PASS. → SUSPECT — 2 of 9 critical features failed."*
>
> This is court-usable. A black-box score is not.

**(b) Serial number recurrence intelligence.** If serial `5AB 123456` appears in a seizure in Guwahati *and* in Nuh, that is the **same printing press**. Auto-flag it as a linked case. This is exactly how real FICN investigation works, and almost no hackathon team will think of it.

**(c) Offline-first.** Export the model to **TFLite / ONNX** and run on-device. Rural bank branches and field officers have unreliable connectivity. Queue results locally, sync geotags when back online. Say this out loud in the demo — it shows you thought about the actual user.

#### Tech
| Need | Free tool |
|---|---|
| Detection/localisation | **YOLO11n or YOLOv8n** (Ultralytics, AGPL — fine for a hackathon) |
| Classification backbone | MobileNetV3 / EfficientNet-B0 (transfer learning) |
| Preprocessing, rectification | **OpenCV** |
| Serial OCR | **EasyOCR** or **PaddleOCR** (both handle the fonts well) |
| Training | **Google Colab** free GPU / **Kaggle** free GPU (~30 hrs/week) |
| Annotation | **Roboflow** free tier / **CVAT** (self-host, free) |
| On-device export | TFLite, ONNX Runtime |

#### Datasets (all free)
- **Roboflow Universe** — search `indian currency fake`. There is a classification set (~1.1k images) with explicit `500 fake` / `500 real` style classes per denomination. Another set has `security thread`, `gandhi`, `currency number` as detection classes — ideal for feature localisation.
- **Kaggle** — "Fake Currency Detection Dataset" (real notes, fake notes, and per-security-feature template images for ₹500/₹2000).
- **Kaggle** — "Indian Currency Notes Classifier" for denomination baseline.
- **RBI's own "Know Your Banknotes" reference images** — authoritative ground truth for feature templates.

#### 4-day MVP scope
Two denominations only (**₹500 + ₹100**), 4–5 security features, ~85% accuracy. That's enough. State the limitation openly in the deck — judges reward honesty far more than they punish scope.

---

### MODULE 2 — KAVACH: Digital Arrest Circuit Breaker

**What it does:** Detects an in-progress digital arrest scam call and **breaks the victim's isolation** before money moves.

**Why it's not simple:** Everyone will build "detect scam call → show warning." That fails, because the victim has been under psychological control for three hours and does not trust a popup. The insight is:

> **The scam's weapon is isolation. So the countermeasure is not information — it's connection.**

#### Workflow
```
1. On-device audio capture during call (with explicit user consent)
2. Streaming ASR → transcript  [Bhashini / Whisper / IndicWhisper]
3. Real-time script-pattern classifier over rolling transcript window
   Detects the canonical escalation ladder:
   ├── STAGE 1  Authority claim  ("CBI se baat kar raha hoon")
   ├── STAGE 2  Threat framing   (parcel / drugs / Aadhaar misuse)
   ├── STAGE 3  Isolation demand ("do not tell anyone", "stay on video")
   ├── STAGE 4  Verification pretext ("RBI account", "refundable")
   └── STAGE 5  Transfer instruction
4. Parallel: AI-voice / spoof detection on the audio
5. Parallel: caller-number reputation lookup against the entity graph
6. RISK ESCALATION LADDER (see below)
7. On confirmed high risk → CIRCUIT BREAKER fires
```

#### The Circuit Breaker — your standout feature

When Stage 3+ is confirmed:

1. **Full-screen interrupt** — not a notification. Occupies the screen, in the user's own language, with a photo/name of their registered trusted contact.
2. **Auto-alert a pre-registered family member** — SMS/WhatsApp: *"Your father may be on a fraudulent 'digital arrest' call right now. Please call him."* **This is the whole feature.** The scam collapses the instant a family member calls.
3. **Cooling-off nudge** — if a high-value transfer is attempted within the call window, surface a hard confirm screen with the single line that breaks the spell: *"No Indian police agency conducts arrests over video call. No agency asks for money to a 'verification account.'"*
4. **Pre-filled 1930/NCRP complaint** — generated and ready to submit in one tap (see Module 6).

#### Risk escalation ladder — why this matters for scoring
The evaluation criteria explicitly demand a **very low false positive rate** for citizen-facing tools. So never use a single threshold:

| Score | Action | Rationale |
|---|---|---|
| 0.0–0.4 | Nothing. Log only. | Never accuse a real caller |
| 0.4–0.7 | Passive tip in notification tray | Non-intrusive |
| 0.7–0.85 | In-app soft warning | Recoverable if wrong |
| 0.85+ **AND** Stage 3 detected | **Circuit breaker + family alert** | Two independent signals required |

Requiring **two independent signals** (score AND stage) before the irreversible action is a genuine engineering decision. Put this table in your deck verbatim — it directly answers the evaluation focus.

#### Tech
| Need | Free tool |
|---|---|
| ASR (Indian languages) | **Bhashini ULCA** (free for PoC, 22 languages) · **IndicWhisper / IndicConformer** (AI4Bharat, open source) · **faster-whisper** (local) |
| Script classification | **Google AI Studio / Gemini** free tier (~1500 req/day, 1M TPM) or **Groq** free tier (30 RPM, ~1000 RPD, very fast) |
| Voice spoof detection | **SpeechBrain** / **Resemblyzer** · ASVspoof dataset for training |
| Speaker diarization | **pyannote.audio** (free, HF token) |
| Family alert channel | **Telegram Bot API** (100% free — use this for the demo instead of WhatsApp) |

#### 4-day MVP scope
Do **not** attempt live call interception — Android telephony permissions will destroy your timeline. Instead: **upload or paste a call transcript / audio file** → run the stage detector → show the circuit breaker screen firing → show the Telegram alert arriving on a second phone. Live on stage, that second phone buzzing is your single most memorable demo moment. Engineer the demo around it.

---

### MODULE 3 — SETU: Citizen Fraud Shield (Multilingual, Multi-channel)

**What it does:** Any citizen, in any of 12 languages, on any channel (app / WhatsApp / Telegram / IVR / SMS), forwards a suspicious message, number, UPI ID, or link → gets an instant verdict, an explanation they can understand, and a guided next action.

**Why it's not simple:** The hard parts are **reach** and **trust**, not classification.

#### Workflow
```
1. Input arrives (text, screenshot, voice note, forwarded message, URL, UPI ID)
2. If image → OCR  [EasyOCR/PaddleOCR — supports Devanagari, Tamil, Telugu...]
   If voice → ASR  [Bhashini]
3. Language detect → normalise to English internally for the model
4. Multi-signal analysis, run in parallel:
   ├── Scam-pattern LLM classifier (urgency / authority / secrecy /
   │   payment-rail mismatch / grammar & transliteration artefacts)
   ├── URL analysis (lookalike domains, punycode, fresh registration,
   │   URL shorteners, .in impersonation of gov.in)
   ├── UPI VPA / phone reputation from the entity graph
   └── Known-campaign match (see cross-lingual fingerprinting below)
5. Verdict + plain-language explanation, TTS'd back in the user's language
6. Guided action: block / report to Chakshu / file at 1930 / ignore
7. The report itself becomes a graph observation → feeds Modules 4 & 5
```

#### The two ideas that elevate this

**(a) Cross-lingual scam script fingerprinting.**
Scam gangs write one script and translate it. A Tamil version and a Bengali version of the same scam look completely different to a keyword filter — but they are **the same campaign**.

Method: embed every reported message with a **multilingual sentence encoder** (LaBSE, or AI4Bharat's IndicBERT), then cluster in embedding space. Messages from the same campaign land in the same cluster **regardless of language**.

Payoff: *"This exact script was first reported in Marathi in Pune 6 days ago. It has now spread to 4 states and 3 languages. 312 citizens have reported it."* That is **fraud network detection lead time before mass victimisation** — the exact phrase in the evaluation focus. Build this and point at it.

**(b) Voice-first for the actual at-risk user.**
The people losing money to these scams are frequently elderly, low-literacy, or on feature phones. A React web app does not reach them. Build an **IVR path**: call a number → speak your problem in Bhojpuri/Tamil/Bengali → Bhashini ASR → classifier → Bhashini TTS speaks the answer back. Even a rough demo of this shows a level of user empathy most teams won't have.

#### Tech
| Need | Free tool |
|---|---|
| LLM classification | **Gemini free tier** (best volume) · **Groq** (best speed) · **OpenRouter** free models (fallback) |
| Indian-language ASR/TTS/MT | **Bhashini ULCA** — register at `bhashini.gov.in/ulca/user/register` |
| Open-source Indic models | **AI4Bharat** on HuggingFace — IndicTrans2, IndicBERT, IndicWhisper |
| Multilingual embeddings | **LaBSE** or `paraphrase-multilingual-MiniLM` via `sentence-transformers` |
| Clustering | HDBSCAN / scikit-learn |
| OCR (Indic scripts) | **EasyOCR**, **PaddleOCR** |
| Chat channel | **Telegram Bot API** (free, instant) — WhatsApp Cloud API only if you have time |
| IVR | **Twilio free trial** · or fake it with a phone-audio upload for the demo |

#### 4-day MVP scope
Text + screenshot input, 3 languages live (English, Hindi, + one more your team speaks), Telegram bot, clustering over a seeded set of ~200 synthetic scam messages. IVR as a recorded demo if time runs out.

---

### MODULE 4 — JAAL: Fraud Network Graph Intelligence

**What it does:** Turns a pile of disconnected complaints into a **named criminal network** with a ranked list of who to arrest first.

**Why it's not simple:** Anyone can draw a pretty force-directed graph. The value is in **which nodes you rank as important and why.**

#### Workflow
```
1. Ingest: transaction metadata, complaint records, call detail records,
   device fingerprints, VPA↔account linkages
2. ENTITY RESOLUTION — the unglamorous step that actually matters
   Same person across sources: phone number normalisation (+91, 0-prefix,
   spacing), VPA-to-account mapping, device/IMEI matching, fuzzy name match
3. Build heterogeneous graph:
   Nodes: victim · mule_account · phone · device · VPA · beneficiary · ATM
   Edges: transferred_to · called · shares_device · same_KYC · same_IP
4. Compute network features:
   ├── Fan-in velocity   (N unrelated sources → 1 account within T minutes)
   ├── Fan-out velocity  (1 account → N destinations within T minutes)
   ├── Pass-through ratio (in ≈ out, balance stays near zero = mule)
   ├── Hop depth to cash-out (ATM / crypto off-ramp)
   ├── Dormancy break (account inactive 6mo → sudden high volume)
   └── Betweenness centrality (who is the broker holding the ring together)
5. Community detection → Louvain / Label Propagation → named clusters
6. Rank targets by disruption impact, not transaction volume
7. Package top cluster as a court-admissible evidence bundle (Module 6)
```

#### The two ideas that elevate this

**(a) Mule velocity scoring instead of amount thresholds.**
Traditional AML flags large transactions. Indian cyber-fraud mules deliberately stay *under* thresholds. What actually gives them away is **temporal shape**: 40 unrelated inbound transfers in 6 minutes, then a fan-out to 12 accounts in the next 4 minutes, ending balance ≈ ₹0. Amount-based rules never catch this. Velocity-based rules catch it in near real time.

**(b) Rank by disruption impact, not by transaction size.**
The account that moved the most money is usually a disposable mule — arresting them changes nothing. The node with the highest **betweenness centrality** is the broker whose removal actually fragments the network. Show a before/after: *"Remove these 3 nodes → the network splits into 7 disconnected fragments and 61% of the flow paths break."*

That before/after visualisation is a killer demo moment. It's also directly "Business Impact."

#### Tech
| Need | Free tool |
|---|---|
| Graph analysis | **NetworkX** (Python) · **igraph** (faster) |
| Graph database | **Neo4j AuraDB Free** · or just NetworkX in memory for the MVP |
| Community detection | `python-louvain`, NetworkX built-ins |
| Graph visualisation | **Cytoscape.js** · **vis-network** · **Sigma.js** (all free, all React-friendly) |
| Entity resolution | `recordlinkage` / `dedupe` (Python) — or hand-rolled rules for the MVP |

#### Data
Real transaction data does not exist for you. **Generate synthetic data — and say so.** Write a generator that plants known fraud rings inside realistic noise (~5000 accounts, ~50k transactions, 3 planted rings). Then you can demonstrate something better than a real dataset would allow: **you know the ground truth, so you can show precision and recall.**

Label it "synthetic data modelled on published CFCFRMS typologies" in the deck. Judges respect a team that is upfront about this far more than one that implies fake data is real.

#### 4-day MVP scope
Synthetic generator + NetworkX + Cytoscape.js in your existing UI + the node-removal before/after animation.

---

### MODULE 5 — DRISHTI: Geospatial Crime Intelligence

**What it does:** A command-centre map that turns scattered incidents into **actionable deployment decisions**.

**Why it's not simple:** A heatmap of dots is a dashboard, not intelligence. Intelligence answers: *where next, and what should the DCP do at 6am tomorrow?*

#### Workflow
```
1. Ingest geotagged events from all other modules:
   ├── FICN seizure points        (from Module 1)
   ├── Digital arrest reports     (from Module 2)
   ├── Citizen fraud reports      (from Module 3)
   ├── Mule account KYC addresses & ATM cash-out points (from Module 4)
   └── Historical NCRB district data
2. Spatial aggregation → district / police-station jurisdiction / ward
3. Hotspot statistics: Getis-Ord Gi* or KDE → statistically significant
   hotspots, not just "many dots here"
4. Temporal layer: day-of-week and hour-of-day patterns
5. Emerging-cluster detection: which district's rate is accelerating fastest
   this week vs its own 8-week baseline  ← predictive, not descriptive
6. Corridor analysis: link seizure points along transport routes to infer
   FICN circulation paths
7. Output: ranked patrol / awareness-campaign / bank-alert recommendations
```

#### The two ideas that elevate this

**(a) Emerging clusters, not existing hotspots.**
Everyone maps where crime *is*. That is history. Map where the **rate of change** is highest — the district whose complaint rate jumped 300% against its own baseline this week. That's a warning, and it's a much harder and more useful thing to compute.

**(b) Cross-module correlation on the map.**
This is where your "one graph" architecture pays off visually. Overlay FICN seizure points with mule-account KYC addresses with digital-arrest complaint origins. When the same district lights up on **three independent layers**, that's the multi-source fusion the problem statement asked for — and it's visible in one screenshot. Make that screenshot your deck's hero image.

#### Tech
| Need | Free tool |
|---|---|
| Map rendering | **Leaflet.js** + **OpenStreetMap** · or **MapLibre GL JS** (vector, prettier) |
| Indian satellite/base layers | **Bhuvan (ISRO)** — free WMS services, Indian government geoportal |
| Heatmaps | `leaflet.heat`, `Leaflet.markercluster` |
| Spatial statistics | **GeoPandas**, **PySAL/esda** (Getis-Ord Gi*), **scikit-learn** DBSCAN |
| District boundaries | **data.gov.in**, Survey of India OpenSeries, open GeoJSON repos for Indian districts |
| Baseline crime data | **NCRB** published reports, **data.gov.in** |

> ⚠️ **Do not use Google Maps** — it needs a billing account. Leaflet + OSM is free forever and looks fine.

#### 4-day MVP scope
Leaflet + synthetic geotagged events + district choropleth + emerging-cluster ranked list + the three-layer overlay toggle.

---

### MODULE 6 — PRAMAN: Evidence, Compliance & Golden Hour Engine

**This module is your highest-leverage, lowest-cost differentiator. Almost no team will build it. It is nearly all backend logic and no ML.**

The evaluation focus explicitly names **"auditability of intelligence packages for legal admissibility."** Here is how you own that line.

#### (a) Golden Hour Response Engine

The moment fraud is confirmed, **automatically generate and stage**:
1. A **pre-filled NCRP complaint payload** (all fields the citizen would otherwise struggle to fill under stress)
2. A **1930 helpline briefing card** — a one-screen summary the citizen can read out on the phone
3. A **bank freeze request packet** — beneficiary account, VPA, transaction reference, timestamp
4. A **Chakshu / Sanchar Saathi report** for the fraudulent number

Track and display the metric: **time from detection → complete complaint package**. If you can show *"12 seconds, versus a national average of several hours"* — that is your Business Impact slide in one number.

> Be precise in the deck: you **generate and pre-fill**; you do not have live government API access. Never imply otherwise. Judges will ask, and honesty here wins the credibility you need.

#### (b) Legal admissibility — the detail nobody else will have

In India, electronic evidence requires a certificate. Under the **Bharatiya Sakshya Adhiniyam, 2023** (which replaced the Indian Evidence Act, 1872 from 1 July 2024), **Section 63** governs admissibility of electronic records and requires an accompanying certificate — the successor to the well-known **Section 65B** certificate.

So: **auto-generate a draft §63 certificate** with every evidence package.

Each evidence bundle contains:
```
├── SHA-256 hash of every artefact (image, audio, transcript, txn record)
├── Hash chain linking artefacts in tamper-evident sequence
├── Full chain of custody log (who accessed what, when)
├── Model version + weights hash used for every automated inference
├── Confidence scores with the decision threshold applied
├── Human-readable reasoning for each flag
└── Draft BSA §63 certificate, ready for an officer to sign
```

**Why model version pinning matters:** if a defence lawyer challenges an AI-generated flag two years later, you must be able to prove *which exact model version* produced it. Saying this sentence in your pitch signals a level of seriousness that separates you from every other team in the room.

#### (c) DPDP Act 2023 compliance

Add a short slide. It costs you 20 minutes and buys enormous credibility:
- **Consent** — explicit opt-in before any call audio processing
- **Data minimisation** — store transcript features and hashes, not raw audio, beyond the analysis window
- **Purpose limitation** — fraud detection only, no secondary use
- **On-device processing** where possible — audio and note images never leave the phone in the field kit
- **Right to erasure** — user-initiated deletion path
- **Retention limits** — auto-purge non-flagged data after N days

#### Tech
Pure backend. `hashlib` (SHA-256), FastAPI, a Postgres/Supabase audit table, `reportlab` or `WeasyPrint` for PDF certificate generation. Zero cost, zero ML risk, maximum judge impact.

---

## 4. Complete Free Stack

### AI / Models
| Purpose | Tool | Notes |
|---|---|---|
| LLM (volume) | **Google AI Studio / Gemini** | ~1500 req/day, 1M TPM free — most generous |
| LLM (speed) | **Groq** | 30 RPM, ~1000 RPD, fastest inference available |
| LLM (fallback) | **OpenRouter** | Several free models; use for redundancy |
| Indian languages | **Bhashini ULCA** | Govt of India. ASR + TTS + MT, 22 languages, free for PoC |
| Indic open models | **AI4Bharat** (HuggingFace) | IndicTrans2, IndicBERT, IndicWhisper, IndicConformer |
| Vision | **Ultralytics YOLO11/YOLOv8** | Free, trains fast on Colab |
| OCR | **EasyOCR** / **PaddleOCR** | Both handle Devanagari, Tamil, Telugu, Bengali |
| ASR (local) | **faster-whisper** | Runs on CPU acceptably |
| Speech / anti-spoof | **SpeechBrain**, **pyannote.audio** | Free, HF token required |
| Embeddings | **sentence-transformers** + LaBSE | Cross-lingual clustering |
| Classical ML | scikit-learn, XGBoost | For tabular fraud scoring |

### Infrastructure
| Purpose | Tool | Free tier |
|---|---|---|
| Frontend hosting | **Vercel** / **Netlify** | Generous |
| Backend hosting | **Render** / **Railway** / **Fly.io** | Free tiers exist; expect cold starts |
| ML model hosting | **HuggingFace Spaces** | Free CPU, Gradio/Streamlit — great for the CV model |
| Database | **Supabase** (Postgres + auth + storage) | Best all-in-one free option |
| Alt database | **MongoDB Atlas** (512MB) / **Firebase** | |
| Graph DB | **Neo4j AuraDB Free** | Optional — NetworkX may be enough |
| Training compute | **Google Colab** / **Kaggle** (~30 GPU hrs/wk) | |
| Object storage | Supabase Storage / Cloudinary free tier | |

### Development
| Purpose | Tool |
|---|---|
| Backend framework | **FastAPI** (async, auto-docs — the auto-generated `/docs` page is itself a demo asset) |
| Frontend | React + Tailwind (you already have this) |
| Rapid ML demo UI | **Streamlit** / **Gradio** — build the CV demo here first, wire to React later |
| Maps | Leaflet.js / MapLibre GL JS + OpenStreetMap + Bhuvan |
| Graph viz | Cytoscape.js / vis-network / Sigma.js |
| Charts | Recharts / Chart.js |
| Chat channel | **Telegram Bot API** (free) |
| SMS/IVR | Twilio free trial |
| Architecture diagram | **draw.io** / **Excalidraw** |
| Deck | Canva free / Google Slides |
| Screen recording | **OBS Studio** |

### Data Sources
| Source | Use |
|---|---|
| **Roboflow Universe** | Indian currency real/fake datasets, security-feature detection sets |
| **Kaggle** | Fake Currency Detection Dataset (₹500/₹2000 + feature templates) |
| **RBI "Know Your Banknotes"** | Authoritative security-feature ground truth & exact note dimensions |
| **data.gov.in** | Indian district boundaries, open government datasets |
| **NCRB reports** | Historical crime baselines by district |
| **Bhuvan (ISRO)** | Indian geospatial base layers, free WMS |
| **ASVspoof** | Voice spoofing / deepfake audio training data |
| **Synthetic generators (yours)** | Transaction graph, complaint records, scam message corpus |

---

## 5. Four-Day Execution Plan

> **Rule for the whole four days: build the demo path first, breadth second.** A judge sees ~5 minutes. Every hour must serve those 5 minutes.

### Before you write any code (2 hours, whole team)
1. Lock the **event contract JSON** from Section 2. Everything integrates against it.
2. Assign module owners.
3. Create the shared repo with the folder structure and stub endpoints.
4. Register **now** — Bhashini approval isn't instant, and API keys take time:
   - Bhashini ULCA · Google AI Studio · Groq · Supabase · HuggingFace · Roboflow

### Day 1 — Foundations, in parallel
| Owner | Task |
|---|---|
| **A** | Train the currency CV model. ₹500 + ₹100. Colab. Get *something* working end-to-end even at 70% — improve later. |
| **B** | FastAPI skeleton + Supabase schema + the event contract + entity graph tables. Deploy immediately so integration isn't a Day-4 surprise. |
| **C** | Synthetic data generators: transaction graph with planted rings, scam message corpus, geotagged events. **This unblocks Modules 4 and 5 entirely** — do it first. |
| **D** | Wire your existing UI to the API skeleton with mocked responses, so screens are ready as real data arrives. |

**End of Day 1 must-have:** a deployed API returning mock events in the correct schema, and one CV model that classifies *something*.

### Day 2 — The two LLM modules (they share one backend)
| Owner | Task |
|---|---|
| **A** | Improve CV: add security-feature localisation, serial OCR, per-feature output. Export TFLite. |
| **B** | Build **one** LLM analysis service with a swappable prompt/schema. Module 2 (call transcripts) and Module 3 (messages) are the same service with different prompts and labels. This is not cutting corners — it's the correct architecture, and it saves you a full day. |
| **C** | Graph module: NetworkX, velocity features, Louvain communities, node-removal impact calculation. |
| **D** | Telegram bot + Bhashini integration (translation + TTS). Get the family-alert message actually arriving on a second phone. |

**End of Day 2 must-have:** paste a scam message → get a real classified verdict. Paste a call transcript → get a stage detection.

### Day 3 — Fusion, geo, and the differentiator
| Owner | Task |
|---|---|
| **A** | Entity resolution + risk scoring in the fusion layer. Make one entity visibly appear across two modules — this is the whole thesis, make sure it demonstrably works. |
| **B** | **Module 6 (PRAMAN)** — Golden Hour packet generator, hash chain, audit log, draft §63 certificate PDF. Highest impact per hour of any task on this list. |
| **C** | Geo module: Leaflet, district choropleth, emerging-cluster detection, three-layer overlay. |
| **D** | Full UI integration. Every screen on real data. Circuit-breaker screen. Graph viz. Map. |

**End of Day 3 must-have:** the full happy path runs end to end without a developer touching a terminal.

### Day 4 — Freeze, polish, deliverables
- **Morning:** Feature freeze. **No new features.** Bug fixing only. This rule is the difference between a demo that works and one that doesn't.
- Architecture diagram (draw.io)
- Presentation deck
- **Record the demo video early** — do not leave it to the last two hours
- Run the demo end-to-end **at least 5 times**. Something will break on run 3. Better now than on stage.
- Prepare offline fallbacks: cached API responses, local model copies, a recorded video backup. **Venue wifi will fail. Assume it.**

---

## 6. Demo Script (5–6 minutes)

Structure it as **one victim's story**, not a feature tour. Same fictional person throughout. Judges remember stories; they don't remember feature lists.

```
0:00  Hook — "In the first nine months of 2024, Indians lost over
      ₹1,776 crore to a scam where nobody was ever physically arrested."
      One line. No throat-clearing.

0:30  The thesis — "One entity graph, five sensors." Architecture slide.
      15 seconds. Then move.

1:00  ACT 1 — Ramesh, 68, retired, receives a call.
      → Live: transcript streams in, stage detector escalates
      → CIRCUIT BREAKER fires on screen
      → SECOND PHONE ON THE TABLE BUZZES — his daughter's alert arrives
      ⭐ This is your moment. Let it land. Say nothing for two seconds.

2:00  ACT 2 — He'd already sent ₹2 lakh before the alert.
      → Golden Hour engine: NCRP complaint pre-filled in 12 seconds
      → Show the timer

2:30  ACT 3 — Where did the money go?
      → Graph lights up: his ₹2L joins 40 other victims into one cluster
      → Velocity scoring flags the mules
      → "Remove these 3 nodes → network fragments into 7 pieces"

3:15  ACT 4 — Meanwhile, at a bank branch in the same district.
      → Live phone camera: scan a printed ₹500 → per-feature verdict
      → "Security thread FAIL, micro-lettering FAIL"
      → Serial number matches a seizure 400km away — same press

4:00  ACT 5 — The command centre.
      → Map: three independent layers converge on one district
      → "This district's complaint rate is up 300% this week"

4:30  ACT 6 — The part nobody else built.
      → Evidence package: hash chain, model version pinning,
        draft BSA §63 certificate
      → "This is admissible. A confidence score is not."

5:00  Honest limitations slide. 20 seconds. Then impact & scale.

5:30  Close: "Reactive investigation costs India crores.
      Prediction costs a phone call."
```

---

## 7. Judging Criteria Mapping

| Criterion | Weight | What you say |
|---|---|---|
| **Innovation** | 25% | Cross-lingual campaign fingerprinting · circuit breaker via isolation-breaking · serial-number press attribution · disruption-ranked node removal · auto §63 certificates |
| **Business Impact** | 25% | Golden Hour: hours → seconds. Quantify: X% of the ₹1,776cr is recoverable if reported within 60 min. Deployable to banks, police, telcos, citizens — four buyers, one platform |
| **Technical Excellence** | 20% | Single event contract across 5 heterogeneous sensors · entity resolution · two-signal thresholding for FP control · model version pinning · offline TFLite |
| **Scalability** | 15% | Stateless services · on-device inference pushes compute to the edge · graph partitions by district · Bhashini gives 22 languages with no retraining · designed to plug into NCRP/CFCFRMS |
| **User Experience** | 15% | Voice-first & IVR for elderly and feature-phone users · 12 languages · offline field kit · one-tap complaint · full-screen interrupt, not an ignorable notification |

---

## 8. Honest Limitations (Put This Slide In)

Teams that hide limitations get destroyed in Q&A. Teams that lead with them get trusted.

- Transaction and complaint data is **synthetic**, modelled on published typologies. Ground truth is known, which is why we can report precision and recall.
- CV model trained on **2 denominations** with limited fake samples. Production needs an RBI-supervised dataset with real FICN.
- Government portal integration is **payload generation**, not live API submission. Live integration requires I4C authorisation.
- Call audio analysis is **consent-based and on-device**, demonstrated via upload rather than live telephony interception.
- Voice spoof detection is a **proof of concept** — production needs adversarial training against current generation models.

Then immediately: *"Every one of these is a data-access problem, not an architecture problem. The platform is built to receive real data on day one."*

---

## 9. The Five Things That Actually Matter

If you cut everything else, keep these:

1. **The unified entity graph.** It's what makes this a platform instead of five demos. Build the fusion layer even if individual sensors are weak.
2. **The family alert firing on a second physical phone.** Most memorable 3 seconds of your demo. Engineer everything around it working.
3. **Module 6 (PRAMAN).** Pure backend, no ML risk, directly answers a named evaluation criterion, and nobody else will build it.
4. **Per-feature explainability in the CV model.** Not "87% fake" — "security thread FAIL, micro-lettering FAIL."
5. **The feature freeze on Day 4 morning.** Non-negotiable. A working narrow demo beats a broken broad one every single time.

---

*Documentation prepared 20 July 2026. Verify all free-tier limits before you build — they change frequently.*

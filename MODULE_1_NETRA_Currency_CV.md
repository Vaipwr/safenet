# MODULE 1 — NETRA
## Counterfeit Currency Field Kit
**Owner:** _______________  ·  **Branch:** `feat/netra`  ·  **Module ID:** `netra`

> **Mission:** Photo of a banknote in → per-security-feature verdict out, in under 2 seconds, with an explanation a magistrate could read.

Read `PRAHARI_Build_Documentation.md` first for the overall platform thesis. This document is your complete implementation spec.

---

## 1. NON-NEGOTIABLE RULES

These exist so three people can merge on day 4 without a fight.

1. **You create and edit files ONLY inside `modules/netra/`.** Nothing outside it. Ever.
2. **`contracts/events.py` is FROZEN.** Import from it, never edit it. If you think it needs a change, message the group.
3. **Never touch** `app/main.py`, root `requirements.txt`, or any other module's folder.
4. **Your dependencies** go in `modules/netra/requirements.txt` only.
5. **Every endpoint returns `PrahariEvent`.** No custom response shapes, no bare dicts.
6. **Your module must run standalone.** `python -m modules.netra.demo` must work with the other two modules completely absent from the repo.
7. **Env vars are prefixed `NETRA_`.** e.g. `NETRA_MODEL_PATH`, `NETRA_CONF_THRESHOLD`.
8. **Ship the stub in your first hour** (Phase 0 below) so the frontend can integrate against you immediately.
9. Commit only to `feat/netra`.

---

## 2. THE FROZEN CONTRACT

Copy `contracts_events.py` into `prahari/contracts/events.py`. It is byte-identical for all three developers. You import these:

```python
from contracts.events import (
    PrahariEvent, SourceModule, Entity, EntityType, GeoPoint,
    Evidence, Finding, RiskBand, Verdict,
    band_from_score, normalise_serial, sha256_bytes,
)
```

**Your contract obligations:**

| Field | What you must put in it |
|---|---|
| `source_module` | `SourceModule.NETRA` — always |
| `entities` | A `SERIAL` entity for the note's serial number (normalised). A `GEO` entity if location was supplied. |
| `verdict` | `Verdict.GENUINE` / `Verdict.SUSPECT` / `Verdict.INCONCLUSIVE` |
| `risk_score` | 0.0 = certainly genuine → 1.0 = certainly fake |
| `risk_band` | `band_from_score(risk_score)` — use the helper, do not invent your own bands |
| `findings` | **One `Finding` per security feature checked.** This is the heart of your module. |
| `evidence` | SHA-256 of the uploaded image bytes |
| `explanation` | One plain sentence, e.g. *"Suspect — security thread and micro-lettering failed on a ₹500 note."* |
| `raw` | `{"denomination": 500, "serial": "5AB123456", "recurrence_count": 2}` |

---

## 3. YOUR DIRECTORY

```
prahari/
├── contracts/
│   └── events.py                 ← FROZEN, shared, do not edit
└── modules/
    └── netra/                    ← YOU OWN 100% OF THIS
        ├── __init__.py
        ├── router.py             # FastAPI APIRouter
        ├── service.py            # orchestrates the pipeline
        ├── preprocess.py         # OpenCV: detect, rectify, normalise
        ├── classifier.py         # denomination + real/fake CNN
        ├── features.py           # the security-feature checks
        ├── ocr.py                # serial number extraction
        ├── serial_store.py       # recurrence database
        ├── config.py             # NETRA_* env vars, ROI tables, weights
        ├── demo.py               # standalone runner — MUST work alone
        ├── requirements.txt
        ├── models/               # .pt / .tflite weights
        ├── samples/              # test images: genuine_500.jpg, fake_500.jpg ...
        └── README.md             # how to run yours in 3 lines
```

---

## 4. YOUR API SURFACE — build exactly these

```python
# modules/netra/router.py
from fastapi import APIRouter, UploadFile, File, Form
router = APIRouter(prefix="/api/netra", tags=["netra"])
```

| Method | Path | Input | Returns |
|---|---|---|---|
| `GET` | `/api/netra/health` | — | `{"status":"ok","model_version":"..."}` |
| `POST` | `/api/netra/scan` | multipart: `image` (file), optional `lat`, `lon`, `district` | `PrahariEvent` |
| `POST` | `/api/netra/scan-base64` | JSON: `{"image_b64":"...", "lat":..., "lon":...}` | `PrahariEvent` |
| `GET` | `/api/netra/serial/{serial}` | — | `{"serial":"...","seen_count":n,"locations":[...]}` |
| `GET` | `/api/netra/seizures` | — | `List[PrahariEvent]` — all SUSPECT scans, for the map module |

The frontend will call `/scan-base64` most often — a canvas capture is trivially base64-encoded. Build it.

---

## 5. BUILD PHASES

> Ship each phase before starting the next. A working Phase 3 beats a broken Phase 6.

### Phase 0 — Stub (45 min) ⚠️ DO THIS FIRST
Return a hardcoded, fully-populated `PrahariEvent` with 6 realistic findings. Deploy it. Tell the frontend dev it's live. Now they are never blocked by you.

### Phase 1 — Preprocessing (2 hrs) · `preprocess.py`
```
load image
→ resize longest edge to 1024 (keep ratio)
→ grayscale + Gaussian blur + Canny
→ findContours → largest 4-point convex quad = note boundary
→ cv2.getPerspectiveTransform → warp to flat rectangle
→ output: rectified note + measured aspect ratio
```
Fallback: if no quad is found, use the whole image and set `confidence` low. Never crash on a bad photo.

### Phase 2 — Denomination classifier (3 hrs) · `classifier.py`
Transfer-learn MobileNetV3-Small or YOLO11n-cls on Roboflow/Kaggle Indian currency data. Classes: `10, 20, 50, 100, 200, 500, none`.
**Target: ₹500 and ₹100 only for the demo.** Others can return `INCONCLUSIVE`.

### Phase 3 — Security features (5 hrs) · `features.py` ⭐ THE CORE
This is what makes your module a product instead of a college project. Details in §6.

### Phase 4 — Serial OCR (2 hrs) · `ocr.py`
EasyOCR or PaddleOCR on the number-panel ROI. Regex-validate: `^[0-9A-Z]{3}\s?[0-9]{6}$`.

### Phase 5 — Recurrence store (1 hr) · `serial_store.py`
SQLite. Table `serials(serial TEXT, event_id TEXT, lat REAL, lon REAL, district TEXT, ts TEXT)`.
On every SUSPECT scan: insert, then count prior occurrences. **If count ≥ 2 → add a `SERIAL_RECURRENCE` finding and boost risk.** This is your demo's "wow" moment.

### Phase 6 — Composite scoring (1 hr) · `service.py`
Weighted combination → `risk_score` → `verdict`. Weights in `config.py` so you can tune without touching logic.

### Phase 7 — TFLite export (2 hrs, optional but high value)
`model.export(format="tflite")`. Even if the app doesn't use it, having the file lets you say *"runs offline on-device in rural branches"* and prove it.

---

## 6. THE SECURITY FEATURE CHECKS (your differentiator)

Do **not** ship a single "87% fake" number. Ship a list of named, individually-scored checks. Each becomes one `Finding`.

These seven are all achievable in 4 days with a small dataset:

### F1 · `ASPECT_RATIO` — pure geometry, zero ML, very reliable
Each RBI denomination has a fixed size. Photocopied and inkjet fakes are frequently resized wrong.
```python
ratio = width_px / height_px
expected = CONFIG.ASPECT_RATIOS[denomination]   # from RBI "Know Your Banknotes"
passed = abs(ratio - expected) / expected < 0.04
```
> ⚠️ Pull exact mm dimensions from the RBI website. Do not guess them — a wrong constant here silently poisons every result.

### F2 · `PRINT_SHARPNESS` — the photocopy killer
Genuine notes use intaglio (raised) printing with extremely crisp edges. Photocopies and inkjet prints lose high-frequency detail.
```python
lap_var = cv2.Laplacian(portrait_roi, cv2.CV_64F).var()
passed = lap_var > CONFIG.SHARPNESS_THRESHOLD
```
Cheap, fast, and catches the most common fake type. Calibrate the threshold on your own sample images.

### F3 · `MICRO_LETTERING` — same trick, tighter ROI
Crop the micro-lettering ROI, upscale 4x, measure sharpness + edge density. Genuine notes retain legible structure; copies turn to mush.

### F4 · `SECURITY_THREAD` — ROI presence + colour
Crop the vertical thread ROI. Check for a continuous high-contrast vertical band. Bonus: sample hue and check it sits in the green→blue range.
> Full colour-shift verification needs two photos at different angles. If you have time, add a second capture; if not, note the limitation openly in the deck.

### F5 · `COLOUR_PROFILE` — histogram distance
Genuine ₹500 is a specific stone grey; ₹200 a specific bright yellow. Compare the HSV histogram against a reference built from your genuine samples (`cv2.compareHist`, correlation method). Fakes drift measurably.

### F6 · `SERIAL_FORMAT` — OCR + regex
Extract the serial. Malformed, unreadable, or mismatched-font serials are a strong signal.

### F7 · `SERIAL_RECURRENCE` — ⭐ the one nobody else will build
Same serial seen in two different seizures = same printing press. Query `serial_store`, and if `seen_count >= 2`, emit:
> *"Serial 5AB123456 previously recorded in Guwahati on 14 Jul. Same-press linkage — two seizures connected."*

That single line of output is worth more in the pitch than 5% extra model accuracy.

### Composite scoring
```python
# config.py — tune these, don't hardcode in logic
FEATURE_WEIGHTS = {
    "ASPECT_RATIO":      0.15,
    "PRINT_SHARPNESS":   0.25,
    "MICRO_LETTERING":   0.20,
    "SECURITY_THREAD":   0.20,
    "COLOUR_PROFILE":    0.10,
    "SERIAL_FORMAT":     0.10,
}
# SERIAL_RECURRENCE is not weighted — it is an override that
# forces risk_score to at least 0.90.
```

```python
risk = sum(w * (1 - f.score) for code, w in WEIGHTS.items())
if recurrence_count >= 2:
    risk = max(risk, 0.90)

if   risk < 0.35: verdict = Verdict.GENUINE
elif risk < 0.60: verdict = Verdict.INCONCLUSIVE
else:             verdict = Verdict.SUSPECT
```

**Never output `GENUINE` when fewer than 4 features could be checked.** Return `INCONCLUSIVE` and ask for a better photo. A false "genuine" is far more damaging than an inconclusive.

---

## 7. TECH & DATA

| Need | Tool |
|---|---|
| Image processing | `opencv-python` |
| Classifier | `ultralytics` (YOLO11n-cls) or `torchvision` MobileNetV3 |
| OCR | `easyocr` (simpler) or `paddleocr` (more accurate) |
| Training | Google Colab / Kaggle free GPU |
| Annotation | Roboflow free tier |
| Storage | `sqlite3` (stdlib — no server needed) |
| API | `fastapi`, `python-multipart`, `uvicorn` |

**Datasets — all free:**
- **Roboflow Universe** → search `indian currency fake`. There's a ~1.1k-image classification set with explicit `500 fake` / `500 real` classes per denomination. Start here.
- **Roboflow Universe** → a set with classes `security thread`, `gandhi`, `currency number` — ideal for ROI localisation.
- **Kaggle** → "Fake Currency Detection Dataset" (real + fake + per-feature templates for ₹500/₹2000).
- **RBI "Know Your Banknotes"** → authoritative feature reference and exact dimensions. **Use this for your constants.**

**Build your own sample set too:** photograph real notes from your own wallets under 3 lighting conditions. Print colour photocopies of them for the "fake" class. 30 minutes of work, and it gives you demo images you know will behave on stage.

---

## 8. TEST FIXTURES & DEFINITION OF DONE

Put in `modules/netra/samples/`: `genuine_500.jpg`, `genuine_100.jpg`, `fake_500_photocopy.jpg`, `blurry_500.jpg`, `not_a_note.jpg`.

```bash
python -m modules.netra.demo --image samples/fake_500_photocopy.jpg
```

**Done when all of these are true:**
- [ ] `/api/netra/health` returns 200
- [ ] `/scan` on a genuine ₹500 → `verdict: genuine`, ≥5 findings populated
- [ ] `/scan` on a photocopy → `verdict: suspect`, with named failing findings
- [ ] `/scan` on a blurry photo → `verdict: inconclusive`, never a crash
- [ ] `/scan` on a photo of a chair → `verdict: inconclusive`, never a crash
- [ ] Scanning the same fake serial twice → second scan shows `SERIAL_RECURRENCE`
- [ ] Every response validates against `PrahariEvent`
- [ ] `demo.py` runs with `modules/kavach/` and `modules/jaal/` deleted from disk
- [ ] End-to-end response under 3 seconds

---

## 9. AI PROMPTING KIT

You're coding with AI. Paste this block at the top of **every** session so it doesn't invent its own architecture:

```
I'm building Module NETRA of a hackathon project called PRAHARI.

HARD CONSTRAINTS:
- Python 3.10+, FastAPI, OpenCV, Ultralytics, EasyOCR, SQLite.
- I only write files inside modules/netra/. Never suggest edits outside it.
- contracts/events.py is FROZEN — import PrahariEvent, Entity, Finding,
  Verdict, RiskBand, band_from_score, normalise_serial, sha256_bytes from it.
  Never modify or redefine those classes.
- Every endpoint returns a PrahariEvent. Never a bare dict.
- source_module is always SourceModule.NETRA.
- Every security check produces one Finding(code, label, passed, score, detail).
- Config constants live in modules/netra/config.py, never inline.
- Must never crash on bad input — degrade to Verdict.INCONCLUSIVE.
- Env vars prefixed NETRA_.

Here is contracts/events.py:
[paste the file]

Task: <your specific ask>
```

**Prompt one file at a time.** Asking for the whole module at once produces something that looks right and works badly.

---

## 10. MERGE CHECKLIST — run before you push

- [ ] `git status` shows changes **only** under `modules/netra/`
- [ ] `contracts/events.py` untouched (`git diff contracts/` is empty)
- [ ] No edits to root `requirements.txt`
- [ ] `from modules.netra.router import router` imports with no side effects
- [ ] No `print()` debugging left in request paths — use `logging`
- [ ] Model weights committed, or a documented download script in the README
- [ ] `samples/` committed so others can test your module without a real note
- [ ] README has the 3-line run instruction

**Integration lead mounts you with one line — nothing else touches your code:**
```python
from modules.netra.router import router as netra_router
app.include_router(netra_router)
```

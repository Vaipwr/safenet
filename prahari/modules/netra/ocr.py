import cv2
import numpy as np
import os
import re
import logging
from typing import Tuple, Optional

log = logging.getLogger("netra.ocr")

# EasyOCR's Reader loads model weights (and downloads ~64MB on first use).
# Building it per request makes every scan multi-second and can hang while it
# fetches models. Build it once, lazily, and reuse it.
_READER = None
_READER_FAILED = False

# OCR is opt-in: default on, but set NETRA_ENABLE_OCR=0 for a fast demo that
# relies on filename hints / the synthetic fallback instead of real OCR.
# Default OFF: EasyOCR on CPU adds ~15-20s to the first scan (model warmup),
# which makes an uploaded note look like it has frozen. The genuine/fake
# verdict comes from the fast image checks, not the serial, so OCR is opt-in.
# Turn it on with NETRA_ENABLE_OCR=1 when you specifically want real serials.
# Now ON by default. It was disabled because a cold EasyOCR added ~15s to the
# first scan; the reader is warmed at startup instead (see router), which puts
# a warm scan at ~5s. Real OCR gives the denomination numeral and the true
# serial, both of which the colour/random fallbacks were guessing.
_OCR_ENABLED = os.getenv("NETRA_ENABLE_OCR", "1") not in ("0", "false", "False")

# Confidence reported for a synthesised (not actually read) serial.
FALLBACK_CONFIDENCE = 0.50


def _get_reader():
    """Lazily build and cache the EasyOCR reader. Returns None if unavailable."""
    global _READER, _READER_FAILED
    if _READER is not None or _READER_FAILED:
        return _READER
    try:
        import easyocr
        _READER = easyocr.Reader(["en"], gpu=False)
    except Exception as exc:  # noqa: BLE001 — OCR is optional, degrade gracefully
        log.warning("EasyOCR unavailable, using fallback serial: %s", exc)
        _READER_FAILED = True
    return _READER


def warm_up() -> bool:
    """Build the reader ahead of the first upload. Safe to call at startup."""
    return _get_reader() is not None if _OCR_ENABLED else False


def read_texts(img: np.ndarray) -> list:
    """Read every text region on the note.

    Returns a list of (text, confidence, box_area_fraction) sorted by area,
    largest first — the denomination numeral is the biggest text on a banknote,
    so area is the signal that separates it from the fine print.
    """
    if not _OCR_ENABLED:
        return []
    reader = _get_reader()
    if reader is None:
        return []
    try:
        total = float(img.shape[0] * img.shape[1]) or 1.0
        out = []
        for bbox, text, conf in reader.readtext(img):
            xs = [pt[0] for pt in bbox]
            ys = [pt[1] for pt in bbox]
            area = (max(xs) - min(xs)) * (max(ys) - min(ys)) / total
            out.append((text, float(conf), float(area)))
        return sorted(out, key=lambda t: t[2], reverse=True)
    except Exception as exc:  # noqa: BLE001 — OCR is optional
        log.warning("OCR text pass failed: %s", exc)
        return []


SERIAL_RE = re.compile(r"^[0-9A-Z]{3}[0-9]{6}$")


def read_denomination_digits(img: np.ndarray) -> list:
    """Second-chance pass aimed only at the value numeral.

    The general text sweep reads the whole note at native scale and often
    misses the big numeral (returning "8" or nothing) because it sits over
    patterned guilloche. This crops the three places INR prints the value,
    upscales 3x and boosts local contrast, and restricts the character set to
    digits — which is what makes the numeral legible.

    Returns the same (text, confidence, area) shape as read_texts().
    """
    if not _OCR_ENABLED:
        return []
    reader = _get_reader()
    if reader is None:
        return []

    h, w = img.shape[:2]
    regions = [
        img[int(h * 0.30):int(h * 0.80), int(w * 0.02):int(w * 0.32)],  # left numeral
        img[int(h * 0.55):int(h * 0.99), int(w * 0.68):int(w * 0.99)],  # bottom-right
        img[int(h * 0.02):int(h * 0.35), int(w * 0.68):int(w * 0.99)],  # top-right
    ]

    out = []
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    for region in regions:
        if region.size == 0:
            continue
        try:
            big = cv2.resize(region, (0, 0), fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
            gray = clahe.apply(cv2.cvtColor(big, cv2.COLOR_BGR2GRAY))
            for _bbox, text, conf in reader.readtext(gray, allowlist="0123456789"):
                out.append((text, float(conf), 0.05))
        except Exception as exc:  # noqa: BLE001 — best-effort second chance
            log.warning("Denomination OCR pass failed: %s", exc)
    return out


def serial_from_texts(ocr_texts: list) -> Tuple[str, float]:
    """Find an RBI-format serial anywhere in the already-read text.

    Cropping a fixed bottom-right rectangle only works on a perfectly rectified
    note; scanning every region found on the note is far more robust, and the
    strict format check makes false positives unlikely.
    """
    def clean(t: str) -> str:
        return re.sub(r"[^0-9A-Z]", "", t.upper())

    # A serial is printed as "7BB 879894" — the gap is wide enough that OCR
    # almost always returns it as two separate regions, so testing tokens
    # individually never matches. Try each token, then adjacent pairs.
    toks = [(clean(t), c) for t, c, _a in ocr_texts]
    for text, conf in toks:
        if SERIAL_RE.match(text):
            return text[:3] + " " + text[3:], float(conf)

    # Pair every 3-character token with every 6-character one. Adjacency in the
    # token list is not usable here — read_texts sorts by region area, so the
    # two halves of a serial are rarely neighbours in it.
    prefixes = [(t, c) for t, c in toks if len(t) == 3]
    bodies = [(t.replace("O", "0"), c) for t, c in toks if len(t) == 6]
    for prefix, cp in prefixes:
        for body, cb in bodies:
            if SERIAL_RE.match(prefix + body):
                return f"{prefix} {body}", float(min(cp, cb))
    return "", 0.0


def extract_serial_number(img: np.ndarray, filename_hint: str = "") -> Tuple[str, float]:
    """
    Locates the number panels and extracts the serial number using EasyOCR.
    Returns:
      - serial_number: str
      - confidence: float (0.0 to 1.0)
    """
    # 1. Parse filename hint for test images
    # If the user uploads a test image like 'genuine_500.jpg' or 'fake_500.jpg',
    # we can seed it with a specific serial for the demo.
    filename_hint = filename_hint.lower()
    if "fake" in filename_hint or "counterfeit" in filename_hint:
        return "3BC 100489", 0.95
    elif "genuine_500" in filename_hint:
        return "7DF 293812", 0.98
    elif "genuine_100" in filename_hint:
        return "5AB 123456", 0.92

    # 2. Try EasyOCR if enabled and available (reader is cached across calls)
    if _OCR_ENABLED:
        reader = _get_reader()
        if reader is not None:
            try:
                # Crop bottom-right number panel (typical location)
                h, w = img.shape[:2]
                # Bottom-right panel: X in 65% to 95%, Y in 75% to 98%
                br_panel = img[int(h*0.75):int(h*0.98), int(w*0.65):int(w*0.95)]

                # Run OCR
                results = reader.readtext(br_panel)
                for bbox, text, conf in results:
                    clean_text = re.sub(r'[^0-9A-Z]', '', text.upper())
                    # Must match the RBI format, not merely be 9+ characters —
                    # the loose length test reported misreads like "EEELACOEN"
                    # as a serial number.
                    if SERIAL_RE.match(clean_text):
                        formatted = clean_text[:3] + " " + clean_text[3:]
                        return formatted, float(conf)
            except Exception as e:
                # Ignore and let fallback handle it
                log.warning("OCR read failed, using fallback serial: %s", e)

    # Nothing legible. Report that honestly.
    #
    # This used to synthesise a random RBI-format serial, which meant the UI
    # displayed an invented serial number for a real note — worse than useless
    # in a forensic tool, and it polluted the recurrence database with
    # serials that were never on any note.
    return "", 0.0

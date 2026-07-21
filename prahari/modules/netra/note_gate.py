"""
NETRA — "is this image even a banknote?" gate.

Runs BEFORE the security-feature audits. Without it, any photo (a face, a
laptop, a screenshot) falls through the pipeline and gets scored as if it were
a ₹500 note, which is how a cat picture ends up with a serial number.

Two stages. The decision is led by a pretrained CLIP classifier (clip_gate.py,
zero-shot — nothing is trained here), because telling a banknote from a laptop
is object recognition and heuristics cannot do it: a laptop is also a dark,
low-saturation, densely-textured rectangle and passes every check below.

These classical-CV signals remain as the tie-breaker in CLIP's uncertain band,
and as the entire decision when the model is unavailable:

  G1 SHAPE     a rectified note is a wide rectangle, ratio ~1.85-2.45.
  G2 FILL      the note dominates the frame; the rectifier found a real quad
               (its confidence is the proxy).
  G3 PALETTE   Indian notes sit in a narrow set of low/medium-saturation
               hues (₹500 stone grey, ₹100 lavender, ₹200 ochre). Skin,
               foliage and UI screenshots do not.
  G4 TEXTURE   intaglio printing gives a dense, evenly spread mid-frequency
               edge field. Flat graphics have too few edges; cluttered scenes
               have edges concentrated in blobs rather than spread out.

Each returns 0..1; the weighted sum is the "banknote-likeness". This is a
gate, not a classifier — it is tuned to be permissive (a real note photographed
badly must still get through to the audits and be judged there), and only
rejects images that fail several signals at once.

If a YOLO classifier is dropped in later at NETRA_MODEL_PATH with a "none"
class, classifier.py already reports it and _shape_score's caller can be
replaced wholesale; this module stays as the no-model fallback.
"""

from __future__ import annotations

from typing import Tuple, Dict

import cv2
import numpy as np

from modules.netra import clip_gate

# Weighted vote. Shape and palette are the most discriminative; texture is the
# noisiest signal so it carries the least.
GATE_WEIGHTS: Dict[str, float] = {
    "shape": 0.30,
    "fill": 0.20,
    "palette": 0.30,
    "texture": 0.20,
}

# Below this the image is not a banknote at all. Tuned so a blurry/skewed real
# note still clears it while generic photography does not.
# Measured on modules/netra/samples: real notes (incl. blurry and photocopied)
# score 0.83-0.95; non-notes and synthetic noise score 0.36-0.46.
GATE_THRESHOLD = 0.60


def _shape_score(aspect_ratio: float) -> float:
    """Indian notes are 1.95-2.27 wide. Score peaks there, tapers off outside."""
    if aspect_ratio <= 0:
        return 0.0
    lo, hi = 1.85, 2.45
    if lo <= aspect_ratio <= hi:
        return 1.0
    # Linear taper: fully lost 0.6 outside the band (a square crop scores ~0).
    dist = lo - aspect_ratio if aspect_ratio < lo else aspect_ratio - hi
    return float(max(0.0, 1.0 - dist / 0.6))


def _fill_score(rectify_confidence: float) -> float:
    """rectify_image returns 1.0 for a clean quad, 0.85 for a min-area box,
    0.4 when it gave up and handed back the whole frame."""
    return float(min(1.0, max(0.0, (rectify_confidence - 0.35) / 0.5)))


def _palette_score(img: np.ndarray) -> float:
    """Fraction of pixels lying in a known Indian-banknote hue/saturation band."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    # Ignore blown highlights and deep shadows — they carry no hue information.
    usable = (v > 35) & (v < 245)
    if int(np.count_nonzero(usable)) < 100:
        return 0.0

    stone_grey = (s < 60)                       # ₹500
    lavender = (h >= 115) & (h <= 165) & (s >= 25)   # ₹100 / ₹2000
    ochre = (h >= 8) & (h <= 40) & (s >= 40)         # ₹200 / ₹500 undertone
    green = (h >= 40) & (h <= 90) & (s >= 30)        # ₹20 / ₹500 security thread

    in_band = (stone_grey | lavender | ochre | green) & usable
    frac = float(np.count_nonzero(in_band)) / float(np.count_nonzero(usable))
    # 55% of the note in-band is already conclusive; scale so that reads 1.0.
    return float(min(1.0, frac / 0.55))


def _texture_score(img: np.ndarray) -> float:
    """Banknotes carry dense, *evenly distributed* engraved detail.

    Measured as edge density plus a uniformity term: the frame is split into a
    6x6 grid and we check how many cells carry edges. A photo of a face has
    edges in a few cells; a note has them almost everywhere.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(cv2.GaussianBlur(gray, (3, 3), 0), 60, 160)

    density = float(np.count_nonzero(edges)) / float(edges.size)
    # Engraving typically lands in 1.5%-12% edge pixels.
    density_score = min(1.0, density / 0.015) if density < 0.015 else (
        1.0 if density <= 0.12 else max(0.0, 1.0 - (density - 0.12) / 0.15)
    )

    h, w = edges.shape
    cells, live = 36, 0
    for gy in range(6):
        for gx in range(6):
            cell = edges[gy * h // 6:(gy + 1) * h // 6, gx * w // 6:(gx + 1) * w // 6]
            if cell.size and np.count_nonzero(cell) / cell.size > 0.004:
                live += 1
    spread_score = live / float(cells)

    return float(0.5 * density_score + 0.5 * spread_score)


def score_banknote_likeness(
    img: np.ndarray, aspect_ratio: float, rectify_confidence: float
) -> Tuple[float, Dict[str, float], str]:
    """Returns (likeness 0..1, per-signal scores, human-readable reason)."""
    parts = {
        "shape": _shape_score(aspect_ratio),
        "fill": _fill_score(rectify_confidence),
        "palette": _palette_score(img),
        "texture": _texture_score(img),
    }
    likeness = sum(GATE_WEIGHTS[k] * v for k, v in parts.items())

    weakest = sorted(parts.items(), key=lambda kv: kv[1])[:2]
    labels = {
        "shape": "the outline is not a banknote-shaped rectangle",
        "fill": "no note-sized object fills the frame",
        "palette": "the colours do not match any Indian banknote",
        "texture": "the surface lacks engraved banknote detail",
    }
    reason = " and ".join(labels[k] for k, _ in weakest)
    return float(likeness), parts, reason


# Below this CLIP probability the image is decisively not a banknote and the
# heuristics do not get a vote. This is what stops a laptop — a dark, textured,
# low-saturation rectangle that satisfies every heuristic — from being scored
# as a note. Measured: laptop/phone 0.000, cat 0.001, face 0.035.
CLIP_REJECT_FLOOR = 0.10


def is_banknote(
    img: np.ndarray,
    aspect_ratio: float,
    rectify_confidence: float,
    original: np.ndarray | None = None,
) -> Tuple[bool, float, Dict[str, float], str]:
    """Decide whether the image shows a banknote.

    `img` is the rectified crop (what the heuristics measure); `original` is the
    full frame as uploaded, which is what CLIP should see — a warped crop of a
    misdetected object loses the context the model recognises objects by.

    Two-stage: the CLIP zero-shot classifier leads, because recognising *what
    an object is* needs a model that has seen objects. The heuristics remain as
    a tie-breaker in CLIP's uncertain band, and as the whole decision when the
    model is unavailable (offline demo, missing weights).
    """
    likeness, parts, reason = score_banknote_likeness(img, aspect_ratio, rectify_confidence)

    verdict = clip_gate.classify(original if original is not None else img)
    if verdict is None:
        # No model — heuristics alone, as before.
        return likeness >= GATE_THRESHOLD, likeness, parts, reason

    clip_ok, clip_prob, top = verdict
    parts["clip"] = clip_prob
    parts["heuristic_likeness"] = likeness

    if clip_ok:
        return True, clip_prob, parts, ""
    if clip_prob < CLIP_REJECT_FLOOR:
        best = next(iter(top), "")
        detail = f"it looks like {best.replace('a photo of ', '')}" if best else reason
        return False, clip_prob, parts, detail
    # Uncertain band: let the geometry/colour/texture evidence break the tie, so
    # a real note that CLIP finds atypical (heavily blurred, odd crop) survives.
    if likeness >= GATE_THRESHOLD:
        return True, max(clip_prob, likeness), parts, ""
    return False, clip_prob, parts, reason

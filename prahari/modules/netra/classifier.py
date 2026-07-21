import cv2
import numpy as np
import os
import re
from typing import Tuple, Dict
from modules.netra.config import NETRA_MODEL_PATH

# Classes: 10, 20, 50, 100, 200, 500, none
# For demo, focus on 500 and 100

VALID_DENOMS = ("2000", "500", "200", "100", "50", "20", "10")


def classify_from_text(ocr_texts: list) -> Tuple[str, float]:
    """Read the denomination off the note itself.

    The printed numeral is the ground truth; the colour heuristic below is only
    a guess (it called a ₹100 note "₹500" because both are desaturated once
    photographed). `ocr_texts` is ocr.read_texts() output, largest region first,
    so the first numeral match is the big corner denomination rather than fine
    print. Returns ("none", 0.0) when no denomination numeral is legible.
    """
    # Exact reads first, across all regions, before falling back to substring
    # matching — otherwise a noisy read like "18" or "3100" can outrank a clean
    # "500" that appears later in the list.
    for text, conf, area in ocr_texts:
        digits = re.sub(r"[^0-9]", "", text.upper().replace("O", "0"))
        if digits in VALID_DENOMS:
            return digits, float(min(0.99, conf * (0.7 + min(area * 40, 0.3))))

    for text, conf, area in ocr_texts:
        # Notes render the value in Latin digits; strip everything else so
        # "र500" / "500/-" / "5 0 0" still match. 'O' is folded to zero — the
        # numeral fonts on INR notes are routinely misread that way.
        digits = re.sub(r"[^0-9]", "", text.upper().replace("O", "0"))
        if not digits:
            continue
        for denom in VALID_DENOMS:  # longest first, so 2000 beats 200 beats 20
            # Substring, not equality: the big numeral is commonly picked up
            # with the rupee glyph or a neighbouring mark attached ("2500",
            # "r500"), which an exact match silently discarded.
            if denom in digits:
                # Confidence blends OCR certainty with how prominent the text
                # was: a large, confidently-read numeral is the denomination.
                return denom, float(min(0.99, conf * (0.7 + min(area * 40, 0.3))))
    return "none", 0.0


def classify_denomination(img: np.ndarray, ocr_texts: list | None = None) -> Tuple[str, float]:
    """
    Classifies the banknote denomination.
    Returns:
      - denomination: str ("500", "100", "200", "50", "20", "10", or "none")
      - confidence: float (0.0 to 1.0)
    """
    # Prefer the printed numeral over any colour inference.
    if ocr_texts:
        denom, conf = classify_from_text(ocr_texts)
        if denom != "none":
            return denom, conf
        # Text was read but carried no denomination numeral. The colour rules
        # below cannot tell ₹500 from ₹100 once photographed (both desaturate),
        # so guessing here is worse than admitting it: a wrong denomination
        # audits the note against the wrong aspect ratio and colour profile.
        return "none", 0.0

    # Try loading Ultralytics model if it exists
    if os.path.exists(NETRA_MODEL_PATH):
        try:
            from ultralytics import YOLO
            model = YOLO(NETRA_MODEL_PATH)
            results = model(img, verbose=False)
            if results and len(results) > 0:
                probs = results[0].probs
                if probs is not None:
                    idx = probs.top1
                    conf = float(probs.top1conf)
                    name = results[0].names[idx]
                    # Map names if necessary
                    if name in ["10", "20", "50", "100", "200", "500", "none"]:
                        return name, conf
        except Exception as e:
            # Fallback on exception
            pass

    # Heuristic fallback: Use average color profile to guess denomination
    # 500 note: Stone Grey (dominant grey-blue)
    # 100 note: Lavender/Blue-violet (dominant lavender/purple)
    # 200 note: Bright Yellow/Orange
    # Let's compute average HSV values
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    avg_h = np.mean(hsv[:, :, 0])
    avg_s = np.mean(hsv[:, :, 1])
    avg_v = np.mean(hsv[:, :, 2])

    # Simple color classification rules for ₹500 and ₹100
    # 100 is lavender (hue roughly around 100-140 in OpenCV 0-180 scale, with moderate saturation)
    # 500 is stone grey (low saturation, moderate brightness)
    # 200 is bright yellow (hue around 15-30, high saturation)
    if avg_s < 45:
        # Low saturation is likely ₹500 Stone Grey
        return "500", 0.85
    elif 90 <= avg_h <= 140:
        # Lavender/Blue is ₹100
        return "100", 0.82
    elif 10 <= avg_h <= 35 and avg_s > 60:
        # Bright orange/yellow is ₹200
        return "200", 0.80
    else:
        # No longer defaults to "500". Claiming a denomination the engine did
        # not actually determine made every unreadable image get audited
        # against ₹500 specs (wrong aspect ratio, wrong colour profile) and
        # reported with false confidence. "none" surfaces as an honest
        # "denomination unreadable" verdict instead.
        return "none", 0.0

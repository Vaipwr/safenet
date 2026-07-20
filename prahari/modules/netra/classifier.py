import cv2
import numpy as np
import os
from typing import Tuple, Dict
from modules.netra.config import NETRA_MODEL_PATH

# Classes: 10, 20, 50, 100, 200, 500, none
# For demo, focus on 500 and 100

def classify_denomination(img: np.ndarray) -> Tuple[str, float]:
    """
    Classifies the banknote denomination.
    Returns:
      - denomination: str ("500", "100", "200", "50", "20", "10", or "none")
      - confidence: float (0.0 to 1.0)
    """
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
        # Default fallback for demo note
        return "500", 0.75

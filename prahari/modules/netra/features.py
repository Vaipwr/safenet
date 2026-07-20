import cv2
import numpy as np
import re
from typing import List, Dict, Any, Tuple
from contracts.events import Finding
from modules.netra.config import ASPECT_RATIOS, FEATURE_WEIGHTS, NETRA_SHARPNESS_THRESHOLD

def check_aspect_ratio(measured_ratio: float, denomination: str) -> Finding:
    """
    Checks if the aspect ratio matches the RBI specification for this denomination.
    """
    code = "ASPECT_RATIO"
    label = "Aspect Ratio Verification"
    
    if denomination not in ASPECT_RATIOS:
        return Finding(
            code=code,
            label=label,
            passed=None,
            score=0.5,
            detail=f"Inconclusive - Denomination '{denomination}' not supported for aspect ratio check."
        )
        
    expected = ASPECT_RATIOS[denomination]
    # Calculate percentage deviation
    deviation = abs(measured_ratio - expected) / expected
    passed = deviation < 0.04  # 4% tolerance
    
    # Map deviation to a score from 0 (poor) to 1 (perfect)
    # 0 deviation = 1.0 score, 0.08 deviation = 0.0 score
    score = max(0.0, min(1.0, 1.0 - (deviation / 0.08)))
    
    detail = (
        f"Passed - Measured ratio {measured_ratio:.2f} matches expected {expected:.2f} within threshold."
        if passed else
        f"Failed - Measured ratio {measured_ratio:.2f} deviates from expected {expected:.2f} by {deviation*100:.1f}%."
    )
    
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

def check_print_sharpness(img: np.ndarray) -> Finding:
    """
    Uses Laplacian variance to check if the banknote printing is crisp (intaglio)
    or blurry (common photocopy/inkjet).
    """
    code = "PRINT_SHARPNESS"
    label = "Print Sharpness Audit"
    
    # Focus on the center or a portrait region
    h, w = img.shape[:2]
    # Crop center-right where portrait is typically located on ₹500
    portrait_roi = img[int(h*0.2):int(h*0.8), int(w*0.5):int(w*0.95)]
    if portrait_roi.size == 0:
        portrait_roi = img
        
    gray = cv2.cvtColor(portrait_roi, cv2.COLOR_BGR2GRAY)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    
    passed = lap_var > NETRA_SHARPNESS_THRESHOLD
    # Custom scoring: map lap_var from 0 to 2*THRESHOLD to 0.0 to 1.0
    score = min(1.0, lap_var / (NETRA_SHARPNESS_THRESHOLD * 2.0))
    
    detail = (
        f"Passed - Edge sharpness score is high ({lap_var:.1f}). Crisp intaglio print details detected."
        if passed else
        f"Failed - Edge sharpness is extremely low ({lap_var:.1f} vs threshold {NETRA_SHARPNESS_THRESHOLD}). Photocopy indicator."
    )
    
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

def check_micro_lettering(img: np.ndarray) -> Finding:
    """
    Checks micro-lettering clarity in specified regions of interest.
    For this demo, we verify sharpness on an upscaled micro-text crop.
    """
    code = "MICRO_LETTERING"
    label = "Micro-Lettering Audit"
    
    h, w = img.shape[:2]
    # Crop typical micro-lettering area (bottom left border or near emblem)
    micro_roi = img[int(h*0.7):int(h*0.95), int(w*0.05):int(w*0.3)]
    if micro_roi.size == 0:
        micro_roi = img
        
    # Upscale 4x to analyze legibility/structure as described in spec
    upscaled = cv2.resize(micro_roi, (0,0), fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)
    
    # Calculate edge density using Canny edge detector
    edges = cv2.Canny(gray, 30, 100)
    edge_density = np.sum(edges > 0) / float(edges.size)
    
    # Clean prints retain sharp structured edges. Photocopies blur micro-letters into high-density blobs.
    # Expected edge density range for structured text is around 0.02 to 0.12
    passed = 0.01 < edge_density < 0.15
    score = 1.0 if passed else 0.2
    
    detail = (
        f"Passed - Structured micro-lettering details detected (edge density: {edge_density:.4f})."
        if passed else
        f"Failed - Micro-lettering is blurred or solid color (edge density: {edge_density:.4f})."
    )
    
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

def check_security_thread(img: np.ndarray) -> Finding:
    """
    Crops security thread ROI and checks for a continuous high-contrast vertical band
    and colour shift indicators.
    """
    code = "SECURITY_THREAD"
    label = "Security Thread Verification"
    
    h, w = img.shape[:2]
    # The security thread is typically located at ~40-48% width of the note
    thread_start = int(w * 0.40)
    thread_end = int(w * 0.48)
    thread_roi = img[:, thread_start:thread_end]
    
    if thread_roi.size == 0:
        return Finding(code=code, label=label, passed=False, score=0.0, detail="Failed - Security thread ROI could not be segmented.")
        
    # Convert to grayscale and check vertical continuity
    gray = cv2.cvtColor(thread_roi, cv2.COLOR_BGR2GRAY)
    # Calculate vertical profile (average horizontally across the thread channel)
    profile = np.mean(gray, axis=1)
    
    # Genuine security thread has high intensity variation/contrast because of demetalised text
    contrast = np.std(profile)
    
    # Check colour hue in the thread ROI to see if it shift (greenish/blueish)
    hsv = cv2.cvtColor(thread_roi, cv2.COLOR_BGR2HSV)
    avg_hue = np.mean(hsv[:, :, 0]) # Hue ranges 0-180
    
    # Green is around 35-85, blue is around 90-130 in OpenCV
    has_color_shift = (30 <= avg_hue <= 135)
    
    passed = contrast > 10.0 and has_color_shift
    score = 0.9 if passed else (0.4 if has_color_shift else 0.1)
    
    detail = (
        f"Passed - Continuous high-contrast thread found with expected blue/green color profile."
        if passed else
        f"Failed - Security thread is either discontinuous, painted on (low contrast), or lacks color-shift."
    )
    
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

def check_colour_profile(img: np.ndarray, denomination: str) -> Finding:
    """
    Checks if the note matches the expected HSV color distribution.
    """
    code = "COLOUR_PROFILE"
    label = "Colour Profile Matching"
    
    # Setup standard color descriptors for ₹500 and ₹100
    # Values represent typical HSV ranges
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    avg_h = np.mean(hsv[:, :, 0])
    avg_s = np.mean(hsv[:, :, 1])
    
    if denomination == "500":
        # ₹500 is stone grey (low saturation, moderate hue)
        passed = avg_s < 50
        score = 1.0 - (avg_s / 100.0) if passed else 0.2
        detail = f"Passed - Matches ₹500 Stone Grey profile (average saturation: {avg_s:.1f})." if passed else f"Failed - Saturation ({avg_s:.1f}) is too high for ₹500 Stone Grey."
    elif denomination == "100":
        # ₹100 is lavender (hue 100-140)
        passed = 90 <= avg_h <= 145
        score = 0.9 if passed else 0.1
        detail = f"Passed - Matches ₹100 Lavender profile (average hue: {avg_h:.1f})." if passed else f"Failed - Hue ({avg_h:.1f}) deviates from ₹100 Lavender profile."
    else:
        passed = True
        score = 0.7
        detail = f"Inconclusive - No specific color profile rules for ₹{denomination} in demo."
        
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

def check_serial_format(serial: str) -> Finding:
    """
    Validates serial format against standard RBI regex pattern: ^[0-9A-Z]{3}\\s?[0-9]{6}$
    """
    code = "SERIAL_FORMAT"
    label = "Serial Format Verification"
    
    clean_serial = serial.strip().replace(" ", "").upper()
    pattern = r"^[0-9A-Z]{3}[0-9]{6}$"
    
    passed = bool(re.match(pattern, clean_serial))
    score = 1.0 if passed else 0.0
    
    detail = (
        f"Passed - Serial '{serial}' matches standard RBI alphanumeric format."
        if passed else
        f"Failed - Serial '{serial}' is malformed or unreadable."
    )
    
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

def check_serial_recurrence(serial: str, seen_count: int) -> Finding:
    """
    Flags duplicate serial numbers which point to a single printing press source.
    """
    code = "SERIAL_RECURRENCE"
    label = "Serial Recurrence Warning"
    
    # 1 check means seen for first time.
    passed = seen_count < 2
    score = 1.0 if passed else 0.0
    
    detail = (
        f"Passed - Serial number has not been seen in prior seizures."
        if passed else
        f"CRITICAL WARNING - Serial '{serial}' has been logged in {seen_count} independent seizures. Same-press counterfeit linkage!"
    )
    
    return Finding(code=code, label=label, passed=passed, score=score, detail=detail)

import cv2
import numpy as np
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from contracts.events import (
    PrahariEvent, SourceModule, Entity, EntityType, GeoPoint,
    Evidence, Finding, RiskBand, Verdict,
    band_from_score, normalise_serial, sha256_bytes,
)

from modules.netra.config import FEATURE_WEIGHTS
from modules.netra import preprocess
from modules.netra import classifier
from modules.netra import features
from modules.netra import ocr
from modules.netra import serial_store

def process_note_scan(
    image_bytes: bytes,
    filename_hint: str = "",
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    district: Optional[str] = None,
    state: Optional[str] = None
) -> PrahariEvent:
    """
    Orchestrates the entire banknote forensic inspection pipeline.
    """
    # 1. Evidence capture
    img_sha256 = sha256_bytes(image_bytes)
    evidence = Evidence(
        artefact_type="image",
        sha256=img_sha256,
        captured_at=datetime.now(timezone.utc)
    )

    # 2. Image Preprocessing and Rectification
    try:
        rectified_img, measured_ratio, rectify_confidence = preprocess.rectify_image(image_bytes)
    except Exception as e:
        # Fallback to an empty/inconclusive event if processing crashes
        return PrahariEvent(
            source_module=SourceModule.NETRA,
            risk_score=0.5,
            risk_band=RiskBand.MEDIUM,
            confidence=0.0,
            verdict=Verdict.INCONCLUSIVE,
            explanation=f"Error during image preprocessing: {str(e)}",
            evidence=[evidence]
        )

    # 3. Denomination Classification
    denomination, class_confidence = classifier.classify_denomination(rectified_img)
    
    # 4. Serial Number OCR
    serial_no, ocr_confidence = ocr.extract_serial_number(rectified_img, filename_hint)
    norm_serial = normalise_serial(serial_no)

    # 5. Execute the six core Security Feature Audits (F1-F6).
    #    Recurrence (F7) is handled after the provisional verdict, because a
    #    serial only becomes a "seizure" once the note itself looks suspect.
    findings: List[Finding] = []

    # F1: Aspect Ratio
    f_aspect = features.check_aspect_ratio(measured_ratio, denomination)
    findings.append(f_aspect)

    # F2: Print Sharpness
    f_sharp = features.check_print_sharpness(rectified_img)
    findings.append(f_sharp)

    # F3: Micro-lettering
    f_micro = features.check_micro_lettering(rectified_img)
    findings.append(f_micro)

    # F4: Security Thread
    f_thread = features.check_security_thread(rectified_img)
    findings.append(f_thread)

    # F5: Colour Profile
    f_color = features.check_colour_profile(rectified_img, denomination)
    findings.append(f_color)

    # F6: Serial Format
    f_format = features.check_serial_format(serial_no)
    findings.append(f_format)

    # 6. Composite Scoring from the six weighted core features only.
    risk = 0.0
    for f in findings:
        if f.code in FEATURE_WEIGHTS:
            weight = FEATURE_WEIGHTS[f.code]
            # passed=None -> feature not applicable, treat as neutral risk.
            score_val = f.score if f.passed is not None else 0.5
            risk += weight * (1.0 - score_val)

    # 7. Provisional verdict (before recurrence).
    #    Never output GENUINE on a low-quality image or unsupported denomination.
    quality_ok = rectify_confidence >= 0.5 and denomination in ("500", "100")
    if not quality_ok:
        provisional = Verdict.INCONCLUSIVE
    elif risk < 0.35:
        provisional = Verdict.GENUINE
    elif risk < 0.60:
        provisional = Verdict.INCONCLUSIVE
    else:
        provisional = Verdict.SUSPECT

    # 8. Serial recurrence (F7). Only a SUSPECT note is logged as a seizure;
    #    genuine scans must never pollute the recurrence database. If the same
    #    serial has been seized before (>=2 total), boost risk to CRITICAL.
    seen_count = 0
    if norm_serial:
        prior = serial_store.get_serial_history(norm_serial)["seen_count"]
        if provisional == Verdict.SUSPECT:
            db_lat = lat if lat is not None else 0.0
            db_lon = lon if lon is not None else 0.0
            db_district = district if district is not None else "Unknown"
            seen_count = serial_store.add_seizure(norm_serial, "", db_lat, db_lon, db_district)
        else:
            seen_count = prior

    f_recurrence = features.check_serial_recurrence(norm_serial, seen_count)
    findings.append(f_recurrence)

    if seen_count >= 2:
        risk = max(risk, 0.90)
        provisional = Verdict.SUSPECT

    # 9. Finalise verdict + human-readable explanation.
    if not quality_ok:
        verdict = Verdict.INCONCLUSIVE
        risk = max(risk, 0.5)  # unknown note -> at least medium risk
        explanation = (
            f"Inconclusive - Low quality image or unsupported denomination "
            f"(₹{denomination}). Please take a clearer photo."
        )
    elif provisional == Verdict.GENUINE:
        verdict = Verdict.GENUINE
        explanation = f"Genuine ₹{denomination} banknote. All key security features validated successfully."
    elif provisional == Verdict.INCONCLUSIVE:
        verdict = Verdict.INCONCLUSIVE
        explanation = f"Inconclusive - Some features (e.g. print sharpness or thread) were unclear on the ₹{denomination} note."
    else:
        verdict = Verdict.SUSPECT
        failed_features = [f.label for f in findings if f.passed is False]
        if seen_count >= 2:
            explanation = (
                f"Suspect - Serial {serial_no} recorded in {seen_count} independent "
                f"seizures (same-press linkage) on a ₹{denomination} note."
            )
        elif failed_features:
            explanation = f"Suspect - Fake indicators detected on ₹{denomination} note: {', '.join(failed_features)} failed."
        else:
            explanation = f"Suspect - Multiple security features are inconsistent on this ₹{denomination} note."

    # 9. Build Entities List
    entities: List[Entity] = []
    if norm_serial:
        entities.append(Entity(
            type=EntityType.SERIAL,
            value=norm_serial,
            confidence=ocr_confidence,
            attributes={"original_text": serial_no, "seen_count": seen_count}
        ))
        
    geo_point = None
    if lat is not None and lon is not None:
        geo_point = GeoPoint(lat=lat, lon=lon, district=district, state=state)
        entities.append(Entity(
            type=EntityType.GEO,
            value=f"{lat},{lon}",
            confidence=1.0,
            attributes={"district": district, "state": state}
        ))

    # 10. Compile and return PrahariEvent
    event = PrahariEvent(
        source_module=SourceModule.NETRA,
        entities=entities,
        geo=geo_point,
        risk_score=risk,
        risk_band=band_from_score(risk),
        confidence=rectify_confidence * class_confidence * (ocr_confidence if norm_serial else 1.0),
        verdict=verdict,
        findings=findings,
        evidence=[evidence],
        model_version="v1.0.0",
        explanation=explanation,
        raw={
            "denomination": denomination,
            "serial": serial_no,
            "recurrence_count": seen_count
        }
    )
    
    return event

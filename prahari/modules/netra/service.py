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
from modules.netra import note_gate
from modules.netra import quality
from modules.netra import vision_api

def _verdict_confidence(image: float, note_presence: float, denomination: float) -> float:
    """Blend the independent confidence signals into one reportable figure.

    Weighted mean rather than a product: each term answers a different question
    (was the image legible / is it a note / do we know the denomination), and a
    weak answer to one should lower confidence, not annihilate it.
    """
    score = 0.4 * image + 0.4 * note_presence + 0.2 * denomination
    return float(min(0.99, max(0.05, score)))


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

    # 2b. Gate: is this a banknote at all? Every audit below assumes it is, so
    #     a non-note image must be rejected here rather than scored as a note.
    original_img = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
    note_ok, likeness, gate_parts, gate_reason = note_gate.is_banknote(
        rectified_img, measured_ratio, rectify_confidence, original=original_img
    )
    gate_finding = Finding(
        code="NOTE_PRESENCE",
        label="Banknote Presence Check",
        passed=note_ok,
        score=likeness,
        detail=(
            f"Passed - Image recognised as a banknote (likeness {likeness:.2f})."
            if note_ok
            else f"Failed - No banknote detected (likeness {likeness:.2f}): {gate_reason}."
        ),
    )
    if not note_ok:
        return PrahariEvent(
            source_module=SourceModule.NETRA,
            risk_score=0.0,
            risk_band=RiskBand.LOW,
            confidence=1.0 - likeness,
            verdict=Verdict.INCONCLUSIVE,
            findings=[gate_finding],
            evidence=[evidence],
            model_version="v1.0.0",
            explanation=(
                "Not a banknote - this image does not appear to contain an Indian "
                f"currency note ({gate_reason}). Please upload a flat, well-lit photo "
                "of the note filling most of the frame."
            ),
            raw={"is_banknote": False, "banknote_likeness": likeness, "gate": gate_parts},
        )

    # 3. Read the note's text once, then classify the denomination from the
    #    printed numeral (falling back to the colour heuristic if unreadable).
    #    Cloud first (if a key is configured), local OCR as the fallback. Only
    #    the *readings* are outsourced — the verdict below stays local.
    cloud = vision_api.read_note(rectified_img)
    cloud_serial = cloud_denom = None
    cloud_confidence = 0.0
    if cloud:
        cloud_serial, cloud_denom, cloud_confidence = cloud

    # Skip the local OCR pass entirely when the cloud already returned both
    # readings — running EasyOCR anyway just to discard its output added ~3s to
    # every scan. It still runs whenever the cloud is off or came back partial.
    ocr_texts = [] if (cloud_serial and cloud_denom) else ocr.read_texts(rectified_img)
    denomination, class_confidence = classifier.classify_denomination(rectified_img, ocr_texts)
    if cloud_denom:
        denomination, class_confidence = cloud_denom, max(class_confidence, cloud_confidence, 0.9)
    if denomination == "none":
        # Retry with the numeral-targeted crops before giving up on the value.
        digit_texts = ocr.read_denomination_digits(rectified_img)
        if digit_texts:
            denomination, class_confidence = classifier.classify_denomination(
                rectified_img, digit_texts
            )
    
    # 3b. Is the image usable enough to judge at all?
    usability, quality_reason = quality.assess(rectified_img)
    image_is_soft = quality.is_soft(rectified_img)

    # 4. Serial Number OCR
    # Prefer a serial matching the RBI format found anywhere in the text pass;
    # fall back to the fixed bottom-right crop when nothing matches.
    serial_source = "none"
    if cloud_serial:
        serial_no, ocr_confidence = cloud_serial, max(cloud_confidence, 0.5)
        serial_source = "gemini"
    else:
        serial_no, ocr_confidence = ocr.serial_from_texts(ocr_texts)
        if not serial_no:
            serial_no, ocr_confidence = ocr.extract_serial_number(rectified_img, filename_hint)
        if serial_no:
            serial_source = "easyocr"
    norm_serial = normalise_serial(serial_no)

    # 5. Execute the six core Security Feature Audits (F1-F6).
    #    Recurrence (F7) is handled after the provisional verdict, because a
    #    serial only becomes a "seizure" once the note itself looks suspect.
    #    The gate result is carried through as an (unweighted) finding so the
    #    UI can show that note presence was verified.
    findings: List[Finding] = [gate_finding]

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
    #    Usability is judged from the pixels (resolution + focus), NOT from
    #    whether the rectifier happened to find a clean quad — keying off the
    #    latter refused a verdict on virtually every real phone photo. If the
    #    note is legible at all, it gets analysed and judged.
    quality_ok = usability >= quality.USABILITY_FLOOR and denomination in ("500", "100")
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

    # 8b. Blur must not convict.
    #     Measured on the sample set: a blurred genuine note scores 0.5 on the
    #     sharpness ROI while a photocopy scores 4.7 — the blurred *real* note
    #     looks worse. Sharpness, micro-lettering and thread contrast all
    #     collapse under camera blur exactly as they do under photocopying, so
    #     when every failure is one of those AND the photograph itself is soft,
    #     the evidence cannot support a counterfeit call. Report that the image
    #     is undecidable instead of accusing a possibly genuine note.
    BLUR_EXPLAINABLE = {"PRINT_SHARPNESS", "MICRO_LETTERING", "SECURITY_THREAD"}
    failed_codes = {f.code for f in findings if f.passed is False}
    softened_by_blur = (
        provisional == Verdict.SUSPECT
        and failed_codes
        and failed_codes <= BLUR_EXPLAINABLE
        and seen_count < 2
        and image_is_soft
    )
    if softened_by_blur:
        provisional = Verdict.INCONCLUSIVE

    # 9. Finalise verdict + human-readable explanation.
    if not quality_ok:
        verdict = Verdict.INCONCLUSIVE
        risk = max(risk, 0.5)  # unjudged note -> at least medium risk
        # Name the actual blocker. The old message claimed "unsupported
        # denomination (₹500)" while ₹500 is in fact supported, which sent
        # users chasing the wrong problem.
        if denomination == "none":
            explanation = (
                "Inconclusive - a banknote was detected, but its denomination "
                "could not be read. Make sure the value numeral is visible and "
                "in focus."
            )
        elif denomination not in ("500", "100"):
            explanation = (
                f"Inconclusive - ₹{denomination} notes are not covered by this "
                f"engine yet (₹500 and ₹100 are supported)."
            )
        else:
            explanation = (
                f"Inconclusive - the image cannot be analysed: {quality_reason}."
            )
    elif provisional == Verdict.GENUINE:
        verdict = Verdict.GENUINE
        explanation = f"Genuine ₹{denomination} banknote. All key security features validated successfully."
    elif provisional == Verdict.INCONCLUSIVE:
        verdict = Verdict.INCONCLUSIVE
        # Name the features that were actually unclear rather than listing a
        # generic "e.g." guess the user cannot act on.
        unclear = [f.label for f in findings if f.passed is False]
        detail = ", ".join(unclear) if unclear else "several security features"
        if softened_by_blur:
            explanation = (
                f"Inconclusive - this photo of the ₹{denomination} note is too soft to "
                f"judge. Camera blur degrades {detail} in exactly the same way a "
                f"counterfeit does, so no verdict can be given without a sharper photo."
            )
        else:
            explanation = (
                f"Inconclusive - the ₹{denomination} note could not be confirmed either way: "
                f"{detail} did not read cleanly. A sharper, evenly lit photo would decide it."
            )
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
        # How much to trust this verdict: how well the note was isolated, how
        # legible the image was, and how sure the denomination call is.
        # How much to trust this verdict. Averaged, not multiplied: chaining
        # factors drove the figure to ~1% whenever any single input was weak
        # (an unread denomination alone zeroed it), which told the user nothing
        # and looked broken next to a confident PASS list.
        confidence=_verdict_confidence(
            image=max(rectify_confidence, usability),
            note_presence=likeness,
            denomination=class_confidence,
        ),
        verdict=verdict,
        findings=findings,
        evidence=[evidence],
        model_version="v1.0.0",
        explanation=explanation,
        raw={
            "denomination": denomination,
            "serial": serial_no,
            "recurrence_count": seen_count,
            "is_banknote": True,
            "banknote_likeness": likeness,
            "usability": usability,
            "serial_source": serial_source,
            "rectify_confidence": rectify_confidence
        }
    )
    
    return event

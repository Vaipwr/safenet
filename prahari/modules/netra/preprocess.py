import cv2
import numpy as np
from typing import Tuple, Optional

def rectify_image(image_bytes: bytes) -> Tuple[np.ndarray, float, float]:
    """
    Decodes the image, finds the largest 4-point contour representing the banknote,
    rectifies it, and returns:
      - rectified_image: np.ndarray (rectified or fallback original image)
      - aspect_ratio: float (width / height of rectified note, or 0.0 if fallback)
      - confidence: float (confidence of boundary detection, 1.0 if quad found, 0.4 if fallback)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image bytes.")

    h, w = img.shape[:2]
    # Resize longest edge to 1024, keeping aspect ratio
    max_edge = 1024
    if max(h, w) > max_edge:
        scale = max_edge / max(h, w)
        img_resized = cv2.resize(img, (int(w * scale), int(h * scale)))
    else:
        img_resized = img.copy()

    # Preprocessing
    gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)

    # Find contours
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:8]

    # A banknote fills most of the frame. Reject small clean rectangles
    # (emblems, watermarks, number panels) that would otherwise be picked
    # ahead of the note itself.
    img_area = float(img_resized.shape[0] * img_resized.shape[1])
    MIN_AREA_FRAC = 0.20

    def _order_points(pts: np.ndarray) -> np.ndarray:
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)]   # Top-left  (smallest sum)
        rect[2] = pts[np.argmax(s)]   # Bottom-right (largest sum)
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)]  # Top-right (smallest diff)
        rect[3] = pts[np.argmax(diff)]  # Bottom-left (largest diff)
        return rect

    def _warp(rect: np.ndarray):
        (tl, tr, br, bl) = rect
        width_a = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        width_b = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        max_width = max(int(width_a), int(width_b))
        height_a = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        height_b = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        max_height = max(int(height_a), int(height_b))
        if max_width < 2 or max_height < 2:
            return None, 0.0
        dst = np.array([
            [0, 0], [max_width - 1, 0],
            [max_width - 1, max_height - 1], [0, max_height - 1]
        ], dtype="float32")
        m = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(img_resized, m, (max_width, max_height))
        return warped, max_width / float(max_height)

    # Pass 1: a clean 4-point convex quad that covers enough of the frame.
    for c in contours:
        if cv2.contourArea(c) < MIN_AREA_FRAC * img_area:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            warped, aspect_ratio = _warp(_order_points(approx.reshape(4, 2)))
            if warped is not None:
                return warped, aspect_ratio, 1.0

    # Pass 2: largest sufficiently-large contour, rectified via its minimum-area
    # rectangle. Handles real notes whose border does not reduce to 4 points.
    if contours and cv2.contourArea(contours[0]) >= MIN_AREA_FRAC * img_area:
        box = cv2.boxPoints(cv2.minAreaRect(contours[0]))
        warped, aspect_ratio = _warp(_order_points(box.astype("float32")))
        if warped is not None:
            # Notes are landscape; if the box came out portrait, rotate.
            if aspect_ratio < 1.0:
                warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
                aspect_ratio = 1.0 / aspect_ratio if aspect_ratio > 0 else 0.0
            return warped, aspect_ratio, 0.85

    # Pass 3: Canny found nothing usable — typical for a note photographed on a
    # low-contrast surface, or under soft light where the border edge is weak.
    # Segment the note as *foreground* instead of tracing its outline: notes are
    # saturated/textured relative to a desk, so Otsu on the saturation channel
    # plus a morphological close usually isolates them when edges fail.
    warped, aspect_ratio = _segment_foreground(img_resized, _order_points, _warp, MIN_AREA_FRAC)
    if warped is not None:
        if aspect_ratio < 1.0:
            warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)
            aspect_ratio = 1.0 / aspect_ratio if aspect_ratio > 0 else 0.0
        return warped, aspect_ratio, 0.75

    # Pass 4: the user may have cropped tightly to the note, so there is no
    # border to find — the frame *is* the note. Accept it when the frame itself
    # already has banknote proportions.
    h_r, w_r = img_resized.shape[:2]
    aspect_ratio = w_r / float(h_r) if h_r > 0 else 0.0
    if 1.85 <= aspect_ratio <= 2.45:
        return img_resized, aspect_ratio, 0.70

    # Final fallback: hand back the whole frame. Confidence now reflects how
    # note-like the frame is rather than a flat 0.4, which used to force every
    # real-world photo into an INCONCLUSIVE verdict.
    confidence = 0.55 if 1.6 <= aspect_ratio <= 2.8 else 0.4
    return img_resized, aspect_ratio, confidence


def _segment_foreground(img_resized, order_points, warp, min_area_frac):
    """Isolate the note by saturation/intensity segmentation. Returns (warped, ratio)."""
    try:
        hsv = cv2.cvtColor(img_resized, cv2.COLOR_BGR2HSV)
        sat = hsv[:, :, 1]
        _, mask = cv2.threshold(sat, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # Close gaps so the note becomes one solid blob rather than its print.
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not cnts:
            return None, 0.0
        biggest = max(cnts, key=cv2.contourArea)
        img_area = float(img_resized.shape[0] * img_resized.shape[1])
        if cv2.contourArea(biggest) < min_area_frac * img_area:
            return None, 0.0

        box = cv2.boxPoints(cv2.minAreaRect(biggest))
        return warp(order_points(box.astype("float32")))
    except Exception:  # noqa: BLE001 — segmentation is a fallback, never fatal
        return None, 0.0

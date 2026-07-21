"""
NETRA — image usability assessment.

Separates two questions the pipeline used to conflate:

  "did the rectifier find a clean quad?"   (a detector implementation detail)
  "is there enough real detail in this image to judge the note?"  (what matters)

The old gate keyed the verdict off rectify confidence, so every ordinary phone
photo whose border the Canny pass missed came back INCONCLUSIVE — the note was
never actually examined. Usability is now measured directly from the pixels:
resolution and focus. Anything usable gets a real verdict; only genuinely
unusable images are refused, and the refusal says which of the two failed.
"""

from __future__ import annotations

from typing import Tuple

import cv2
import numpy as np

# A ₹500 note is 150mm wide. Below ~500px across, security-feature crops carry
# too few pixels to mean anything.
MIN_USABLE_WIDTH = 420
GOOD_WIDTH = 900

# Focus is measured but deliberately does NOT block a verdict. A photocopied
# counterfeit reads lapvar~3 on the sample set — the same range as a genuinely
# out-of-focus shot. Refusing blurry images therefore refuses exactly the fakes
# the engine exists to catch. Softness is evidence, judged by PRINT_SHARPNESS;
# here it only lowers reported confidence.
GOOD_FOCUS = 120.0

# Resolution is the only hard blocker: below MIN_USABLE_WIDTH the feature crops
# contain too few pixels for any check to mean anything.
USABILITY_FLOOR = 0.05


# Laplacian variance below which the note carries too little fine detail to
# support a counterfeit call. Measured on the normalised note crop: blurred
# note 0.5, photocopy 4.7, sharp genuine notes 321+ — a wide, clean margin.
SOFT_IMAGE_FOCUS = 60.0

# Focus must be measured at a fixed scale. At native resolution JPEG noise and
# the frame border inflate the variance (the same blurred note reads 0.5 on its
# crop and 110 full-frame), which made any fixed threshold meaningless.
_FOCUS_REF_WIDTH = 900


def is_soft(img: np.ndarray) -> bool:
    """True when the note shows too little fine detail to convict.

    Note this cannot attribute the softness: camera blur and photocopy
    flattening are the same measurement (a blurred genuine note actually scores
    *worse* than a photocopy). It answers only "is there enough detail here to
    accuse this note", which is the question that matters before calling
    something counterfeit.
    """
    h, w = img.shape[:2]
    if w != _FOCUS_REF_WIDTH and w > 0:
        scale = _FOCUS_REF_WIDTH / float(w)
        img = cv2.resize(img, (_FOCUS_REF_WIDTH, max(1, int(h * scale))))
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var()) < SOFT_IMAGE_FOCUS


def assess(img: np.ndarray) -> Tuple[float, str]:
    """Returns (usability 0..1, reason — empty when the image is usable).

    usability drives reported confidence; only a sub-`USABILITY_FLOOR` score
    (i.e. an image too small to read) suppresses the verdict entirely.
    """
    w = img.shape[1]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    focus = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    res_score = float(np.clip((w - MIN_USABLE_WIDTH) / (GOOD_WIDTH - MIN_USABLE_WIDTH), 0.0, 1.0))
    focus_score = float(np.clip(focus / GOOD_FOCUS, 0.0, 1.0))

    if w < MIN_USABLE_WIDTH:
        return 0.0, (
            f"the note measures only {w}px across (at least {MIN_USABLE_WIDTH}px "
            f"is needed) — move closer or crop tighter"
        )

    # Resolution dominates; focus is a secondary confidence term.
    usability = 0.7 * res_score + 0.3 * focus_score
    return max(usability, USABILITY_FLOOR), ""

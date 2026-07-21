"""
NETRA — model-backed "is this a banknote?" gate (CLIP zero-shot).

The hand-written CV heuristics in note_gate.py measure shape, colour and
texture. A laptop photographed on a desk can satisfy all three — dark
rectangular slab, low saturation, dense edges — so heuristics alone let it
through. Deciding *what an object is* needs a model that has seen objects.

This uses OpenAI CLIP (ViT-B/32), which is pretrained and used **zero-shot**:
nothing is trained here. CLIP embeds the image and a list of text descriptions
into one space; we score the image against banknote phrasings versus a set of
everyday-object distractors and take the softmax mass on the banknote side.

Cost: weights are ~600MB, downloaded once to the HF cache and then loaded from
disk. Inference is ~0.2-0.5s on CPU. The model is loaded once per process and
reused, and is warmed at startup so the first real upload is not slow.

If torch/transformers or the weights are unavailable, `classify` returns None
and the caller falls back to the heuristic gate — the engine degrades, it does
not break.
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Dict, Optional, Tuple

import cv2
import numpy as np

log = logging.getLogger("netra.clip_gate")

MODEL_ID = os.getenv("NETRA_CLIP_MODEL", "openai/clip-vit-base-patch32")

# Set NETRA_DISABLE_CLIP=1 to force the heuristic-only path (offline demos).
_DISABLED = os.getenv("NETRA_DISABLE_CLIP", "0") not in ("0", "false", "False")

# Probability mass on the banknote prompts above which the image is accepted.
CLIP_THRESHOLD = float(os.getenv("NETRA_CLIP_THRESHOLD", "0.55"))

# Several phrasings per concept: CLIP is sensitive to wording, and averaging
# over a prompt ensemble is markedly more stable than any single caption.
BANKNOTE_PROMPTS = [
    "a photo of an Indian rupee banknote",
    "a close-up photo of a paper currency note",
    "a photograph of money, a paper banknote lying flat",
    "a 500 rupee note from India",
    "a scanned image of a banknote with a portrait and serial number",
]

# Distractors define what "not a banknote" means. They must cover what users
# actually upload by mistake — devices, documents, people, screenshots.
DISTRACTOR_PROMPTS = [
    "a photo of a laptop computer",
    "a photo of a mobile phone",
    "a photo of a person's face",
    "a photo of a plastic credit card or debit card",
    "a screenshot of a computer screen",
    "a photo of a printed text document or a book page",
    "a photo of an identity card or passport",
    "a photo of a room, furniture or a desk",
    "a photo of food",
    "a photo of an animal",
    "a photo of a car or vehicle",
    "an abstract pattern or a blank surface",
]

_model = None
_processor = None
_text_features = None  # the prompt bank, encoded jointly with each image
_load_failed = False
_lock = threading.Lock()


def _cached_locally() -> bool:
    """True once the weights are in the HF cache, so startup can skip the hub."""
    from pathlib import Path

    cache = Path(
        os.getenv("HF_HOME", Path.home() / ".cache" / "huggingface")
    )
    slug = "models--" + MODEL_ID.replace("/", "--")
    return (cache / "hub" / slug).exists() or (cache / slug).exists()


def _load() -> bool:
    """Load CLIP and pre-encode the prompt bank. Returns False if unavailable."""
    global _model, _processor, _text_features, _load_failed
    if _model is not None:
        return True
    if _load_failed or _DISABLED:
        return False

    with _lock:
        if _model is not None:
            return True
        if _load_failed:
            return False
        try:
            import torch
            from transformers import CLIPModel, CLIPProcessor

            # Weights are cached after the first run; loading offline takes
            # ~1s versus ~100s when the hub is contacted on every startup.
            kwargs = {"local_files_only": _cached_locally()}
            model = CLIPModel.from_pretrained(MODEL_ID, **kwargs)
            model.eval()
            processor = CLIPProcessor.from_pretrained(MODEL_ID, **kwargs)

            _model, _processor = model, processor
            _text_features = BANKNOTE_PROMPTS + DISTRACTOR_PROMPTS
            log.info("CLIP gate ready (%s)", MODEL_ID)
            return True
        except Exception as exc:  # noqa: BLE001 — degrade to heuristics
            log.warning("CLIP unavailable, falling back to heuristic gate: %s", exc)
            _load_failed = True
            return False


def warm_up() -> bool:
    """Load the model ahead of the first request. Safe to call at startup."""
    return _load()


def is_available() -> bool:
    return _model is not None or (not _load_failed and not _DISABLED)


def classify(img_bgr: np.ndarray) -> Optional[Tuple[bool, float, Dict[str, float]]]:
    """Zero-shot banknote check.

    Returns (is_banknote, note_probability, top_scores) or None if the model
    could not be loaded, so the caller can fall back to heuristics.
    """
    if not _load():
        return None

    try:
        import torch
        from PIL import Image

        # CLIP wants RGB; OpenCV holds BGR.
        pil = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))

        # A single joint forward is used rather than the get_*_features
        # helpers: those changed return type in transformers v5, and
        # logits_per_image already carries CLIP's trained temperature, so the
        # softmax below is properly calibrated.
        with torch.no_grad():
            inputs = _processor(
                text=_text_features, images=pil, return_tensors="pt", padding=True
            )
            probs = _model(**inputs).logits_per_image.softmax(dim=-1)[0].tolist()

        n_note = len(BANKNOTE_PROMPTS)
        note_prob = float(sum(probs[:n_note]))

        all_prompts = BANKNOTE_PROMPTS + DISTRACTOR_PROMPTS
        ranked = sorted(zip(all_prompts, probs), key=lambda kv: kv[1], reverse=True)
        top = {label: round(float(p), 4) for label, p in ranked[:3]}

        return note_prob >= CLIP_THRESHOLD, note_prob, top
    except Exception as exc:  # noqa: BLE001
        log.warning("CLIP inference failed, falling back to heuristic gate: %s", exc)
        return None

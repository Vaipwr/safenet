import os

# KAVACH environment variables
KAVACH_LLM_PROVIDER = os.getenv("KAVACH_LLM_PROVIDER", "gemini")
KAVACH_TELEGRAM_TOKEN = os.getenv("KAVACH_TELEGRAM_TOKEN", "")

# Circuit Breaker Thresholds
CIRCUIT_BREAKER_SCORE_THRESHOLD = 0.85
CIRCUIT_BREAKER_REQUIRED_STAGE = 3

# Weights for rule scoring
STAGE_WEIGHTS = {1: 0.10, 2: 0.20, 3: 0.35, 4: 0.20, 5: 0.15}
SEQUENCE_BONUS = 0.15

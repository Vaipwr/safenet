import os

# Prefix env vars with NETRA_
NETRA_MODEL_PATH = os.getenv("NETRA_MODEL_PATH", "modules/netra/models/yolov8n_cls.pt")
NETRA_CONF_THRESHOLD = float(os.getenv("NETRA_CONF_THRESHOLD", "0.5"))
NETRA_SHARPNESS_THRESHOLD = float(os.getenv("NETRA_SHARPNESS_THRESHOLD", "100.0"))

# RBI banknote sizes (width / height)
# 500: 150mm x 66mm = 2.2727
# 100: 142mm x 66mm = 2.1515
# 200: 146mm x 66mm = 2.2121
# 50: 135mm x 66mm = 2.0454
# 20: 129mm x 63mm = 2.0476
# 10: 123mm x 63mm = 1.9523
ASPECT_RATIOS = {
    "500": 150.0 / 66.0,
    "100": 142.0 / 66.0,
    "200": 146.0 / 66.0,
    "50": 135.0 / 66.0,
    "20": 129.0 / 63.0,
    "10": 123.0 / 63.0,
    500: 150.0 / 66.0,
    100: 142.0 / 66.0,
    200: 146.0 / 66.0,
    50: 135.0 / 66.0,
    20: 129.0 / 63.0,
    10: 123.0 / 63.0,
}

FEATURE_WEIGHTS = {
    "ASPECT_RATIO": 0.15,
    "PRINT_SHARPNESS": 0.25,
    "MICRO_LETTERING": 0.20,
    "SECURITY_THREAD": 0.20,
    "COLOUR_PROFILE": 0.10,
    "SERIAL_FORMAT": 0.10,
}

# SQLite database path
DATABASE_PATH = os.getenv("NETRA_DB_PATH", "modules/netra/serial_store.db")

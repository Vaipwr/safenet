# KAVACH - Digital Arrest Circuit Breaker

This module analyzes call transcripts to detect digital arrest scams and breaks the isolation stage by triggering a family alert.

## How to Run

1. Create a `.env` file (see `.env.example` if applicable, or use environment variables).
2. Install dependencies: `pip install -r modules/kavach/requirements.txt`
3. Run the demo: `python -m prahari.modules.kavach.demo --transcript prahari/modules/kavach/samples/scam_full_ladder_hi.txt`

## Endpoints
- `GET /api/kavach/health`
- `POST /api/kavach/analyze`
- `POST /api/kavach/stream-chunk`
- `POST /api/kavach/register-contact`
- `POST /api/kavach/trigger-alert`
- `GET /api/kavach/session/{session_id}`

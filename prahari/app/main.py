"""
PRAHARI — integration app.

Mounts each module's APIRouter behind one FastAPI app. Modules are optional:
if a module folder is absent (or its heavy deps aren't installed yet), the app
still starts and simply skips it. Every module still owns 100% of its own code
under modules/<name>/ — this file only wires the routers together.

Run:
    cd prahari
    uvicorn app.main:app --reload --port 8000
Docs:  http://127.0.0.1:8000/docs
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

log = logging.getLogger("prahari")

# Load the repo-root .env before any module reads os.getenv. The backend runs
# from prahari/ while .env lives one level up next to package.json (the Node
# server loads it from there too), so without this the API keys configured for
# the project would be invisible to Python and cloud features would silently
# stay disabled.
try:
    from pathlib import Path

    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parents[2] / ".env")
except Exception as exc:  # noqa: BLE001 — env file is optional
    log.warning("Could not load .env (%s); relying on process environment", exc)

app = FastAPI(
    title="PRAHARI — AI for Digital Public Safety",
    description="One entity graph. Five sensors.",
    version="0.1.0",
)

# The frontend (Vite dev server) calls these endpoints from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["platform"])
def health():
    return {"status": "ok", "service": "prahari", "modules": _mounted}


# ---------------------------------------------------------------------------
# Mount modules. Each is independent; a failure to import one must not stop the
# others (e.g. NETRA needs opencv; other modules may not be present yet).
# ---------------------------------------------------------------------------
_mounted: list[str] = []


def _mount(name: str, import_path: str) -> None:
    try:
        module = __import__(import_path, fromlist=["router"])
        app.include_router(module.router)
        _mounted.append(name)
        log.info("Mounted module: %s", name)
    except Exception as exc:  # noqa: BLE001 — one bad module must not kill the app
        log.warning("Skipping module '%s' (%s)", name, exc)


_mount("netra", "modules.netra.router")
# Future teammates: _mount("kavach", "modules.kavach.router") etc.

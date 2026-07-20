import base64
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from contracts.events import PrahariEvent, Verdict
from modules.netra import service
from modules.netra import serial_store

router = APIRouter(prefix="/api/netra", tags=["netra"])

class ScanBase64Request(BaseModel):
    image_b64: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    district: Optional[str] = None
    state: Optional[str] = None

@router.get("/health")
def health():
    return {
        "status": "ok",
        "model_version": "v1.0.0"
    }

@router.post("/scan", response_model=PrahariEvent)
async def scan(
    image: UploadFile = File(...),
    lat: Optional[float] = Form(None),
    lon: Optional[float] = Form(None),
    district: Optional[str] = Form(None),
    state: Optional[str] = Form(None)
):
    try:
        image_bytes = await image.read()
        event = service.process_note_scan(
            image_bytes=image_bytes,
            filename_hint=image.filename or "",
            lat=lat,
            lon=lon,
            district=district,
            state=state
        )
        # Update event ID in database if logged
        if event.verdict == Verdict.SUSPECT and event.entities:
            # Update the logged entry with the real event ID
            serial_no = event.entities[0].value
            # We can associate the event_id in the db
            conn = serial_store.sqlite3.connect(serial_store.DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE serials SET event_id = ? WHERE serial = ? AND event_id = ''",
                (event.event_id, serial_no)
            )
            conn.commit()
            conn.close()
            
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.post("/scan-base64", response_model=PrahariEvent)
def scan_base64(request: ScanBase64Request):
    try:
        image_b64 = request.image_b64
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
        
        image_bytes = base64.b64decode(image_b64)
        event = service.process_note_scan(
            image_bytes=image_bytes,
            filename_hint="",
            lat=request.lat,
            lon=request.lon,
            district=request.district,
            state=request.state
        )
        
        # Update event ID in database if logged
        if event.verdict == Verdict.SUSPECT and event.entities:
            serial_no = event.entities[0].value
            conn = serial_store.sqlite3.connect(serial_store.DATABASE_PATH)
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE serials SET event_id = ? WHERE serial = ? AND event_id = ''",
                (event.event_id, serial_no)
            )
            conn.commit()
            conn.close()
            
        return event
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Base64 scan failed: {str(e)}")

@router.get("/serial/{serial}")
def get_serial(serial: str):
    norm_serial = serial.strip().replace(" ", "").upper()
    history = serial_store.get_serial_history(norm_serial)
    return history

@router.get("/seizures", response_model=List[PrahariEvent])
def get_seizures():
    # Return PrahariEvent stubs for all logged seizures
    # Under real conditions, we query PrahariEvents database, but here we query the local serials table
    seizures = serial_store.get_all_suspect_seizures()
    events = []
    for s in seizures:
        # Reconstruct a basic PrahariEvent for mapping/display
        events.append(PrahariEvent(
            event_id=s["event_id"],
            source_module=service.SourceModule.NETRA,
            timestamp=service.datetime.fromisoformat(s["timestamp"]) if s["timestamp"] else service.datetime.now(service.timezone.utc),
            entities=[
                service.Entity(type=service.EntityType.SERIAL, value=s["serial"], confidence=1.0),
                service.Entity(type=service.EntityType.GEO, value=f"{s['lat']},{s['lon']}", confidence=1.0)
            ],
            geo=service.GeoPoint(lat=s["lat"], lon=s["lon"], district=s["district"]),
            risk_score=0.95,
            risk_band=service.RiskBand.CRITICAL,
            confidence=1.0,
            verdict=Verdict.SUSPECT,
            explanation=f"Counterfeit banknote seizure linked to serial {s['serial']} in {s['district']}."
        ))
    return events

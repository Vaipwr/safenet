import sqlite3
import os
from datetime import datetime, timezone
from typing import List, Dict, Any
from modules.netra.config import DATABASE_PATH

def init_db():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS serials (
            serial TEXT,
            event_id TEXT,
            lat REAL,
            lon REAL,
            district TEXT,
            ts TEXT
        )
    """)
    conn.commit()
    conn.close()

def add_seizure(serial: str, event_id: str, lat: float, lon: float, district: str) -> int:
    """
    Inserts a seizure record, and returns the total occurrence count of this serial.
    """
    init_db()
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Check current count before inserting
    cursor.execute("SELECT COUNT(*) FROM serials WHERE serial = ?", (serial,))
    count = cursor.fetchone()[0]
    
    # Insert new record
    ts = datetime.now(timezone.utc).isoformat()
    cursor.execute(
        "INSERT INTO serials (serial, event_id, lat, lon, district, ts) VALUES (?, ?, ?, ?, ?, ?)",
        (serial, event_id, lat, lon, district, ts)
    )
    conn.commit()
    conn.close()
    
    # Return count including the one just inserted
    return count + 1

def get_serial_history(serial: str) -> Dict[str, Any]:
    """
    Returns the occurrence count and list of prior locations/events for a serial.
    """
    init_db()
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(
        "SELECT event_id, lat, lon, district, ts FROM serials WHERE serial = ? ORDER BY ts DESC",
        (serial,)
    )
    rows = cursor.fetchall()
    conn.close()
    
    locations = []
    for r in rows:
        locations.append({
            "event_id": r["event_id"],
            "lat": r["lat"],
            "lon": r["lon"],
            "district": r["district"],
            "timestamp": r["ts"]
        })
        
    return {
        "serial": serial,
        "seen_count": len(locations),
        "locations": locations
    }

def get_all_suspect_seizures() -> List[Dict[str, Any]]:
    """
    Returns all logged seizures.
    """
    init_db()
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT serial, event_id, lat, lon, district, ts FROM serials ORDER BY ts DESC")
    rows = cursor.fetchall()
    conn.close()
    
    seizures = []
    for r in rows:
        seizures.append({
            "serial": r["serial"],
            "event_id": r["event_id"],
            "lat": r["lat"],
            "lon": r["lon"],
            "district": r["district"],
            "timestamp": r["ts"]
        })
    return seizures

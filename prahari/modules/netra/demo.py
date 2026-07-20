import argparse
import os
import json
import sys

# Windows consoles default to cp1252 and cannot print the rupee sign (₹).
# Force UTF-8 so the report renders on every platform.
try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except (AttributeError, ValueError):
    pass

# Ensure parent directory (prahari/) is in sys.path so we can import 'contracts' and 'modules'
# when run from anywhere
current_dir = os.path.dirname(os.path.abspath(__file__))
# current_dir = .../prahari/modules/netra
# parent_dir = .../prahari
parent_dir = os.path.dirname(os.path.dirname(current_dir))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from modules.netra import service
from contracts.events import PrahariEvent

def main():
    parser = argparse.ArgumentParser(description="Standalone CLI Runner for Module 1 (NETRA) Currency CV")
    parser.add_argument(
        "--image", 
        type=str, 
        required=True, 
        help="Path to the banknote image file"
    )
    parser.add_argument(
        "--lat", 
        type=float, 
        default=28.6139, 
        help="Latitude coordinates (default: New Delhi)"
    )
    parser.add_argument(
        "--lon", 
        type=float, 
        default=77.2090, 
        help="Longitude coordinates (default: New Delhi)"
    )
    parser.add_argument(
        "--district", 
        type=str, 
        default="New Delhi NCR", 
        help="District location name"
    )
    parser.add_argument(
        "--state", 
        type=str, 
        default="Delhi", 
        help="State name"
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.image):
        print(f"Error: Image file not found at '{args.image}'")
        sys.exit(1)
        
    print(f"[*] Loading image: {args.image}")
    try:
        with open(args.image, "rb") as f:
            image_bytes = f.read()
    except Exception as e:
        print(f"Error: Could not read image file: {str(e)}")
        sys.exit(1)
        
    print("[*] Processing banknote analysis pipeline...")
    event: PrahariEvent = service.process_note_scan(
        image_bytes=image_bytes,
        filename_hint=os.path.basename(args.image),
        lat=args.lat,
        lon=args.lon,
        district=args.district,
        state=args.state
    )
    
    print("\n" + "="*50)
    print("           NETRA FORENSIC SCAN REPORT")
    print("="*50)
    print(f"Event ID:      {event.event_id}")
    print(f"Source:        {event.source_module.value.upper()}")
    print(f"Timestamp:     {event.timestamp.isoformat()}")
    print(f"Verdict:       {event.verdict.value.upper()}")
    print(f"Risk Score:    {event.risk_score:.2f} ({event.risk_band.value.upper()})")
    print(f"Confidence:    {event.confidence:.2f}")
    print(f"Explanation:   {event.explanation}")
    
    print("\n--- Entities ---")
    for entity in event.entities:
        print(f"  [{entity.type.value}] {entity.value} (conf: {entity.confidence})")
        
    print("\n--- Security Findings ---")
    for f in event.findings:
        status_str = "PASS" if f.passed is True else ("FAIL" if f.passed is False else "INCONCLUSIVE")
        color_code = "\033[92m" if f.passed is True else ("\033[91m" if f.passed is False else "\033[93m")
        reset_code = "\033[0m"
        print(f"  - {f.label:<30} {color_code}[{status_str}]{reset_code} (score: {f.score:.2f})")
        print(f"    Detail: {f.detail}")
        
    print("\n--- Raw Data ---")
    print(json.dumps(event.raw, indent=2))
    print("="*50)

if __name__ == "__main__":
    main()

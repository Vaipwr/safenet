import argparse
import asyncio
import json
from pathlib import Path
from prahari.modules.kavach.service import analyze_transcript

async def main():
    parser = argparse.ArgumentParser(description="KAVACH Module Demo")
    parser.add_argument("--transcript", required=True, help="Path to transcript file")
    parser.add_argument("--language", default="hi", help="Language of transcript (default: hi)")
    parser.add_argument("--caller", default="+919876543210", help="Caller phone number")
    args = parser.parse_args()

    transcript_path = Path(args.transcript)
    if not transcript_path.exists():
        print(f"Error: File not found: {transcript_path}")
        return

    transcript_text = transcript_path.read_text(encoding="utf-8")
    
    print(f"Analyzing transcript: {transcript_path.name}...")
    
    event = await analyze_transcript(transcript_text, args.language, args.caller)
    
    print("\n--- PRAHARI EVENT ---")
    try:
        print(event.model_dump_json(indent=2))
    except UnicodeEncodeError:
        print(event.model_dump_json(indent=2).encode('utf-8', 'replace').decode('utf-8', 'replace'))
    
    if event.raw.get("circuit_breaker_fired"):
        print("\n🚨 CIRCUIT BREAKER FIRED 🚨")
        print("Interrupt Payload:")
        payload_str = json.dumps(event.raw.get("interrupt_payload", {}), indent=2, ensure_ascii=False)
        try:
            print(payload_str)
        except UnicodeEncodeError:
            print(payload_str.encode('utf-8', 'replace').decode('utf-8', 'replace'))

if __name__ == "__main__":
    asyncio.run(main())

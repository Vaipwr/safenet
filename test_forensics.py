import base64
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from prahari.modules.currency.forensics import analyze_banknote_image

def test_forensics():
    image_path = r"c:\Users\Vaibhavi\Downloads\currency\Test\5Hundrednote\1.jpg"
    with open(image_path, "rb") as f:
        image_data = f.read()
    
    base64_str = base64.b64encode(image_data).decode("utf-8")
    result = analyze_banknote_image(base64_str)
    
    print("Detected Serial No:", result["serialNo"])
    print("Is Valid:", result["isValid"])
    print("Confidence:", result["confidence"])
    print("Mismatch Reason:", result["mismatchReason"])
    print("Audit Log:")
    for log in result["auditLog"]:
        print(" -", log)
    print("Features:")
    for feat in result["features"]:
        print(f" - {feat['name']}: {feat['status']} ({feat['detail']})")

if __name__ == "__main__":
    test_forensics()

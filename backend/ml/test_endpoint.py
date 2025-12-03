import requests
import json

url = "http://localhost:8000/train"

print("Testing ML training endpoint...")
try:
    response = requests.post(url, timeout=30)
    print(f"Status: {response.status_code}")
    print(f"Headers: {response.headers.get('content-type')}")
    print(f"Raw Response: {response.text[:500]}")
    
    if response.status_code == 200:
        print(f"\n✓ SUCCESS!\n{json.dumps(response.json(), indent=2)}")
    else:
        print(f"\n✗ ERROR {response.status_code}")
        print(response.text)
except requests.exceptions.Timeout:
    print("Request timed out (ML processing takes time)")
except Exception as e:
    print(f"Error: {type(e).__name__}: {e}")

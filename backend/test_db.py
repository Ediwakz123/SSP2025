import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

print(f"CWD: {os.getcwd()}")
print(f"URL: {url}")
print(f"Key: {key[:10]}...{key[-5:]}")

supabase: Client = create_client(url, key)

print("Testing connection to business_raw...")
try:
    response = supabase.table("business_raw").select("*").limit(1).execute()
    print("Success!")
    print(response)
except Exception as e:
    print(f"Error: {e}")

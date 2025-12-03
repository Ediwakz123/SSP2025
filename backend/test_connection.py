import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to: {url}")
supabase: Client = create_client(url, key)

try:
    print("Attempting to select from business_raw...")
    response = supabase.table("business_raw").select("*", count="exact").limit(1).execute()
    print("Success!")
    print(response)
except Exception as e:
    print("Error:")
    print(e)

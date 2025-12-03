import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(override=True)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

print("Checking profiles table...")
try:
    response = supabase.table("profiles").select("*").limit(1).execute()
    print("✅ Profiles table exists.")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"❌ Error accessing profiles table: {e}")

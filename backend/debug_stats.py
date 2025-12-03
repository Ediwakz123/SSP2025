import os
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import Counter

load_dotenv(override=True)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Connecting to: {url}")
supabase: Client = create_client(url, key)

try:
    print("Fetching categories and zones...")
    response = supabase.table("business_raw").select("general_category, zone_type").execute()
    
    data = response.data
    print(f"Total rows fetched: {len(data)}")
    
    categories = [row['general_category'] for row in data]
    zones = [row['zone_type'] for row in data]
    
    unique_categories = set(categories)
    unique_zones = set(zones)
    
    print(f"\nUnique Categories Count: {len(unique_categories)}")
    print("Categories:", unique_categories)
    
    print(f"\nUnique Zones Count: {len(unique_zones)}")
    print("Zones:", unique_zones)
    
    if len(unique_categories) > 10:
        print("\n⚠️  Too many categories! Showing first 10:")
        print(list(unique_categories)[:10])
        
    if len(unique_zones) > 10:
        print("\n⚠️  Too many zones! Showing first 10:")
        print(list(unique_zones)[:10])

except Exception as e:
    print("Error:")
    print(e)

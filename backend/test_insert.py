import os
from supabase import create_client, Client
from dotenv import load_dotenv
import time

load_dotenv(override=True)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(url, key)

test_id = 99999
test_data = {
    'business_id': test_id,
    'business_name': 'TEST_NAME',
    'general_category': 'TEST_CAT',
    'latitude': 1.1,
    'longitude': 2.2,
    'street': 'TEST_STREET',
    'zone_type': 'TEST_ZONE',
    'status': 'active'
}

print("Inserting test data...")
try:
    # Delete if exists
    supabase.table("business_raw").delete().eq("business_id", test_id).execute()
    
    # Insert
    supabase.table("business_raw").insert(test_data).execute()
    print("Insert successful.")
    
    # Fetch back
    print("Fetching back...")
    response = supabase.table("business_raw").select("*").eq("business_id", test_id).execute()
    
    if response.data:
        row = response.data[0]
        print("\nFetched Row:")
        print(row)
        
        # Verify
        if row['business_name'] == 'TEST_NAME' and row['general_category'] == 'TEST_CAT':
            print("\n✅ Mapping is CORRECT.")
        else:
            print("\n❌ Mapping is INCORRECT.")
            print(f"Expected business_name='TEST_NAME', got '{row.get('business_name')}'")
            print(f"Expected general_category='TEST_CAT', got '{row.get('general_category')}'")
            
    else:
        print("❌ Could not fetch row.")

except Exception as e:
    print(f"Error: {e}")

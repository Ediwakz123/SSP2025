#!/usr/bin/env python3
"""
Import CSV data to Supabase business_raw table.

This script reads rawbusinessdata.csv and imports all businesses into Supabase.
It handles category normalization and clears existing data before import.
"""

import csv
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

# Initialize Supabase client (using service role key to bypass RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def clear_existing_data():
    """Clear all existing data from business_raw table."""
    print("Clearing existing data from business_raw table...")
    try:
        result = supabase.table("business_raw").delete().neq("business_id", 0).execute()
        print("Existing data cleared successfully")
    except Exception as e:
        print(f"Warning: Could not clear existing data: {e}")
        print("   (Table might be empty, continuing...)")

def normalize_category(category: str) -> str:
    """
    Normalize category names to handle spelling variations.
    """
    category = category.strip()
    
    # Handle "Merchandising / Trading" -> "Merchandise / Trading"
    if "merchandising" in category.lower():
        return "Merchandise / Trading"
    
    # Handle "Food and Beverages" -> "Food & Beverages"
    if "food" in category.lower() and "beverage" in category.lower():
        return "Food & Beverages"
    
    return category

def import_csv_data(csv_file: str):
    """Import businesses from CSV file to Supabase."""
    print(f"Reading CSV file: {csv_file}")
    
    businesses = []
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        first_row = True
        for row in reader:
            if first_row:
                print("\nDEBUG: First row raw data:")
                print(row)
                first_row = False

            # Normalize category
            category = normalize_category(row['general_category'])
            
            business = {
                'business_id': int(row['business_id']),
                'business_name': row['business_name'].strip(),
                'general_category': category,
                'latitude': float(row['latitude']),
                'longitude': float(row['longitude']),
                'street': row['street'].strip(),
                'zone_type': row['zone_type'].strip(),
                'status': row['status'].strip().lower(),  # normalize to lowercase
            }
            
            if len(businesses) == 0:
                print("\nDEBUG: First constructed business object:")
                print(business)
                
            businesses.append(business)
    
    print(f"Found {len(businesses)} businesses to import")
    
    # Display category distribution
    from collections import Counter
    categories = [b['general_category'] for b in businesses]
    category_counts = Counter(categories)
    print("\nCategory Distribution:")
    for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
        print(f"   {cat}: {count}")
    print()
    
    # Import in batches (Supabase has limits)
    BATCH_SIZE = 100
    total_imported = 0
    
    for i in range(0, len(businesses), BATCH_SIZE):
        batch = businesses[i:i + BATCH_SIZE]
        print(f"Importing batch {i//BATCH_SIZE + 1} ({len(batch)} businesses)...")
        
        try:
            result = supabase.table("business_raw").insert(batch).execute()
            total_imported += len(batch)
            print(f"   Batch imported successfully")
        except Exception as e:
            print(f"   Error importing batch: {e}")
            raise
    
    print(f"\nImport complete! Total businesses imported: {total_imported}")
    return total_imported

def verify_import():
    """Verify the import was successful."""
    print("\nVerifying import...")
    
    try:
        # Count total businesses
        result = supabase.table("business_raw").select("*", count="exact").execute()
        total_count = result.count
        print(f"Total businesses in database: {total_count}")
        
        # Get category distribution
        all_data = supabase.table("business_raw").select("general_category").execute()
        from collections import Counter
        categories = [row['general_category'] for row in all_data.data]
        category_counts = Counter(categories)
        
        print(f"Unique categories: {len(category_counts)}")
        print("\nCategory counts in database:")
        for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
            print(f"   {cat}: {count}")
        
        return total_count == 100
    except Exception as e:
        print(f"Verification error: {e}")
        return False

def main():
    """Main import process."""
    with open("import_log.txt", "w", encoding="utf-8") as log_file:
        def log(msg):
            print(msg)
            try:
                log_file.write(msg + "\n")
            except:
                pass

        log("=" * 70)
        log("CSV TO SUPABASE IMPORT SCRIPT")
        log("=" * 70)
        log("")
        
        csv_file = "rawbusinessdata.csv"
        
        if not os.path.exists(csv_file):
            log(f"Error: CSV file not found: {csv_file}")
            exit(1)
        
        try:
            # Step 1: Clear existing data
            log("Clearing existing data from business_raw table...")
            try:
                result = supabase.table("business_raw").delete().neq("business_id", 0).execute()
                log("Existing data cleared successfully")
            except Exception as e:
                log(f"Warning: Could not clear existing data: {e}")
                log("   (Table might be empty, continuing...)")
            log("")
            
            # Step 2: Import CSV data
            # Inline import_csv_data logic to use the log function
            log(f"Reading CSV file: {csv_file}")
            
            businesses = []
            with open(csv_file, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                first_row = True
                for row in reader:
                    if first_row:
                        print("\nDEBUG: First row raw data:")
                        print(row)
                        first_row = False
        
                    # Normalize category
                    category = normalize_category(row['general_category'])
                    
                    business = {
                        'business_id': int(row['business_id']),
                        'business_name': row['business_name'].strip(),
                        'general_category': category,
                        'latitude': float(row['latitude']),
                        'longitude': float(row['longitude']),
                        'street': row['street'].strip(),
                        'zone_type': row['zone_type'].strip(),
                        'status': row['status'].strip().lower(),  # normalize to lowercase
                    }
                    
                    if len(businesses) == 0:
                        print("\nDEBUG: First constructed business object:")
                        print(business)
                        
                    businesses.append(business)
            
            log(f"Found {len(businesses)} businesses to import")
            
            # Display category distribution
            from collections import Counter
            categories = [b['general_category'] for b in businesses]
            category_counts = Counter(categories)
            log("\nCategory Distribution:")
            for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
                log(f"   {cat}: {count}")
            log("")
            
            # Import in batches (Supabase has limits)
            BATCH_SIZE = 100
            total_imported = 0
            
            for i in range(0, len(businesses), BATCH_SIZE):
                batch = businesses[i:i + BATCH_SIZE]
                log(f"Importing batch {i//BATCH_SIZE + 1} ({len(batch)} businesses)...")
                
                try:
                    result = supabase.table("business_raw").insert(batch).execute()
                    total_imported += len(batch)
                    log(f"   Batch imported successfully")
                except Exception as e:
                    log(f"   Error importing batch: {e}")
                    raise
            
            log(f"\nImport complete! Total businesses imported: {total_imported}")
            
            # Step 3: Verify import
            log("\nVerifying import...")
            try:
                # Count total businesses
                result = supabase.table("business_raw").select("*", count="exact").execute()
                total_count = result.count
                log(f"Total businesses in database: {total_count}")
                
                # Get category distribution
                all_data = supabase.table("business_raw").select("general_category").execute()
                categories = [row['general_category'] for row in all_data.data]
                category_counts = Counter(categories)
                
                log(f"Unique categories: {len(category_counts)}")
                log("\nCategory counts in database:")
                for cat, count in sorted(category_counts.items(), key=lambda x: -x[1]):
                    log(f"   {cat}: {count}")
                
                verified = total_count == 100
            except Exception as e:
                log(f"Verification error: {e}")
                verified = False
            
            log("")
            log("=" * 70)
            if verified:
                log("IMPORT SUCCESSFUL!")
            else:
                log("IMPORT COMPLETED WITH WARNINGS")
            log("=" * 70)
            
        except Exception as e:
            log("")
            log("=" * 70)
            log(f"IMPORT FAILED: {e}")
            log("=" * 70)
            exit(1)

if __name__ == "__main__":
    main()

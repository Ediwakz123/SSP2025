import csv
from collections import Counter

# Read CSV file
with open('backend/rawbusinessdata.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    data = list(reader)

# Extract and normalize categories
categories = []
for row in data:
    if row.get('general_category'):
        cat = row['general_category'].strip()
        categories.append(cat)

# Count occurrences
count_dict = Counter(categories)

# Valid categories from user
valid_categories = [
    "Entertainment / Leisure",
    "Retail",
    "Merchandise / Trading",
    "Restaurant",
    "Misc (Custom Category)",
    "Food & Beverages"
]

print("=" * 70)
print("BUSINESS COUNT BY CATEGORY (from rawbusinessdata.csv)")
print("=" * 70)
print()

# Print all unique categories found with counts
for category in sorted(count_dict.keys()):
    count = count_dict[category]
    print(f"{category:50s} : {count:3d}")

print()
print("=" * 70)
print(f"TOTAL BUSINESSES: {sum(count_dict.values())}")
print("=" * 70)

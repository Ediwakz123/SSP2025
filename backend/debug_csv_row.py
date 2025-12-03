import csv

csv_file = "rawbusinessdata.csv"
print(f"📂 Reading CSV file: {csv_file}")

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    print("Header:", reader.fieldnames)
    for row in reader:
        print("\n🔍 DEBUG: First row raw data:")
        print(row)
        break

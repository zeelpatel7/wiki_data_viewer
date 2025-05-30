import csv
import json

csv_file = "matched_links.csv"       
json_file = "matched_links.json"     

mapping = {}

with open(csv_file, newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        original = row["Missing File"].strip()
        matched = row["Matched File"].strip()
        mapping[original] = matched

# Save JSON
with open(json_file, "w", encoding='utf-8') as f:
    json.dump(mapping, f, indent=2)

print(f"Saved {len(mapping)} mappings to {json_file}")

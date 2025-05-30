import os
import urllib.parse
from difflib import get_close_matches
import csv

# Paths
missing_file_path = "missing_links.txt"
new_files_dir = os.path.join("files", "new files")

# Load missing filenames and decode them
with open(missing_file_path, "r", encoding="utf-8") as f:
    missing_files = [urllib.parse.unquote(line.strip()) for line in f if line.strip()]

# List of actual files in new files folder
available_files = os.listdir(new_files_dir)

# Result dictionary
matches = []

for missing in missing_files:
    # Try matching without extension to be more flexible
    missing_base = os.path.splitext(missing)[0].lower()
    candidates = [os.path.splitext(f)[0].lower() for f in available_files]

    close = get_close_matches(missing_base, candidates, n=1, cutoff=0.6)

    if close:
        # Recover actual filename (with extension)
        match_index = candidates.index(close[0])
        match_file = available_files[match_index]
        matches.append((missing, match_file))
    else:
        matches.append((missing, "NOT FOUND"))

# Write output to CSV
with open("matched_links.csv", "w", newline='', encoding="utf-8") as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(["Missing File", "Matched File"])
    writer.writerows(matches)

print(f"Matching complete. Results saved to matched_links.csv")

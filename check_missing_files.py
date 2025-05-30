import os
import re
import openpyxl

# === CONFIG ===
excel_path = "Wiki_AH.xlsx"
sheet_name = "All Tests"
folder_path = "./files"  # Relative path to your files folder

# === STEP 1: Load workbook ===
wb = openpyxl.load_workbook(excel_path, data_only=True)
ws = wb[sheet_name]

# === STEP 2: Extract filenames from hyperlinks ===
linked_files = set()

for row in ws.iter_rows():
    for cell in row:
        if cell.value == "⓪" and cell.hyperlink:
            match = re.search(r'fileName=([^&]+)', cell.hyperlink.target)
            if match:
                filename = match.group(1)
                linked_files.add(filename)

# === STEP 3: Compare to existing files ===
existing_files = set(os.listdir(folder_path))
missing_files = sorted(f for f in linked_files if f not in existing_files)

# === STEP 4: Output results ===
print("Missing Files:")
if missing_files:
    for f in missing_files:
        print(f" - {f}")
else:
    print("All linked files are present!")

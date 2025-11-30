#!/bin/bash

# Ensure the script exits on error
set -e

# Run the Python script
python3 - << 'PY'
import csv
import os
import sys

# Configuration
csv_path = "context/sources/glossary.csv"
output_path = "content/10_glossary/index.md"

# Check input
if not os.path.exists(csv_path):
    print(f"Error: Input file not found at {csv_path}")
    sys.exit(1)

# Ensure output directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

def clean_text(text):
    if text is None:
        return ""
    return text.strip()

try:
    with open(csv_path, 'r', encoding='utf-8-sig') as f_in:
        reader = csv.DictReader(f_in)
        
        # Filter out rows with no term and sort by Term
        rows = [r for r in reader if r.get('Term') and clean_text(r.get('Term'))]
        rows.sort(key=lambda x: clean_text(x['Term']).lower())

        with open(output_path, 'w', encoding='utf-8') as f_out:
            f_out.write("# Glossary\n\n")
            f_out.write("Definitions of terms used throughout the CoMapeo documentation.\n\n")
            
            for row in rows:
                term = clean_text(row.get('Term'))
                definition = clean_text(row.get('Definition'))
                used_by = clean_text(row.get('used by'))
                contexts = clean_text(row.get('contexts used'))
                related = clean_text(row.get('Related terms'))
                
                f_out.write(f"## {term}\n\n")
                
                if definition:
                    f_out.write(f"{definition}\n\n")
                
                # Optional metadata fields
                meta = []
                if used_by:
                    meta.append(f"**Used by:** {used_by}")
                if contexts:
                    meta.append(f"**Contexts:** {contexts}")
                if related:
                    meta.append(f"**Related terms:** {related}")
                
                if meta:
                    f_out.write("\n".join(meta) + "\n\n")

                f_out.write("---\n\n")

    print(f"Successfully generated glossary at {output_path}")

except Exception as e:
    print(f"An error occurred: {e}")
    sys.exit(1)
PY

import os
import re
import argparse
from pathlib import Path

def parse_sd_file(sd_path):
    """Parse an SD file to get mean/SD for each gene ID."""
    sd_data = {}
    current_gene = None

    with open(sd_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                current_gene = line.split()[0].lstrip(">")
            elif line.startswith("MEAN") and current_gene:
                match = re.search(r"MEAN\s*::\s*([\d.]+).*SD\s*::\s*([\d.]+)", line)
                if match:
                    mean, sd = map(float, match.groups())
                    sd_data[current_gene] = (mean, sd)
                    current_gene = None
    return sd_data

def compute_zscore(mean, sd, value):
    return (value - mean) / sd if sd != 0 else 0.0

def process_valid_file(valid_path, sd_dir):
    zsco_lines = []
    current_gene_line = ""
    current_motif = ""
    valval = {}

    with open(valid_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith(">"):
                current_gene_line = line
            elif line.startswith("****"):
                current_motif = line.replace("****", "").strip()
            elif line.startswith("FORWARD") or line.startswith("REVERSE"):
                parts = re.split(r'\s+', line)
                if len(parts) >= 5:
                    key = f"{current_motif}\t{current_gene_line}"
                    valval.setdefault(key, []).append({
                        "orientation": parts[0],
                        "sequence": parts[1],
                        "position": parts[2],
                        "region": parts[3],
                        "score": float(parts[4]) if re.match(r"^\d+(\.\d+)?$", parts[4]) else None
                    })

    for key, entries in valval.items():
        motif, gene_line = key.split("\t")
        gene_id = gene_line.split()[0].lstrip(">")

        sd_path = os.path.join(sd_dir, f"{motif}.sd")
        if not os.path.isfile(sd_path):
            continue

        sd_data = parse_sd_file(sd_path)
        if gene_id not in sd_data:
            continue

        mean, sd = sd_data[gene_id]

        zsco_lines.append(f"{gene_line} ||||  {motif}")
        for e in entries:
            if e["score"] is not None:
                z = compute_zscore(mean, sd, e["score"])
                zsco_lines.append(f"Z-SCORE ::{z:.4f}\t{e['position']}\t\t{e['region']}\t {e['orientation']} \t {e['sequence']}")
        zsco_lines.append("")  # Blank line between blocks

    return zsco_lines

def main(valid_dir, sd_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    valid_files = [f for f in os.listdir(valid_dir) if "_valid.outout" in f]

    for vf in valid_files:
        gene_id = vf.split("_valid.outout")[0]
        input_path = os.path.join(valid_dir, vf)
        output_path = os.path.join(output_dir, f"{gene_id}.zsco")

        lines = process_valid_file(input_path, sd_dir)

        with open(output_path, "w") as out_f:
            out_f.write("\n".join(lines))

    print(f"✅ Processed {len(valid_files)} valid.outout files into .zsco files.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert *_valid.outout files to .zsco format using SD scores")
    parser.add_argument("valid_dir", help="Directory containing *_valid.outout files")
    parser.add_argument("sd_dir", help="Directory containing .sd files")
    parser.add_argument("output_dir", help="Directory to write output .zsco files")
    args = parser.parse_args()

    main(args.valid_dir, args.sd_dir, args.output_dir)

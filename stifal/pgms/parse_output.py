import re
import argparse

def parse_normal_output(input_file, output_file):
    with open(input_file, "r") as infile, open(output_file, "w") as outfile:
        # Write header
        outfile.write("Gene ID\tTranscription factor\tZ-score\tStart\tEnd\tOrientation\n")

        gene_id = ""
        tf_name = ""

        for line in infile:
            line = line.strip()

            if line.startswith(">"):
                parts = line[1:].split("||||")
                gene_id = parts[0].split("|")[0].strip()
                tf_name = parts[1].strip()
            elif line.startswith("Z-SCORE"):
                match = re.search(r"Z-SCORE\s+([0-9.]+)\s+\d+-\d+\s+(-?\d+)to(-?\d+)\s+(FORWARD|REVERSE)", line)
                if match:
                    zscore = match.group(1)
                    start = match.group(2)
                    end = match.group(3)
                    orientation = match.group(4)
                    outfile.write(f"{gene_id}\t{tf_name}\t{zscore}\t{start}\t{end}\t{orientation}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse normal.output and convert to TSV format.")
    parser.add_argument("input_file", help="Path to the normal.output file")
    parser.add_argument("output_file", help="Path to the output TSV file")

    args = parser.parse_args()
    parse_normal_output(args.input_file, args.output_file)

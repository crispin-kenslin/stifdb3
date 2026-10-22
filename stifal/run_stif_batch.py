import argparse
import shutil
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from Bio import SeqIO

def split_multifasta(multifasta_path, output_dir):
    output_dir.mkdir(parents=True, exist_ok=True)
    fasta_files = []
    
    for record in SeqIO.parse(multifasta_path, "fasta"):
        out_path = output_dir / f"{record.id}.fasta"
        SeqIO.write(record, out_path, "fasta")
        fasta_files.append(out_path)
    
    return fasta_files

def run_stif_for_file(fasta_file: Path, stif_root: Path, bash_wrapper: Path, output_file: Path):
    gene_id = fasta_file.stem
    working_dir = stif_root / f"working_dir_{gene_id}"
    working_dir.mkdir(parents=True, exist_ok=True)

    try:
        command = [
            "bash",
            str(bash_wrapper),
            str(stif_root),
            str(fasta_file),
            str(working_dir),
            str(output_file)
        ]
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] STIF failed for {gene_id}: {e}")
    finally:
        shutil.rmtree(working_dir, ignore_errors=True)

def concatenate_outputs(output_dir: Path, final_output: Path):
    with open(final_output, 'w') as outfile:
        for tsv in sorted(output_dir.glob("*.out.tsv")):
            with open(tsv, 'r') as infile:
                shutil.copyfileobj(infile, outfile)

def main():
    parser = argparse.ArgumentParser(description="Run STIF on multi-FASTA file with parallel processing.")
    parser.add_argument("--multifasta",required=True, help="Path to multi-FASTA input file")
    parser.add_argument("--stif_root", default="./", help="Path to STIF root directory")
#    parser.add_argument("--input_dir", default="inputs", help="Folder to hold split FASTA files")
#    parser.add_argument("--output_dir", default="outputs", help="Folder to store .out.tsv results")
    parser.add_argument("--final_output", default="final_results.tsv", help="Concatenated result file")
    parser.add_argument("--threads", type=int, default=1, help="Number of parallel threads (default: 1)")

    args = parser.parse_args()

    # Resolve paths
    stif_root = Path(args.stif_root).expanduser().resolve()
    bash_wrapper = stif_root / "run_stif.sh"
    multifasta = Path(args.multifasta).expanduser().resolve()
    temp_input_dir = stif_root / "input_dir"
    output_dir = stif_root / "output_dir"
    final_output = Path(".") / args.final_output

    output_dir.mkdir(parents=True, exist_ok=True)

    # Step 1: Split multi-fasta
    print(f"[INFO] Splitting multi-FASTA file: {multifasta}")
    fasta_files = split_multifasta(multifasta, temp_input_dir)

    # Step 2: Run jobs with limited parallel threads
    print(f"[INFO] Running STIF with {args.threads} parallel threads...")
    with ThreadPoolExecutor(max_workers=args.threads) as executor:
        futures = []
        for fasta_file in fasta_files:
            out_path = output_dir / f"{fasta_file.stem}.out.tsv"
            futures.append(
                executor.submit(run_stif_for_file, fasta_file, stif_root, bash_wrapper, out_path)
            )

        for future in as_completed(futures):
            future.result()  # raise exceptions if any

    # Step 3: Combine all outputs
    print(f"[INFO] Concatenating results into: {final_output}")
    concatenate_outputs(output_dir, final_output)

    # Optional cleanup
    shutil.rmtree(temp_input_dir, ignore_errors=True)
    print("[INFO] Temporary input files removed.")
    print("[✅ DONE] Final results written to:", final_output)

if __name__ == "__main__":
    main()

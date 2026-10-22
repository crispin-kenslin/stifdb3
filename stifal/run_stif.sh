#!/bin/bash

# USAGE:
# sh run_stif.sh <STIF_ROOT_DIR> <FASTA_FILE> <WORKING_DIR> <OUTPUT_DIR>

# Input arguments
pwd=$1                 # STIF root directory
seq_file=$2            # Full path to single-sequence FASTA file
working_dir=$3         # Path to dedicated working directory for this run
output_file=$4		   # Path to output directory


# Extract just the filename (e.g., AT1G68440.fasta)
seq_base=$(basename "$seq_file")

# Optional: create working directory if not exists
mkdir -p "$working_dir"

echo "[INFO] Processing $seq_base in $working_dir"

# Forward and reverse processing
perl "$pwd/pgms/del_fwd.pl" "$seq_file" > "$working_dir/$seq_base.fwd_1k"
perl "$pwd/pgms/del_rev.pl" "$seq_file" > "$working_dir/$seq_base.rev_1k"

# Run forward and reverse HMMs
perl "$pwd/pgms/fin_HMM_fwd_1000.pl" "$working_dir/$seq_base.fwd_1k" "$pwd/pgms/consensus" > "$working_dir/seq_FWD.out"
perl "$pwd/pgms/fin_HMM_rev_1000.pl" "$working_dir/$seq_base.rev_1k" "$pwd/pgms/consensus" > "$working_dir/seq_REV.out"

# Sliding windows and calculations
perl "$pwd/pgms/full_slides.pl" "$seq_file" "$pwd/pgms/consensus" "$working_dir"
perl "$pwd/pgms/sdevn_all_files.pl" "$pwd/pgms" "$working_dir"

# Merge and validate
cat "$working_dir/seq_FWD.out" "$working_dir/seq_REV.out" > "$working_dir/seq_both.out"
perl "$pwd/pgms/valid_single_file.pl" "$working_dir/seq_both.out" "$working_dir"
python "$pwd/pgms/zscore.py" "$working_dir" "$working_dir" "$working_dir"

# Final filtering
perl "$pwd/pgms/filter_duplicates.pl" "$working_dir"/*.zsco > "$working_dir/inp_normal"
perl "$pwd/pgms/normal_1.pl" "$working_dir/inp_normal" > "$working_dir/inp"
perl "$pwd/pgms/normal_2.pl" "$working_dir/inp" > "$working_dir/normal.output"

# Parse to TSV
python "$pwd/pgms/parse_output.py" "$working_dir/normal.output" "$output_file"

echo "[INFO] Done with $seq_base"

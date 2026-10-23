from __future__ import annotations

from pathlib import Path
import re


class UpstreamSequenceStore:
    def __init__(self, sequences_dir: Path) -> None:
        self.sequences_dir = sequences_dir
        self._records_by_crop: dict[str, dict[str, dict[str, str | int]]] = {}

    def get_sequence(self, crop: str, gene_id: str) -> dict[str, str | int] | None:
        crop_key = crop.strip().lower()
        if crop_key not in self._records_by_crop:
            self._records_by_crop[crop_key] = self._load_crop(crop_key)
        return self._records_by_crop[crop_key].get(gene_id.strip().lower())

    def _find_fasta(self, crop: str) -> Path:
        crop_dirs = [
            self.sequences_dir / crop,
            self.sequences_dir.parent / "genomes" / crop,
        ]
        crop_dirs = [directory for directory in crop_dirs if directory.is_dir()]
        if not crop_dirs:
            raise FileNotFoundError(f"No upstream sequences are available for {crop}.")

        fasta_files = sorted(
            path
            for crop_dir in crop_dirs
            for path in crop_dir.iterdir()
            if path.is_file() and path.suffix.lower() in {".fa", ".fasta", ".fna"}
        )
        preferred = [
            path for path in fasta_files
            if "upstream" in path.name.lower()
        ]
        if preferred:
            return preferred[0]
        if len(fasta_files) == 1:
            return fasta_files[0]
        raise FileNotFoundError(f"No unambiguous upstream FASTA was found for {crop}.")

    def _load_crop(self, crop: str) -> dict[str, dict[str, str | int]]:
        fasta_path = self._find_fasta(crop)
        records: dict[str, dict[str, str | int]] = {}
        header: str | None = None
        sequence_parts: list[str] = []

        def save_record() -> None:
            if not header:
                return
            identifier = header.split("|", 1)[0].split()[0].strip()
            sequence = "".join(sequence_parts).upper()
            if identifier and sequence:
                records.setdefault(identifier.lower(), {
                    "gene_id": identifier,
                    "header": header,
                    "sequence": sequence,
                    "length": len(sequence),
                })

        with fasta_path.open("r", encoding="ascii") as fasta:
            for line in fasta:
                if line.startswith(">"):
                    save_record()
                    header = line[1:].strip()
                    sequence_parts = []
                elif header:
                    sequence_parts.append(re.sub(r"\s+", "", line))
            save_record()

        return records
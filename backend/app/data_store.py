from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pandas as pd


SUPPORTED_EXTENSIONS = {".csv", ".tsv", ".xlsx", ".xls"}


def _normalize_column_name(name: str) -> str:
    return str(name).strip()


def _canonical_key(name: str) -> str:
    return _normalize_column_name(name).lower().replace(" ", "_")


def _to_python_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return value
    return value


def _normalize_cell(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        cleaned = value.strip()
        return cleaned if cleaned else None
    return value


def _is_no_tfbs_row(values: list[Any]) -> bool:
    for value in values:
        if isinstance(value, str) and "no tfbs found" in value.strip().lower():
            return True
    return False


def _to_float(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return None


@dataclass
class CropDataset:
    crop: str
    file_path: Path
    columns: list[str]
    records: list[dict[str, Any]]
    gene_lookup: dict[str, dict[str, Any]]
    gene_column: str | None

    @property
    def total_records(self) -> int:
        return len(self.records)


class DataStore:
    def __init__(self, data_dir: Path) -> None:
        self.data_dir = data_dir
        self.datasets: dict[str, CropDataset] = {}
        self.all_columns: list[str] = []

    def load(self) -> None:
        self.datasets = {}
        if not self.data_dir.exists():
            self.all_columns = []
            return

        files = [
            p
            for p in self.data_dir.iterdir()
            if p.is_file() and p.suffix.lower() in SUPPORTED_EXTENSIONS
        ]

        union_columns: set[str] = set()
        for file_path in sorted(files, key=lambda p: p.name.lower()):
            crop = file_path.stem.lower()
            try:
                dataset = self._load_dataset(file_path=file_path, crop=crop)
                self.datasets[crop] = dataset
                union_columns.update(dataset.columns)
            except Exception as e:
                print(f"Warning: Could not load {file_path.name}: {e}")
                continue

        self.all_columns = sorted(union_columns)

    def _load_dataset(self, file_path: Path, crop: str) -> CropDataset:
        suffix = file_path.suffix.lower()
        
        if suffix == ".csv":
            df = pd.read_csv(file_path)
        elif suffix == ".tsv":
            df = pd.read_csv(file_path, sep="\t")
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(file_path)
        else:
            raise ValueError(f"Unsupported file type: {suffix}")

        df = df.copy()
        df.columns = [_normalize_column_name(c) for c in df.columns]
        df = df.where(pd.notnull(df), None)

        # Normalize all string cells first so downstream row filters are reliable.
        for col in df.columns:
            df[col] = df[col].map(_normalize_cell)

        df = self._drop_non_data_rows(df)

        columns = list(df.columns)
        records: list[dict[str, Any]] = []
        for row in df.to_dict(orient="records"):
            record = {str(k): _to_python_value(v) for k, v in row.items()}
            records.append(record)

        gene_column = self._find_gene_column(columns)
        gene_lookup: dict[str, dict[str, Any]] = {}
        if gene_column is not None:
            for record in records:
                gene_id = record.get(gene_column)
                if gene_id is not None:
                    gene_lookup[str(gene_id).strip().lower()] = record

        return CropDataset(
            crop=crop,
            file_path=file_path,
            columns=columns,
            records=records,
            gene_lookup=gene_lookup,
            gene_column=gene_column,
        )

    @staticmethod
    def _drop_non_data_rows(df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        column_keys = [_canonical_key(col) for col in df.columns]

        def is_empty_row(row: pd.Series) -> bool:
            return all(value in (None, "") for value in row.values.tolist())

        def is_repeated_header(row: pd.Series) -> bool:
            matches = 0
            for idx, value in enumerate(row.values.tolist()):
                if isinstance(value, str) and _canonical_key(value) == column_keys[idx]:
                    matches += 1
            threshold = min(3, len(column_keys))
            return matches >= threshold

        keep_mask = []
        for _, row in df.iterrows():
            values = row.values.tolist()
            keep_mask.append(
                not is_empty_row(row)
                and not is_repeated_header(row)
                and not _is_no_tfbs_row(values)
            )

        return df.loc[keep_mask].reset_index(drop=True)

    @staticmethod
    def _find_gene_column(columns: list[str]) -> str | None:
        priority = ("gene_id", "geneid", "gene id", "locus", "id")
        by_key = {_canonical_key(c): c for c in columns}
        for candidate in priority:
            if candidate in by_key:
                return by_key[candidate]
        for col in columns:
            if "gene" in _canonical_key(col):
                return col
        return None

    def list_crops(self) -> list[str]:
        return sorted(self.datasets.keys())

    def get_dataset(self, crop: str) -> CropDataset | None:
        return self.datasets.get(crop.lower())

    def get_stats(self) -> dict[str, int]:
        total_genes = sum(ds.total_records for ds in self.datasets.values())
        tf_family_count = set()
        for ds in self.datasets.values():
            # Look for TF column with multiple possible names
            tf_col = None
            for col in ds.columns:
                col_key = _canonical_key(col)
                if 'tf' in col_key or col_key in ('tf_name', 'tf_family', 'tffamily'):
                    tf_col = col
                    break
            
            if tf_col:
                for row in ds.records:
                    value = row.get(tf_col)
                    if value not in (None, ""):
                        tf_family_count.add(str(value).strip().lower())
        
        return {
            "total_genes": total_genes,
            "total_tfs": len(tf_family_count),
            "total_crops": len(self.datasets),
        }

    def get_facets(self, crop: str | None = None) -> dict[str, list[str]]:
        datasets = (
            [self.datasets[crop.lower()]]
            if crop and crop.lower() in self.datasets
            else list(self.datasets.values())
        )
        tf_values: set[str] = set()
        chr_values: set[str] = set()
        strand_values: set[str] = set()
        for ds in datasets:
            for rec in ds.records:
                for key, value in rec.items():
                    if value in (None, ""):
                        continue
                    norm_key = _canonical_key(key)
                    val = str(value).strip()
                    # More flexible TF matching
                    if "tf" in norm_key or norm_key in ("tf_name", "tf_family", "tffamily"):
                        tf_values.add(val)
                    elif "chromosome" in norm_key or norm_key == "chr":
                        chr_values.add(val)
                    elif "strand" in norm_key:
                        strand_values.add(val)
        return {
            "tf_families": sorted(tf_values),
            "chromosomes": sorted(chr_values),
            "strands": sorted(strand_values),
        }

    @staticmethod
    def _find_column_by_keywords(columns: list[str], keywords: list[str]) -> str | None:
        # First try exact matches with common TF column names
        if keywords == ["tf", "family"] or "tf" in keywords:
            for col in columns:
                key = _canonical_key(col)
                if key in ("tf_name", "tf_family", "tffamily", "tfname"):
                    return col
        
        # Then try keyword matching
        for col in columns:
            key = _canonical_key(col)
            if all(k in key for k in keywords):
                return col
        
        return None

    def find_gene(self, gene_id: str) -> dict[str, Any] | None:
        key = gene_id.strip().lower()
        for crop, dataset in self.datasets.items():
            rec = dataset.gene_lookup.get(key)
            if rec is not None:
                out = dict(rec)
                out["_crop"] = crop
                return out
        return None

    def get_gene_tfbs(self, gene_id: str) -> dict[str, Any]:
        key = gene_id.strip().lower()
        motifs: list[dict[str, Any]] = []
        seen: set[tuple[Any, ...]] = set()
        found_crop: str | None = None

        for crop, dataset in self.datasets.items():
            gene_column = dataset.gene_column
            if not gene_column:
                continue

            tf_column = self._find_column_by_keywords(dataset.columns, ["tf"])
            start_column = self._find_column_by_keywords(dataset.columns, ["start"])
            end_column = self._find_column_by_keywords(dataset.columns, ["end"])
            zscore_column = self._find_column_by_keywords(dataset.columns, ["z", "score"])
            strand_column = self._find_column_by_keywords(dataset.columns, ["strand"])

            if not tf_column or not start_column or not end_column:
                continue

            for rec in dataset.records:
                gene_value = rec.get(gene_column)
                if gene_value is None or str(gene_value).strip().lower() != key:
                    continue

                tf_name = rec.get(tf_column)
                if tf_name in (None, ""):
                    continue

                start_val = _to_float(rec.get(start_column))
                end_val = _to_float(rec.get(end_column))
                if start_val is None or end_val is None:
                    continue

                zscore_val = _to_float(rec.get(zscore_column)) if zscore_column else None
                strand_val = rec.get(strand_column) if strand_column else None

                motif = {
                    "gene_id": str(gene_value).strip(),
                    "name": str(tf_name).strip(),
                    "start": int(round(start_val)),
                    "end": int(round(end_val)),
                    "zscore": zscore_val,
                    "strand": str(strand_val).strip() if strand_val not in (None, "") else None,
                }
                dedupe_key = (
                    motif["name"],
                    motif["start"],
                    motif["end"],
                    motif["zscore"],
                    motif["strand"],
                )
                if dedupe_key in seen:
                    continue
                seen.add(dedupe_key)
                motifs.append(motif)
                found_crop = crop

        motifs.sort(key=lambda m: (m["start"], m["end"], m["name"]))
        return {"gene_id": gene_id, "crop": found_crop, "motifs": motifs}

    def query_records(
        self,
        crop: str | None = None,
        q: str | None = None,
        tf_family: str | None = None,
        chromosome: str | None = None,
        strand: str | None = None,
        field: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> tuple[list[dict[str, Any]], int]:
        selected = []
        datasets = (
            [self.datasets[crop.lower()]]
            if crop and crop.lower() in self.datasets
            else list(self.datasets.values())
        )
        q_norm = q.strip().lower() if q else None

        for ds in datasets:
            for rec in ds.records:
                row = dict(rec)
                row["_crop"] = ds.crop
                if not self._matches_filters(
                    row=row,
                    q=q_norm,
                    tf_family=tf_family,
                    chromosome=chromosome,
                    strand=strand,
                    field=field,
                ):
                    continue
                selected.append(row)

        total = len(selected)
        return selected[offset : offset + limit], total

    def _matches_filters(
        self,
        row: dict[str, Any],
        q: str | None,
        tf_family: str | None,
        chromosome: str | None,
        strand: str | None,
        field: str | None,
    ) -> bool:
        if tf_family and not self._value_contains(row, ["tf", "tf_name", "tf_family", "tffamily"], tf_family):
            return False
        if chromosome and not self._value_contains(row, ["chromosome", "chr"], chromosome):
            return False
        if strand and not self._value_contains(row, ["strand"], strand):
            return False
        if q:
            if field:
                candidate = row.get(field)
                if candidate is None or q not in str(candidate).lower():
                    return False
            else:
                if not any(
                    (value is not None and q in str(value).lower())
                    for value in row.values()
                ):
                    return False
        return True

    @staticmethod
    def _value_contains(row: dict[str, Any], aliases: list[str], expected: str) -> bool:
        expected_norm = expected.strip().lower()
        for key, value in row.items():
            key_norm = _canonical_key(key)
            if any(alias in key_norm for alias in aliases):
                if value is not None and expected_norm in str(value).lower():
                    return True
        return False

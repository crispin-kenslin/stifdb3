from __future__ import annotations

from dataclasses import dataclass
import math
import os
from pathlib import Path
import re


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_CONSENSUS = PROJECT_ROOT / "stifal" / "pgms" / "consensus"
ScoreProfile = tuple[tuple[dict[str, float], ...], ...]


@dataclass(frozen=True)
class MotifModel:
    name: str
    family: str
    threshold: float
    variants: tuple[str, ...]


def resolve_consensus_path() -> Path:
    configured = os.getenv("STIFAL_CONSENSUS_FILE")
    if configured:
        return Path(configured)
    docker_path = Path("/stifal/pgms/consensus")
    if docker_path.is_file():
        return docker_path
    return DEFAULT_CONSENSUS


def load_motifs(consensus_path: Path | None = None) -> list[MotifModel]:
    path = consensus_path or resolve_consensus_path()
    if not path.is_file():
        raise FileNotFoundError(f"STIFAL consensus file not found: {path}")

    motifs: list[MotifModel] = []
    name = family = ""
    threshold = 0.0
    variants: list[str] = []

    def append_current() -> None:
        if name and variants:
            motif_length = len(variants[0])
            if any(len(variant) != motif_length for variant in variants):
                raise ValueError(f"Consensus variants have inconsistent lengths for {name}")
            motifs.append(MotifModel(name, family, threshold, tuple(variants)))

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("FACTOR="):
            append_current()
            name_match = re.search(r"FACTOR=([^\s]+)", line)
            family_match = re.search(r"FAMILY=([^\s]+)", line)
            threshold_match = re.search(r"THRESHOLD=([\d.]+)", line)
            name = name_match.group(1) if name_match else ""
            family = family_match.group(1) if family_match else ""
            threshold = float(threshold_match.group(1)) if threshold_match else 0.0
            variants = []
        else:
            variant = line.upper()
            if re.fullmatch(r"[ACGT]+", variant):
                variants.append(variant)

    append_current()
    return motifs


def normalize_sequence(raw_sequence: str) -> str:
    sequence_lines = [
        line.strip()
        for line in raw_sequence.splitlines()
        if line.strip() and not line.lstrip().startswith(">")
    ]
    sequence = "".join("".join(line.split()) for line in sequence_lines).upper()
    if not sequence:
        raise ValueError("Enter a DNA sequence.")
    if re.search(r"[^ACGT]", sequence):
        raise ValueError("Sequence may contain only A, C, G, and T.")
    if len(sequence) != 1000:
        raise ValueError(f"Sequence must be exactly 1,000 bp; received {len(sequence)} bp.")
    return sequence


def _build_score_profile(motif: MotifModel) -> ScoreProfile:
    profile = []
    for variant_index, variant in enumerate(motif.variants):
        other_variants = [
            candidate for index, candidate in enumerate(motif.variants) if index != variant_index
        ]
        positions = []
        for position in range(len(variant)):
            position_scores = {}
            for base in "ACGT":
                probability = (
                    1.0 + sum(candidate[position] == base for candidate in other_variants) / len(other_variants)
                    if other_variants
                    else 1.0
                )
                position_scores[base] = math.log(probability)
            positions.append(position_scores)
        profile.append(tuple(positions))
    return tuple(profile)


def _score_against_variant(
    sequence: str,
    motif: MotifModel,
    variant_index: int,
    profile: ScoreProfile,
) -> float:
    log_likelihood = 0.0
    log_background = 0.0
    for position, base in enumerate(sequence):
        log_likelihood += profile[variant_index][position][base]
        if base in "AT":
            log_background += math.log(0.375)
        elif base in "GC":
            log_background += math.log(0.125)
    return (log_likelihood - log_background) / len(motif.variants[variant_index])


def _window_score(sequence: str, motif: MotifModel, profile: ScoreProfile) -> float:
    return round(
        max(
            _score_against_variant(sequence, motif, index, profile)
            for index in range(len(motif.variants))
        ),
        4,
    )


def _legacy_background_stats(scores: list[float]) -> tuple[float, float]:
    if len(scores) < 3:
        return (0.0, 0.0)

    legacy_count = len(scores) - 1
    mean = sum(scores) / legacy_count
    deviation = math.sqrt(
        sum((score - mean) ** 2 for score in scores) / (legacy_count - 1)
    )
    return mean, deviation


def predict_sequence(
    raw_sequence: str,
    sequence_name: str = "Submitted sequence",
    consensus_path: Path | None = None,
    minimum_zscore: float = 1.0,
) -> dict:
    sequence = normalize_sequence(raw_sequence)
    sequence_name = sequence_name.strip() or "Submitted sequence"
    motifs = load_motifs(consensus_path)
    predictions: list[dict] = []

    for motif in motifs:
        width = len(motif.variants[0])
        profile = _build_score_profile(motif)
        background_scores: list[float] = []
        for offset in range(len(sequence) - width + 1):
            window = sequence[offset : offset + width]
            background_scores.append(_window_score(window, motif, profile))
            background_scores.append(_window_score(window[::-1], motif, profile))

        mean, deviation = _legacy_background_stats(background_scores)
        hits: dict[tuple[int, str], dict] = {}

        for offset in range(len(sequence) - width + 1):
            window = sequence[offset : offset + width]
            for orientation, scanned_window in (("FORWARD", window), ("REVERSE", window[::-1])):
                for variant_index, variant in enumerate(motif.variants):
                    if scanned_window != variant:
                        continue
                    score = round(
                        _score_against_variant(scanned_window, motif, variant_index, profile), 4
                    )
                    start = offset - 1000
                    prediction = {
                        "gene_id": sequence_name,
                        "name": motif.name,
                        "family": motif.family,
                        "start": start,
                        "end": start + width - 1,
                        "zscore": round((score - mean) / deviation, 4) if deviation else 0.0,
                        "score": score,
                        "threshold": motif.threshold,
                        "strand": orientation,
                        "sequence": scanned_window,
                    }
                    key = (offset, orientation)
                    previous = hits.get(key)
                    if previous is None or prediction["score"] > previous["score"]:
                        hits[key] = prediction

        unique_sites: dict[tuple[int, int], dict] = {}
        for prediction in hits.values():
            unique_sites[(prediction["start"], prediction["end"])] = prediction
        predictions.extend(unique_sites.values())

    best_zscore_by_motif: dict[str, float] = {}
    for prediction in predictions:
        motif_name = prediction["name"]
        best_zscore_by_motif[motif_name] = max(
            best_zscore_by_motif.get(motif_name, float("-inf")), prediction["zscore"]
        )

    predictions = [
        prediction
        for prediction in predictions
        if prediction["zscore"] >= minimum_zscore
        and prediction["zscore"] == best_zscore_by_motif[prediction["name"]]
    ]
    predictions.sort(key=lambda hit: (hit["start"], hit["name"], hit["strand"]))
    return {
        "sequence_name": sequence_name,
        "sequence_length": len(sequence),
        "coordinate_system": "1,000 bp upstream of the TSS (-1000 to -1; 0 marks the TSS)",
        "minimum_zscore": minimum_zscore,
        "selection": "highest z-score site(s) per transcription-factor model",
        "motifs_scanned": len(motifs),
        "hit_count": len(predictions),
        "motifs": predictions,
    }
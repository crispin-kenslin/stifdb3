# Plant TF Public Database Portal

Read-only biological database portal for plant transcription factor (TF) records, with CSV/Excel-based data management.

## Structure

```text
/data
  rice.csv
  wheat.csv
  maize.csv
/backend
/frontend
docker-compose.yml
```

## Features

- Dynamic datasets per crop from `/data/*.csv|*.xlsx|*.xls`
- Dynamic columns (new columns appear automatically in API/UI)
- Fast in-memory backend caching with pandas
- Public pages: home, search, gene detail, crop browse, downloads
- No auth / no admin panel

## Backend API

- `GET /crops` list crop datasets
- `GET /stats` total genes / TF families / crops
- `GET /facets` available TF families, chromosomes, strands
- `GET /data?crop=rice&limit=100&offset=0` browse data
- `GET /search?q=...&crop=...&tf_family=...&chromosome=...&strand=...`
- `GET /gene/{gene_id}` gene/TF detail
- `GET /download/{crop}` download full crop file
- `GET /download?...filters...` download filtered results as CSV
- `POST /reload` manual in-process reload (restart is still admin workflow)

## Option 1: Simple Linux Deployment

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
VITE_API_BASE=http://YOUR_SERVER_IP:8000 npm run build
npm install -g serve
serve -s dist -l 4173
```

## Option 2: Docker Compose (Recommended)

```bash
docker compose up --build -d
```

- Frontend: `http://SERVER_IP:4173`
- Backend API: `http://SERVER_IP:8000`

## Admin Workflow (CSV/Excel Only)

1. Edit file in Excel (`rice.csv`, `wheat.csv`, `maize.csv`, or new crop file)
2. Upload/replace file in `/data`
3. Restart backend (or call `POST /reload`)
4. Portal reflects updated data and columns

## Notes

- For large files, keep CSV columns consistent where possible.
- `Gene ID` is auto-detected heuristically; include a `Gene ID` column for best detail-page behavior.

## STIFAL Sequence Prediction

The **Predict** page scans a pasted 1,000 bp upstream DNA sequence against the bundled STIFAL consensus motifs. Input may be plain sequence or FASTA; whitespace and FASTA headers are ignored. Bases are mapped from -1000 to -1, with 0 marking the transcription start site.

The Python implementation ports the legacy Perl scoring flow: exact consensus-variant hits use the matching variant's leave-one-out score, while the background uses the maximum variant score for each sliding window and its reversed string. Scores are rounded to four decimals before the legacy mean/SD calculation. Duplicate hits at the same motif coordinates are collapsed using the legacy last-hit behavior. Like the Perl `normal_1.pl` stage, the interactive results keep the highest-z-score site(s) per factor and default to excluding z-scores below 1; the cutoff is configurable in the page and API. Consensus threshold values are returned as model metadata; the legacy scanner does not use them as a hit filter. The legacy code reverses windows without complementing them, and the Python port preserves that behavior.

The interactive predictor returns per-sequence scores and z-scores. It does not apply the legacy batch pipeline's final normalization, which depends on counts across the full batch of genes; that step is not defined for one pasted sequence.
The backend endpoint is `POST /predict/stifal` with JSON such as:

```json
{
  "sequence_name": "example_gene",
  "sequence": "ACGT...",
  "minimum_zscore": 1
}
```

For Docker Compose, `./stifal` is mounted read-only into the backend container so the API can load `stifal/pgms/consensus`. For another deployment layout, set `STIFAL_CONSENSUS_FILE` to the consensus file path.

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

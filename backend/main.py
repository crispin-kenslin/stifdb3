from __future__ import annotations

from contextlib import asynccontextmanager
from io import StringIO
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.data_store import DataStore


BASE_DIR = Path(__file__).resolve().parent


def resolve_data_dir() -> Path:
    configured = os.getenv("STIF_DATA_DIR")
    if configured:
        return Path(configured)

    docker_data = Path("/data")
    if docker_data.exists():
        return docker_data

    return BASE_DIR.parent / "data"


DATA_DIR = resolve_data_dir()

@asynccontextmanager
async def lifespan(_: FastAPI):
    store.load()
    yield


app = FastAPI(title="Plant TF Public Portal API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = DataStore(DATA_DIR)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "datasets": len(store.datasets)}


@app.post("/reload")
def reload_data() -> dict:
    store.load()
    return {"status": "reloaded", "crops": store.list_crops()}


@app.get("/stats")
def stats() -> dict:
    return store.get_stats()


@app.get("/columns")
def columns(crop: str | None = None) -> dict:
    if crop:
        ds = store.get_dataset(crop)
        if not ds:
            raise HTTPException(status_code=404, detail=f"Unknown crop: {crop}")
        return {"crop": ds.crop, "columns": ds.columns}
    return {"columns": store.all_columns}


@app.get("/crops")
def crops() -> dict:
    return {"crops": store.list_crops()}


@app.get("/facets")
def facets(crop: str | None = None) -> dict:
    return store.get_facets(crop=crop)


@app.get("/data")
def data(
    crop: str | None = None,
    tf_family: str | None = None,
    chromosome: str | None = None,
    strand: str | None = None,
    limit: int = Query(default=100, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows, total = store.query_records(
        crop=crop,
        tf_family=tf_family,
        chromosome=chromosome,
        strand=strand,
        limit=limit,
        offset=offset,
    )
    return {"total": total, "count": len(rows), "items": rows}


@app.get("/search")
def search(
    q: str = Query(default=""),
    crop: str | None = None,
    tf_family: str | None = None,
    chromosome: str | None = None,
    strand: str | None = None,
    field: str | None = None,
    limit: int = Query(default=100, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows, total = store.query_records(
        crop=crop,
        q=q,
        tf_family=tf_family,
        chromosome=chromosome,
        strand=strand,
        field=field,
        limit=limit,
        offset=offset,
    )
    return {"total": total, "count": len(rows), "items": rows}


@app.get("/gene/{gene_id}/tfbs")
def gene_tfbs_data(gene_id: str) -> dict:
    return store.get_gene_tfbs(gene_id)


@app.get("/tfbs/{tfbs_name}")
def tfbs_detail(tfbs_name: str) -> dict:
    return store.get_tfbs_detail(tfbs_name)


@app.get("/gene/{gene_id}")
def gene_detail(gene_id: str) -> dict:
    rec = store.find_gene(gene_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"Gene not found: {gene_id}")
    return rec


@app.get("/download/{crop}")
def download_crop(crop: str) -> StreamingResponse:
    ds = store.get_dataset(crop)
    if not ds:
        raise HTTPException(status_code=404, detail=f"Unknown crop: {crop}")

    def iter_file():
        with ds.file_path.open("rb") as handle:
            while chunk := handle.read(8192):
                yield chunk

    suffix = ds.file_path.suffix.lower()
    media_type = "text/csv" if suffix in (".csv", ".tsv") else "application/vnd.ms-excel"
    filename = ds.file_path.name
    return StreamingResponse(
        iter_file(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/download")
def download_filtered(
    crop: str | None = None,
    q: str | None = None,
    tf_family: str | None = None,
    chromosome: str | None = None,
    strand: str | None = None,
    field: str | None = None,
) -> StreamingResponse:
    rows, _ = store.query_records(
        crop=crop,
        q=q,
        tf_family=tf_family,
        chromosome=chromosome,
        strand=strand,
        field=field,
        limit=500000,
        offset=0,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No rows found for export")

    csv_buffer = StringIO()
    import pandas as pd

    pd.DataFrame(rows).to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="filtered_results.csv"'},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from io import StringIO
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from fastapi.responses import StreamingResponse

from app.data_store import DataStore
from app.stifal_engine import predict_sequence
from app.upstream_sequences import UpstreamSequenceStore


BASE_DIR = Path(__file__).resolve().parent


def resolve_data_dir() -> Path:
    configured = os.getenv("STIF_DATA_DIR")
    if configured:
        return Path(configured)
    local_data = BASE_DIR.parent / "data"
    if local_data.exists():
        return local_data
    docker_data = Path("/data")
    if docker_data.exists() and (Path("/.dockerenv").exists() or (docker_data / "tfbs").exists()):
        return docker_data
    return local_data


DATA_DIR = resolve_data_dir()
store = DataStore(DATA_DIR)
upstream_sequences = UpstreamSequenceStore(DATA_DIR / "sequences")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Load data in thread pool to avoid blocking startup
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, store.load)
    yield


app = FastAPI(title="STIFDB3 - Plant TF Stress Response Portal", version="3.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StifalPredictionRequest(BaseModel):
    sequence: str = Field(max_length=20000)
    sequence_name: str = Field(default="Submitted sequence", max_length=100)
    minimum_zscore: float = Field(default=1.0, ge=0, le=20)


@app.post("/predict/stifal")
async def predict_stifal(request: StifalPredictionRequest) -> dict:
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            lambda: predict_sequence(
                request.sequence,
                request.sequence_name,
                minimum_zscore=request.minimum_zscore,
            ),
        )
        return result
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except FileNotFoundError as error:
        raise HTTPException(status_code=503, detail="STIFAL consensus data is unavailable.") from error


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "datasets": len(store.datasets)}


@app.post("/reload")
async def reload_data() -> dict:
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, store.load)
    return {"status": "reloaded", "crops": store.list_crops()}


@app.get("/stats")
def stats() -> dict:
    return store.get_stats()


@app.get("/crops")
def crops() -> dict:
    crop_list = store.list_crops()
    summary = []
    for c in crop_list:
        ds = store.datasets.get(c)
        if not ds:
            continue
        tf_families = set()
        tf_col = store._find_column_by_keywords(ds.columns, ["tf", "family"])
        if tf_col:
            for r in ds.records:
                val = r.get(tf_col)
                if val not in (None, ""):
                    tf_families.add(str(val).strip())
        summary.append({
            "crop": c,
            "total_records": ds.total_records,
            "unique_genes": len(ds.gene_lookup),
            "tf_count": len(tf_families),
            "columns": ds.columns,
            "stress_tags": sorted(ds.stress_tags),
        })
    return {"crops": crop_list, "summary": summary}


@app.get("/facets")
def facets(crop: str | None = None) -> dict:
    return store.get_facets(crop=crop)


@app.get("/stress-types")
def stress_types() -> dict:
    """Return all stress types detected across the loaded datasets."""
    tags = sorted(store.all_stress_tags)
    if not tags:
        tags = ["Drought", "Salinity", "Cold", "Heat", "Osmotic", "ABA", "Oxidative"]
    return {"stress_types": tags}


@app.get("/data")
def data(
    crop: str | None = None,
    tf_family: str | None = None,
    chromosome: str | None = None,
    strand: str | None = None,
    stress: str | None = None,
    limit: int = Query(default=100, ge=1, le=5000),
    offset: int = Query(default=0, ge=0),
) -> dict:
    rows, total = store.query_records(
        crop=crop,
        tf_family=tf_family,
        chromosome=chromosome,
        strand=strand,
        stress=stress,
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
    stress: str | None = None,
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
        stress=stress,
        field=field,
        limit=limit,
        offset=offset,
    )
    return {"total": total, "count": len(rows), "items": rows}


@app.get("/gene/{gene_id}/tfbs")
def gene_tfbs_data(gene_id: str) -> dict:
    return store.get_gene_tfbs(gene_id)


@app.get("/gene/{gene_id}/upstream-sequence")
def gene_upstream_sequence(gene_id: str) -> dict:
    gene = store.find_gene(gene_id)
    if not gene:
        raise HTTPException(status_code=404, detail=f"Gene not found: {gene_id}")
    crop = str(gene["_crop"])
    try:
        record = upstream_sequences.get_sequence(crop, gene_id)
    except FileNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"No upstream FASTA sequence is available for {gene_id} in {crop}.",
        )
    return {"crop": crop, **record}


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
    return StreamingResponse(
        iter_file(),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{ds.file_path.name}"'},
    )


@app.get("/download")
def download_filtered(
    crop: str | None = None,
    q: str | None = None,
    tf_family: str | None = None,
    chromosome: str | None = None,
    strand: str | None = None,
    stress: str | None = None,
    field: str | None = None,
) -> StreamingResponse:
    import pandas as pd

    rows, _ = store.query_records(
        crop=crop,
        q=q,
        tf_family=tf_family,
        chromosome=chromosome,
        strand=strand,
        stress=stress,
        field=field,
        limit=500000,
        offset=0,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No rows found for export")

    csv_buffer = StringIO()
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

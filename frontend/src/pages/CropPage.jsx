import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

/** Case-insensitive field getter — tries exact key first, then lowercased scan */
function getField(item, ...keys) {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) return item[key];
  }
  // Fallback: case-insensitive scan
  const lower = Object.fromEntries(Object.entries(item).map(([k, v]) => [k.toLowerCase(), v]));
  for (const key of keys) {
    const v = lower[key.toLowerCase()];
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}

export default function CropPage() {
  const { crop } = useParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.data({ crop, limit: "5000", offset: "0" })
      .then((res) => {
        const items = res.items || [];
        if (!items.length) { setRows([]); setTotal(0); return; }

        const grouped = {};
        items.forEach((item) => {
          const geneKey = getField(item, "Gene", "Gene ID", "gene", "gene_id", "GeneID");
          if (!geneKey) return;
          const geneStr = String(geneKey).trim();
          const tfName = getField(item, "TF_Name", "TF Name", "TF_Family", "TF Family", "tf_name", "tf_family", "TF_name");
          const tfStr = tfName ? String(tfName).trim() : "";
          if (!tfStr || tfStr.toLowerCase() === "tf_name" || tfStr.toLowerCase().includes("no tfbs found")) return;

          const startNum = Number(getField(item, "Start", "start") ?? NaN);
          const endNum   = Number(getField(item, "End",   "end")   ?? NaN);
          const zNum     = Number(getField(item, "Z-Score", "Z-score", "z-score", "zscore") ?? NaN);

          if (!grouped[geneStr]) {
            grouped[geneStr] = { Gene: geneStr, Protein: item._protein_name || geneStr, TF_Names: new Set(), starts: [], ends: [], zscores: [], TFBS_Count: 0 };
          }
          grouped[geneStr].TF_Names.add(tfStr);
          grouped[geneStr].TFBS_Count += 1;
          if (Number.isFinite(startNum)) grouped[geneStr].starts.push(startNum);
          if (Number.isFinite(endNum))   grouped[geneStr].ends.push(endNum);
          if (Number.isFinite(zNum))     grouped[geneStr].zscores.push(zNum);
        });

        const result = Object.values(grouped).map((row) => {
          const zMin = row.zscores.length ? Math.min(...row.zscores) : null;
          const zMax = row.zscores.length ? Math.max(...row.zscores) : null;
          return {
            Gene: row.Gene,
            "Protein Name": row.Protein,
            "TF Families": Array.from(row.TF_Names).sort().join(", "),
            "TFBS Count": row.TFBS_Count,
            "Z-Score Range": zMin === null ? "N/A" : zMin === zMax ? `${zMin.toFixed(2)}` : `${zMin.toFixed(2)} – ${zMax.toFixed(2)}`,
          };
        });

        setRows(result);
        setTotal(result.length);
      })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [crop]);

  return (
    <div className="crop-page">
      <div className="crop-page-header" style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: ".8rem 1.5rem" }}>
        <div>
          <p className="page-eyebrow">Crop view</p>
          <h1 style={{ fontSize: "1.2rem" }}>{cap(crop)}</h1>
        </div>
        <div className="results-badge">
          <strong>{total}</strong>
          <span>genes</span>
        </div>
      </div>

      <div className="crop-page-body" style={{ maxWidth: "90%", margin: "0 auto", width: "100%" }}>
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /> Loading {cap(crop)} data…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">No TF records found for {cap(crop)}.</div>
        ) : (
          <DataTable rows={rows} />
        )}
      </div>
    </div>
  );
}

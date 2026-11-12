import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export default function TFBSPage() {
  const { tfbsName } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tfbsName) return;
    setError(""); setDetail(null);
    api.tfbsDetail(tfbsName)
      .then(setDetail)
      .catch((e) => setError(String(e.message || e)));
  }, [tfbsName]);

  if (error) return (
    <div className="tfbs-page">
      <div className="tfbs-header" style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: "1rem 1.5rem" }}>
        <p className="page-eyebrow">TFBS Details</p>
        <h1 style={{ fontSize: "1.1rem" }}>{tfbsName}</h1>
      </div>
      <div style={{ padding: "1rem 1.5rem" }}><p className="error-msg">{error}</p></div>
    </div>
  );

  if (!detail) return (
    <div className="tfbs-page">
      <div className="loading-state" style={{ flex: 1 }}><div className="loading-spinner" /> Loading TFBS details…</div>
    </div>
  );

  const cropList = (detail.crops || []).map(cap);
  const fn = typeof detail.function === "string" && detail.function.trim()
    ? detail.function.trim()
    : "Regulatory TFBS motif associated with transcriptional control in stress response.";
  const geneAnnotations = detail.gene_annotations || [];

  return (
    <div className="tfbs-page">
      <div className="tfbs-header" style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="page-eyebrow">Transcription Factor Binding Site</p>
            <h1 style={{ fontSize: "1.2rem", color: "var(--cyan)" }}>{detail.name || tfbsName}</h1>
          </div>
          <Link to={`/search?tf_family=${encodeURIComponent(tfbsName)}`} className="btn btn-primary">
            View Genes →
          </Link>
        </div>
      </div>

      <div className="tfbs-body" style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {/* Summary card */}
        <div className="card">
          <h2>Summary</h2>
          <div className="info-row"><strong>TFBS Name</strong><span>{detail.name || tfbsName}</span></div>
          <div className="info-row"><strong>Total Occurrences</strong><span>{detail.total_occurrences ?? 0}</span></div>
          <div className="info-row"><strong>Unique Genes</strong><span>{detail.total_genes ?? 0}</span></div>
          <div className="info-row"><strong>Crop Species</strong><span>{detail.total_crops ?? cropList.length}</span></div>
          <div className="info-row"><strong>Crops</strong><span>{cropList.join(", ") || "—"}</span></div>
        </div>

        {/* Z-score stats */}
        <div className="card">
          <h2>Occurrence Statistics</h2>
          <div className="info-row">
            <strong>Z-Score range</strong>
            <span>{detail.zscore?.min ?? "N/A"} – {detail.zscore?.max ?? "N/A"} (avg: {detail.zscore?.avg ?? "N/A"})</span>
          </div>
          <div className="info-row">
            <strong>Start range</strong>
            <span>{detail.start?.min ?? "N/A"} to {detail.start?.max ?? "N/A"} bp</span>
          </div>
          <div className="info-row">
            <strong>End range</strong>
            <span>{detail.end?.min ?? "N/A"} to {detail.end?.max ?? "N/A"} bp</span>
          </div>
        </div>

        {/* Function */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h2>Functional Annotation</h2>
          <p style={{ fontSize: ".85rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>{fn}</p>
        </div>

        {/* Gene annotations table */}
        {geneAnnotations.length > 0 && (
          <div className="card" style={{ gridColumn: "1 / -1" }}>
            <h2>Associated Genes ({geneAnnotations.length})</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Gene</th><th>Crop</th><th>Protein Name</th><th>Annotation</th></tr>
                </thead>
                <tbody>
                  {geneAnnotations.map((g) => (
                    <tr key={`${g.crop}-${g.gene_id}`}>
                      <td><Link to={`/gene/${encodeURIComponent(g.gene_id)}`}>{g.gene_id}</Link></td>
                      <td>{cap(g.crop)}</td>
                      <td>{g.protein_name || "N/A"}</td>
                      <td style={{ fontSize: ".78rem" }}>
                        {Object.entries(g.annotation || {})
                          .filter(([k, v]) => k.toLowerCase() !== "gene_id" && v !== null && v !== "")
                          .map(([k, v]) => `${k}: ${v}`)
                          .join("; ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

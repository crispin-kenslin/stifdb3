import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import InteractiveGeneGraph from "../components/InteractiveGeneGraph";

export default function GeneDetailPage() {
  const { geneId } = useParams();
  const [tfbsData, setTfbsData] = useState(null);
  const [geneData, setGeneData] = useState(null);
  const [upstreamSeq, setUpstreamSeq] = useState(null);
  const [seqLoading, setSeqLoading] = useState(true);
  const [seqError, setSeqError] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("graph");

  useEffect(() => {
    setGeneData(null); setTfbsData(null); setUpstreamSeq(null);
    setSeqError(""); setSeqLoading(true); setError("");

    api.gene(geneId).then(setGeneData).catch(() => setGeneData(null));
    api.geneTFBS(geneId).then(setTfbsData).catch((e) => setError(String(e.message || e)));
    api.geneUpstreamSequence(geneId)
      .then(setUpstreamSeq)
      .catch((e) => {
        let msg = String(e.message || e);
        try { msg = JSON.parse(msg).detail || msg; } catch { /* */ }
        setSeqError(msg);
      })
      .finally(() => setSeqLoading(false));
  }, [geneId]);

  const downloadCsv = () => {
    if (!tfbsData?.motifs?.length) return;
    const rows = tfbsData.motifs.map((m, i) => ({
      index: i + 1, gene_id: m.gene_id ?? geneId,
      tf_name: m.name ?? "", start: m.start ?? "", end: m.end ?? "",
      zscore: m.zscore ?? "", orientation: m.strand ?? ""
    }));
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `${geneId}-tfbs.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = document.querySelector(".gene-graph");
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const url = URL.createObjectURL(new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const w = (svg.viewBox?.baseVal?.width || svg.clientWidth || 1200) * 2;
      const h = (svg.viewBox?.baseVal?.height || svg.clientHeight || 420) * 2;
      const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#070b14"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const pu = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = pu; a.download = `${geneId}-tfbs.png`; a.click();
        URL.revokeObjectURL(pu);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  if (!tfbsData && !error) {
    return (
      <div className="gene-detail-page">
        <div className="loading-state" style={{ flex: 1 }}>
          <div className="loading-spinner" /> Loading gene data…
        </div>
      </div>
    );
  }

  const motifRows = (tfbsData?.motifs || []).map((m, i) => ({
    "#": i + 1, "TF Name": m.name ?? "", "Start": m.start ?? "",
    "End": m.end ?? "", "Z-Score": m.zscore ?? "", "Orientation": m.strand ?? ""
  }));

  return (
    <div className="gene-detail-page">
      {/* Header */}
      <div className="gene-page-header" style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p className="page-eyebrow">TFBS Profile</p>
          <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "1.2rem", color: "var(--cyan)" }}>{geneId}</h1>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          {tfbsData?.motifs?.length > 0 && (
            <>
              <button className="btn btn-secondary" onClick={downloadPng}>↓ PNG</button>
              <button className="btn btn-secondary" onClick={downloadCsv}>↓ CSV</button>
            </>
          )}
          <div className="results-badge">
            <strong>{tfbsData?.motifs?.length ?? 0}</strong>
            <span>motifs</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="gene-detail-tabs">
        {[["graph", "🧬 TFBS Map"], ["table", "📋 Motif Table"], ["annotation", "📝 Annotation"], ["sequence", "🔗 Upstream Seq"]].map(([key, label]) => (
          <button key={key} className={`gene-tab ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="gene-detail-body">
        {error && <p className="error-msg">{error}</p>}

        {tab === "graph" && (
          <>
            {tfbsData?.motifs?.length > 0 ? (
              <div className="gene-graph-container">
                <InteractiveGeneGraph data={tfbsData.motifs} geneId={geneId} />
                <p className="graph-hint">💡 Click any motif to view TFBS details</p>
              </div>
            ) : (
              <div className="empty-state">No TFBS motifs found for this gene.</div>
            )}
          </>
        )}

        {tab === "table" && (
          <div className="table-wrap">
            {motifRows.length > 0 ? (
              <table>
                <thead><tr>{Object.keys(motifRows[0]).map((k) => <th key={k}>{k}</th>)}</tr></thead>
                <tbody>
                  {motifRows.map((r, i) => (
                    <tr key={i}>{Object.values(r).map((v, j) => <td key={j}>{v}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">No motif data available.</div>
            )}
          </div>
        )}

        {tab === "annotation" && (
          <div className="card">
            <h2>Gene Annotation</h2>
            {geneData?.annotations?.length ? (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Field</th><th>Value</th></tr></thead>
                  <tbody>
                    {geneData.annotations.flatMap((ann, ai) =>
                      Object.entries(ann).map(([field, value]) => (
                        <tr key={`${ai}-${field}`}>
                          <th scope="row" style={{ fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{field}</th>
                          <td>{value === null || value === "" ? "N/A" : String(value)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>No annotation data available for this gene.</p>
            )}
          </div>
        )}

        {tab === "sequence" && (
          <div className="card">
            <h2>1,000 bp Upstream Sequence
              {upstreamSeq && (
                <span style={{ fontSize: ".75rem", color: "var(--lime)", marginLeft: ".5rem", fontWeight: 400 }}>
                  {upstreamSeq.length?.toLocaleString()} bp · {upstreamSeq.crop}
                </span>
              )}
            </h2>
            {seqLoading ? (
              <div className="loading-state"><div className="loading-spinner" /> Retrieving sequence…</div>
            ) : upstreamSeq ? (
              <>
                <p style={{ fontSize: ".75rem", color: "var(--text-muted)", marginBottom: ".5rem" }}>{upstreamSeq.header}</p>
                <pre className="gene-sequence-code">{upstreamSeq.sequence}</pre>
              </>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: ".85rem" }}>
                Upstream sequence not available. {seqError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

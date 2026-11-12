import { useRef, useState } from "react";
import { api } from "../api";
import InteractiveGeneGraph from "../components/InteractiveGeneGraph";

const RESULT_COLS = [
  ["name", "Transcription Factor"],
  ["family", "Family"],
  ["start", "Start (bp)"],
  ["end", "End (bp)"],
  ["zscore", "Z-score"],
  // ["score", "Score"],
  // ["threshold", "Threshold"],
  ["strand", "Orientation"],
  ["sequence", "Binding Site"],
];

function seqLen(v) {
  return v.replace(/^\s*>[^\n]*(?:\n|$)/gm, "").replace(/\s/g, "").length;
}

export default function StifalPredictPage() {
  const graphRef = useRef(null);
  const [sequenceName, setSequenceName] = useState("Submitted sequence");
  const [sequence, setSequence] = useState("");
  const [minZscore, setMinZscore] = useState("1");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const currentLen = seqLen(sequence);

  const runPrediction = async (e) => {
    e.preventDefault();
    setError(""); setResult(null); setLoading(true);
    try {
      const r = await api.predictStifal({
        sequence,
        sequence_name: sequenceName.trim() || "Submitted sequence",
        minimum_zscore: Number(minZscore),
      });
      setResult(r);
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    const headers = RESULT_COLS.map(([, l]) => l);
    const rows = result.motifs.map((m) => RESULT_COLS.map(([k]) => m[k] ?? ""));
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = `${result.sequence_name.replace(/[^a-z0-9_-]+/gi, "_")}-stifal.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const svg = graphRef.current?.querySelector("svg.gene-graph");
    if (!svg) return;
    const svgCopy = svg.cloneNode(true);
    svgCopy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const vb = svg.viewBox.baseVal;
    const w = vb.width || svg.clientWidth || 1200;
    const h = vb.height || svg.clientHeight || 420;
    svgCopy.setAttribute("width", String(w)); svgCopy.setAttribute("height", String(h));
    const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svgCopy)], { type: "image/svg+xml;charset=utf-8" }));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = w * 2; canvas.height = h * 2;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#070b14"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (!blob) return;
        const pu = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pu; a.download = `${result.sequence_name.replace(/[^a-z0-9_-]+/gi, "_")}-stifal.png`;
        a.click(); setTimeout(() => URL.revokeObjectURL(pu), 0);
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); setError("PNG export failed."); };
    img.src = url;
  };

  return (
    <div className="stifal-page">
      {/* ── Sidebar form ── */}
      <aside className="stifal-sidebar">
        <div className="stifal-sidebar-header">
          <p style={{ fontSize: ".6rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--lime)", fontWeight: 700, marginBottom: ".3rem" }}>
            STIFAL · Motif Scanner
          </p>
          <h1>Predict TF Binding Sites</h1>
          <p>Scan a 1,000 bp upstream region against STIFAL Transcription Factors Binding Site Prediction Algorithm.</p>


        </div>

        <form className="stifal-form" onSubmit={runPrediction}>
          <div>
            <label className="stifal-label">Sequence name</label>
            <input className="stifal-input" value={sequenceName} maxLength={100}
              onChange={(e) => setSequenceName(e.target.value)} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: ".3rem" }}>
              <label className="stifal-label" style={{ marginBottom: 0 }}>5′ UTR upstream region</label>
              <span className={`seq-count ${currentLen === 1000 ? "valid" : ""}`}>
                {currentLen.toLocaleString()} / 1,000 bp
              </span>
            </div>
            <textarea
              className="stifal-textarea"
              value={sequence}
              onChange={(e) => setSequence(e.target.value)}
              placeholder={">sequence_name\nACGT… (1,000 bases)"}
              spellCheck="false"
              required
            />
            <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: ".25rem" }}>
              Paste plain DNA or FASTA. Whitespace and FASTA headers are ignored.
            </p>
          </div>

          <div>
            <label className="stifal-label">Minimum z-score</label>
            <input className="stifal-input" type="number" min="0" max="20" step="0.1"
              value={minZscore} onChange={(e) => setMinZscore(e.target.value)} required />
            <p style={{ fontSize: ".68rem", color: "var(--text-muted)", marginTop: ".25rem" }}>
              Shows highest-scoring site per TF model, excluding hits below this threshold.
            </p>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button className="stifal-submit-btn" type="submit" disabled={loading || currentLen !== 1000}>
            {loading ? "⏳ Scanning…" : "Run Prediction"}
          </button>
        </form>
      </aside>

      {/* ── Results panel ── */}
      <div className="stifal-results-panel">
        <div className="stifal-results-header">
          {result ? (
            <>
              <div>
                <p style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--lime)", fontWeight: 700 }}>
                  Prediction results
                </p>
                <h2 style={{ fontSize: "1rem" }}>{result.sequence_name}</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".7rem" }}>
                <div className="results-badge">
                  <strong>{result.hit_count}</strong>
                  <span>sites found</span>
                </div>
                {result.hit_count > 0 && (
                  <>
                    <button className="btn btn-secondary" onClick={downloadPng}>↓ PNG</button>
                    <button className="btn btn-secondary" onClick={downloadCsv}>↓ CSV</button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div>
              <p style={{ fontSize: ".65rem", textTransform: "uppercase", letterSpacing: ".1em", color: "var(--text-muted)", fontWeight: 700 }}>
                Results
              </p>
              <p style={{ fontSize: ".85rem", color: "var(--text-muted)", marginTop: ".2rem" }}>
                Submit a sequence to see predictions here.
              </p>
            </div>
          )}
        </div>

        <div className="stifal-results-body">
          {!result && !loading && (
            <div className="empty-state" style={{ flex: 1 }}>
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>🧬</p>
              <p>Paste a 1,000 bp upstream sequence and click <strong>Run Prediction</strong>.</p>
              <p style={{ fontSize: ".8rem", marginTop: ".5rem", color: "var(--text-muted)" }}>
                Coordinates: −1000 to −1 bp, with 0 at the transcription start site (TSS).
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state" style={{ flex: 1 }}>
              <div className="loading-spinner" />
              Scanning sequence against consensus models…
            </div>
          )}

          {result && result.hit_count === 0 && (
            <div className="empty-state">
              <p style={{ fontSize: "1.5rem", marginBottom: ".5rem" }}>🔍</p>
              <p>No consensus-site matches found above z-score {minZscore}.</p>
              <p style={{ fontSize: ".8rem", marginTop: ".4rem", color: "var(--text-muted)" }}>
                Try lowering the minimum z-score threshold.
              </p>
            </div>
          )}

          {result && result.hit_count > 0 && (
            <>
              <p style={{ fontSize: ".75rem", color: "var(--text-muted)" }}>
                Positions use upstream coordinates: −1000 to −1 bp (0 = TSS). Scanned {result.motifs_scanned} models.
              </p>

              <div ref={graphRef} className="gene-graph-container">
                <InteractiveGeneGraph data={result.motifs} geneId={result.sequence_name} />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>{RESULT_COLS.map(([, l]) => <th key={l}>{l}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.motifs.map((m, i) => (
                      <tr key={`${m.name}-${m.start}-${m.strand}-${i}`}>
                        {RESULT_COLS.map(([k]) => <td key={k}>{m[k] ?? "—"}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

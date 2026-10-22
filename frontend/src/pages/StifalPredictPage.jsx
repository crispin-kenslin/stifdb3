import { useRef, useState } from "react";
import { api } from "../api";
import InteractiveGeneGraph from "../components/InteractiveGeneGraph";

const resultColumns = [
  ["name", "Transcription factor"],
  ["family", "Family"],
  ["start", "Start (bp)"],
  ["end", "End (bp)"],
  ["zscore", "Z-score"],
  ["score", "Score"],
  ["threshold", "Model threshold"],
  ["strand", "Orientation"],
  ["sequence", "Matched window"],
];

function sequenceLength(value) {
  return value.replace(/^\s*>[^\n]*(?:\n|$)/gm, "").replace(/\s/g, "").length;
}

export default function StifalPredictPage() {
  const graphSectionRef = useRef(null);
  const [sequenceName, setSequenceName] = useState("Submitted sequence");
  const [sequence, setSequence] = useState("");
  const [minimumZscore, setMinimumZscore] = useState("1");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runPrediction = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const prediction = await api.predictStifal({
        sequence,
        sequence_name: sequenceName.trim() || "Submitted sequence",
        minimum_zscore: Number(minimumZscore),
      });
      setResult(prediction);
    } catch (requestError) {
      setError(String(requestError.message || requestError));
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    const headers = resultColumns.map(([, label]) => label);
    const rows = result.motifs.map((motif) => resultColumns.map(([key]) => motif[key] ?? ""));
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.sequence_name.replace(/[^a-z0-9_-]+/gi, "_")}-stifal-predictions.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadGraphPng = () => {
    const svg = graphSectionRef.current?.querySelector("svg.gene-graph");
    if (!svg) return;

    const svgCopy = svg.cloneNode(true);
    svgCopy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const viewBox = svg.viewBox.baseVal;
    const width = viewBox.width || svg.clientWidth || 1200;
    const height = viewBox.height || svg.clientHeight || 420;
    svgCopy.setAttribute("width", String(width));
    svgCopy.setAttribute("height", String(height));

    const svgUrl = URL.createObjectURL(
      new Blob([new XMLSerializer().serializeToString(svgCopy)], {
        type: "image/svg+xml;charset=utf-8",
      }),
    );
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width * 2;
      canvas.height = height * 2;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(svgUrl);
        setError("Could not create the graph image.");
        return;
      }

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((pngBlob) => {
        URL.revokeObjectURL(svgUrl);
        if (!pngBlob) {
          setError("Could not export the graph as PNG.");
          return;
        }

        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${result.sequence_name.replace(/[^a-z0-9_-]+/gi, "_")}-stifal-plot.png`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(pngUrl), 0);
      }, "image/png");
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      setError("Could not render the graph for PNG export.");
    };
    image.src = svgUrl;
  };

  const currentLength = sequenceLength(sequence);

  return (
    <main className="container stifal-page">
      <header className="stifal-header">
        <p className="eyebrow">STIFAL sequence analysis</p>
        <h1>Predict TF binding sites</h1>
        <p>Scan a 1,000 bp upstream region against the STIFAL plant transcription-factor consensus models.</p>
      </header>

      <form className="stifal-form" onSubmit={runPrediction}>
        <div className="stifal-form-heading">
          <h2>Input sequence</h2>
          <span className={currentLength === 1000 ? "sequence-count is-valid" : "sequence-count"}>
            {currentLength.toLocaleString()} / 1,000 bp
          </span>
        </div>
        <label className="stifal-label" htmlFor="sequence-name">Sequence name</label>
        <input
          id="sequence-name"
          className="stifal-name-input"
          value={sequenceName}
          maxLength={100}
          onChange={(event) => setSequenceName(event.target.value)}
        />
        <label className="stifal-label" htmlFor="stifal-sequence">5′ UTR upstream region (1,000 bp)</label>
        <textarea
          id="stifal-sequence"
          value={sequence}
          onChange={(event) => setSequence(event.target.value)}
          placeholder={">sequence_name\nACGT... (1,000 bases)"}
          spellCheck="false"
          required
        />

        <label className="stifal-label" htmlFor="minimum-zscore">Minimum z-score</label>
        <input
          id="minimum-zscore"
          className="stifal-name-input stifal-zscore-input"
          type="number"
          min="0"
          max="20"
          step="0.1"
          value={minimumZscore}
          onChange={(event) => setMinimumZscore(event.target.value)}
          required
        />
        <p className="stifal-filter-note">Shows the highest-scoring site(s) per transcription-factor model and excludes hits below this z-score.</p>
        <div className="stifal-form-footer">
          <span>Paste plain DNA or FASTA. Whitespace and FASTA headers are ignored.</span>
          <button className="stifal-submit" type="submit" disabled={loading || currentLength !== 1000}>
            {loading ? "Scanning…" : "Run prediction"}
          </button>
        </div>
        {error && <p className="error-msg stifal-error" role="alert">{error}</p>}
      </form>

      {result && (
        <section className="stifal-results" aria-live="polite">
          <div className="stifal-results-heading">
            <div>
              <p className="eyebrow">Prediction results</p>
              <h2>{result.sequence_name}</h2>
            </div>
            <div className="stifal-result-count">
              <strong>{result.hit_count}</strong>
              <span>sites found</span>
            </div>
          </div>
          <p className="stifal-coordinate-note">Positions use the upstream coordinate system: −1000 to −1 bp, with 0 at the transcription start site.</p>

          {result.hit_count > 0 ? (
            <>
              <section className="stifal-graph-section">
                <div className="stifal-graph-heading">
                  <h3>Binding-site map</h3>
                  <button className="button-secondary" type="button" onClick={downloadGraphPng}>
                    Download PNG
                  </button>
                </div>
                <div ref={graphSectionRef}>
                  <InteractiveGeneGraph data={result.motifs} geneId={result.sequence_name} />
                </div>
              </section>
              <div className="stifal-table-heading">
                <h3>Predicted sites</h3>
                <button className="button-secondary" type="button" onClick={downloadCsv}>
                  Download CSV
                </button>
              </div>
              <div className="table-wrap stifal-table-wrap">
                <table>
                  <thead>
                    <tr>{resultColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.motifs.map((motif, index) => (
                      <tr key={`${motif.name}-${motif.start}-${motif.strand}-${index}`}>
                        {resultColumns.map(([key]) => <td key={key}>{motif[key]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="stifal-empty">No exact consensus-site matches were found in this sequence.</p>
          )}
        </section>
      )}
    </main>
  );
}
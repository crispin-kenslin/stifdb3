import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import InteractiveGeneGraph from "../components/InteractiveGeneGraph";

export default function GeneDetailPage() {
  const { geneId } = useParams();
  const [tfbsData, setTfbsData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.geneTFBS(geneId)
      .then((tfbs) => {
        setTfbsData(tfbs);
      })
      .catch((e) => setError(String(e.message || e)));
  }, [geneId]);

  const downloadCurrentGeneCsv = () => {
    if (!tfbsData?.motifs?.length) return;

    const rows = tfbsData.motifs.map((motif, index) => ({
      index: index + 1,
      gene_id: motif.gene_id ?? geneId,
      tf_name: motif.name ?? "",
      start: motif.start ?? "",
      end: motif.end ?? "",
      zscore: motif.zscore ?? "",
      strand_orientation: motif.strand ?? motif.orientation ?? ""
    }));

    const csvHeaders = ["index", "gene_id", "tf_name", "start", "end", "zscore", "strand_orientation"];
    const content = [
      csvHeaders.join(","),
      ...rows.map((row) =>
        csvHeaders.map((header) => {
          const value = row[header] ?? "";
          const escaped = String(value).replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${geneId}-tfbs.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTfbsPng = () => {
    const svg = document.querySelector(".gene-graph");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const width = (svg.viewBox?.baseVal?.width || svg.clientWidth || 1200) * 2;
      const height = (svg.viewBox?.baseVal?.height || svg.clientHeight || 420) * 2;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${geneId}-tfbs-plot.png`;
        link.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  if (error) return <main className="container"><p className="error-msg">{error}</p></main>;
  if (!tfbsData) return <main className="container"><p>Loading...</p></main>;

  const motifRows = (tfbsData?.motifs || []).map((motif, index) => ({
    index: index + 1,
    tf_name: motif.name ?? "",
    start: motif.start ?? "",
    end: motif.end ?? "",
    zscore: motif.zscore ?? "",
    strand: motif.strand ?? motif.orientation ?? "",
  }));

  return (
    <main className="container gene-detail-page">
      <header className="gene-page-header">
        <div>
          <p className="eyebrow">TFBS profile</p>
          <h1>{geneId}</h1>
        </div>
      </header>
      
      {tfbsData && tfbsData.motifs && tfbsData.motifs.length > 0 && (
        <section className="graph-section">
          <h2>TFBS Visualization</h2>
          <InteractiveGeneGraph data={tfbsData.motifs} geneId={geneId} />


           <div className="download-actions">
          <button type="button" className="secondary-btn" onClick={downloadTfbsPng}>Download PNG</button>
          <button type="button" className="secondary-btn" onClick={downloadCurrentGeneCsv}>Download CSV</button>
        </div>

          <h3>TFBS Motif Table</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>TF Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Z-Score</th>
                  <th>Strand / Orientation</th>
                </tr>
              </thead>
              <tbody>
                {motifRows.map((row) => (
                  <tr key={`${row.tf_name}-${row.start}-${row.end}-${row.index}`}>
                    <td>{row.index}</td>
                    <td>{row.tf_name}</td>
                    <td>{row.start}</td>
                    <td>{row.end}</td>
                    <td>{row.zscore}</td>
                    <td>{row.strand}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

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

  if (error) return <main className="container"><p className="error-msg">{error}</p></main>;
  if (!tfbsData) return <main className="container"><p>Loading...</p></main>;

  const motifRows = (tfbsData?.motifs || []).map((motif, index) => ({
    index: index + 1,
    tf_name: motif.name ?? "",
    start: motif.start ?? "",
    end: motif.end ?? "",
    zscore: motif.zscore ?? "",
    strand: motif.strand ?? "",
  }));

  return (
    <main className="container gene-detail-page">
      <h1>Gene / TF Detail</h1>
      
      {tfbsData && tfbsData.motifs && tfbsData.motifs.length > 0 && (
        <section className="graph-section">
          <h2>TFBS Visualization</h2>
          <InteractiveGeneGraph data={tfbsData.motifs} geneId={geneId} />

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
                  <th>Strand</th>
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

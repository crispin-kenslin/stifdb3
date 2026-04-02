import { useParams } from "react-router-dom";

export default function TFBSPage() {
  const { tfbsName } = useParams();

  return (
    <main className="container">
      <h1>TFBS Details: {tfbsName}</h1>
      <div className="tfbs-content">
        <section className="card">
          <h2>About {tfbsName}</h2>
          <p>
            This is a transcription factor binding site (TFBS) motif found in regulatory regions of genes.
          </p>
          <div className="tfbs-info">
            <div className="info-row">
              <strong>TFBS Name:</strong> <span>{tfbsName}</span>
            </div>
            <div className="info-row">
              <strong>Type:</strong> <span>Binding Site Motif</span>
            </div>
            <div className="info-row">
              <strong>Function:</strong> <span>Transcriptional regulation in stress response</span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Related Information</h2>
          <p>
            Transcription factor binding sites play crucial roles in gene regulation,
            especially under stress conditions. This motif has been identified in 
            regulatory regions of stress-responsive genes.
          </p>
        </section>

        <section className="card">
          <h2>Occurrence Statistics</h2>
          <p>
            Statistical information about the occurrence and significance of this TFBS 
            across different genes and conditions will be displayed here.
          </p>
        </section>
      </div>
    </main>
  );
}

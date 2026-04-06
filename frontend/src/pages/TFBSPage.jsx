import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function TFBSPage() {
  const { tfbsName } = useParams();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!tfbsName) return;
    setError("");
    setDetail(null);
    api
      .tfbsDetail(tfbsName)
      .then((data) => setDetail(data))
      .catch((e) => setError(String(e.message || e)));
  }, [tfbsName]);

  if (error) {
    return (
      <main className="container">
        <h1>TFBS Details: {tfbsName}</h1>
        <p className="error-msg">{error}</p>
      </main>
    );
  }

  if (!detail) {
    return (
      <main className="container">
        <h1>TFBS Details: {tfbsName}</h1>
        <p>Loading TFBS details...</p>
      </main>
    );
  }

  const cropList = (detail.crops || []).map((crop) => crop.charAt(0).toUpperCase() + crop.slice(1));
  const functionText = typeof detail.function === "string" && detail.function.trim()
    ? detail.function.trim()
    : "Regulatory TFBS motif associated with transcriptional control in stress response.";

  return (
    <main className="container">
      <h1>TFBS Details: {detail.name || tfbsName}</h1>
      <div className="tfbs-content">
        <section className="card">
          <h2>About {detail.name || tfbsName}</h2>
          <p>
            Motif-specific summary generated from all loaded crop datasets.
          </p>
          <div className="tfbs-info">
            <div className="info-row">
              <strong>TFBS Name:</strong> <span>{detail.name || tfbsName}</span>
            </div>
            <div className="info-row">
              <strong>Function:</strong> <span>{functionText}</span>
            </div>
            <div className="info-row">
              <strong>Total Occurrences:</strong> <span>{detail.total_occurrences ?? 0}</span>
            </div>
            <div className="info-row">
              <strong>Unique Genes:</strong> <span>{detail.total_genes ?? 0}</span>
            </div>
            <div className="info-row">
              <strong>Total Crops:</strong> <span>{detail.total_crops ?? (detail.crops || []).length}</span>
            </div>
          </div>
        </section>

        <section className="card">
          <h2>Function Annotation</h2>
          <p>{functionText}</p>
        </section>

        <section className="card">
          <h2>Crop Distribution</h2>
          <p>
            {cropList.length ? cropList.join(", ") : "No crop records found for this TFBS."}
          </p>
        </section>

        <section className="card">
          <h2>Occurrence Statistics</h2>
          <div className="tfbs-info">
            <div className="info-row">
              <strong>Z-Score (min / avg / max):</strong>
              <span>
                {detail.zscore?.min ?? "N/A"} / {detail.zscore?.avg ?? "N/A"} / {detail.zscore?.max ?? "N/A"}
              </span>
            </div>
            <div className="info-row">
              <strong>Start Range:</strong>
              <span>
                {detail.start?.min ?? "N/A"} to {detail.start?.max ?? "N/A"}
              </span>
            </div>
            <div className="info-row">
              <strong>End Range:</strong>
              <span>
                {detail.end?.min ?? "N/A"} to {detail.end?.max ?? "N/A"}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

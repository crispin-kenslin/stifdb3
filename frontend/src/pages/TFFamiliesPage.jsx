import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function TFFamiliesPage() {
  const [tfFamilies, setTfFamilies] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.facets(), api.stats()])
      .then(([facetsData, statsData]) => {
        setTfFamilies(facetsData.tf_families || []);
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading TF families:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="container">
        <h1>TF Families</h1>
        <p>Loading TF family data...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Transcription Factor Families</h1>
      <p className="page-intro">
        Browse stress-responsive transcription factors organized by family. 
        Click on any TF family to view all genes belonging to that family.
      </p>

    

      <section className="tf-families-grid">
        {tfFamilies.map((family) => (
          <Link
            key={family}
            to={`/search?tf_family=${encodeURIComponent(family)}`}
            className="tf-family-card"
          >
            <h3>{family}</h3>
            <p className="tf-meta">View all genes →</p>
          </Link>
        ))}
      </section>

      {tfFamilies.length === 0 && (
        <div className="empty-state">
          <p>No TF families found in the database.</p>
        </div>
      )}
    </main>
  );
}

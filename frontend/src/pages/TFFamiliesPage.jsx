import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function TFFamiliesPage() {
  const navigate = useNavigate();
  const [tfFamilies, setTfFamilies] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [openFamily, setOpenFamily] = useState(null);

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
        For each family, choose whether to open matching genes or TFBS motif info.
      </p>

    

      <section className="tf-families-grid">
        {tfFamilies.map((family) => {
          const isOpen = openFamily === family;
          return (
            <article
              key={family}
              className={`tf-family-card${isOpen ? " open" : ""}`}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              aria-controls={`tf-actions-${encodeURIComponent(family)}`}
              onClick={() => setOpenFamily((prev) => (prev === family ? null : family))}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenFamily((prev) => (prev === family ? null : family));
                }
              }}
            >
              <h3>{family}</h3>

              {isOpen && (
                <div
                  className="tf-card-actions"
                  id={`tf-actions-${encodeURIComponent(family)}`}
                  role="group"
                  aria-label={`Actions for ${family}`}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/tfbs/${encodeURIComponent(family)}`)}
                  >
                    View Info
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/search?tf_family=${encodeURIComponent(family)}`)}
                  >
                    View Genes
                  </button>
                </div>
              )}

              <p className="tf-meta">
                {isOpen ? "Choose an action" : ""}
              </p>
            </article>
          );
        })}
      </section>

      {tfFamilies.length === 0 && (
        <div className="empty-state">
          <p>No TF families found in the database.</p>
        </div>
      )}
    </main>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export default function TFFamiliesPage() {
  const navigate = useNavigate();
  const [tfFamilies, setTfFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFamily, setOpenFamily] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.facets()
      .then((f) => { setTfFamilies(f.tf_families || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = search.trim()
    ? tfFamilies.filter((f) => f.toLowerCase().includes(search.toLowerCase()))
    : tfFamilies;

  return (
    <div className="tf-families-page">
      <div className="tf-families-header" style={{ maxWidth: 1400, margin: "0 auto", width: "100%", padding: "1rem 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p className="page-eyebrow">Transcription Factors</p>
            <h1 style={{ fontSize: "1.2rem" }}>TF Families</h1>
          </div>
          <div className="results-badge">
            <strong>{filtered.length}</strong>
            <span>families</span>
          </div>
        </div>
        <input
          style={{ marginTop: ".8rem", padding: ".45rem .8rem", background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text-primary)", fontSize: ".85rem", fontFamily: "inherit", width: 260 }}
          placeholder="Filter families…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="tf-families-body" style={{ maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No TF families found.</div>
        ) : (
          <div className="tf-families-grid">
            {filtered.map((family) => {
              const isOpen = openFamily === family;
              return (
                <article
                  key={family}
                  className={`tf-family-card ${isOpen ? "open" : ""}`}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => setOpenFamily((p) => p === family ? null : family)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenFamily((p) => p === family ? null : family);
                    }
                  }}
                >
                  <h3>{family}</h3>
                  {isOpen && (
                    <div className="tf-card-actions" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <button className="btn tf-action-btn tf-action-btn-info"
                        onClick={() => navigate(`/tfbs/${encodeURIComponent(family)}`)}>
                        Info
                      </button>
                      <button className="btn tf-action-btn tf-action-btn-genes"
                        onClick={() => navigate(`/search?tf_family=${encodeURIComponent(family)}`)}>
                        Genes
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

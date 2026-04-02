import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

export default function CropsListPage() {
  const [crops, setCrops] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    Promise.all([api.crops(), api.stats()])
      .then(([cropsData, statsData]) => {
        setCrops(cropsData.crops || []);
        setStats(statsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading crops:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main className="container">
        <h1>Crop Species</h1>
        <p>Loading crop data...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <h1>Crop Species in STIFDB3</h1>
      <p className="page-intro">
        Browse transcription factors by crop species. Click on any crop to view all genes and TFs for that species.
      </p>

      <section className="stats-summary">
        <div className="summary-card">
          <span className="summary-number">{stats.total_crops || crops.length}</span>
          <span className="summary-label">Crop Species</span>
        </div>
        <div className="summary-card">
          <span className="summary-number">{stats.total_genes || 0}</span>
          <span className="summary-label">Total Genes</span>
        </div>
      </section>

      <section className="crops-grid">
        {crops.map((crop) => (
          <Link
            key={crop}
            to={`/crop/${encodeURIComponent(crop)}`}
            className="crop-card"
          >
            <div className="crop-icon">
              <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="#1565C0" strokeWidth="3" fill="#E3F2FD"/>
                <path d="M50 20 Q35 35 50 50 Q65 35 50 20" fill="#4CAF50"/>
                <path d="M50 50 Q35 65 50 80 Q65 65 50 50" fill="#66BB6A"/>
                <circle cx="50" cy="50" r="5" fill="#1565C0"/>
              </svg>
            </div>
            <h3>{capitalizeFirst(crop)}</h3>
            <p className="crop-meta">Click to browse genes</p>
          </Link>
        ))}
      </section>

      {crops.length === 0 && (
        <div className="empty-state">
          <p>No crop species found in the database.</p>
        </div>
      )}
    </main>
  );
}

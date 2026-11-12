import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

const BOTANICAL_NAMES = {
  arabidopsis: "Arabidopsis thaliana",
  cotton: "Gossypium hirsutum",
  maize: "Zea mays",
  potato: "Solanum tuberosum",
  rapeseed: "Brassica napus",
  rice: "Oryza sativa",
  sorghum: "Sorghum bicolor",
  soybean: "Glycine max",
  tomato: "Solanum lycopersicum",
  wheat: "Triticum aestivum",
};

const CROP_COLORS = {
  arabidopsis: { bg: "#f0fdf4", border: "#22c55e", icon: "🌿", accent: "#16a34a" },
  cotton: { bg: "#fdf2f8", border: "#ec4899", icon: "☁️", accent: "#6970afff" },
  maize: { bg: "#fdf4ff", border: "#d946ef", icon: "🌽", accent: "#c026d3" },
  potato: { bg: "#eff6ff", border: "#3b82f6", icon: "🥔", accent: "#2563eb" },
  rapeseed: { bg: "#fffbeb", border: "#f59e0b", icon: "🌼", accent: "#d97706" },
  rice: { bg: "#fefce8", border: "#eab308", icon: "🌾", accent: "#ca8a04" },
  sorghum: { bg: "#f0fdfa", border: "#14b8a6", icon: "🌱", accent: "#0d9488" },
  soybean: { bg: "#ecfdf5", border: "#10b981", icon: "🫘", accent: "#059669" },
  tomato: { bg: "#fff1f2", border: "#f43f5e", icon: "🍅", accent: "#e11d48" },
  wheat: { bg: "#fff7ed", border: "#f97316", icon: "🌾", accent: "#ea580c" },
};
const DEFAULT_COLOR = { bg: "#f8fafc", border: "#94a3b8", icon: "🌱", accent: "#64748b" };

export default function BrowsePage() {
  const [cropSummary, setCropSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stressTypes, setStressTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.crops(),
      api.stressTypes ? api.stressTypes() : Promise.resolve({ stress_types: [] }),
    ])
      .then(([cropsData, stressData]) => {
        setCropSummary(cropsData?.summary || []);
        setStressTypes(stressData?.stress_types || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="browse-page">
      <div className="browse-header">
        <p className="page-eyebrow">Genome Database Catalog</p>
        <h1>Browse Crop Species &amp; Transcription Factors</h1>
      </div>

      <div className="browse-body">
        <p className="browse-section-title">Plant Species in STIFDB3 ({cropSummary.length})</p>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" /> Loading species data from backend...
          </div>
        ) : (
          <div className="browse-card-grid">
            {cropSummary.map((item) => {
              const cKey = item.crop.toLowerCase();
              const sci = BOTANICAL_NAMES[cKey] || cap(item.crop);
              const colors = CROP_COLORS[cKey] || DEFAULT_COLOR;

              return (
                <button
                  key={item.crop}
                  type="button"
                  className="browse-crop-card"
                  onClick={() => navigate(`/crop/${encodeURIComponent(item.crop)}`)}
                  style={{
                    "--card-bg": colors.bg,
                    "--card-border": colors.border,
                    "--card-accent": colors.accent,
                  }}
                >
                  <div className="browse-crop-card-header">
                    <span className="browse-crop-icon">{colors.icon}</span>
                    <span className="browse-crop-title">{cap(item.crop)}</span>
                  </div>
                  <div className="browse-crop-details">
                    <span className="browse-crop-sci">{sci}</span>
                    <div className="browse-crop-stats-row">
                      <span><strong>{item.total_records.toLocaleString()}</strong> TFBS</span>
                      <span><strong>{item.unique_genes.toLocaleString()}</strong> Genes</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {stressTypes && stressTypes.length > 0 && (
          <div className="browse-stress-section">
            <span className="browse-stress-label">Stress Annotations:</span>
            <div className="browse-stress-pills">
              {stressTypes.map((st) => (
                <button
                  key={st}
                  type="button"
                  className="browse-stress-pill"
                  onClick={() => navigate(`/search?stress=${encodeURIComponent(st)}`)}
                >
                  {cap(st)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

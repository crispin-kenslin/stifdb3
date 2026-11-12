import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

/* ── Continuous DNA Sequence for 5-nt Sliding Window Scanner ── */
const FULL_SEQUENCE = "AGCTGACACGTGATGCCTTTGACCGCTAGGCTAACTACGACAGTCGCTACACGTGTTAGGTACTTGACCGCCGTCGA";

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

/* Bright color palette for crop cards */
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

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

function useCounting(target, duration = 800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(target * ease));
      if (p < 1) requestAnimationFrame(tick);
      else setCount(target);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

/* ── Subtle 5-bp TF Binding Sites ── */
const SUBTLE_TFBS = [
  { start: 7, end: 12 },   // 5 bp
  { start: 27, end: 32 },  // 5 bp
  { start: 50, end: 55 },  // 5 bp
];

/* ── Motif Scanner: 5-Sequence Sliding Window Box ── */
function MotifScanner() {
  const [windowPos, setWindowPos] = useState(0);
  const WINDOW_SIZE = 5;
  const seqLen = FULL_SEQUENCE.length;

  useEffect(() => {
    let raf;
    let pos = 0;
    let dir = 1;
    const speed = 0.22;

    const animate = () => {
      pos += speed * dir;
      if (pos >= seqLen - WINDOW_SIZE) {
        dir = -1;
        pos = seqLen - WINDOW_SIZE;
      }
      if (pos <= 0) {
        dir = 1;
        pos = 0;
      }
      setWindowPos(pos);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [seqLen]);

  // Calculate sliding box position in percentages
  const leftPercent = (windowPos / seqLen) * 100;
  const widthPercent = (WINDOW_SIZE / seqLen) * 100;

  return (
    <div className="scanner-widget">
      <div className="scanner-widget-header">
        <div className="scanner-brand-row">
          <span className="scanner-logo-tag">STIFAL</span>
          <span className="scanner-divider">|</span>
          <span className="scanner-seq-label">Motif Scanner</span>
        </div>
      </div>

      <div className="scanner-track">
        {/* Blue Sliding box covering 5 sequences */}
        <div
          className="scanner-sliding-box"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
          }}
        >
          <div className="sliding-box-inner" />
        </div>

        {/* DNA sequence with subtle 5-bp TFBS highlights */}
        <div className="scanner-dna-row">
          {FULL_SEQUENCE.split("").map((ch, i) => {
            const isSubtle = SUBTLE_TFBS.some(site => i >= site.start && i < site.end);
            return (
              <span
                key={i}
                className={`seq-char ${isSubtle ? "seq-subtle-site" : ""}`}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>

      <div className="scanner-footer">
        <Link to="/predict" className="scanner-open-btn">Open Full Predictor →</Link>
      </div>
    </div>
  );
}

/* ── Electron Orbiting Animation: Crops & Stresses ── */
function ElectronOrbitAnimation({ crops = [], stresses = [] }) {
  const navigate = useNavigate();
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    let raf;
    let a = 0;
    const animate = () => {
      a += 0.005; // Smooth orbital rotation speed
      setAngle(a);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Distinct sets for orbits
  const displayCrops = crops.length > 0 ? crops.slice(0, 8) : [
    "Arabidopsis", "Cotton", "Maize", "Potato", "Rapeseed", "Rice", "Sorghum", "Wheat"
  ];
  const displayStresses = stresses.length > 0 ? stresses.slice(0, 6) : [
    "Drought", "Salinity", "Cold", "Heat", "Osmotic", "ABA"
  ];

  // Orbital radii (guaranteed non-overlapping ellipses, enlarged and centered)
  // Outer orbit: Crops
  const Rx_crop = 185;
  const Ry_crop = 92;

  // Inner orbit: Stresses (well clear of outer orbit)
  const Rx_stress = 100;
  const Ry_stress = 48;

  return (
    <div className="electron-orbit-section" aria-label="Orbital crop and stress visualization">
      <div className="atom-stage">
        {/* Center Nucleus */}
        <div className="atom-nucleus" title="STIFDB3 Regulatory Core">
          <div className="nucleus-glow" />
          <span className="nucleus-text">STIF</span>
        </div>

        {/* Outer Orbit Guide Track (Crops) */}
        <div
          className="orbit-ellipse-track track-crops"
          style={{
            width: `${Rx_crop * 2}px`,
            height: `${Ry_crop * 2}px`,
          }}
        />

        {/* Inner Orbit Guide Track (Stresses) */}
        <div
          className="orbit-ellipse-track track-stresses"
          style={{
            width: `${Rx_stress * 2}px`,
            height: `${Ry_stress * 2}px`,
          }}
        />

        {/* Orbiting Stresses (Inner Orbit, Counter-Clockwise, Always Horizontal) */}
        {displayStresses.map((stress, idx) => {
          const a = -angle * 1.2 + (idx * 2 * Math.PI) / displayStresses.length;
          const x = Rx_stress * Math.cos(a);
          const y = Ry_stress * Math.sin(a);

          return (
            <button
              key={`stress-${stress}`}
              type="button"
              className="electron-particle electron-stress"
              onClick={() => navigate(`/search?q=${encodeURIComponent(stress)}`)}
              title={`Search ${stress} responsive genes`}
              style={{
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              }}
            >
              <span className="electron-sparkle stress-sparkle" />
              <span className="electron-label">{stress}</span>
            </button>
          );
        })}

        {/* Orbiting Crops (Outer Orbit, Clockwise, Always Horizontal) */}
        {displayCrops.map((crop, idx) => {
          const a = angle + (idx * 2 * Math.PI) / displayCrops.length;
          const x = Rx_crop * Math.cos(a);
          const y = Ry_crop * Math.sin(a);

          return (
            <button
              key={`crop-${crop}`}
              type="button"
              className="electron-particle electron-crop"
              onClick={() => navigate(`/crop/${crop.toLowerCase()}`)}
              title={`Explore ${cap(crop)} transcription factors`}
              style={{
                transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              }}
            >
              <span className="electron-sparkle crop-sparkle" />
              <span className="electron-label">{cap(crop)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState({ total_genes: 0, total_tfs: 0, total_crops: 0 });
  const [cropSummary, setCropSummary] = useState([]);
  const [stressTypes, setStressTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);

  const geneCount = useCounting(loading ? 0 : stats.total_genes);
  const tfCount = useCounting(loading ? 0 : stats.total_tfs);
  const cropCount = useCounting(loading ? 0 : stats.total_crops);

  useEffect(() => {
    let disposed = false;
    const loadData = async (attempt = 1) => {
      try {
        const [statsData, cropsData, stressData] = await Promise.all([
          api.stats(),
          api.crops(),
          api.stressTypes(),
        ]);
        if (disposed) return;
        setStats(statsData || { total_genes: 0, total_tfs: 0, total_crops: 0 });
        setCropSummary(cropsData?.summary || []);
        setStressTypes(stressData?.stress_types || []);
        setLoading(false);
      } catch (err) {
        if (disposed) return;
        if (attempt < 4) {
          setTimeout(() => loadData(attempt + 1), attempt * 400);
          return;
        }
        setLoading(false);
        setLoadError(String(err?.message || "Failed to connect to backend service."));
      }
    };
    loadData();
    return () => { disposed = true; };
  }, []);

  // Live search
  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); setShowResults(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.search({ q: search, limit: 6 });
        setSearchResults(r.items || []);
        setShowResults(true);
      } catch { /* silent */ }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!searchRef.current?.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setShowResults(false);
    }
  }

  function selectResult(item) {
    const geneId = item.gene_id || item.Gene_ID || item.GeneID || item.Gene || Object.values(item)[0];
    navigate(`/gene/${encodeURIComponent(geneId)}`);
    setSearch("");
    setShowResults(false);
  }

  const cropNames = cropSummary.map(c => c.crop);

  return (
    <div className="home-root">
      <div className="home-main-grid">
        {/* ── LEFT PANEL: DB Info & Branding + Electron Orbiting Animation ── */}
        <div className="home-left-panel">
          <div className="home-left-inner">
            <div className="db-brand-section">
              {/* <h1 className="db-title">STIFDB3</h1> */}
              <p className="db-full-name">Stress-responsive Transcription Factor Database</p>
            </div>

            <p className="db-intro-text">
              STIFDB3 is a curated plant transcriptomics resource identifying stress-responsive
              transcription factor binding sites across major crop genomes using genome-wide promoter analyses.
            </p>

            {/* Stats Bar */}
            <div className="home-stats-grid">
              <Link to="/search" className="home-stat-card stat-green" title="View all records">
                <span className="home-stat-val">{loading ? "—" : geneCount.toLocaleString()}</span>
                <span className="home-stat-lbl">TFBS Records</span>
              </Link>
              <Link to="/tf-families" className="home-stat-card stat-blue" title="View TF families">
                <span className="home-stat-val">{loading ? "—" : tfCount}</span>
                <span className="home-stat-lbl">TF Families</span>
              </Link>
              <Link to="/browse" className="home-stat-card stat-purple" title="Browse crops">
                <span className="home-stat-val">{loading ? "—" : cropCount}</span>
                <span className="home-stat-lbl">Crop Species</span>
              </Link>
            </div>

            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="home-search-wrap" ref={searchRef}>
              <span className="home-search-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                className="home-search-input"
                type="text"
                placeholder="Search by Gene ID, TF Family, or Keyword"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="home-search-btn">Search</button>

              {showResults && searchResults.length > 0 && (
                <div className="search-dropdown">
                  {searchResults.map((item, i) => {
                    const geneId = item.gene_id || item.Gene_ID || item.GeneID || item.Gene || Object.values(item)[0];
                    const crop = item._crop || "";
                    const tf = item.TF_Name || item.tf_name || item.TF_Family || item.tf_family || "";
                    return (
                      <div key={`${geneId}-${i}`} className="search-dropdown-item" onClick={() => selectResult(item)}>
                        <strong>{geneId}</strong>
                        <span className="search-dropdown-meta"> · {cap(crop)}{tf ? ` · ${tf}` : ""}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>

            {loadError && <p className="error-msg">{loadError}</p>}

            {/* Quick-action links */}
            <div className="home-quick-links">
              <Link to="/predict" className="action-pill action-pill-primary">STIFAL Predictor</Link>
              <Link to="/tf-families" className="action-pill action-pill-outline">TF Families</Link>
              <Link to="/help" className="action-pill action-pill-outline">Documentation</Link>
            </div>

            {/* ── Below the information pane: Electron Orbiting Animation ── */}
            <ElectronOrbitAnimation crops={cropNames} stresses={stressTypes} />

            {/* <div className="db-credits">
              <p>Developed at CAPS, NCBS-TIFR, Bangalore</p>
            </div> */}
          </div>
        </div>

        {/* ── RIGHT PANEL: Crop Browse + Motif Scanner ── */}
        <div className="home-right-panel">
          {/* Crop Species Browse Section */}
          <div className="home-crops-section">
            <div className="crops-section-header">
              <div>
                <h2 className="crops-section-title">Browse by Species</h2>
                <p className="crops-section-sub">
                  {cropSummary.length} species · {stats.total_genes.toLocaleString()} TFBS entries
                </p>
              </div>
              <Link to="/browse" className="crops-browse-link">View All →</Link>
            </div>

            <div className="crops-scroll-area">
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner" /> Fetching species data...
                </div>
              ) : (
                <div className="home-crops-grid">
                  {cropSummary.map((item) => {
                    const cKey = item.crop.toLowerCase();
                    const sciName = BOTANICAL_NAMES[cKey] || cap(item.crop);
                    const colors = CROP_COLORS[cKey] || DEFAULT_COLOR;

                    return (
                      <button
                        key={item.crop}
                        type="button"
                        className="home-crop-card"
                        onClick={() => navigate(`/crop/${item.crop}`)}
                        title={`Explore ${cap(item.crop)} transcription factors`}
                        style={{
                          "--card-bg": colors.bg,
                          "--card-border": colors.border,
                          "--card-accent": colors.accent,
                        }}
                      >
                        <div className="crop-icon-circle">
                          <span className="crop-icon-emoji">{colors.icon}</span>
                        </div>
                        <div className="crop-card-info">
                          <span className="crop-card-name">{cap(item.crop)}</span>
                          <span className="crop-card-sci">{sciName}</span>
                        </div>
                        <div className="crop-card-nums">
                          <span><strong>{item.total_records.toLocaleString()}</strong> TFBS</span>
                          <span><strong>{item.unique_genes.toLocaleString()}</strong> Genes</span>
                          {/* <span><strong>{item.tf_count}</strong> TFs</span> */}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Motif Scanner Section: 5-nt sliding window box */}
          <div className="home-scanner-section">
            <MotifScanner />
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

export default function HomePage() {
  const [stats, setStats] = useState({ total_genes: 0, total_tfs: 0, total_crops: 0 });
  const [displayStats, setDisplayStats] = useState({ total_genes: 0, total_tfs: 0, total_crops: 0 });
  const [crops, setCrops] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stressTypes] = useState(["Drought", "Heat", "Cold", "Salt", "Biotic"]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let disposed = false;

    const loadStats = async (attempt = 1) => {
      try {
        const s = await api.stats();
        if (disposed) return;
        setStats(s);
        setLoadingStats(false);
        setLoadError("");
        animateCount("total_genes", 0, s.total_genes || 0, 800);
        animateCount("total_tfs", 0, s.total_tfs || 0, 800);
        animateCount("total_crops", 0, s.total_crops || 0, 800);
      } catch (err) {
        if (disposed) return;
        if (attempt < 4) {
          setTimeout(() => loadStats(attempt + 1), attempt * 400);
          return;
        }
        setLoadingStats(false);
        setLoadError(String(err?.message || err || "Failed to load homepage stats."));
      }
    };

    const loadCrops = async (attempt = 1) => {
      try {
        const c = await api.crops();
        if (disposed) return;
        const cropList = Array.from(new Set(c?.crops || [])).sort((a, b) => a.localeCompare(b));
        setCrops(cropList);
        setLoadingCrops(false);
      } catch (err) {
        if (disposed) return;
        if (attempt < 4) {
          setTimeout(() => loadCrops(attempt + 1), attempt * 400);
          return;
        }
        setLoadingCrops(false);
        setLoadError((prev) => prev || String(err?.message || err || "Failed to load crops."));
      }
    };

    loadStats();
    loadCrops();

    return () => {
      disposed = true;
    };
  }, []);

  const animateCount = (key, start, end, duration) => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(start + (end - start) * easeOutQuart);
      
      setDisplayStats(prev => ({ ...prev, [key]: current }));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  };

  useEffect(() => {
    if (search.trim().length > 1) {
      const timer = setTimeout(() => {
        api.search({ q: search, limit: 5 }).then((result) => {
          setSearchResults(result.items || []);
          setShowResults(true);
        });
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [search]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
      setShowResults(false);
    }
  }

  function selectResult(geneId) {
    navigate(`/gene/${encodeURIComponent(geneId)}`);
    setSearch("");
    setShowResults(false);
  }

  const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  function refreshHomeData() {
    setLoadingStats(true);
    setLoadingCrops(true);
    setLoadError("");
    api.stats().then((s) => {
      setStats(s);
      animateCount("total_genes", 0, s.total_genes || 0, 800);
      animateCount("total_tfs", 0, s.total_tfs || 0, 800);
      animateCount("total_crops", 0, s.total_crops || 0, 800);
      setLoadingStats(false);
    }).catch((err) => {
      setLoadingStats(false);
      setLoadError(String(err?.message || err || "Failed to refresh stats."));
    });

    api.crops().then((c) => {
      const cropList = Array.from(new Set(c?.crops || [])).sort((a, b) => a.localeCompare(b));
      setCrops(cropList);
      setLoadingCrops(false);
    }).catch((err) => {
      setLoadingCrops(false);
      setLoadError((prev) => prev || String(err?.message || err || "Failed to refresh crops."));
    });
  }

  return (
    <main className="container homepage">
      <section className="hero-science">
        <div className="hero-copy">
          <p className="eyebrow">Plant stress transcriptomics</p>
          <h1 className="main-title">Stress-responsive TranscrIption Factors DataBase</h1>
          <p className="body-text">
            STIFDB3 brings together transcription factor families, crop-specific gene records,
            and stress-response biology in a single research-ready interface.
          </p>

          <div className="hero-actions">
            <Link to="/browse" className="primary-link">Explore crops</Link>
            <Link to="/search" className="secondary-link">Search genes</Link>
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="signal-grid" />
          <div className="signal-wave wave-one" />
          <div className="signal-wave wave-two" />
          <div className="signal-wave wave-three" />

          <div className="science-orbit">
            {crops.slice(0, 6).map((crop, index) => {
              const angle = (index * 360) / Math.max(crops.slice(0, 6).length, 1) - 90;
              const radius = 170;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <span
                  key={crop}
                  className="orbit-badge"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${index * 0.25}s`,
                  }}
                >
                  {capitalizeFirst(crop)}
                </span>
              );
            })}
          </div>

          <div className="database-visual">
            <div className="network-ring ring-one" />
            <div className="network-ring ring-two" />
            <div className="network-ring ring-three" />
            <div className="gene-node node-a" />
            <div className="gene-node node-b" />
            <div className="gene-node node-c" />
            <div className="gene-node node-d" />
            <div className="dna-helix">
              <span className="helix-strand left" />
              <span className="helix-strand right" />
            </div>
            <div className="core-hub">
              <span>STIF</span>
            </div>
          </div>

          <div className="floating-node node-one">Abiotic</div>
          <div className="floating-node node-two">Tolerance</div>
          <div className="floating-node node-three">Regulation</div>
          <div className="floating-node node-four">Defense</div>
        </div>
      </section>

      <section className="search-section">
        <form onSubmit={handleSearchSubmit} className="search-container">
          <input
            type="text"
            className="search-input-large"
            placeholder="Search Gene ID, TF family, orientation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="search-button">Search</button>
        </form>

        <div className="micro-metrics">
          <Link to="/search" className="metric-pill clickable">
            <strong>{loadingStats ? "..." : displayStats.total_genes.toLocaleString()}</strong>
            <span>Genes</span>
          </Link>
          <Link to="/tf-families" className="metric-pill clickable">
            <strong>{loadingStats ? "..." : displayStats.total_tfs}</strong>
            <span>TF families</span>
          </Link>
          <Link to="/crops" className="metric-pill clickable">
            <strong>{loadingStats ? "..." : displayStats.total_crops}</strong>
            <span>Crops</span>
          </Link>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="search-results-dropdown">
            {searchResults.map((item) => {
              const geneId = item.gene_id || item.Gene_ID || item.GeneID || Object.values(item)[0];
              const crop = item._crop || item.crop || "N/A";
              return (
                <div
                  key={geneId}
                  className="search-result-item"
                  onClick={() => selectResult(geneId)}
                >
                  <strong>{geneId}</strong>
                  <span className="result-meta"> - {capitalizeFirst(crop)} - {item.TF_family || item.tf_family || "N/A"}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {loadError && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <p className="error-msg">{loadError}</p>
          <button type="button" className="search-button" onClick={refreshHomeData}>Retry Homepage Load</button>
        </section>
      )}

      <section className="circular-navigation-wrapper">
        <div className="circle-section">
          <h3 className="circle-title">Select by crops</h3>
          <div className="circle-container">
            <div className="center-circle">
              <span className="center-text">CROPS</span>
            </div>
            {!loadingCrops && crops.map((crop, index) => {
              const angle = (index * 360) / Math.max(crops.length, 1) - 90;
              const radius = 175;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <Link
                  key={crop}
                  to={`/crop/${encodeURIComponent(crop)}`}
                  className="orbit-item"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {capitalizeFirst(crop)}
                </Link>
              );
            })}
            {!loadingCrops && crops.length === 0 && (
              <div className="orbit-item" style={{ left: "50%", top: "12%", transform: "translate(-50%, -50%)" }}>
                No crops loaded
              </div>
            )}
          </div>
        </div>

        <div className="circle-section">
          <h3 className="circle-title">Select by stress</h3>
          <div className="circle-container">
            <div className="center-circle stress">
              <span className="center-text">STRESS</span>
            </div>
            {stressTypes.map((stress, index) => {
              const angle = (index * 360) / stressTypes.length - 90;
              const radius = 175;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <div
                  key={stress}
                  className="orbit-item stress"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(stress)}`)}
                >
                  {stress}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="explore-strip">
        <div className="explore-pill" onClick={() => navigate("/browse")}>Browse crops</div>
        <div className="explore-pill" onClick={() => navigate("/search?q=stress")}>Stress response</div>
        <div className="explore-pill" onClick={() => navigate("/help")}>Methods</div>
        <div className="explore-pill" onClick={() => navigate("/tf-families")}>TF families</div>
      </section>
    </main>
  );
}

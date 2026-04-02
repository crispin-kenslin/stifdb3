import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";

const sliderImageModules = import.meta.glob("../static/images/slider/slider-*.png", {
  eager: true,
  import: "default",
});

const sliderImages = Object.entries(sliderImageModules)
  .sort(([pathA], [pathB]) => {
    const indexA = Number((pathA.match(/slider-(\d+)\.png$/) || [])[1] || 0);
    const indexB = Number((pathB.match(/slider-(\d+)\.png$/) || [])[1] || 0);
    return indexA - indexB;
  })
  .map(([, src]) => src);

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (sliderImages.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

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

  function goToPrevSlide() {
    if (sliderImages.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  }

  function goToNextSlide() {
    if (sliderImages.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
  }

  return (
    <main className="container homepage">
      {/* Hero Section */}
      <section className="hero-new">
        <h1 className="main-title">Stress-Responsive Transcription Factors Database</h1>
        <p className="subtitle">Explore stress-responsive transcription factors across multiple crop species</p>
        <p className="body-text">STIFDB3 is a collection of Stress Responsive Transcription Factors of 13 crops.</p>

        <div className="hero-media-stack">
          <div className="hero-slider" aria-label="Homepage image slider">
            {sliderImages.length > 0 ? (
              <>
                <img
                  key={currentSlide}
                  src={sliderImages[currentSlide]}
                  alt={`STIFDB3 slider ${currentSlide + 1}`}
                  className="hero-slider-image"
                />
              </>
            ) : (
              <div className="slider-empty-state">Add images in src/static/images/slider (slider-1.png, slider-2.png...)</div>
            )}
          </div>

        </div>
      </section>

      {/* Interactive Search Bar */}
      <section className="search-section">
        <form onSubmit={handleSearchSubmit} className="search-container">
          <input
            type="text"
            className="search-input-large"
            placeholder="Search Gene ID, TF Family, Chromosome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="search-button">Search</button>
        </form>
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

      {/* Stats Cards with Animation - Now Clickable */}
      <section className="stats-grid">
        <Link to="/search" className="stat-card clickable">
          <div className="stat-number animated">
            {loadingStats ? "..." : displayStats.total_genes.toLocaleString()}
          </div>
          <div className="stat-label">Total Genes</div>
        </Link>
        <Link to="/tf-families" className="stat-card clickable">
          <div className="stat-number animated">{loadingStats ? "..." : displayStats.total_tfs}</div>
          <div className="stat-label">TF Families</div>
        </Link>
        <Link to="/crops" className="stat-card clickable">
          <div className="stat-number animated">{loadingStats ? "..." : displayStats.total_crops}</div>
          <div className="stat-label">Crop Species</div>
        </Link>
      </section>

      {loadError && (
        <section className="card" style={{ marginTop: "1rem" }}>
          <p className="error-msg">{loadError}</p>
          <button type="button" className="search-button" onClick={refreshHomeData}>Retry Homepage Load</button>
        </section>
      )}

      {/* Browse Section Title */}
      <section className="browse-header">
        <h2>Browse Database</h2>
      </section>

      {/* Side-by-Side Circular Navigation */}
      <section className="circular-navigation-wrapper">
        {/* Crops Circle */}
        <div className="circle-section">
          <h3 className="circle-title">Browse by Crops</h3>
          <div className="circle-container">
            <div className="center-circle">
              <span className="center-text">CROPS</span>
            </div>
            {!loadingCrops && crops.map((crop, index) => {
              const angle = (index * 360) / crops.length - 90;
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

        {/* Stress Circle */}
        <div className="circle-section">
          <h3 className="circle-title">Browse by Stress</h3>
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

      {/* Quick Links */}
      <section className="quick-links">
        <div className="link-grid">
          <Link to="/search" className="quick-link-card">
            <h3>Advanced Search</h3>
            <p>Search with filters and export results</p>
          </Link>
          <Link to="/help" className="quick-link-card">
            <h3>Help & Documentation</h3>
            <p>Learn how to use the database effectively</p>
          </Link>
        </div>
      </section>
    </main>
  );
}

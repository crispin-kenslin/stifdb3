import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const STRESS_TYPES = ["Drought", "Heat", "Cold", "Salt", "Biotic"];

export default function BrowsePage() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.crops()
      .then((c) => {
        const cropList = Array.from(new Set(c?.crops || [])).sort((a, b) => a.localeCompare(b));
        setCrops(cropList);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  function openCrop(crop) {
    navigate(`/search?crop=${encodeURIComponent(crop)}`);
  }

  function openStress(stress) {
    navigate(`/search?q=${encodeURIComponent(stress)}`);
  }

  return (
    <main className="container browse-page">
      <h1>Browse by Crop and Stress</h1>
      <p className="page-intro">
        Open filtered results instantly by clicking any crop or stress card.
      </p>

      <section className="browse-panel">
        <h2>Browse Crops</h2>
        {loading ? (
          <p>Loading crops...</p>
        ) : (
          <div className="browse-card-grid">
            {crops.map((crop) => (
              <button
                type="button"
                key={crop}
                className="browse-option-card"
                onClick={() => openCrop(crop)}
              >
                <span className="browse-option-title">{capitalizeFirst(crop)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="browse-panel">
        <h2>Browse Stresses</h2>
        <div className="browse-card-grid stress-grid">
          {STRESS_TYPES.map((stress) => (
            <button
              type="button"
              key={stress}
              className="browse-option-card stress"
              onClick={() => openStress(stress)}
            >
              <span className="browse-option-title">{stress}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

const STRESS_TYPES = ["Drought", "Heat", "Cold", "Salt", "Biotic"];

export default function BrowsePage() {
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedStress, setSelectedStress] = useState("");
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

  const canBrowse = useMemo(() => selectedCrop || selectedStress, [selectedCrop, selectedStress]);

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  function openBrowseResults() {
    const params = new URLSearchParams();
    if (selectedCrop) params.set("crop", selectedCrop);
    if (selectedStress) params.set("q", selectedStress);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <main className="container browse-page">
      <h1>Browse by Crop and Stress</h1>
      <p className="page-intro">
        Select a crop and/or stress type, then open filtered results.
      </p>

      <section className="browse-panel">
        <h2>Select Crop</h2>
        {loading ? (
          <p>Loading crops...</p>
        ) : (
          <div className="browse-chip-grid">
            {crops.map((crop) => (
              <button
                type="button"
                key={crop}
                className={`browse-chip ${selectedCrop === crop ? "active" : ""}`}
                onClick={() => setSelectedCrop((prev) => (prev === crop ? "" : crop))}
              >
                {capitalizeFirst(crop)}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="browse-panel">
        <h2>Select Stress</h2>
        <div className="browse-chip-grid">
          {STRESS_TYPES.map((stress) => (
            <button
              type="button"
              key={stress}
              className={`browse-chip stress ${selectedStress === stress ? "active" : ""}`}
              onClick={() => setSelectedStress((prev) => (prev === stress ? "" : stress))}
            >
              {stress}
            </button>
          ))}
        </div>
      </section>

      <section className="browse-actions">
        <button type="button" className="search-button" disabled={!canBrowse} onClick={openBrowseResults}>
          Browse Selected
        </button>
        <button
          type="button"
          className="button-secondary"
          onClick={() => {
            setSelectedCrop("");
            setSelectedStress("");
          }}
        >
          Clear Selection
        </button>
      </section>
    </main>
  );
}

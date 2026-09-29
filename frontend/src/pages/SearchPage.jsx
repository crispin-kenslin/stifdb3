import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [crops, setCrops] = useState([]);
  const [facets, setFacets] = useState({ tf_families: [], strands: [] });
  const [tfFamilyOpen, setTfFamilyOpen] = useState(false);
  const [form, setForm] = useState({
    q: searchParams.get("q") || "",
    crop: searchParams.get("crop") || "",
    tf_family: searchParams.get("tf_family") || "",
    strand: searchParams.get("strand") || ""
  });

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    api.crops().then((c) => {
      setCrops(c.crops || []);
    });
  }, []);

  // Fetch facets when crop changes
  useEffect(() => {
    const cropParam = form.crop || null;
    api.facets(cropParam).then((f) => {
      setFacets({
        tf_families: f.tf_families || [],
        strands: f.strands || []
      });
    });
  }, [form.crop]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest(".family-select-wrap")) {
        setTfFamilyOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const params = Object.fromEntries([...searchParams.entries()]);
    delete params.chromosome;

    const hasAnyFilter = Object.values(params).some((value) => String(value).trim() !== "");
    if (!hasAnyFilter) {
      setRows([]);
      setTotal(0);
      return;
    }

    api.search({ ...params, limit: "5000", offset: "0" }).then((r) => {
      const items = r.items || [];

      if (items.length === 0) {
        setRows([]);
        setTotal(0);
        return;
      }

      const grouped = {};
      items.forEach((item) => {
        const geneKey = item.Gene || item['Gene ID'] || item.gene || item.gene_id || item.GeneID;
        if (!geneKey) {
          return;
        }

        const geneStr = String(geneKey).trim();
        const cropRaw = String(item._crop || "").trim();
        if (!cropRaw) return;

        const cropDisplay = capitalizeFirst(cropRaw);
        const groupKey = `${geneStr}__${cropRaw.toLowerCase()}`;
        const tfName = item.TF_Name || item['TF Name'] || item.TF_Family || item['TF Family'] || item.tf_name || item.tf_family;
        const tfStr = tfName ? String(tfName).trim() : "";
        if (!tfStr || tfStr.toLowerCase() === "tf_name" || tfStr.toLowerCase().includes("no tfbs found")) {
          return;
        }

        if (!grouped[groupKey]) {
          grouped[groupKey] = {
            Gene: geneStr,
            tfSet: new Set(),
            Crop: cropDisplay
          };
        }

        grouped[groupKey].tfSet.add(tfStr);
      });

      const selectedFamilies = (params.tf_family || "").split(",").map((v) => v.trim()).filter(Boolean);
      const groupedRows = Object.values(grouped)
        .map((row) => {
          const tfNames = Array.from(row.tfSet).sort((a, b) => a.localeCompare(b));
          const matchesAllSelected = selectedFamilies.every((family) => tfNames.some((tf) => {
            const tfLow = tf.toLowerCase();
            const familyLow = family.toLowerCase();
            return tfLow === familyLow || tfLow.includes(familyLow) || familyLow.includes(tfLow);
          }));

          if (selectedFamilies.length && !matchesAllSelected) {
            return null;
          }

          const tfDisplay = (
            <span>
              {tfNames.map((tf, idx) => {
                const isSelected = selectedFamilies.some((family) => {
                  const tfLow = tf.toLowerCase();
                  const familyLow = family.toLowerCase();
                  return tfLow === familyLow || tfLow.includes(familyLow) || familyLow.includes(tfLow);
                });

                return (
                  <span key={tf}>
                    {isSelected ? <strong>{tf}</strong> : tf}
                    {idx < tfNames.length - 1 ? ", " : ""}
                  </span>
                );
              })}
            </span>
          );

          return {
            Gene: row.Gene,
            "Transcription Factors Binding Sites": tfDisplay,
            Crop: row.Crop
          };
        })
        .filter(Boolean);

      setRows(groupedRows);
      setTotal(groupedRows.length);
    }).catch(err => {
      console.error('Error fetching search results:', err);
      setRows([]);
      setTotal(0);
    });
  }, [searchParams]);

  function submit(e) {
    e.preventDefault();
    const next = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "tf_family") {
        const values = Array.isArray(v) ? v : String(v || "").split(",").filter(Boolean);
        if (values.length) next.set(k, values.join(","));
        return;
      }
      if (v) next.set(k, v);
    });
    setSearchParams(next);
  }

  const selectedFamilies = (form.tf_family || "").split(",").map((v) => v.trim()).filter(Boolean);

  const toggleTfFamily = (family) => {
    const selected = new Set(selectedFamilies);
    if (selected.has(family)) {
      selected.delete(family);
    } else {
      selected.add(family);
    }

    setForm((prev) => ({
      ...prev,
      tf_family: Array.from(selected).join(",")
    }));
  };

  return (
    <main className="container search-page-shell">
      <header className="search-page-header">
        <div>
          <p className="eyebrow">Gene discovery</p>
          <h1>Search TF records</h1>
        </div>
        <div className="results-badge">
          <strong>{total}</strong>
          <span>matching records</span>
        </div>
      </header>

      <form onSubmit={submit} className="search-page-filters">
        <div className="filter-group wide">
          <label>Keyword</label>
          <input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="Gene ID, TF name, stress term..." />
        </div>

        <div className="filter-group">
          <label>Crop</label>
          <select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>
            <option value="">All crops</option>
            {crops.map((c) => <option key={c} value={c}>{capitalizeFirst(c)}</option>)}
          </select>
        </div>

        <div className="filter-group tf-family-filter">
          <label>TF family</label>
          <div className="family-select-wrap">
            <button type="button" className="family-select-trigger" onClick={() => setTfFamilyOpen((prev) => !prev)}>
              {selectedFamilies.length ? `${selectedFamilies.length} selected` : "Select TF families"}
            </button>
            {tfFamilyOpen && (
              <div className="family-option-panel">
                <label className="family-option all-option">
                  <input
                    type="checkbox"
                    checked={selectedFamilies.length === 0}
                    onChange={() => {
                      setForm((prev) => ({ ...prev, tf_family: "" }));
                    }}
                  />
                  <span>All</span>
                </label>
                {(facets.tf_families || []).map((family) => (
                  <label key={family} className="family-option">
                    <input
                      type="checkbox"
                      checked={selectedFamilies.includes(family)}
                      onChange={() => toggleTfFamily(family)}
                    />
                    <span>{family}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="filter-group">
          <label>Strand / Orientation</label>
          <select value={form.strand} onChange={(e) => setForm({ ...form, strand: e.target.value })}>
            <option value="">All</option>
            {(facets.strands || []).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <button type="submit" className="search-button inline-button">Apply filters</button>
      </form>

      <div className="search-table-wrap">
        <DataTable rows={rows} />
      </div>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [crops, setCrops] = useState([]);
  const [facets, setFacets] = useState({ tf_families: [], strands: [] });
  const [tfFamilyOpen, setTfFamilyOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tfDropRef = useRef(null);

  const [form, setForm] = useState({
    q:         searchParams.get("q")         || "",
    crop:      searchParams.get("crop")      || "",
    tf_family: searchParams.get("tf_family") || "",
    strand:    searchParams.get("strand")    || "",
    stress:    searchParams.get("stress")    || "",
  });

  useEffect(() => { api.crops().then((c) => setCrops(c.crops || [])); }, []);

  useEffect(() => {
    api.facets(form.crop || null).then((f) =>
      setFacets({ tf_families: f.tf_families || [], strands: f.strands || [] })
    );
  }, [form.crop]);

  useEffect(() => {
    const handler = (e) => {
      if (!tfDropRef.current?.contains(e.target)) setTfFamilyOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const params = Object.fromEntries([...searchParams.entries()]);
    const hasFilter = Object.values(params).some((v) => String(v).trim() !== "");
    if (!hasFilter) { setRows([]); setTotal(0); return; }

    setLoading(true);
    api.search({ ...params, limit: "5000", offset: "0" })
      .then((r) => {
        const items = r.items || [];
        if (!items.length) { setRows([]); setTotal(0); return; }

        const grouped = {};
        items.forEach((item) => {
          const geneKey = item.Gene || item["Gene ID"] || item.gene || item.gene_id || item.GeneID;
          if (!geneKey) return;
          const geneStr = String(geneKey).trim();
          const cropRaw = String(item._crop || "").trim();
          if (!cropRaw) return;
          const groupKey = `${geneStr}__${cropRaw.toLowerCase()}`;
          const tfName = item.TF_Name || item.TF_name || item["TF Name"] || item.TF_Family || item["TF Family"] || item.tf_name || item.tf_family;
          const tfStr = tfName ? String(tfName).trim() : "";
          if (!tfStr || tfStr.toLowerCase() === "tf_name" || tfStr.toLowerCase().includes("no tfbs found")) return;

          if (!grouped[groupKey]) {
            grouped[groupKey] = { Gene: geneStr, Protein: item._protein_name || geneStr, tfSet: new Set(), Crop: cap(cropRaw) };
          }
          grouped[groupKey].tfSet.add(tfStr);
        });

        const selectedFamilies = (params.tf_family || "").split(",").map((v) => v.trim()).filter(Boolean);
        const result = Object.values(grouped).map((row) => {
          const tfNames = Array.from(row.tfSet).sort((a, b) => a.localeCompare(b));
          if (selectedFamilies.length) {
            const matches = selectedFamilies.every((fam) =>
              tfNames.some((tf) => {
                const tl = tf.toLowerCase(); const fl = fam.toLowerCase();
                return tl === fl || tl.includes(fl) || fl.includes(tl);
              })
            );
            if (!matches) return null;
          }
          const tfDisplay = (
            <span>
              {tfNames.map((tf, idx) => {
                const highlighted = selectedFamilies.some((fam) => {
                  const tl = tf.toLowerCase(); const fl = fam.toLowerCase();
                  return tl === fl || tl.includes(fl) || fl.includes(tl);
                });
                return <span key={tf}>{highlighted ? <strong>{tf}</strong> : tf}{idx < tfNames.length - 1 ? ", " : ""}</span>;
              })}
            </span>
          );
          return { Gene: row.Gene, "Protein Name": row.Protein, "TF Binding Sites": tfDisplay, Crop: row.Crop };
        }).filter(Boolean);

        setRows(result);
        setTotal(result.length);
      })
      .catch(() => { setRows([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [searchParams]);

  function submit(e) {
    e.preventDefault();
    const next = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => {
      if (k === "tf_family") {
        const vals = Array.isArray(v) ? v : String(v || "").split(",").filter(Boolean);
        if (vals.length) next.set(k, vals.join(","));
        return;
      }
      if (v) next.set(k, v);
    });
    setSearchParams(next);
  }

  const selectedFamilies = (form.tf_family || "").split(",").map((v) => v.trim()).filter(Boolean);
  const toggleTfFamily = (fam) => {
    const s = new Set(selectedFamilies);
    s.has(fam) ? s.delete(fam) : s.add(fam);
    setForm((p) => ({ ...p, tf_family: Array.from(s).join(",") }));
  };

  return (
    <div className="search-page">
      {/* Header */}
      <div className="search-header">
        <div>
          <p className="page-eyebrow">Gene Discovery</p>
          <h1>Search TF Records</h1>
        </div>
        <div className="results-badge">
          <strong>{total}</strong>
          <span>genes</span>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={submit} className="search-filters-bar">
          <div className="filter-group wide">
            <label>Keyword</label>
            <input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })}
              placeholder="Gene ID, TF name, stress term…" />
          </div>

          <div className="filter-group">
            <label>Crop</label>
            <select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })}>
              <option value="">All crops</option>
              {crops.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Stress</label>
            <input value={form.stress} onChange={(e) => setForm({ ...form, stress: e.target.value })}
              placeholder="drought, heat, cold…" />
          </div>

          <div className="filter-group">
            <label>TF Family</label>
            <div ref={tfDropRef} className="family-select-wrap">
              <button type="button" className="family-select-trigger"
                onClick={() => setTfFamilyOpen((p) => !p)}>
                {selectedFamilies.length ? `${selectedFamilies.length} selected` : "Select families"}
              </button>
              {tfFamilyOpen && (
                <div className="family-option-panel">
                  <label className="family-option all-option">
                    <input type="checkbox" checked={selectedFamilies.length === 0}
                      onChange={() => setForm((p) => ({ ...p, tf_family: "" }))} />
                    <span>All families</span>
                  </label>
                  {facets.tf_families.map((fam) => (
                    <label key={fam} className="family-option">
                      <input type="checkbox" checked={selectedFamilies.includes(fam)}
                        onChange={() => toggleTfFamily(fam)} />
                      <span>{fam}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-group">
            <label>Strand</label>
            <select value={form.strand} onChange={(e) => setForm({ ...form, strand: e.target.value })}>
              <option value="">All</option>
              {facets.strands.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <button type="submit" className="apply-btn">Apply filters</button>
        </form>

      {/* Results */}
      <div className="search-results-area">
        {loading ? (
          <div className="loading-state"><div className="loading-spinner" /> Loading records…</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            {Object.values(Object.fromEntries([...searchParams])).some((v) => v)
              ? "No records match the selected filters."
              : "Enter a search term or select a filter to begin."}
          </div>
        ) : (
          <DataTable rows={rows} />
        )}
      </div>
    </div>
  );
}

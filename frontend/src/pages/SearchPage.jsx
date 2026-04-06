import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [crops, setCrops] = useState([]);
  const [facets, setFacets] = useState({ tf_families: [], chromosomes: [], strands: [] });
  const [form, setForm] = useState({
    q: searchParams.get("q") || "",
    crop: searchParams.get("crop") || "",
    tf_family: searchParams.get("tf_family") || "",
    chromosome: searchParams.get("chromosome") || "",
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
      setFacets(f);
      // Reset chromosome if it's not in the new facets
      if (form.chromosome && f.chromosomes && !f.chromosomes.includes(form.chromosome)) {
        setForm(prev => ({ ...prev, chromosome: "" }));
      }
    });
  }, [form.crop]);

  useEffect(() => {
    const params = Object.fromEntries([...searchParams.entries()]);
    api.search({ ...params, limit: "5000", offset: "0" }).then((r) => {
      const items = r.items || [];
      
      if (items.length === 0) {
        setRows([]);
        setTotal(0);
        return;
      }
      
      // Group by gene and crop for a concise result table.
      const grouped = {};
      items.forEach(item => {
        // Try multiple column names for gene
        const geneKey = item.Gene || item['Gene ID'] || item.gene || item.gene_id || item.GeneID;
        if (!geneKey) {
          console.warn('No gene key found in item:', item);
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
            "Transcription Factors": new Set(),
            Crop: cropDisplay
          };
        }
        
        grouped[groupKey]["Transcription Factors"].add(tfStr);
      });
      
      // Keep only requested columns.
      const groupedRows = Object.values(grouped).map(row => ({
        Gene: row.Gene,
        "Transcription Factors": Array.from(row["Transcription Factors"]).sort().join(', '),
        Crop: row.Crop
      }));
      
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
      if (v) next.set(k, v);
    });
    setSearchParams(next);
  }

  return (
    <main className="container">
      <h1>Search TF Records</h1>
      <form onSubmit={submit} className="grid-form five">
        <input value={form.q} onChange={(e) => setForm({ ...form, q: e.target.value })} placeholder="Keyword..." />
        <select value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value, chromosome: "" })}>
          <option value="">All crops</option>
          {crops.map((c) => <option key={c} value={c}>{capitalizeFirst(c)}</option>)}
        </select>
        <select value={form.tf_family} onChange={(e) => setForm({ ...form, tf_family: e.target.value })}>
          <option value="">All TF families</option>
          {(facets.tf_families || []).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={form.chromosome} onChange={(e) => setForm({ ...form, chromosome: e.target.value })}>
          <option value="">All chromosomes</option>
          {(facets.chromosomes || []).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={form.strand} onChange={(e) => setForm({ ...form, strand: e.target.value })}>
          <option value="">All strands</option>
          {(facets.strands || []).map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <button type="submit">Apply Filters</button>
      </form>
      <p><strong>{total}</strong> matching records</p>
      <DataTable rows={rows} />
    </main>
  );
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import DataTable from "../components/DataTable";

export default function CropPage() {
  const { crop } = useParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  const capitalizeFirst = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  useEffect(() => {
    api.data({ 
      crop,
      limit: "5000", 
      offset: "0" 
    }).then((res) => {
      const items = res.items || [];
      
      if (items.length === 0) {
        setRows([]);
        setTotal(0);
        return;
      }
      
      // Group by Gene
      const grouped = {};
      items.forEach(item => {
        // Try multiple column names for gene
        const geneKey = item.Gene || item['Gene ID'] || item.gene || item.gene_id || item.GeneID;
        if (!geneKey) {
          console.warn('No gene key found in item:', item);
          return;
        }

        const geneStr = String(geneKey).trim();
        const tfName = item.TF_Name || item['TF Name'] || item.TF_Family || item['TF Family'] || item.tf_name || item.tf_family;
        const tfStr = tfName ? String(tfName).trim() : "";
        if (!tfStr || tfStr.toLowerCase() === "tf_name" || tfStr.toLowerCase().includes("no tfbs found")) {
          return;
        }

        const startNum = Number(item.Start ?? item.start);
        const endNum = Number(item.End ?? item.end);
        const zNum = Number(item['Z-Score'] ?? item['z-score'] ?? item.zscore);
        
        if (!grouped[geneStr]) {
          grouped[geneStr] = {
            Gene: geneStr,
            TF_Names: new Set(),
            starts: [],
            ends: [],
            zscores: [],
            TFBS_Count: 0,
            _crop: item._crop
          };
        }
        
        grouped[geneStr].TF_Names.add(tfStr);
        grouped[geneStr].TFBS_Count += 1;
        if (Number.isFinite(startNum)) grouped[geneStr].starts.push(startNum);
        if (Number.isFinite(endNum)) grouped[geneStr].ends.push(endNum);
        if (Number.isFinite(zNum)) grouped[geneStr].zscores.push(zNum);
      });
      
      // Convert to array and format aggregated values for grouped gene rows.
      const groupedRows = Object.values(grouped).map(row => {
        const startMin = row.starts.length ? Math.min(...row.starts) : null;
        const startMax = row.starts.length ? Math.max(...row.starts) : null;
        const endMin = row.ends.length ? Math.min(...row.ends) : null;
        const endMax = row.ends.length ? Math.max(...row.ends) : null;
        const zMin = row.zscores.length ? Math.min(...row.zscores) : null;
        const zMax = row.zscores.length ? Math.max(...row.zscores) : null;

        return {
          Gene: row.Gene,
          TF_Names: Array.from(row.TF_Names).sort().join(', '),
          TFBS_Count: row.TFBS_Count,
          Start_Range: startMin === null ? 'N/A' : (startMin === startMax ? `${startMin}` : `${startMin} to ${startMax}`),
          End_Range: endMin === null ? 'N/A' : (endMin === endMax ? `${endMin}` : `${endMin} to ${endMax}`),
          'Z-Score_Range': zMin === null ? 'N/A' : (zMin === zMax ? `${zMin.toFixed(2)}` : `${zMin.toFixed(2)} to ${zMax.toFixed(2)}`),
          _crop: row._crop
        };
      });
      
      setRows(groupedRows);
      setTotal(groupedRows.length);
    }).catch(err => {
      console.error('Error fetching crop data:', err);
      setRows([]);
      setTotal(0);
    });
  }, [crop]);

  return (
    <main className="container search-page-shell">
      <header className="search-page-header compact-header">
        <div>
          <p className="eyebrow">Crop view</p>
          <h1>{capitalizeFirst(crop)}</h1>
        </div>
        <div className="results-badge">
          <strong>{total}</strong>
          <span>TF records</span>
        </div>
      </header>

      <div className="search-table-wrap">
        <DataTable rows={rows} />
      </div>
    </main>
  );
}

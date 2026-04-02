import { Link } from "react-router-dom";

export default function DataTable({ rows }) {
  if (!rows?.length) return <p>No records found.</p>;

  const formatHeader = (key) => {
    if (key === "_crop") return "Crop";
    return key;
  };

  const keys = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set())
  );

  const geneKey = keys.find((k) => k.toLowerCase().replaceAll(" ", "_").includes("gene"));

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {keys.map((k) => <th key={k}>{formatHeader(k)}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${idx}-${row[geneKey] || "row"}`}>
              {keys.map((k) => {
                const value = row[k] ?? "";
                if (k === geneKey && value) {
                  return (
                    <td key={k}>
                      <Link to={`/gene/${encodeURIComponent(value)}`}>{String(value)}</Link>
                    </td>
                  );
                }
                if (k === "_crop" && value) {
                  return (
                    <td key={k}>
                      <Link to={`/crop/${encodeURIComponent(value)}`}>{String(value)}</Link>
                    </td>
                  );
                }
                return <td key={k}>{String(value)}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

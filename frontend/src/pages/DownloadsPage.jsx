import { useEffect, useState } from "react";
import { api } from "../api";

export default function DownloadsPage() {
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    api.crops().then((c) => setCrops(c.crops || []));
  }, []);

  return (
    <main className="container">
      <h1>Downloads</h1>
      <p>Download full dataset files by crop.</p>
      <ul className="download-list">
        {crops.map((crop) => (
          <li key={crop}>
            <span>{crop}</span>
            <a className="button-link" href={api.downloadCropUrl(crop)}>Download</a>
          </li>
        ))}
      </ul>
    </main>
  );
}

import { api } from "../api";

export default function HelpPage() {
  return (
    <main className="container help-page">
      <h1>Help & Documentation</h1>
      
      <section className="help-section">
        <h2>Getting Started</h2>
        <div className="help-content">
          <p>
            Welcome to the Stress-Induced Transcription Factors Database (STIFDB3). 
            This database provides comprehensive information about transcription factors 
            involved in stress responses across multiple crop species.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2>How to Use the Database</h2>
        <div className="help-content">
          <h3>1. Search for Genes</h3>
          <p>
            Use the search bar on the homepage to find genes by ID, TF family, or chromosome. 
            As you type, matching results will appear instantly.
          </p>

          <h3>2. Browse by Crop</h3>
          <p>
            Click on any crop in the circular navigation to view all transcription factors 
            specific to that crop species. Hover over items to see the zoom effect.
          </p>

          <h3>3. Browse by Stress Type</h3>
          <p>
            Select a stress type (Drought, Heat, Cold, Salt, or Biotic) to find genes 
            associated with that particular stress response.
          </p>

          <h3>4. Advanced Search</h3>
          <p>
            Use the Advanced Search page to apply multiple filters including crop type, 
            TF family, chromosome, and strand orientation.
          </p>

          <h3>5. View Gene Details</h3>
          <p>
            Click on any gene to view detailed information including TFBS (Transcription 
            Factor Binding Sites) visualization. The interactive graph shows motif positions 
            and Z-scores.
          </p>

          <h3>6. Interactive TFBS Graph</h3>
          <p>
            On gene detail pages, you can interact with the TFBS visualization:
          </p>
          <ul>
            <li>Hover over motifs to highlight them</li>
            <li>Click on any motif to view detailed TFBS information</li>
            <li>Z-scores indicate the statistical significance of each binding site</li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h2>Database Statistics</h2>
        <div className="help-content">
          <p>
            The database contains information about transcription factors from multiple crop 
            species including rice, wheat, and maize. Use the stats cards on the homepage 
            to see current database metrics.
          </p>
        </div>
      </section>

      <section className="help-section">
        <h2>Data Interpretation</h2>
        <div className="help-content">
          <h3>TFBS Z-scores</h3>
          <p>
            Z-scores in the TFBS visualization represent the statistical significance of 
            each binding site. Higher Z-scores indicate stronger evidence for the presence 
            of a functional binding site.
          </p>

          <h3>TF Families</h3>
          <p>
            Transcription factor families are grouped based on their DNA-binding domains 
            and structural similarities. Common families include bZIP, MYB, AP2/ERF, NAC, 
            and WRKY.
          </p>

          <h3>Stress Types</h3>
          <ul>
            <li><strong>Drought:</strong> Water deficit stress response</li>
            <li><strong>Heat:</strong> High temperature stress response</li>
            <li><strong>Cold:</strong> Low temperature stress response</li>
            <li><strong>Salt:</strong> Salinity stress response</li>
            <li><strong>Biotic:</strong> Pathogen and pest stress response</li>
          </ul>
        </div>
      </section>

      

      <section className="help-section">
        <h2>Easy usage</h2>
        <div className="help-content">
          <ul>
            <li>Use the live search for quick gene lookups</li>
            <li>Combine multiple filters in Advanced Search for precise results</li>
            <li>Click on TFBS motifs in gene visualizations to learn more about binding sites</li>
            <li>Bookmark frequently accessed genes for quick reference</li>
          </ul>
        </div>
      </section>

      <section className="help-section">
        <h2>Contact & Support</h2>
        <div className="help-content">
          <p>
            For questions, feedback, or technical support, please contact the database 
            administrators. We welcome suggestions for improving the database and adding 
            new features.
          </p>
        </div>
      </section>
    </main>
  );
}

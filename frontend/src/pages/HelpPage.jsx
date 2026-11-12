export default function HelpPage() {
  const sections = [
    {
      badge: "SEARCH",
      title: "Search & Filtering",
      content: "Use the Search page to find genes by ID, TF family, or stress term. Combine crop species, stress tags, TF family, and strand filters for targeted querying."
    },
    {
      badge: "SPECIES",
      title: "Browse by Species",
      content: "Explore genome-wide transcription factors across 8 major crop species including Arabidopsis, Cotton, Maize, Potato, Rapeseed, Rice, Sorghum, and Wheat."
    },
    {
      badge: "TFBS MAP",
      title: "TFBS Map & Gene Profiles",
      content: "Click any gene to view its full TFBS profile. The interactive binding-site map shows predicted motif positions across the -1000 bp upstream region relative to TSS."
    },
    {
      badge: "PREDICTION",
      title: "STIFAL Prediction Engine",
      content: "Submit a 1,000 bp upstream regulatory sequence in plain DNA or FASTA format. STIFAL scans against plant TF consensus models and calculates statistical z-scores."
    },
    {
      badge: "FAMILIES",
      title: "Transcription Factor Families",
      content: "Catalog of plant TF families (bZIP, WRKY, NAC, MYB, AP2/EREBP, bHLH, HSF, etc.) with binding consensus data and cross-species conservation."
    },
    {
      badge: "METRICS",
      title: "Statistical Z-Scores",
      content: "Z-scores quantify the statistical significance of a TFBS match relative to background promoter nucleotide frequencies. Filter by minimum z-score for high-confidence predictions."
    },
    {
      badge: "METADATA",
      title: "Dataset Annotations",
      content: "When datasets contain an explicit 'Stress', 'Condition', or 'Treatment' column, STIFDB3 automatically indexes these terms for multifaceted discovery."
    },
    {
      badge: "EXPORT",
      title: "Data Export & Downloads",
      content: "Export dataset tables in CSV/TSV format, download complete crop files, or save interactive promoter maps directly from gene profile views."
    },
    {
      badge: "SUPPORT",
      title: "Research Support & Contact",
      content: "Developed at the Computational Approaches to Plant Stress (CAPS) Lab, National Centre for Biological Sciences (NCBS), Bangalore."
    },
  ];

  return (
    <div className="help-page">
      <div className="help-header">
        <p className="page-eyebrow">Documentation &amp; User Guide</p>
        <h1>STIFDB3 User Guide &amp; Technical Manual</h1>
      </div>

      <div className="help-body">
        {sections.map((s) => (
          <div key={s.title} className="card">
            <h2>
              <span className="help-section-badge">{s.badge}</span>
              {s.title}
            </h2>
            <p style={{ fontSize: ".84rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
              {s.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function InteractiveGeneGraph({ data, geneId }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    const svg = svgRef.current;
    const containerWidth = containerRef.current?.clientWidth || window.innerWidth || 1200;
    const width = Math.max(1200, containerWidth - 8);
    const margin = { left: 70, right: 70, top: 80, bottom: 60 };

    // Clear previous content
    svg.innerHTML = "";

    // Calculate bounds
    const starts = data.map((d) => Number(d.start));
    const ends = data.map((d) => Number(d.end));
    const xmin = Math.min(...starts);
    const xmax = Math.max(...ends);
    const span = Math.max(1, xmax - xmin);
    const padding = Math.min(100, Math.max(20, span * 0.05));
    const xStart = xmin - padding;
    const xEnd = xmax + padding;

    // Assign lanes to avoid overlap with an extra bp gap so boxes stay visually separated.
    const regions = data.map((d) => ({ ...d }));
    regions.sort((a, b) => a.start - b.start);
    const lanes = [];
    const laneGapBp = 20;
    regions.forEach((r) => {
      const rMin = Math.min(r.start, r.end);
      const rMax = Math.max(r.start, r.end);
      let placed = false;
      for (let i = 0; i < lanes.length; i++) {
        if (
          lanes[i].every((e) => {
            const eMin = Math.min(e.start, e.end);
            const eMax = Math.max(e.start, e.end);
            return rMin > eMax + laneGapBp || rMax < eMin - laneGapBp;
          })
        ) {
          lanes[i].push(r);
          r.lane = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        r.lane = lanes.length;
        lanes.push([r]);
      }
    });

    const nLanes = lanes.length;
    const laneHeight = 120;
    const motifOffsetY = 60;
    const motifHeight = 46;
    const height = margin.top + margin.bottom + nLanes * laneHeight + 100;

    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Scale function
    const scale = (x) => margin.left + ((x - xStart) / (xEnd - xStart)) * (width - margin.left - margin.right);

    // Background
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.setAttribute("width", width);
    bg.setAttribute("height", height);
    bg.setAttribute("fill", "#f5f5f5");
    svg.appendChild(bg);

    // Title
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.setAttribute("x", width / 2);
    title.setAttribute("y", 30);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("font-size", "20");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("fill", "#333");
    title.textContent = geneId;
    svg.appendChild(title);

    // Number line background
    const yTop = margin.top;
    const lineRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    lineRect.setAttribute("x", margin.left);
    lineRect.setAttribute("y", yTop);
    lineRect.setAttribute("width", width - margin.left - margin.right);
    lineRect.setAttribute("height", 20);
    lineRect.setAttribute("fill", "#FFD700");
    lineRect.setAttribute("stroke", "black");
    lineRect.setAttribute("stroke-width", 1);
    svg.appendChild(lineRect);

    // Tick marks and labels
    const tickStep = getTickStep(xStart, xEnd, width - margin.left - margin.right);
    for (let x = Math.ceil(xStart / tickStep) * tickStep; x <= xEnd; x += tickStep) {
      const xPos = scale(x);
      const tick = document.createElementNS("http://www.w3.org/2000/svg", "line");
      tick.setAttribute("x1", xPos);
      tick.setAttribute("x2", xPos);
      tick.setAttribute("y1", yTop);
      tick.setAttribute("y2", yTop + 25);
      tick.setAttribute("stroke", "black");
      tick.setAttribute("stroke-width", 1.5);
      svg.appendChild(tick);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", xPos);
      label.setAttribute("y", yTop + 40);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("font-size", "11");
      label.setAttribute("font-weight", "bold");
      label.textContent = formatBp(x);
      svg.appendChild(label);
    }

    // Custom in-graph tooltip (non-browser native) for motif details.
    const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    tooltipGroup.setAttribute("visibility", "hidden");
    tooltipGroup.setAttribute("pointer-events", "none");

    const tooltipBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    tooltipBg.setAttribute("rx", 8);
    tooltipBg.setAttribute("fill", "#0D47A1");
    tooltipBg.setAttribute("stroke", "#90CAF9");
    tooltipBg.setAttribute("stroke-width", "1.5");
    tooltipBg.setAttribute("opacity", "0.96");
    tooltipGroup.appendChild(tooltipBg);

    const tooltipTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tooltipTitle.setAttribute("font-size", "12");
    tooltipTitle.setAttribute("font-weight", "700");
    tooltipTitle.setAttribute("fill", "#E3F2FD");
    tooltipGroup.appendChild(tooltipTitle);

    const tooltipPos = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tooltipPos.setAttribute("font-size", "11");
    tooltipPos.setAttribute("fill", "#FFFFFF");
    tooltipGroup.appendChild(tooltipPos);

    const tooltipZ = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tooltipZ.setAttribute("font-size", "11");
    tooltipZ.setAttribute("fill", "#BBDEFB");
    tooltipGroup.appendChild(tooltipZ);

    // Color map
    const uniqueTFBS = [...new Set(data.map((d) => d.name))];
    const colorMap = {};
    uniqueTFBS.forEach((tfbs, i) => {
      colorMap[tfbs] = `hsl(${(i * 360) / uniqueTFBS.length}, 70%, 60%)`;
    });

    // Draw motifs in separate horizontal lanes
    const lastOutsideLabelXByLane = new Map();
    const lastZScoreXByLane = new Map();
    regions.forEach((r) => {
      const rawX1 = scale(Math.min(r.start, r.end));
      const rawX2 = scale(Math.max(r.start, r.end));
      let x1 = rawX1;
      let x2 = rawX2;
      const y = yTop + motifOffsetY + r.lane * laneHeight;
      if (x2 - x1 < 10) {
        const center = (x1 + x2) / 2;
        x1 = center - 5;
        x2 = center + 5;
      }
      const motifWidth = x2 - x1;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("class", "motif-group");
      group.style.cursor = "pointer";

      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x1);
      rect.setAttribute("y", y);
      rect.setAttribute("width", motifWidth);
      rect.setAttribute("height", motifHeight);
      rect.setAttribute("rx", 1);
      rect.setAttribute("fill", colorMap[r.name]);
      rect.setAttribute("opacity", 0.85);
      rect.setAttribute("stroke", "#333");
      rect.setAttribute("stroke-width", 1);
      group.appendChild(rect);

      const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      nameText.setAttribute("x", (x1 + x2) / 2);
      nameText.setAttribute("y", y + motifHeight / 2);
      nameText.setAttribute("text-anchor", "middle");
      nameText.setAttribute("dominant-baseline", "middle");
      nameText.setAttribute("font-size", "11");
      nameText.setAttribute("font-weight", "bold");
      nameText.setAttribute("fill", "#000");
      if (motifWidth >= 52) {
        nameText.textContent = r.name;
        group.appendChild(nameText);
      } else {
        const laneKey = Number(r.lane || 0);
        const outsideX = (x1 + x2) / 2;
        const lastX = lastOutsideLabelXByLane.get(laneKey);
        if (lastX !== undefined && Math.abs(outsideX - lastX) < 80) {
          svg.appendChild(group);
          return;
        }
        lastOutsideLabelXByLane.set(laneKey, outsideX);

        const outsideNameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        outsideNameText.setAttribute("x", outsideX);
        outsideNameText.setAttribute("y", y - 8);
        outsideNameText.setAttribute("text-anchor", "middle");
        outsideNameText.setAttribute("font-size", "10");
        outsideNameText.setAttribute("font-weight", "bold");
        outsideNameText.setAttribute("fill", "#1a1a1a");
        outsideNameText.textContent = r.name;
        group.appendChild(outsideNameText);
      }

      const numericZ = Number(r.zscore);
      if (Number.isFinite(numericZ)) {
        const laneKey = Number(r.lane || 0);
        const zX = (x1 + x2) / 2;
        const previousZX = lastZScoreXByLane.get(laneKey);
        if (previousZX === undefined || Math.abs(zX - previousZX) >= 70) {
          lastZScoreXByLane.set(laneKey, zX);
          const zscoreText = document.createElementNS("http://www.w3.org/2000/svg", "text");
          zscoreText.setAttribute("x", zX);
          zscoreText.setAttribute("y", y + motifHeight + 16);
          zscoreText.setAttribute("text-anchor", "middle");
          zscoreText.setAttribute("font-size", "10");
          zscoreText.setAttribute("fill", "#555");
          zscoreText.textContent = `Z: ${numericZ.toFixed(2)}`;
          group.appendChild(zscoreText);
        }
      }

      const startValue = Math.min(r.start, r.end);
      const endValue = Math.max(r.start, r.end);

      const showTooltip = (evt) => {
        const line1 = String(r.name);
        const line2 = `Start: ${startValue} bp  End: ${endValue} bp`;
        const line3 = Number.isFinite(numericZ) ? `Z-Score: ${numericZ.toFixed(2)}` : "Z-Score: N/A";

        tooltipTitle.textContent = line1;
        tooltipPos.textContent = line2;
        tooltipZ.textContent = line3;

        const maxChars = Math.max(line1.length, line2.length, line3.length);
        const tooltipWidth = Math.max(200, maxChars * 7.2 + 18);
        const tooltipHeight = 64;

        const svgRect = svg.getBoundingClientRect();
        const mouseX = evt.clientX - svgRect.left;
        const mouseY = evt.clientY - svgRect.top;
        const desiredX = mouseX + 12;
        const desiredY = mouseY - tooltipHeight - 12;
        const tooltipX = Math.max(8, Math.min(desiredX, width - tooltipWidth - 8));
        const tooltipY = Math.max(8, Math.min(desiredY, height - tooltipHeight - 8));

        tooltipBg.setAttribute("x", String(tooltipX));
        tooltipBg.setAttribute("y", String(tooltipY));
        tooltipBg.setAttribute("width", String(tooltipWidth));
        tooltipBg.setAttribute("height", String(tooltipHeight));

        tooltipTitle.setAttribute("x", String(tooltipX + 10));
        tooltipTitle.setAttribute("y", String(tooltipY + 18));
        tooltipPos.setAttribute("x", String(tooltipX + 10));
        tooltipPos.setAttribute("y", String(tooltipY + 36));
        tooltipZ.setAttribute("x", String(tooltipX + 10));
        tooltipZ.setAttribute("y", String(tooltipY + 53));

        tooltipGroup.setAttribute("visibility", "visible");
      };

      const hideTooltip = () => {
        tooltipGroup.setAttribute("visibility", "hidden");
      };

      // Hover effects
      group.addEventListener("mouseenter", (evt) => {
        rect.setAttribute("opacity", 1);
        rect.setAttribute("stroke-width", 2);
        rect.setAttribute("stroke", "#000");
        showTooltip(evt);
      });

      group.addEventListener("mousemove", (evt) => {
        showTooltip(evt);
      });

      group.addEventListener("mouseleave", () => {
        rect.setAttribute("opacity", 0.85);
        rect.setAttribute("stroke-width", 1);
        rect.setAttribute("stroke", "#333");
        hideTooltip();
      });

      // Click handler
      group.addEventListener("click", () => {
        navigate(`/tfbs/${encodeURIComponent(r.name)}`);
      });

      svg.appendChild(group);
    });

    // Arrow at the end
    const arrowX = scale(xEnd) - 20;
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    arrow.setAttribute("points", `${arrowX},${yTop + 10} ${arrowX + 15},${yTop + 10} ${arrowX + 10},${yTop + 5} ${arrowX + 10},${yTop + 15}`);
    arrow.setAttribute("fill", "#333");
    svg.appendChild(arrow);
    svg.appendChild(tooltipGroup);

  }, [data, geneId, navigate]);

  function getTickStep(xmin, xmax, axisPixels) {
    const span = Math.abs(xmax - xmin);
    const candidates = [20, 50, 100, 200, 500, 1000, 2000, 5000];
    for (const step of candidates) {
      const tickCount = Math.max(1, Math.ceil(span / step));
      const pxPerTick = axisPixels / tickCount;
      if (pxPerTick >= 80) {
        return step;
      }
    }
    return 10000;
  }

  function formatBp(x) {
    return `${Math.round(x)} bp`;
  }

  return (
    <div className="gene-graph-container" ref={containerRef}>
      <svg ref={svgRef} className="gene-graph"></svg>
      <p className="graph-hint">💡 Click on any TFBS motif to view details</p>
    </div>
  );
}

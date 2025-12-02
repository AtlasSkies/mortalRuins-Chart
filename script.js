// Utility: clamp a number
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Global image reference for composing PNG
let uploadedImage = null;

window.addEventListener("DOMContentLoaded", () => {
  const ringCanvas = document.getElementById("ringCanvas");
  const ringCtx = ringCanvas.getContext("2d");

  const sunburstCanvas = document.getElementById("sunburstCanvas");
  const sunCtx = sunburstCanvas.getContext("2d");

  const ringCloneCanvas = document.getElementById("ringCanvasClone");
  const ringCloneCtx = ringCloneCanvas.getContext("2d");
  const sunCloneCanvas = document.getElementById("sunburstCanvasClone");
  const sunCloneCtx = sunCloneCanvas.getContext("2d");

  const updateChartBtn = document.getElementById("updateChartBtn");
  const downloadChartBtn = document.getElementById("downloadChartBtn");
  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");

  const modal = document.getElementById("chartModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalCharName = document.getElementById("modalCharName");
  const modalCharInfo = document.getElementById("modalCharInfo");
  const modalImagePreview = document.getElementById("modalImagePreview");
  const savePngBtn = document.getElementById("savePngBtn");
  const downloadLink = document.getElementById("downloadLink");

  // Default blank preview
  imagePreview.style.background = "rgba(8, 12, 30, 0.9)";

  // INPUT HELPERS
  const getOverallRating = () => {
    const val = parseFloat(document.getElementById("overallRating").value);
    return clamp(isNaN(val) ? 1 : val, 1, 10);
  };

  const getStatsArray = () => {
    const ids = [
      "statEnergy",
      "statSpeed",
      "statSupport",
      "statPower",
      "statIntelligence",
      "statConcentration",
      "statPerception"
    ];
    return ids.map((id) => {
      const v = parseFloat(document.getElementById(id).value);
      return clamp(isNaN(v) ? 1 : v, 1, 10);
    });
  };

  // DRAWING: OUTER RING

  function drawRing(ctx, size, score) {
    const w = size;
    const h = size;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const outerRadius = w * 0.36;
    const innerRadius = w * 0.26;

    const totalWedges = 10;
    const sectorAngle = (2 * Math.PI) / totalWedges;

    // Base ring (light background)
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#151a32";
    ctx.fill();

    // Draw wedge divisions as faint lines for visible 10-seg ring
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < totalWedges; i++) {
      const angle = -Math.PI / 2 + i * sectorAngle;
      const x1 = centerX + Math.cos(angle) * innerRadius;
      const y1 = centerY + Math.sin(angle) * innerRadius;
      const x2 = centerX + Math.cos(angle) * outerRadius;
      const y2 = centerY + Math.sin(angle) * outerRadius;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();

    // Determine full and partial wedges
    const fullWedges = Math.floor(score);
    const fraction = score - fullWedges;
    const partialFraction = Math.round(fraction * 10) / 10; // keep 1 decimal

    // Function to compute progressive gray shade (darker with wedge index)
    const wedgeColor = (index) => {
      // index: 0..9
      const lightness = 78 - index * 4; // from ~78% to ~42%
      return `hsl(220, 15%, ${lightness}%)`;
    };

    // Draw full wedges
    for (let i = 0; i < fullWedges; i++) {
      const startAngle = -Math.PI / 2 + i * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }

    // Partial wedge for decimals (invisible subsegments, but 10% arc increments)
    if (partialFraction > 0 && fullWedges < totalWedges) {
      const i = fullWedges; // index of the wedge we're filling partially
      const startAngle = -Math.PI / 2 + i * sectorAngle;
      const partialAngle = sectorAngle * partialFraction;
      const endAngle = startAngle + partialAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }

    // Draw text in center with score
    ctx.save();
    ctx.fillStyle = "#f5f5ff";
    ctx.font = `${w * 0.07}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score.toFixed(1), centerX, centerY);
    ctx.restore();
  }

  // DRAWING: SUNBURST

  function drawSunburst(ctx, size, stats) {
    const w = size;
    const h = size;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;

    const innerRadius = w * 0.06;
    const outerRadius = w * 0.40;
    const ringCount = 10;
    const ringThickness = (outerRadius - innerRadius) / ringCount;

    const sectionCount = 7;
    const sectionAngle = (2 * Math.PI) / sectionCount;

    const labels = [
      "Energy",
      "Speed",
      "Support",
      "Power",
      "Intelligence",
      "Concentration",
      "Perception"
    ];

    // base hues for the seven sections
    const baseHues = [0, 30, 55, 130, 210, 255, 280]; // red, orange, yellow, green, blue, indigo, purple

    // Background: faint circular base
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
    ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#0a0f24";
    ctx.fill();

    // Draw rings outward: darker & more saturated the further out
    for (let s = 0; s < sectionCount; s++) {
      const value = stats[s]; // 1-10
      const hue = baseHues[s];
      const startAngle = -Math.PI / 2 + s * sectionAngle;
      const endAngle = startAngle + sectionAngle;

      for (let r = 0; r < ringCount; r++) {
        // only draw if this ring index is within the stat value
        if (r + 1 <= value) {
          const ringInner = innerRadius + r * ringThickness;
          const ringOuter = ringInner + ringThickness;

          // color: saturation and darkness scale with ring index
          const sat = 40 + r * 5; // 40–85
          const light = 70 - r * 4; // 70–34

          ctx.beginPath();
          ctx.arc(centerX, centerY, ringOuter, startAngle, endAngle);
          ctx.arc(centerX, centerY, ringInner, endAngle, startAngle, true);
          ctx.closePath();
          ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
          ctx.fill();
        }
      }
    }

    // Labels for each section
    ctx.save();
    ctx.fillStyle = "#f5f5ff";
    ctx.font = `${w * 0.035}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let s = 0; s < sectionCount; s++) {
      const labelAngle =
        -Math.PI / 2 + s * sectionAngle + sectionAngle / 2;
      const radiusForLabel = innerRadius + (outerRadius - innerRadius) * 0.55;
      const lx = centerX + Math.cos(labelAngle) * radiusForLabel;
      const ly = centerY + Math.sin(labelAngle) * radiusForLabel;
      ctx.fillText(labels[s], lx, ly);
    }
    ctx.restore();

    // small dot at center
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius * 0.5, 0, 2 * Math.PI);
    ctx.fillStyle = "#151a32";
    ctx.fill();
  }

  // COMPOSE CLONES (for modal – just copy main canvases)
  function refreshClones() {
    ringCloneCtx.clearRect(0, 0, ringCloneCanvas.width, ringCloneCanvas.height);
    sunCloneCtx.clearRect(0, 0, sunCloneCanvas.width, sunCloneCanvas.height);

    ringCloneCtx.drawImage(ringCanvas, 0, 0, ringCloneCanvas.width, ringCloneCanvas.height);
    sunCloneCtx.drawImage(sunburstCanvas, 0, 0, sunCloneCanvas.width, sunCloneCanvas.height);
  }

  // UPDATE CHARTS based on current inputs
  function updateCharts() {
    const overall = getOverallRating();
    const stats = getStatsArray();

    drawRing(ringCtx, ringCanvas.width, overall);
    drawSunburst(sunCtx, sunburstCanvas.width, stats);
  }

  // IMAGE UPLOAD HANDLING
  imageUpload.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      uploadedImage = null;
      imagePreview.src = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        imagePreview.src = e.target.result;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // BUTTON HANDLERS
  updateChartBtn.addEventListener("click", () => {
    updateCharts();
  });

  downloadChartBtn.addEventListener("click", () => {
    // Update charts first (in case user didn't press "Update")
    updateCharts();
    refreshClones();

    // Fill modal text
    const name = document.getElementById("charName").value || "Unnamed Character";
    const species = document.getElementById("charSpecies").value || "Unknown Species";
    const ability = document.getElementById("charAbility").value || "Unknown Ability";
    const level = document.getElementById("charLevel").value || "Unknown Level";
    const danger = document.getElementById("charDanger").value || "Unknown Danger Level";

    modalCharName.textContent = name;
    modalCharInfo.textContent =
      `Species: ${species} | Ability: ${ability} | Level: ${level} | Danger: ${danger}`;

    if (uploadedImage) {
      modalImagePreview.src = uploadedImage.src;
    } else {
      modalImagePreview.src = "";
    }

    modal.classList.remove("hidden");
  });

  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Close modal clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target === modal.querySelector(".modal-backdrop")) {
      modal.classList.add("hidden");
    }
  });

  // SAVE AS PNG: compose a single canvas with image + text + charts
  savePngBtn.addEventListener("click", () => {
    const overall = getOverallRating();
    const stats = getStatsArray();

    const name = document.getElementById("charName").value || "Unnamed Character";
    const species = document.getElementById("charSpecies").value || "Unknown Species";
    const ability = document.getElementById("charAbility").value || "Unknown Ability";
    const level = document.getElementById("charLevel").value || "Unknown Level";
    const danger = document.getElementById("charDanger").value || "Unknown Danger Level";

    const compositeWidth = 1200;
    const compositeHeight = 600;

    const compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = compositeWidth;
    compositeCanvas.height = compositeHeight;
    const cctx = compositeCanvas.getContext("2d");

    // Background
    const gradient = cctx.createLinearGradient(0, 0, compositeWidth, compositeHeight);
    gradient.addColorStop(0, "#050814");
    gradient.addColorStop(1, "#1b2340");
    cctx.fillStyle = gradient;
    cctx.fillRect(0, 0, compositeWidth, compositeHeight);

    // Character image (left)
    const leftMargin = 40;
    const topMargin = 40;
    const imageBoxWidth = 350;
    const imageBoxHeight = 350;

    if (uploadedImage) {
      // fit image into box while preserving aspect
      const img = uploadedImage;
      const ratio = Math.min(
        imageBoxWidth / img.width,
        imageBoxHeight / img.height
      );
      const drawW = img.width * ratio;
      const drawH = img.height * ratio;
      const dx = leftMargin + (imageBoxWidth - drawW) / 2;
      const dy = topMargin + (imageBoxHeight - drawH) / 2;

      // border behind
      cctx.fillStyle = "rgba(10, 16, 40, 0.9)";
      cctx.fillRect(leftMargin, topMargin, imageBoxWidth, imageBoxHeight);

      cctx.drawImage(img, dx, dy, drawW, drawH);
    } else {
      // placeholder box
      cctx.fillStyle = "rgba(10, 16, 40, 0.9)";
      cctx.fillRect(leftMargin, topMargin, imageBoxWidth, imageBoxHeight);
      cctx.fillStyle = "#505a80";
      cctx.font = "20px system-ui";
      cctx.textAlign = "center";
      cctx.textBaseline = "middle";
      cctx.fillText("No Image", leftMargin + imageBoxWidth / 2, topMargin + imageBoxHeight / 2);
    }

    // Character text info (under image)
    cctx.fillStyle = "#ffffff";
    cctx.font = "32px system-ui";
    cctx.textAlign = "left";
    cctx.textBaseline = "top";
    cctx.fillText(name, leftMargin, topMargin + imageBoxHeight + 24);

    cctx.font = "18px system-ui";
    cctx.fillStyle = "#d2d7ff";
    const infoLines = [
      `Species: ${species}`,
      `Ability: ${ability}`,
      `Level: ${level}`,
      `Danger Level: ${danger}`,
      `Overall Rating: ${overall.toFixed(1)}`
    ];

    let infoY = topMargin + imageBoxHeight + 24 + 40;
    infoLines.forEach((line) => {
      cctx.fillText(line, leftMargin, infoY);
      infoY += 26;
    });

    // Draw main charts to the right
    const chartsTop = 60;
    const ringSize = 360;
    const sunSize = 360;

    // ensure updated charts
    drawRing(ringCtx, ringCanvas.width, overall);
    drawSunburst(sunCtx, sunburstCanvas.width, stats);

    cctx.drawImage(
      ringCanvas,
      0,
      0,
      ringCanvas.width,
      ringCanvas.height,
      460,
      chartsTop,
      ringSize,
      ringSize
    );

    cctx.drawImage(
      sunburstCanvas,
      0,
      0,
      sunburstCanvas.width,
      sunburstCanvas.height,
      460 + ringSize + 30,
      chartsTop,
      sunSize,
      sunSize
    );

    // Title text above charts
    cctx.fillStyle = "#f5f5ff";
    cctx.font = "24px system-ui";
    cctx.textAlign = "left";
    cctx.fillText("Character Ability Chart", 460, chartsTop - 30);

    // Export PNG
    const dataUrl = compositeCanvas.toDataURL("image/png");
    downloadLink.href = dataUrl;
    downloadLink.click();
  });

  // Initial draw
  updateCharts();
});

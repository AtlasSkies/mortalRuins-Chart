function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

let uploadedImage = null;

window.addEventListener("DOMContentLoaded", () => {

  /* ===== ELEMENT REFS ===== */
  const previewCanvas = document.getElementById("fullChartCanvas");
  const previewCtx = previewCanvas.getContext("2d");

  const modalCanvas = document.getElementById("modalChartCanvas");
  const modalCtx = modalCanvas.getContext("2d");

  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");

  const charName = document.getElementById("charName");
  const charSpecies = document.getElementById("charSpecies");
  const charAbility = document.getElementById("charAbility");
  const charLevel = document.getElementById("charLevel");
  const charDanger = document.getElementById("charDanger");

  const overallInput = document.getElementById("overallRating");
  const statInputs = {
    energy: document.getElementById("statEnergy"),
    speed: document.getElementById("statSpeed"),
    support: document.getElementById("statSupport"),
    power: document.getElementById("statPower"),
    intelligence: document.getElementById("statIntelligence"),
    concentration: document.getElementById("statConcentration"),
    perception: document.getElementById("statPerception")
  };

  const viewBtn = document.getElementById("viewChartBtn");
  const modal = document.getElementById("chartModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalImage = document.getElementById("modalImage");
  const modalInfo = document.getElementById("modalInfo");
  const modalDownloadBtn = document.getElementById("modalDownloadBtn");
  const modalWrapper = document.getElementById("modalWrapper");

  /* ===== IMAGE UPLOAD ===== */
  imageUpload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        imagePreview.src = img.src;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ===== READ STATS ===== */
  function getStats() {
    return [
      clamp(parseFloat(statInputs.energy.value), 1, 10),
      clamp(parseFloat(statInputs.speed.value), 1, 10),
      clamp(parseFloat(statInputs.support.value), 1, 10),
      clamp(parseFloat(statInputs.power.value), 1, 10),
      clamp(parseFloat(statInputs.intelligence.value), 1, 10),
      clamp(parseFloat(statInputs.concentration.value), 1, 10),
      clamp(parseFloat(statInputs.perception.value), 1, 10)
    ];
  }

  function getOverall() {
    return clamp(parseFloat(overallInput.value), 1, 10);
  }

  function computeLevel(stats, overall) {
    return stats.reduce((a, b) => a + b, 0) + overall * 3;
  }

  /* ============================================================
     =============   FINAL RESTORED + UPDATED CHART   ============
     ============================================================ */
  function drawChart(ctx, canvas, stats, overall) {

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const labels = [
      "Energy",
      "Speed",
      "Support",
      "Power",
      "Intelligence",
      "Concentration",
      "Perception"
    ];

    const hues = [0, 30, 55, 130, 210, 255, 280];

    const sections = 7;
    const rings = 10;

    const innerR = 60;
    const outerR = 210;  // sunburst size
    const ringT = (outerR - innerR) / rings;
    const secA = (2 * Math.PI) / sections;

    /* ---------------- SUNBURST ---------------- */
    for (let i = 0; i < sections; i++) {

      const a0 = -Math.PI / 2 + i * secA;
      const a1 = a0 + secA;

      const val = stats[i];
      const hue = hues[i];

      for (let r = 0; r < val; r++) {
        const rIn = innerR + r * ringT;
        const rOut = rIn + ringT;

        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();

        ctx.fillStyle = `hsl(${hue}, ${40 + r * 5}%, ${70 - r * 4}%)`;
        ctx.fill();
      }
    }

    /* ---------------- CENTER DISC ---------------- */
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#0b1020";
    ctx.fill();

    /* ======================================================
       ========== LABELS BETWEEN SUNBURST + RING ============
       ====================================================== */

    // label track sits between sunburst and outer ring
    const labelTrackRadius = outerR + 15; // gap from sunburst

    const chipWidth = 120;
    const chipHeight = 24;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "15px 'Times New Roman', serif";

    for (let i = 0; i < sections; i++) {

      const angle = -Math.PI / 2 + (i + 0.5) * secA;

      const lx = cx + Math.cos(angle) * labelTrackRadius;
      const ly = cy + Math.sin(angle) * labelTrackRadius;

      // Diamond-cut plaque points
      const hw = chipWidth / 2;
      const hh = chipHeight / 2;

      ctx.beginPath();
      ctx.moveTo(lx - hw, ly);
      ctx.lineTo(lx - hw + 12, ly - hh);
      ctx.lineTo(lx + hw - 12, ly - hh);
      ctx.lineTo(lx + hw, ly);
      ctx.lineTo(lx + hw - 12, ly + hh);
      ctx.lineTo(lx - hw + 12, ly + hh);
      ctx.closePath();

      // Fill
      ctx.fillStyle = "#1a1a1a";
      ctx.fill();

      // Gold trim
      ctx.strokeStyle = "#c9a552";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Slight inner glow
      ctx.save();
      ctx.clip();
      const grad = ctx.createLinearGradient(lx, ly - hh, lx, ly + hh);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = grad;
      ctx.fillRect(lx - hw, ly - hh, chipWidth, chipHeight);
      ctx.restore();

      // Engraved text, slightly elevated
      ctx.fillStyle = "#f9e7c3";
      ctx.fillText(labels[i], lx, ly - 3);
    }

    /* ========================================================
       ================ OUTER RING (JUST OUTSIDE) =============
       ======================================================== */

    // place ring fully outside chips
    const chipOuterEdge = labelTrackRadius + chipHeight / 2;
    const ringIn = chipOuterEdge + 3;       // small gap
    const ringOut = ringIn + 30;            // thickness

    const wedgeN = 10;
    const wedgeA = (2 * Math.PI) / wedgeN;

    ctx.beginPath();
    ctx.arc(cx, cy, ringOut, 0, Math.PI * 2);
    ctx.arc(cx, cy, ringIn, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#1a2038";
    ctx.fill();

    const full = Math.floor(overall);
    const frac = overall - full;

    function wedgeColor(i) {
      return `hsl(220, 20%, ${70 - i * 4}%)`;
    }

    for (let i = 0; i < full; i++) {
      const a0 = -Math.PI / 2 + i * wedgeA;
      const a1 = a0 + wedgeA;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }

    if (frac > 0 && full < wedgeN) {
      const a0 = -Math.PI / 2 + full * wedgeA;
      const a1 = a0 + wedgeA * frac;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(full);
      ctx.fill();
    }
  }

  /* ===== AUTO UPDATE ===== */
  function update() {
    const stats = getStats();
    const overall = getOverall();
    charLevel.value = computeLevel(stats, overall).toFixed(1);
    drawChart(previewCtx, previewCanvas, stats, overall);
  }

  Object.values(statInputs).forEach(inp => inp.addEventListener("input", update));
  overallInput.addEventListener("input", update);

  update();

  /* ===== VIEW POPUP ===== */
  viewBtn.addEventListener("click", () => {
    const stats = getStats();
    const overall = getOverall();
    const lvl = computeLevel(stats, overall);

    charLevel.value = lvl.toFixed(1);

    modalImage.src = uploadedImage ? uploadedImage.src : "";

    modalInfo.innerHTML = `
      <div><span class="label">SUBJECT:</span> ${charName.value || "UNNAMED"}</div>
      <div><span class="label">SPECIES:</span> ${charSpecies.value || "UNKNOWN"}</div>
      <div><span class="label">ABILITY:</span> ${charAbility.value || "UNKNOWN"}</div>
      <div><span class="label">LEVEL INDEX:</span> ${lvl.toFixed(1)}</div>
      <div><span class="label">DANGER:</span> ${charDanger.value || "UNKNOWN"}</div>
      <div><span class="label">[REDACTED]:</span> ${overall.toFixed(1)}</div>
    `;

    drawChart(modalCtx, modalCanvas, stats, overall);
    modal.classList.remove("hidden");
  });

  /* ===== CLOSE POPUP ===== */
  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  /* ===== DOWNLOAD PNG ===== */
  modalDownloadBtn.addEventListener("click", () => {
    const rect = modalWrapper.getBoundingClientRect();

    const tmp = document.createElement("canvas");
    tmp.width = rect.width * 2;
    tmp.height = rect.height * 2;

    const tctx = tmp.getContext("2d");
    tctx.scale(2, 2);

    tctx.fillStyle = "#111524";
    tctx.fillRect(0, 0, rect.width, rect.height);

    // Draw left image
    if (uploadedImage) {
      tctx.drawImage(modalImage, 0, 0, 360, 360);
    }

    // Draw info text
    tctx.fillStyle = "white";
    tctx.font = "16px SF Mono";
    let y = 370;

    modalInfo.innerText.split("\n").forEach(line => {
      tctx.fillText(line, 0, y);
      y += 22;
    });

    // Draw chart
    tctx.drawImage(modalCanvas, 380, 0, 550, 550);

    const name = (charName.value || "character").replace(/\s+/g, "");

    const link = document.createElement("a");
    link.download = `${name}_mr_characterchart.png`;
    link.href = tmp.toDataURL();
    link.click();
  });

});

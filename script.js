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

  const charNameInput = document.getElementById("charName");
  const charSpeciesInput = document.getElementById("charSpecies");
  const charAbilityInput = document.getElementById("charAbility");
  const charLevelInput = document.getElementById("charLevel");
  const charDangerInput = document.getElementById("charDanger");

  const overallInput = document.getElementById("overallRating");
  const statEnergyInput = document.getElementById("statEnergy");
  const statSpeedInput = document.getElementById("statSpeed");
  const statSupportInput = document.getElementById("statSupport");
  const statPowerInput = document.getElementById("statPower");
  const statIntelligenceInput = document.getElementById("statIntelligence");
  const statConcentrationInput = document.getElementById("statConcentration");
  const statPerceptionInput = document.getElementById("statPerception");

  const viewChartBtn = document.getElementById("viewChartBtn");

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


  /* ===== STATS ===== */
  function readStats() {
    const vals = [
      parseFloat(statEnergyInput.value),
      parseFloat(statSpeedInput.value),
      parseFloat(statSupportInput.value),
      parseFloat(statPowerInput.value),
      parseFloat(statIntelligenceInput.value),
      parseFloat(statConcentrationInput.value),
      parseFloat(statPerceptionInput.value)
    ];

    return vals.map(v => clamp(isNaN(v) ? 1 : v, 1, 10));
  }

  function getOverall() {
    const v = parseFloat(overallInput.value);
    return clamp(isNaN(v) ? 1 : v, 1, 10);
  }

  function calculateLevel(stats, overall) {
    return stats.reduce((a, b) => a + b, 0) + overall * 3;
  }


  /* ============================================================
     =============   RESTORED PERFECT WORKING CHART   ============
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

    const sectionCount = 7;
    const ringCount = 10;

    const innerR = 60;
    const outerR = 210;
    const ringT = (outerR - innerR) / ringCount;
    const secA = (2 * Math.PI) / sectionCount;

    /* ---------------- SUNBURST (UNCHANGED) ---------------- */
    for (let s = 0; s < sectionCount; s++) {

      const val = stats[s];
      const hue = hues[s];

      const a0 = -Math.PI / 2 + s * secA;
      const a1 = a0 + secA;

      for (let r = 0; r < val; r++) {
        const rIn = innerR + r * ringT;
        const rOut = rIn + ringT;

        const sat = 40 + r * 5;
        const lit = 70 - r * 4;

        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
        ctx.fill();
      }
    }

    /* ---------------- CENTER DISC ---------------- */
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#0b1020";
    ctx.fill();


    /* =====================================================
       ==========  LABELS MOVED OUTSIDE SAFELY  ============
       ===================================================== */

    const labelRadius = outerR + 25;  
    // Medium spacing — labels no longer overlap, chart stays intact

    ctx.fillStyle = "white";
    ctx.font = "15px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let s = 0; s < sectionCount; s++) {
      const a0 = -Math.PI / 2 + s * secA;
      const mid = a0 + secA / 2;

      const lx = cx + Math.cos(mid) * labelRadius;
      const ly = cy + Math.sin(mid) * labelRadius;

      ctx.fillText(labels[s], lx, ly);
    }


    /* =====================================================
       ============== OUTER RATING RING (unchanged) ========
       ===================================================== */

    const ringIn = outerR + 20;
    const ringOut = outerR + 60;
    const wedgeA = (2 * Math.PI) / 10;

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

    if (frac > 0 && full < 10) {
      const i = full;

      const a0 = -Math.PI / 2 + i * wedgeA;
      const a1 = a0 + wedgeA * frac;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }
  }


  /* ===== AUTO UPDATE PREVIEW ===== */
  function updatePreview() {
    const stats = readStats();
    const overall = getOverall();
    const lvl = calculateLevel(stats, overall);

    charLevelInput.value = lvl.toFixed(1);
    drawChart(previewCtx, previewCanvas, stats, overall);
  }

  const statInputs = [
    overallInput,
    statEnergyInput,
    statSpeedInput,
    statSupportInput,
    statPowerInput,
    statIntelligenceInput,
    statConcentrationInput,
    statPerceptionInput
  ];

  statInputs.forEach(input => {
    input.addEventListener("input", updatePreview);
  });

  updatePreview();


  /* ===== VIEW POPUP ===== */
  viewChartBtn.addEventListener("click", () => {

    const stats = readStats();
    const overall = getOverall();
    const lvl = calculateLevel(stats, overall);

    charLevelInput.value = lvl.toFixed(1);

    modalImage.src = uploadedImage ? uploadedImage.src : "";

    modalInfo.innerHTML = `
      <div><span class="label">SUBJECT:</span> ${charNameInput.value || "UNNAMED"}</div>
      <div><span class="label">SPECIES:</span> ${charSpeciesInput.value || "UNKNOWN"}</div>
      <div><span class="label">ABILITY:</span> ${charAbilityInput.value || "UNCLASSIFIED"}</div>
      <div><span class="label">LEVEL INDEX:</span> ${lvl.toFixed(1)}</div>
      <div><span class="label">DANGER:</span> ${charDangerInput.value || "UNKNOWN"}</div>
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

    if (uploadedImage) {
      tctx.drawImage(modalImage, 0, 0, 360, 360);
    }

    tctx.fillStyle = "#f5f5ff";
    tctx.font = "16px SF Mono";
    let y = 370;

    modalInfo.innerText.split("\n").forEach(line => {
      tctx.fillText(line, 0, y);
      y += 22;
    });

    tctx.drawImage(modalCanvas, 380, 0, 550, 550);

    const rawName = charNameInput.value || "character";
    const safeName = rawName.replace(/\s+/g, "");

    const link = document.createElement("a");
    link.download = `${safeName}_mr_characterchart.png`;
    link.href = tmp.toDataURL();
    link.click();
  });

});

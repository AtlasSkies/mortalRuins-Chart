function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

let uploadedImage = null;

window.addEventListener("DOMContentLoaded", () => {

  const previewCanvas = document.getElementById("fullChartCanvas");
  const previewCtx = previewCanvas.getContext("2d");

  const modalCanvas = document.getElementById("modalChartCanvas");
  const modalCtx = modalCanvas.getContext("2d");

  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");

  const charName = document.getElementById("charName");
  const charSpecies = document.getElementById("charSpecies");
  const charAbility = document.getElementById("charAbility");
  const charGod = document.getElementById("charGod");
  const charDanger = document.getElementById("charDanger");
  const charLevel = document.getElementById("charLevel");

  const overall = document.getElementById("overallRating");

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
  const closeBtn = document.getElementById("closeModalBtn");
  const modalImage = document.getElementById("modalImage");
  const modalInfo = document.getElementById("modalInfo");
  const fileTypeGod = document.getElementById("fileTypeGod");
  const downloadBtn = document.getElementById("modalDownloadBtn");

  /* --------------------------------------------- */
  /* IMAGE UPLOAD                                  */
  /* --------------------------------------------- */
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

  /* --------------------------------------------- */
  /* STATS                                         */
  /* --------------------------------------------- */
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
    return clamp(parseFloat(overall.value), 1, 10);
  }

  function computeLevel(stats, ov) {
    return stats.reduce((a, b) => a + b, 0) + ov * 3;
  }

  /* --------------------------------------------- */
  /* RESTORED DRAW CHART — ORIGINAL WORKING VERSION */
  /* --------------------------------------------- */
  function drawChart(ctx, canvas, stats, overallVal) {

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    const labels = [
      "Energy", "Speed", "Support",
      "Power", "Intelligence",
      "Concentration", "Perception"
    ];

    const hues = [0, 30, 55, 130, 210, 255, 280];

    const secCount = 7;
    const rings = 10;

    const inner = 60;
    const outer = 210 * (w / 550);  
    const ringT = (outer - inner) / rings;

    const secA = (2 * Math.PI) / secCount;

    /* ---------------- SUNBURST (restored) ---------------- */
    for (let i = 0; i < secCount; i++) {

      const a0 = -Math.PI / 2 + i * secA;
      const a1 = a0 + secA;
      const val = stats[i];
      const hue = hues[i];

      for (let r = 0; r < val; r++) {
        const rIn = inner + r * ringT;
        const rOut = rIn + ringT;

        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();

        ctx.fillStyle = `hsl(${hue}, ${40 + r * 5}%, ${70 - r * 4}%)`;
        ctx.fill();
      }
    }

    /* INNER DISC */
    ctx.beginPath();
    ctx.arc(cx, cy, inner * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();

    /* ----------------------------------------- */
    /* NORMAL LABELS — MEDIUM SPACING (SAFE)     */
    /* ----------------------------------------- */

    const labelRadius = outer + 20;  

    ctx.fillStyle = "#3b2e1d";
    ctx.font = "14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < secCount; i++) {

      const midAngle = -Math.PI / 2 + secA * (i + 0.5);

      const lx = cx + Math.cos(midAngle) * labelRadius;
      const ly = cy + Math.sin(midAngle) * labelRadius;

      ctx.fillText(labels[i], lx, ly);
    }

    /* ----------------------------------------- */
    /* OUTER RATING RING (restored & working)    */
    /* ----------------------------------------- */

    const ringIn = outer + 40;
    const ringOut = outer + 80;
    const wedgeA = (2 * Math.PI) / 10;

    ctx.beginPath();
    ctx.arc(cx, cy, ringOut, 0, Math.PI * 2);
    ctx.arc(cx, cy, ringIn, Math.PI * 2, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#fff";
    ctx.fill();

    const full = Math.floor(overallVal);
    const frac = overallVal - full;

    function wedgeColor(i) {
      return `hsl(220, 30%, ${70 - i * 4}%)`;
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

    if (frac > 0) {
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

  /* --------------------------------------------- */
  /* AUTO UPDATE                                   */
  /* --------------------------------------------- */
  function updatePreview() {
    const stats = getStats();
    const ov = getOverall();
    charLevel.value = computeLevel(stats, ov).toFixed(1);

    drawChart(previewCtx, previewCanvas, stats, ov);
  }

  Object.values(statInputs).forEach(x => x.addEventListener("input", updatePreview));
  overall.addEventListener("input", updatePreview);

  updatePreview();

  /* --------------------------------------------- */
  /* OPEN POPUP                                    */
  /* --------------------------------------------- */
  viewBtn.addEventListener("click", () => {

    const stats = getStats();
    const ov = getOverall();
    const lvl = computeLevel(stats, ov);

    charLevel.value = lvl.toFixed(1);
    fileTypeGod.textContent = charGod.value;

    modalImage.src = uploadedImage ? uploadedImage.src : "";

    modalInfo.innerHTML = `
      <div><span class="label">Name:</span> ${charName.value || "Unknown"}</div>
      <div><span class="label">Species:</span> ${charSpecies.value || "Unknown"}</div>
      <div><span class="label">Ability:</span> ${charAbility.value || "Unknown"}</div>
      <div><span class="label">Patron God:</span> ${charGod.value}</div>
      <div><span class="label">Danger Level:</span> ${charDanger.value}</div>
      <div><span class="label">Level Index:</span> ${lvl.toFixed(1)}</div>
      <div><span class="label">[Redacted]:</span> ${ov.toFixed(1)}</div>
    `;

    drawChart(modalCtx, modalCanvas, stats, ov);

    modal.classList.remove("hidden");
  });

  /* --------------------------------------------- */
  /* CLOSE POPUP                                    */
  /* --------------------------------------------- */
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  /* --------------------------------------------- */
  /* DOWNLOAD                                       */
  /* --------------------------------------------- */
  downloadBtn.addEventListener("click", () => {

    const wrap = document.getElementById("modalWrapper");
    const rect = wrap.getBoundingClientRect();

    const tmp = document.createElement("canvas");
    tmp.width = rect.width * 2;
    tmp.height = rect.height * 2;

    const tctx = tmp.getContext("2d");
    tctx.scale(2, 2);

    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, rect.width, rect.height);

    if (uploadedImage) {
      tctx.drawImage(modalImage, 10, 10, 300, 300);
    }

    tctx.fillStyle = "#000";
    tctx.font = "18px Georgia";
    let y = 330;
    modalInfo.innerText.split("\n").forEach(line => {
      tctx.fillText(line, 10, y);
      y += 26;
    });

    tctx.drawImage(modalCanvas, 350, 10);

    const name = (charName.value || "character").replace(/\s+/g, "");
    const link = document.createElement("a");
    link.download = `${name}_mr_characterchart.png`;
    link.href = tmp.toDataURL();
    link.click();
  });

});

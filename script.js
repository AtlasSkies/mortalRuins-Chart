function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

let uploadedImage = null;

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("fullChartCanvas");
  const ctx = canvas.getContext("2d");

  const modalCanvas = document.getElementById("modalChartCanvas");
  const modalCtx = modalCanvas.getContext("2d");

  const imageUpload = document.getElementById("imageUpload");
  const imagePreview = document.getElementById("imagePreview");

  const modal = document.getElementById("chartModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const modalImage = document.getElementById("modalImage");
  const modalInfo = document.getElementById("modalInfo");


  /* ---------------- IMAGE UPLOAD ---------------- */

  imageUpload.addEventListener("change", (e) => {
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


  /* ---------------- READ STATS ---------------- */

  function readStats() {
    return [
      clamp(parseFloat(statEnergy.value), 1, 10),
      clamp(parseFloat(statSpeed.value), 1, 10),
      clamp(parseFloat(statSupport.value), 1, 10),
      clamp(parseFloat(statPower.value), 1, 10),
      clamp(parseFloat(statIntelligence.value), 1, 10),
      clamp(parseFloat(statConcentration.value), 1, 10),
      clamp(parseFloat(statPerception.value), 1, 10)
    ];
  }


  /* ---------------- DRAW COMBINED CHART ---------------- */

  function drawChart(ctx, canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w/2;
    const cy = h/2;

    ctx.clearRect(0,0,w,h);

    const stats = readStats();
    const labels = ["Energy","Speed","Support","Power","Intelligence","Concentration","Perception"];
    const hues = [0,30,55,130,210,255,280];

    const sectionCount = 7;
    const ringCount = 10;

    const innerR = 60;
    const outerR = 210;
    const ringT = (outerR-innerR)/ringCount;
    const secA = (2*Math.PI)/sectionCount;

    /* --- SUNBURST --- */
    for (let s=0; s<sectionCount; s++) {
      const val = stats[s];
      const hue = hues[s];

      const a0 = -Math.PI/2 + s*secA;
      const a1 = a0 + secA;

      for (let r=0; r<val; r++) {
        const rIn = innerR + r*ringT;
        const rOut = rIn + ringT;

        const sat = 40 + r*5;
        const lit = 70 - r*4;

        ctx.beginPath();
        ctx.arc(cx, cy, rOut, a0, a1);
        ctx.arc(cx, cy, rIn, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
        ctx.fill();
      }

      const midA = a0 + secA/2;
      const lx = cx + Math.cos(midA)*(innerR + (outerR-innerR)*0.6);
      const ly = cy + Math.sin(midA)*(innerR + (outerR-innerR)*0.6);

      ctx.fillStyle = "white";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[s], lx, ly);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, innerR*0.45, 0, Math.PI*2);
    ctx.fillStyle = "#0b1020";
    ctx.fill();

    /* --- OUTER RING --- */
    const overall = clamp(parseFloat(overallRating.value), 1, 10);

    const ringIn = outerR + 20;
    const ringOut = outerR + 60;
    const wedgeN = 10;
    const wedgeA = (2*Math.PI)/wedgeN;

    ctx.beginPath();
    ctx.arc(cx, cy, ringOut, 0, Math.PI*2);
    ctx.arc(cx, cy, ringIn, Math.PI*2, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#1a2038";
    ctx.fill();

    const full = Math.floor(overall);
    const frac = overall - full;

    function wedgeColor(i) {
      return `hsl(220, 20%, ${70 - i*4}%)`;
    }

    for (let i=0; i<full; i++) {
      const a0 = -Math.PI/2 + i*wedgeA;
      const a1 = a0 + wedgeA;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }

    if (frac > 0 && full < wedgeN) {
      const i = full;
      const a0 = -Math.PI/2 + i*wedgeA;
      const a1 = a0 + wedgeA*frac;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }
  }


  /* ---------------- PREVIEW PANE ---------------- */
  document.getElementById("updateChartBtn").addEventListener("click", () => {
    drawChart(ctx, canvas);
  });


  /* ---------------- VIEW POPUP ---------------- */
  document.getElementById("viewChartBtn").addEventListener("click", () => {

    // Fill modal image
    modalImage.src = uploadedImage ? uploadedImage.src : "";

    // Fill modal info
    const name = charName.value || "Unnamed Character";
    modalInfo.innerHTML = `
      <strong>${name}</strong><br><br>
      Species: ${charSpecies.value}<br>
      Ability: ${charAbility.value}<br>
      Level: ${charLevel.value}<br>
      Danger Level: ${charDanger.value}<br>
      Overall Rating: ${overallRating.value}
    `;

    // Draw modal chart
    drawChart(modalCtx, modalCanvas);

    // Show modal
    modal.classList.remove("hidden");
  });


  /* ---------------- CLOSE POPUP ---------------- */
  closeModalBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });


  /* ---------------- DOWNLOAD POPUP AS PNG ---------------- */
  document.getElementById("modalDownloadBtn").addEventListener("click", () => {

    const wrapper = document.getElementById("modalWrapper");
    const rect = wrapper.getBoundingClientRect();

    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = rect.width * 2;
    tmpCanvas.height = rect.height * 2;

    const tctx = tmpCanvas.getContext("2d");
    tctx.scale(2,2);

    // Fill background
    tctx.fillStyle = "#121728";
    tctx.fillRect(0,0,rect.width,rect.height);

    // Left image
    if (uploadedImage) {
      tctx.drawImage(modalImage, 0,0,350,350);
    }

    // Text
    tctx.fillStyle = "white";
    tctx.font = "18px system-ui";
    tctx.textBaseline = "top";

    const name = charName.value || "UnnamedCharacter";

    tctx.fillText(modalInfo.innerText, 0, 360);

    // Chart
    tctx.drawImage(modalCanvas, 370, 0, 550, 550);

    const link = document.createElement("a");
    link.download = `${name}_mr_characterchart.png`;
    link.href = tmpCanvas.toDataURL("image/png");
    link.click();
  });


  /* Initial draw */
  drawChart(ctx, canvas);
});

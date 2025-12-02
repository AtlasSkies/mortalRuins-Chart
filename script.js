function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

let uploadedImage = null;

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("fullChartCanvas");
  const ctx = canvas.getContext("2d");

  const imgUpload = document.getElementById("imageUpload");
  const imgPrev = document.getElementById("imagePreview");

  imgUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        uploadedImage = img;
        imgPrev.src = img.src;
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

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

  function drawChart() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // --- SUNBURST REGION ---
    const stats = readStats();
    const labels = ["Energy","Speed","Support","Power","Intelligence","Concentration","Perception"];
    const hues = [0, 30, 55, 130, 210, 255, 280];

    const sectionCount = 7;
    const ringCount = 10;

    const innerR = 60;
    const outerR = 210;
    const ringT = (outerR - innerR) / ringCount;
    const secAngle = (2 * Math.PI) / sectionCount;

    for (let s = 0; s < sectionCount; s++) {
      const val = stats[s];
      const hue = hues[s];

      const startA = -Math.PI / 2 + s * secAngle;
      const endA = startA + secAngle;

      for (let r = 0; r < val; r++) {
        const rIn = innerR + r * ringT;
        const rOut = rIn + ringT;

        const sat = 40 + r * 5;
        const light = 70 - r * 4;

        ctx.beginPath();
        ctx.arc(cx, cy, rOut, startA, endA);
        ctx.arc(cx, cy, rIn, endA, startA, true);
        ctx.closePath();

        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        ctx.fill();
      }

      // label
      const textA = startA + secAngle / 2;
      const lx = cx + Math.cos(textA) * (innerR + (outerR-innerR)*0.6);
      const ly = cy + Math.sin(textA) * (innerR + (outerR-innerR)*0.6);

      ctx.fillStyle = "white";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(labels[s], lx, ly);
    }

    // sunburst center
    ctx.beginPath();
    ctx.arc(cx, cy, innerR * 0.45, 0, Math.PI*2);
    ctx.fillStyle = "#0b1020";
    ctx.fill();

    // --- OUTER RING ---
    const overall = clamp(parseFloat(overallRating.value), 1, 10);

    const ringIn = outerR + 18;
    const ringOut = outerR + 55;

    const wedgeN = 10;
    const wedgeA = (2 * Math.PI) / wedgeN;

    // ring background
    ctx.beginPath();
    ctx.arc(cx, cy, ringOut, 0, Math.PI*2);
    ctx.arc(cx, cy, ringIn, Math.PI*2, 0, true);
    ctx.closePath();
    ctx.fillStyle = "#1a2038";
    ctx.fill();

    const full = Math.floor(overall);
    const frac = overall - full;

    function wedgeColor(i) {
      const light = 70 - i * 4;
      return `hsl(220, 20%, ${light}%)`;
    }

    for (let i = 0; i < full; i++) {
      const a0 = -Math.PI/2 + i * wedgeA;
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
      const a1 = a0 + wedgeA * frac;

      ctx.beginPath();
      ctx.arc(cx, cy, ringOut, a0, a1);
      ctx.arc(cx, cy, ringIn, a1, a0, true);
      ctx.closePath();

      ctx.fillStyle = wedgeColor(i);
      ctx.fill();
    }
  }

  document.getElementById("updateChartBtn").addEventListener("click", drawChart);

  document.getElementById("downloadChartBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "character-chart.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  drawChart();
});

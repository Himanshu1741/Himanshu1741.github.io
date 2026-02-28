/**
 * generate-icons.js
 * Run: node generate-icons.js
 * Creates public/icons/icon-192.png and icon-512.png using the canvas package.
 * If canvas is unavailable, falls back to writing an SVG placeholder.
 */

const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "public", "icons");
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── Inline SVG source ────────────────────────────────────────────────────── */
const svgSrc = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#g)"/>
  <!-- Abstract "C" + connection dots -->
  <circle cx="256" cy="256" r="110" fill="none" stroke="#fff" stroke-width="36"/>
  <rect x="230" y="146" width="140" height="36" rx="18" fill="#fff"/>
  <rect x="230" y="330" width="140" height="36" rx="18" fill="#fff"/>
  <circle cx="170" cy="164" r="28" fill="#fff"/>
  <circle cx="170" cy="348" r="28" fill="#fff"/>
</svg>`;

/* ── Write SVG ────────────────────────────────────────────────────────────── */
fs.writeFileSync(path.join(OUT_DIR, "icon.svg"), svgSrc);
console.log("✅ icon.svg written");

/* ── Try canvas for PNG ───────────────────────────────────────────────────── */
let canvasAvailable = false;
try {
  require.resolve("canvas");
  canvasAvailable = true;
} catch {}

if (canvasAvailable) {
  const { createCanvas, loadImage } = require("canvas");
  const { Resvg } = (() => {
    try {
      return require("@resvg/resvg-js");
    } catch {
      return {};
    }
  })();

  const sizes = [192, 512];
  sizes.forEach((size) => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, "#8b5cf6");
    grad.addColorStop(1, "#06b6d4");

    // Rounded rect background
    const r = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(size - r, 0);
    ctx.quadraticCurveTo(size, 0, size, r);
    ctx.lineTo(size, size - r);
    ctx.quadraticCurveTo(size, size, size - r, size);
    ctx.lineTo(r, size);
    ctx.quadraticCurveTo(0, size, 0, size - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    const cx = size / 2,
      cy = size / 2;
    const radius = size * 0.215;
    const lw = size * 0.07;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Top bar
    const barH = lw,
      barW = size * 0.27,
      rx2 = barH / 2;
    const barXOffset = size * 0.045;
    ctx.fillStyle = "#ffffff";
    [
      [cx + barXOffset, cy - radius - barH / 2],
      [cx + barXOffset, cy + radius - barH / 2],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, rx2);
      ctx.fill();
    });

    // Dots
    const dotR = size * 0.055;
    [
      [cx - radius, cy - radius],
      [cx - radius, cy + radius],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, dotR, 0, 2 * Math.PI);
      ctx.fill();
    });

    const buf = canvas.toBuffer("image/png");
    fs.writeFileSync(path.join(OUT_DIR, `icon-${size}.png`), buf);
    console.log(`✅ icon-${size}.png written`);
  });
} else {
  // Fallback: copy SVG as PNG placeholder (browsers accept this in dev)
  const sizes = [192, 512];
  sizes.forEach((size) => {
    fs.copyFileSync(
      path.join(OUT_DIR, "icon.svg"),
      path.join(OUT_DIR, `icon-${size}.png`),
    );
    console.log(
      `⚠️  icon-${size}.png is an SVG copy (install 'canvas' for real PNGs)`,
    );
  });
}

console.log("\n✨ Icons ready in public/icons/");

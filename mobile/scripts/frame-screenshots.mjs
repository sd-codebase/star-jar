// Frames raw phone captures (adb screencap, 720×1640) into 1080×1920 Play Store screenshots
// with a Fredoka caption on the app's sky background. Run: node scripts/frame-screenshots.mjs <raw dir>
// Raw files are matched by name: 1-jar.png, 2-earn.png, ... (see SHOTS).
import { Buffer } from "node:buffer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { svgText } from "./svg-text.mjs";

const raw = process.argv[2];
if (!raw) throw new Error("usage: node scripts/frame-screenshots.mjs <raw dir>");
const out = join(dirname(fileURLToPath(import.meta.url)), "..", "store-assets", "screenshots");
mkdirSync(out, { recursive: true });

const W = 1080;
const H = 1920;
const INK = "#2b1055";
// Capture area kept from each raw shot: below the status bar, above the navigation bar (y 1545).
const CROP_H = 1440;
const SHOT_W = 760;
const SHOT_H = Math.round((CROP_H * SHOT_W) / 720);
const RADIUS = 44;
const BORDER = 10;

// [raw file, crop top, caption]
const SHOTS = [
  ["1-jar.png", 80, "Watch the jar\nfill with stars"],
  ["2-earn.png", 105, "Tap a good habit,\nearn a star"],
  ["3-road.png", 100, "Walk the road\nto treasure"],
  ["4-home.png", 80, "Every kid gets\ntheir own jar"],
  ["5-milestones.png", 80, "Set badges and\nreal rewards"],
  ["6-log.png", 80, "Parents stay\nin control"],
];

function rays(cx, cy, r, n = 16) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = ((i * 360) / n) * (Math.PI / 180);
    const a1 = a0 + (Math.PI / n) * 0.9;
    d += `M${cx} ${cy}L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}Z`;
  }
  return `<path d="${d}" fill="#fff" opacity="0.13"/>`;
}

const left = (W - SHOT_W) / 2;
const top = H - SHOT_H - 70;
const CAPTION = 84;
const frame = (text) => {
  const lines = text.split("\n").length;
  const block = CAPTION * (0.72 + (lines - 1) * 1.15);
  const caption = svgText(text, { x: W / 2, y: (top - block) / 2 + CAPTION * 0.72, size: CAPTION, fill: "#fde047", center: true, shadow: { color: INK, dx: 5, dy: 7 } });
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#7b2ff7"/><stop offset="0.55" stop-color="#f107a3"/><stop offset="1" stop-color="#ff9a00"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="${INK}" flood-opacity="0.45"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${rays(W / 2, 200, H * 1.2)}
  ${caption}
  <rect x="${left - BORDER}" y="${top - BORDER}" width="${SHOT_W + 2 * BORDER}" height="${SHOT_H + 2 * BORDER}" rx="${RADIUS + BORDER}" fill="#fff" filter="url(#shadow)"/>
</svg>`);
};

const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SHOT_W}" height="${SHOT_H}"><rect width="${SHOT_W}" height="${SHOT_H}" rx="${RADIUS}" fill="#fff"/></svg>`);

for (const [i, [file, cropTop, text]] of SHOTS.entries()) {
  const shot = await sharp(join(raw, file))
    .extract({ left: 0, top: cropTop, width: 720, height: CROP_H })
    .resize(SHOT_W, SHOT_H)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const name = `${String(i + 1).padStart(2, "0")}-${file.replace(/^\d+-/, "")}`;
  await sharp(frame(text))
    .composite([{ input: shot, left, top }])
    .flatten({ background: "#7b2ff7" })
    .removeAlpha()
    .png()
    .toFile(join(out, name));
  console.log("wrote", `store-assets/screenshots/${name}`);
}

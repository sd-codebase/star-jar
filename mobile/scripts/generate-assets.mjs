// Renders the app icon, Android adaptive icon layers, splash image and store graphics
// from one vector drawing of the in-app star jar. Run: node scripts/generate-assets.mjs
import { Buffer } from "node:buffer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { svgText } from "./svg-text.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const assets = join(root, "assets");
const store = join(root, "store-assets");
mkdirSync(store, { recursive: true });

const INK = "#2b1055";
const SKY = ["#7b2ff7", "#f107a3", "#ff9a00"];
const GOLD = "#ffd60a";

/** 5-point star centred on (x, y). */
function starPath(x, y, r, rot = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = ((i * 36 + rot - 90) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push(`${(x + rr * Math.cos(a)).toFixed(1)},${(y + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** 4-point sparkle centred on (x, y). */
const sparkle = (x, y, r) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;

// Same jar outline as src/components/StarJar.tsx (local 200×250 box).
const JAR = "M45 60 Q40 60 40 75 L35 215 Q35 240 60 240 L140 240 Q165 240 165 215 L160 75 Q160 60 155 60 Z";
const JAR_STARS = [
  [72, 205, 19, 8], [127, 200, 21, -12], [100, 168, 19, 20], [64, 160, 13, -5], [138, 152, 14, 15], [101, 224, 11, 0],
];
// Content box of the drawing in local units (big star pokes above the lid).
const BOX = { x: 0, y: -30, w: 200, h: 282 };

/** The jar drawing; `mono` gives white line art for Android's themed icon. */
function jar({ mono = false } = {}) {
  const line = mono ? "#fff" : INK;
  if (mono) {
    return `
      <path d="${JAR}" fill="none" stroke="#fff" stroke-width="12" stroke-linejoin="round"/>
      ${JAR_STARS.map(([x, y, r, rot]) => `<path d="${starPath(x, y, r, rot)}" fill="#fff"/>`).join("")}
      <rect x="38" y="36" width="124" height="28" rx="11" fill="#fff"/>
      <path d="${starPath(100, 2, 34, 12)}" fill="#fff"/>`;
  }
  return `
    <ellipse cx="100" cy="246" rx="72" ry="9" fill="rgba(43,16,85,0.28)"/>
    <path d="${JAR}" fill="rgba(255,255,255,0.78)"/>
    <g clip-path="url(#jarClip)">
      <path d="M20 118 Q60 100 100 118 T180 118 V260 H20 Z" fill="url(#liquid)"/>
      ${JAR_STARS.map(([x, y, r, rot]) => `<path d="${starPath(x, y, r, rot)}" fill="${GOLD}" stroke="${line}" stroke-width="4.5" stroke-linejoin="round"/>`).join("")}
    </g>
    <path d="${JAR}" fill="none" stroke="${line}" stroke-width="8" stroke-linejoin="round"/>
    <path d="M58 88 L55 130" stroke="#fff" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
    <rect x="38" y="36" width="124" height="28" rx="11" fill="#ff9f1c" stroke="${line}" stroke-width="7"/>
    <path d="M50 44 L120 44" stroke="#ffd29a" stroke-width="6" stroke-linecap="round"/>
    <path d="${starPath(100, 2, 34, 12)}" fill="${GOLD}" stroke="${line}" stroke-width="6" stroke-linejoin="round"/>
    <path d="${sparkle(22, 20, 14)}" fill="#fff"/>
    <path d="${sparkle(182, 40, 11)}" fill="#fff"/>`;
}

const DEFS = `
  <defs>
    <clipPath id="jarClip"><path d="${JAR}"/></clipPath>
    <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff176"/><stop offset="1" stop-color="#ffb703"/>
    </linearGradient>
    <linearGradient id="sky" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${SKY[0]}"/><stop offset="0.55" stop-color="${SKY[1]}"/><stop offset="1" stop-color="${SKY[2]}"/>
    </linearGradient>
  </defs>`;

/** Places the jar so its content box is `height` px tall, centred on (cx, cy). */
function placed(cx, cy, height, opts) {
  const s = height / BOX.h;
  const tx = cx - (BOX.x + BOX.w / 2) * s;
  const ty = cy - (BOX.y + BOX.h / 2) * s;
  return `<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${s.toFixed(4)})">${jar(opts)}</g>`;
}

/** Soft sunburst like the in-app Rays, centred on (cx, cy). */
function rays(cx, cy, r, n = 16) {
  let d = "";
  for (let i = 0; i < n; i++) {
    const a0 = ((i * 360) / n) * (Math.PI / 180);
    const a1 = a0 + (Math.PI / n) * 0.9;
    d += `M${cx} ${cy}L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}L${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}Z`;
  }
  return `<path d="${d}" fill="#fff" opacity="0.13"/>`;
}

const background = (w, h, cx = w / 2, cy = h / 2) => `
  <rect width="${w}" height="${h}" fill="url(#sky)"/>
  ${rays(cx, cy, Math.max(w, h))}
  <path d="${sparkle(w * 0.16, h * 0.2, w * 0.03)}" fill="#fff" opacity="0.7"/>
  <path d="${sparkle(w * 0.85, h * 0.78, w * 0.025)}" fill="#fff" opacity="0.6"/>`;

const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${DEFS}${body}</svg>`);

async function out(file, w, h, body, { opaque = false } = {}) {
  let img = sharp(svg(w, h, body));
  // App Store icons must have no alpha channel.
  if (opaque) img = img.flatten({ background: SKY[0] }).removeAlpha();
  await img.png().toFile(file);
  console.log("wrote", file.replace(root + "/", ""));
}

// iOS / generic app icon: full-bleed, square, opaque (the OS rounds the corners).
await out(join(assets, "icon.png"), 1024, 1024, background(1024, 1024) + placed(512, 520, 760), { opaque: true });

// Android adaptive icon: 108dp canvas, launchers mask to a shape inside the central 66dp,
// so the jar stays within ~61% of the canvas.
await out(join(assets, "android-icon-background.png"), 1024, 1024, background(1024, 1024), { opaque: true });
await out(join(assets, "android-icon-foreground.png"), 1024, 1024, placed(512, 520, 560));
await out(join(assets, "android-icon-monochrome.png"), 1024, 1024, placed(512, 520, 560, { mono: true }));

// Splash: the jar alone on transparent, shown on the purple splash background.
await out(join(assets, "splash-icon.png"), 1024, 1024, placed(512, 512, 980));

// In-app logo (Home and Login screens), tightly cropped to the drawing's proportions.
await out(join(assets, "logo.png"), 400, 580, placed(200, 290, 560));

// Play Store listing: 512×512 icon, 1024×500 feature graphic.
await out(join(store, "play-icon-512.png"), 512, 512, background(512, 512) + placed(256, 260, 380), { opaque: true });

await out(
  join(store, "feature-graphic-1024x500.png"),
  1024,
  500,
  background(1024, 500, 250, 250) +
    placed(250, 255, 430) +
    svgText("Star Jar", { x: 472, y: 250, size: 128, fill: "#fde047", shadow: { color: INK, dx: 6, dy: 8 } }) +
    svgText("Stars for good habits", { x: 480, y: 340, size: 44, fill: "#ffffff" }),
  { opaque: true },
);

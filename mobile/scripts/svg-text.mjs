// Fredoka text as SVG paths, so store graphics don't depend on the fonts installed on the
// build machine (sharp's own text renderer falls back to a system font on macOS).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { parse } from "opentype.js";

const file = createRequire(import.meta.url).resolve("@expo-google-fonts/fredoka/700Bold/Fredoka_700Bold.ttf");
const buf = readFileSync(file);
const font = parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

/**
 * Lines of text (split on "\n") whose first baseline is at `y`; `x` is the left edge, or
 * the centre when `center` is set. `shadow` adds a hard ink drop shadow like the app titles.
 */
export function svgText(text, { x, y, size, fill, center = false, lineHeight = 1.15, shadow }) {
  let d = "";
  text.split("\n").forEach((line, i) => {
    const left = center ? x - font.getAdvanceWidth(line, size) / 2 : x;
    d += font.getPath(line, left, y + i * size * lineHeight, size).toPathData(2);
  });
  const under = shadow ? `<path d="${d}" fill="${shadow.color}" transform="translate(${shadow.dx} ${shadow.dy})"/>` : "";
  return `${under}<path d="${d}" fill="${fill}"/>`;
}

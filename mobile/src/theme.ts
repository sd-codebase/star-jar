/** Design tokens mirrored from webapp/src/app/globals.css and the Tailwind classes the web screens use. */

export const sky = { a: "#7b2ff7", b: "#f107a3", c: "#ff9a00" };
export const ink = "#2b1055";

/** Tailwind palette values used by the web screens. */
export const tw = {
  white: "#ffffff",
  purple50: "#faf5ff",
  purple100: "#f3e8ff",
  purple200: "#e9d5ff",
  purple300: "#d8b4fe",
  purple400: "#c084fc",
  purple500: "#a855f7",
  purple600: "#9333ea",
  purple700: "#7e22ce",
  purple800: "#6b21a8",
  purple900: "#581c87",
  purple950: "#3b0764",
  yellow50: "#fefce8",
  yellow200: "#fef08a",
  yellow300: "#fde047",
  yellow400: "#facc15",
  orange50: "#fff7ed",
  orange300: "#fdba74",
  orange500: "#f97316",
  pink50: "#fdf2f8",
  pink100: "#fce7f3",
  pink200: "#fbcfe8",
  pink500: "#ec4899",
  pink600: "#db2777",
  pink700: "#be185d",
  green50: "#f0fdf4",
  green200: "#bbf7d0",
  green300: "#86efac",
  green400: "#4ade80",
  green500: "#22c55e",
  green600: "#16a34a",
  green700: "#15803d",
  green800: "#166534",
  red50: "#fef2f2",
  red200: "#fecaca",
  red400: "#f87171",
  red500: "#ef4444",
  red600: "#dc2626",
  red700: "#b91c1c",
  blue500: "#3b82f6",
  slate300: "#cbd5e1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate900: "#0f172a",
  sky100: "#e0f2fe",
  sky300: "#7dd3fc",
  sky400: "#38bdf8",
  indigo600: "#4f46e5",
  indigo900: "#312e81",
};

/** Tailwind text sizes (px). */
export const fs = { xs: 12, sm: 14, base: 16, lg: 18, xl: 20, "2xl": 24, "3xl": 30, "4xl": 36, "5xl": 48, "6xl": 60, "7xl": 72, "8xl": 96 };

export const font = {
  400: "Fredoka_400Regular",
  500: "Fredoka_500Medium",
  600: "Fredoka_600SemiBold",
  700: "Fredoka_700Bold",
} as const;
export type Weight = keyof typeof font;

/** `.btn3d` chunky candy button shadow, resting and pressed. */
export const btn3dShadow = "0 7px 0 rgba(0,0,0,0.25), inset 0 -4px 0 rgba(0,0,0,0.12), inset 0 3px 0 rgba(255,255,255,0.45)";
export const btn3dShadowPressed = "0 2px 0 rgba(0,0,0,0.25), inset 0 -2px 0 rgba(0,0,0,0.12), inset 0 3px 0 rgba(255,255,255,0.45)";

/** `.card` */
export const cardShadow = "0 10px 0 rgba(43,16,85,0.18), 0 20px 40px rgba(43,16,85,0.2)";

/** framer-motion `bounce` → Reanimated spring damping ratio. */
export const spring = (bounce = 0.25, duration = 800) => ({ dampingRatio: 1 - bounce, duration });

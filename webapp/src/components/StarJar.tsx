"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

export function CountUp({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const [shown, setShown] = useState(value);
  useEffect(() => rounded.on("change", setShown), [rounded]);
  useEffect(() => {
    const c = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    return () => c.stop();
  }, [mv, value]);
  return <>{shown}</>;
}

const STAR_SPOTS = [
  [70, 205], [105, 212], [135, 200], [85, 180], [120, 178], [65, 155], [100, 150], [135, 158],
  [80, 128], [118, 122], [70, 100], [102, 95], [135, 105], [88, 72],
];

/** A glass jar that fills toward the next milestone. */
export default function StarJar({ progress, color }: { progress: number; color: string }) {
  const pct = Math.max(0, Math.min(1, progress));
  const top = 230 - pct * 170; // liquid surface y (60..230)

  return (
    <svg viewBox="0 0 200 250" className="h-48 w-40 drop-shadow-xl sm:h-56 sm:w-48">
      <defs>
        <clipPath id="jar-clip">
          <path d="M45 60 Q40 60 40 75 L35 215 Q35 240 60 240 L140 240 Q165 240 165 215 L160 75 Q160 60 155 60 Z" />
        </clipPath>
        <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff176" />
          <stop offset="1" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M45 60 Q40 60 40 75 L35 215 Q35 240 60 240 L140 240 Q165 240 165 215 L160 75 Q160 60 155 60 Z" fill="rgba(255,255,255,0.55)" stroke="#2b1055" strokeWidth="6" />
      <g clipPath="url(#jar-clip)">
        <motion.g initial={{ y: 200 }} animate={{ y: top - 50 }} transition={{ type: "spring", bounce: 0.35, duration: 1.4 }}>
          <motion.path
            d="M-200 50 Q-175 38 -150 50 T-100 50 T-50 50 T0 50 T50 50 T100 50 T150 50 T200 50 T250 50 T300 50 V300 H-200 Z"
            fill="url(#liquid)"
            animate={{ x: [0, 100] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </motion.g>
        {STAR_SPOTS.map(([x, y], i) =>
          y > top + 8 ? (
            <motion.text
              key={i}
              x={x}
              y={y}
              fontSize="22"
              textAnchor="middle"
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 15, -15, 0] }}
              transition={{ delay: i * 0.05, rotate: { duration: 3, repeat: Infinity, delay: i * 0.2 } }}
              style={{ originX: `${x}px`, originY: `${y}px` }}
            >
              ⭐
            </motion.text>
          ) : null,
        )}
      </g>
      <rect x="38" y="38" width="124" height="26" rx="10" fill="#ff9f1c" stroke="#2b1055" strokeWidth="6" />
      <path d="M55 85 L52 200" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

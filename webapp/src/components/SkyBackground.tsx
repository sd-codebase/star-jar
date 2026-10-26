"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const ITEMS = ["⭐", "✨", "☁️", "🌟", "💫", "⭐", "☁️", "✨", "🌈", "⭐", "💖", "🌟"];

type Floater = { left: number; top: number; size: number; dur: number; delay: number; emoji: string };

/** Floating stars & clouds behind every screen. */
export default function SkyBackground() {
  const [items, setItems] = useState<Floater[]>([]);

  useEffect(() => {
    setItems(
      ITEMS.map((emoji, i) => ({
        emoji,
        left: (i * 83) % 100,
        top: (i * 47 + 7) % 95,
        size: 18 + ((i * 13) % 30),
        dur: 5 + (i % 5),
        delay: i * 0.4,
      })),
    );
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute opacity-60"
          style={{ left: `${it.left}%`, top: `${it.top}%`, fontSize: it.size }}
          animate={{ y: [0, -24, 0], rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {it.emoji}
        </motion.span>
      ))}
    </div>
  );
}

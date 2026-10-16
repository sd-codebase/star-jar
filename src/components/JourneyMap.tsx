"use client";

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Kid, Milestone } from "@/lib/types";

const GAP = 150;
const H = 230;
const yAt = (i: number) => H / 2 + Math.sin(i * 1.3) * 55;

/** Game-style winding road: home → treasure chests at each milestone, avatar walks along it. */
export default function JourneyMap({ kid, milestones, total }: { kid: Kid; milestones: Milestone[]; total: number }) {
  const scroller = useRef<HTMLDivElement>(null);
  const sorted = [...milestones].sort((a, b) => a.points - b.points);
  const nodes = [{ points: 0, x: 60, y: yAt(0) }, ...sorted.map((m, i) => ({ points: m.points, x: 60 + (i + 1) * GAP, y: yAt(i + 1) }))];
  const width = nodes[nodes.length - 1].x + 80;

  // Where the avatar stands: between the last reached node and the next one.
  let seg = nodes.findIndex((n) => n.points > total);
  if (seg === -1) seg = nodes.length;
  const a = nodes[Math.max(0, seg - 1)];
  const b = nodes[Math.min(nodes.length - 1, seg)];
  const f = b.points === a.points ? 0 : (total - a.points) / (b.points - a.points);
  const pos = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };

  const path = nodes.reduce((d, n, i) => {
    if (i === 0) return `M${n.x} ${n.y}`;
    const p = nodes[i - 1];
    const mx = (p.x + n.x) / 2;
    return `${d} C${mx} ${p.y} ${mx} ${n.y} ${n.x} ${n.y}`;
  }, "");

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: pos.x - el.clientWidth / 2, behavior: "smooth" });
  }, [pos.x]);

  return (
    <div ref={scroller} className="no-scrollbar overflow-x-auto rounded-[1.5rem] bg-gradient-to-b from-sky-300 to-green-300">
      <div className="relative" style={{ width, height: H }}>
        <svg width={width} height={H} className="absolute inset-0">
          <path d={path} fill="none" stroke="#c08552" strokeWidth="30" strokeLinecap="round" />
          <path d={path} fill="none" stroke="#fff3b0" strokeWidth="6" strokeDasharray="14 14" strokeLinecap="round" />
        </svg>

        <div className="absolute text-5xl" style={{ left: nodes[0].x - 28, top: nodes[0].y - 34 }}>
          🏠
        </div>

        {sorted.map((m, i) => {
          const n = nodes[i + 1];
          const got = !!kid.unlocked[m.id];
          return (
            <div key={m.id} className="absolute flex w-28 flex-col items-center" style={{ left: n.x - 56, top: n.y - 46 }}>
              <motion.div
                animate={got ? { y: [0, -6, 0] } : { rotate: [0, -5, 5, 0] }}
                transition={{ duration: got ? 1.5 : 2.5, repeat: Infinity, delay: i * 0.2 }}
                className={`flex h-16 w-16 items-center justify-center rounded-full border-4 text-4xl shadow-lg ${
                  got ? "border-yellow-300 bg-white shadow-yellow-300/80" : "border-white/70 bg-purple-900/40 grayscale-[0.4]"
                }`}
              >
                {got ? m.badge : "🎁"}
              </motion.div>
              <span className={`mt-1 rounded-full px-2 text-sm font-bold ${got ? "bg-yellow-300 text-purple-900" : "bg-white/80 text-purple-800"}`}>
                {got ? "✔ " : "🔒 "}
                {m.points}⭐
              </span>
            </div>
          );
        })}

        <motion.div
          className="absolute z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white text-4xl shadow-xl"
          style={{ background: kid.color }}
          initial={{ left: 32, top: nodes[0].y - 60 }}
          animate={{ left: pos.x - 28, top: pos.y - 60, y: [0, -10, 0] }}
          transition={{ left: { duration: 1.5 }, top: { duration: 1.5 }, y: { duration: 0.9, repeat: Infinity } }}
        >
          {kid.avatar}
        </motion.div>
      </div>
    </div>
  );
}

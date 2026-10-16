"use client";

import { motion } from "framer-motion";
import { formatWait, type Check } from "@/lib/rules";
import type { Activity } from "@/lib/types";

const GOOD_COLORS = ["#ff006e", "#fb5607", "#ffbe0b", "#06d6a0", "#3a86ff", "#8338ec", "#00b4d8", "#ff4d6d"];

export default function ActivityCard({
  activity,
  index,
  doneToday,
  maxPerDay,
  check,
  onTap,
}: {
  activity: Activity;
  index: number;
  doneToday: number;
  maxPerDay: number;
  check: Check;
  onTap: (e: React.MouseEvent) => void;
}) {
  const good = activity.kind === "good";
  const bg = good ? GOOD_COLORS[index % GOOD_COLORS.length] : "#6c757d";
  const locked = !check.ok;

  return (
    <motion.button
      initial={{ scale: 0, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", bounce: 0.55, delay: index * 0.05 }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.88 }}
      onClick={onTap}
      className={`btn3d relative flex flex-col items-center justify-center overflow-hidden text-white ${good ? "aspect-square p-3" : "p-3"}`}
      style={{ background: good ? `linear-gradient(160deg, ${bg}, ${bg}cc)` : "linear-gradient(160deg,#8d99ae,#5c677d)" }}
    >
      <motion.span
        className={good ? "text-6xl sm:text-7xl" : "text-4xl"}
        animate={locked ? { opacity: 0.45 } : { y: [0, -6, 0], rotate: [0, -6, 6, 0] }}
        transition={{ duration: 2, repeat: locked ? 0 : Infinity, delay: index * 0.15 }}
      >
        {activity.emoji}
      </motion.span>
      <span className={`mt-1 text-center font-bold leading-tight drop-shadow ${good ? "text-lg sm:text-xl" : "text-sm"}`}>{activity.name}</span>
      <span className={`mt-1 rounded-full px-2 text-sm font-bold ${good ? "bg-white/30" : "bg-black/25"}`}>
        {activity.points > 0 ? `+${activity.points}` : activity.points} ⭐
      </span>

      {good && (
        <div className="absolute left-2 top-2 flex gap-1">
          {Array.from({ length: maxPerDay }).map((_, i) => (
            <span key={i} className={`h-3 w-3 rounded-full border-2 border-white ${i < doneToday ? "bg-yellow-300" : "bg-white/20"}`} />
          ))}
        </div>
      )}

      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-950/55 backdrop-blur-[1px]">
          {check.reason === "daily" ? (
            <>
              <span className="text-4xl">✅</span>
              <span className="text-sm font-bold">Done for today!</span>
            </>
          ) : (
            <>
              <motion.span animate={{ rotate: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity }} className="text-3xl">
                ⏳
              </motion.span>
              <span className="text-xl font-bold tabular-nums">{formatWait(check.waitMs)}</span>
            </>
          )}
        </div>
      )}
    </motion.button>
  );
}

"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useState } from "react";
import { sounds } from "@/lib/fx";

const KEY_COLORS = ["#ff006e", "#fb5607", "#ffbe0b", "#06d6a0", "#3a86ff", "#8338ec", "#ff4d6d", "#2ec4b6", "#ff8c00", "#00b4d8"];

export default function PinPad({
  length = 4,
  onSubmit,
  hint,
}: {
  length?: number;
  /** Return (or resolve) true if PIN accepted. */
  onSubmit: (pin: string) => boolean | Promise<boolean>;
  hint?: string;
}) {
  const [pin, setPin] = useState("");
  const controls = useAnimationControls();

  const press = (d: string) => {
    sounds.tap();
    const next = (pin + d).slice(0, length);
    setPin(next);
    if (next.length === length) {
      setTimeout(async () => {
        if (!(await onSubmit(next))) {
          sounds.wrong();
          void controls.start({ x: [0, -18, 18, -12, 12, -6, 6, 0], transition: { duration: 0.5 } });
          setPin("");
        }
      }, 150);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {hint && <p className="text-center text-lg font-semibold text-purple-900/70">{hint}</p>}
      <motion.div animate={controls} className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <motion.div
            key={i}
            animate={{ scale: i < pin.length ? [1, 1.4, 1] : 1 }}
            className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-purple-300 bg-white text-2xl"
          >
            {i < pin.length ? "⭐" : ""}
          </motion.div>
        ))}
      </motion.div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", ""].map((k, i) =>
          k === "" ? (
            <div key={i} />
          ) : (
            <motion.button
              key={k}
              whileTap={{ scale: 0.85 }}
              onClick={() => (k === "⌫" ? setPin((p) => p.slice(0, -1)) : press(k))}
              className="btn3d h-[4.5rem] w-[4.5rem] text-3xl text-white sm:h-20 sm:w-20"
              style={{ background: k === "⌫" ? "#adb5bd" : KEY_COLORS[Number(k)] }}
            >
              {k}
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}

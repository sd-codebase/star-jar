"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { fireworks, sounds, speak } from "@/lib/fx";
import { milestoneMessage } from "@/lib/messages";
import type { Milestone } from "@/lib/types";

/** Full-screen treasure reveal: shaking gift → tap → badge + real gift. */
export default function MilestoneOverlay({ milestone, kidName, onDone }: { milestone: Milestone | null; kidName: string; onDone: () => void }) {
  const [opened, setOpened] = useState(false);
  const [taps, setTaps] = useState(0);

  const tapGift = () => {
    sounds.tap();
    if (taps < 2) return setTaps((t) => t + 1);
    setOpened(true);
    sounds.fanfare();
    fireworks();
    if (milestone) speak(`${milestoneMessage(kidName)} You got the ${milestone.title} badge!${milestone.gift ? ` And your gift is ${milestone.gift}!` : ""}`);
  };

  const done = () => {
    setOpened(false);
    setTaps(0);
    onDone();
  };

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          key={milestone.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-900/95 via-purple-800/95 to-pink-700/95 p-4"
        >
          <motion.h2
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", bounce: 0.6 }}
            className="text-outline text-center text-5xl font-bold text-yellow-300 sm:text-6xl"
          >
            {opened ? "TREASURE!" : "You found a treasure!"}
          </motion.h2>

          <div className="relative mt-8 flex h-80 w-80 items-center justify-center">
            {opened && (
              <motion.div
                className="rays absolute inset-[-40%]"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ scale: { duration: 0.5 }, rotate: { duration: 10, repeat: Infinity, ease: "linear" } }}
              />
            )}
            {!opened ? (
              <motion.button
                onClick={tapGift}
                animate={{ rotate: [0, -12, 12, -12, 12, 0], scale: 1 + taps * 0.15 }}
                transition={{ rotate: { duration: 0.6, repeat: Infinity, repeatDelay: 0.4 } }}
                whileTap={{ scale: 1.4 + taps * 0.15 }}
                className="relative text-[10rem] drop-shadow-2xl"
              >
                🎁
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", bounce: 0.6, duration: 1 }}
                className="relative flex h-56 w-56 items-center justify-center rounded-full border-8 border-yellow-300 bg-white text-[8rem] shadow-[0_0_80px_rgba(255,230,0,0.8)]"
              >
                <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  {milestone.badge}
                </motion.span>
              </motion.div>
            )}
          </div>

          {!opened ? (
            <motion.p animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="mt-6 text-3xl font-bold text-white">
              👆 Tap the gift {3 - taps} {3 - taps === 1 ? "time" : "times"}!
            </motion.p>
          ) : (
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-6 flex flex-col items-center text-center">
              <p className="text-4xl font-bold text-white">{milestone.title}</p>
              <p className="text-xl text-pink-100">{milestone.points} stars reached!</p>
              {milestone.gift && (
                <div className="btn3d mt-5 bg-yellow-300 px-6 py-4 text-2xl text-purple-900">
                  🎉 Your gift: <b>{milestone.gift}</b>
                  <div className="text-base font-semibold">Show this to Mom or Dad!</div>
                </div>
              )}
              <motion.button whileTap={{ scale: 0.9 }} onClick={done} className="btn3d mt-8 bg-green-400 px-10 py-4 text-3xl text-white">
                Yay! 🥳
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

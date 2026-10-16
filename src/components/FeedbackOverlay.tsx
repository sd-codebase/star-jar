"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export type Feedback = {
  id: string;
  kind: "good" | "bad" | "blocked";
  emoji: string;
  title: string;
  text: string;
  points?: number;
};

const RING = Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2);

export default function FeedbackOverlay({ feedback, onClose }: { feedback: Feedback | null; onClose: () => void }) {
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(onClose, feedback.kind === "blocked" ? 2500 : 4000);
    return () => clearTimeout(t);
  }, [feedback, onClose]);

  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          key={feedback.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className={`fixed inset-0 z-40 flex items-center justify-center p-4 ${feedback.kind === "bad" ? "bg-slate-900/70" : "bg-purple-950/50"}`}
        >
          {feedback.kind === "good" && <Good f={feedback} />}
          {feedback.kind === "bad" && <Bad f={feedback} />}
          {feedback.kind === "blocked" && <Blocked f={feedback} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Good({ f }: { f: Feedback }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", bounce: 0.6 }}
      className="relative flex flex-col items-center"
    >
      <motion.div className="rays absolute -top-24 h-96 w-96" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
      <div className="relative flex h-48 w-48 items-center justify-center">
        {RING.map((a, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl"
            initial={{ x: 0, y: 0, scale: 0 }}
            animate={{ x: Math.cos(a) * 140, y: Math.sin(a) * 140, scale: [0, 1.4, 0.8], rotate: 360 }}
            transition={{ duration: 1, delay: 0.15 }}
          >
            {i % 2 ? "⭐" : "✨"}
          </motion.span>
        ))}
        <motion.span
          className="text-[8rem] drop-shadow-2xl"
          animate={{ scale: [1, 1.25, 1], rotate: [0, -12, 12, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {f.emoji}
        </motion.span>
      </div>
      <motion.h2
        initial={{ y: 40, scale: 0.5 }}
        animate={{ y: 0, scale: 1 }}
        transition={{ type: "spring", delay: 0.2, bounce: 0.7 }}
        className="text-outline relative mt-2 text-6xl font-bold text-yellow-300 drop-shadow-[0_6px_0_rgba(0,0,0,0.3)] sm:text-7xl"
      >
        {f.title}
      </motion.h2>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.5, 1] }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="btn3d relative mt-4 bg-yellow-300 px-6 py-2 text-4xl text-purple-900"
      >
        +{f.points} ⭐
      </motion.div>
      <p className="relative mt-5 max-w-sm text-center text-2xl font-semibold text-white drop-shadow-lg">{f.text}</p>
    </motion.div>
  );
}

function Bad({ f }: { f: Feedback }) {
  return (
    <motion.div
      initial={{ y: -200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 200, opacity: 0 }}
      transition={{ type: "spring", bounce: 0.3 }}
      className="relative flex w-full max-w-sm flex-col items-center rounded-[2rem] bg-gradient-to-b from-sky-400 to-indigo-600 p-8 shadow-2xl"
    >
      <motion.div animate={{ x: [-10, 10, -10] }} transition={{ duration: 3, repeat: Infinity }} className="relative text-8xl">
        🌧️
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="absolute top-20 text-2xl"
            style={{ left: 10 + i * 18 }}
            animate={{ y: [0, 90], opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          >
            💧
          </motion.span>
        ))}
      </motion.div>
      <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="mt-6 text-7xl">
        {f.emoji}
      </motion.span>
      <h2 className="mt-3 text-5xl font-bold text-white drop-shadow">{f.title}</h2>
      <motion.div
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: 60, opacity: 0.6 }}
        transition={{ delay: 0.5, duration: 1.2 }}
        className="mt-3 rounded-full bg-white/25 px-5 py-1 text-3xl font-bold text-white"
      >
        {f.points} ⭐
      </motion.div>
      <p className="mt-4 text-center text-xl font-semibold text-white">{f.text}</p>
      <p className="mt-3 text-lg text-sky-100">You can do it! 💪💙</p>
    </motion.div>
  );
}

function Blocked({ f }: { f: Feedback }) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1, rotate: [0, -4, 4, -4, 0] }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", bounce: 0.6 }}
      className="card flex max-w-sm flex-col items-center p-8 text-center"
    >
      <motion.span animate={{ rotate: [0, 180, 360] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-7xl">
        {f.emoji}
      </motion.span>
      <h2 className="mt-3 text-4xl font-bold text-purple-700">{f.title}</h2>
      <p className="mt-2 text-xl font-semibold">{f.text}</p>
    </motion.div>
  );
}

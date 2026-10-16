"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PinPad from "@/components/PinPad";
import SkyBackground from "@/components/SkyBackground";
import { burst, sounds, speak } from "@/lib/fx";
import { pinFor, totalStars } from "@/lib/rules";
import { useData } from "@/lib/store";
import type { Kid } from "@/lib/types";

export default function Home() {
  const data = useData();
  const router = useRouter();
  const [picked, setPicked] = useState<Kid | null>(null);

  if (!data) return <SkyBackground />;

  const pick = (kid: Kid) => {
    sounds.tap();
    speak(`Hi ${kid.name}! Enter your secret code.`);
    setPicked(kid);
  };

  const submit = (pin: string) => {
    if (!picked || pin !== pinFor(picked.birthdate)) return false;
    sessionStorage.setItem("starjar.kid", picked.id);
    sounds.good();
    burst();
    router.push(`/kid/${picked.id}`);
    return true;
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center px-4 pb-16 pt-8">
      <SkyBackground />
      <Link href="/parent" className="btn3d absolute right-4 top-4 bg-white/90 px-4 py-2 text-sm text-purple-800">
        👨‍👩‍👧 Parents
      </Link>

      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.6 }}
        className="mt-12 flex flex-col items-center sm:mt-10"
      >
        <motion.div animate={{ rotate: [0, -10, 10, 0], y: [0, -10, 0] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-8xl drop-shadow-xl">
          🫙
        </motion.div>
        <h1 className="text-outline mt-2 text-5xl font-bold tracking-wide text-yellow-300 drop-shadow-[0_6px_0_rgba(0,0,0,0.25)] sm:text-7xl">
          Star Jar
        </h1>
        <p className="mt-3 text-2xl font-semibold text-white drop-shadow">Who&apos;s playing today?</p>
      </motion.div>

      {data.kids.length === 0 ? (
        <div className="card mt-10 max-w-md p-8 text-center">
          <div className="text-6xl">👋</div>
          <p className="mt-3 text-xl font-semibold">Welcome! Ask a grown-up to add players first.</p>
          <Link href="/parent" className="btn3d mt-6 inline-block bg-yellow-400 px-6 py-3 text-xl">
            Set up Star Jar →
          </Link>
        </div>
      ) : (
        <div className="mt-10 flex w-full flex-wrap justify-center gap-4 sm:gap-5">
          {data.kids.map((kid, i) => (
            <motion.button
              key={kid.id}
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + i * 0.12, type: "spring", bounce: 0.5 }}
              whileHover={{ scale: 1.06, rotate: i % 2 ? 2 : -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => pick(kid)}
              className="btn3d flex w-[calc(50%-0.5rem)] flex-col items-center p-4 text-white sm:w-[calc(33.333%-0.84rem)] sm:p-5"
              style={{ background: kid.color }}
            >
              <motion.span
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 1.6, delay: i * 0.3, repeat: Infinity }}
                className="flex h-24 w-24 items-center justify-center rounded-full bg-white/90 text-6xl shadow-inner sm:h-28 sm:w-28 sm:text-7xl"
              >
                {kid.avatar}
              </motion.span>
              <span className="mt-3 w-full truncate text-center text-2xl font-bold drop-shadow sm:text-3xl">{kid.name}</span>
              <span className="mt-1 rounded-full bg-black/20 px-3 py-0.5 text-lg">⭐ {totalStars(data.entries.filter((e) => e.kidId === kid.id))}</span>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {picked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-purple-950/60 p-4 backdrop-blur-sm"
            onClick={() => setPicked(null)}
          >
            <motion.div
              initial={{ scale: 0.3, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="card relative flex max-w-full flex-col items-center p-5 sm:p-6"
            >
              <button onClick={() => setPicked(null)} className="absolute right-4 top-3 text-3xl text-purple-400">
                ✕
              </button>
              <div className="flex h-24 w-24 items-center justify-center rounded-full text-6xl" style={{ background: picked.color }}>
                {picked.avatar}
              </div>
              <h2 className="mt-2 max-w-full truncate text-3xl font-bold">Hi {picked.name}!</h2>
              <div className="mt-4">
                <PinPad onSubmit={submit} hint="Your secret code: birthday day + month 🎂" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

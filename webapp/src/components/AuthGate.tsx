"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import SkyBackground from "@/components/SkyBackground";
import { dismissError, load, useStore } from "@/lib/store";

/** Pages anyone can read without logging in (the Play Store links to them). */
const PUBLIC = ["/login", "/privacy", "/terms", "/delete-account"];

/** Loads the family once, sends logged-out visitors to /login, and shows request errors as a toast. */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, error } = useStore();
  const path = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC.includes(path);

  useEffect(() => void load(), []);
  useEffect(() => {
    if (status === "anon" && !isPublic) router.replace("/login");
  }, [status, isPublic, router]);

  let content: React.ReactNode = children;
  if (!isPublic && status !== "authed") {
    content =
      status === "error" ? (
        <main className="flex min-h-screen items-center justify-center p-4">
          <SkyBackground />
          <div className="card max-w-sm p-6 text-center">
            <div className="text-5xl">🌧️</div>
            <p className="mt-2 text-xl font-semibold">{error ?? "Couldn't load Star Jar."}</p>
            <button className="btn3d mt-4 bg-purple-600 px-6 py-2 text-white" onClick={() => void load()}>
              Try again
            </button>
          </div>
        </main>
      ) : (
        <SkyBackground />
      );
  }

  return (
    <>
      {content}
      <AnimatePresence>
        {error && status !== "error" && (
          <motion.button
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={dismissError}
            className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-red-600 px-4 py-3 text-left font-semibold text-white shadow-xl"
          >
            ⚠️ {error}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

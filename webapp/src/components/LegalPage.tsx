import Link from "next/link";
import SkyBackground from "@/components/SkyBackground";

export const APP_NAME = "Star Jar";
export const DEVELOPER = "Krishna Jayram Suryavanshi";
export const CONTACT_EMAIL = "krishna.dhas021815@gmail.com";
export const UPDATED = "26 October 2026";

/** Readable long-form page (privacy policy, terms…) that works without logging in. */
export default function LegalPage({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8">
      <SkyBackground />
      <article className="card mx-auto max-w-3xl p-6 sm:p-10 [&_a]:font-semibold [&_a]:text-purple-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
        <div className="text-5xl">{emoji}</div>
        <h1 className="mt-2 text-3xl font-bold text-purple-900 sm:text-4xl">{title}</h1>
        <p className="text-sm text-purple-600">
          {APP_NAME} · Last updated {UPDATED}
        </p>
        <div className="leading-relaxed text-slate-800 sm:text-lg">{children}</div>
        <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t-2 border-purple-100 pt-4 text-sm">
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of use</Link>
          <Link href="/delete-account">Delete your account</Link>
          <a href={`mailto:${CONTACT_EMAIL}`}>Contact</a>
          <Link href="/">Open {APP_NAME}</Link>
        </nav>
      </article>
    </main>
  );
}

export const Email = () => <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

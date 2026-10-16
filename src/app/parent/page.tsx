"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import PinPad from "@/components/PinPad";
import SkyBackground from "@/components/SkyBackground";
import { AVATARS, COLORS, defaultData } from "@/lib/defaults";
import { isToday, pinFor, totalStars } from "@/lib/rules";
import { exportJson, importJson, giveBonus, logActivity, removeEntry, setData, uid, useData } from "@/lib/store";
import type { Activity, AppData, Entry, Kid, Milestone } from "@/lib/types";

const TABS = ["Kids", "Activities", "Milestones", "Log & Gifts", "Settings"] as const;
type Tab = (typeof TABS)[number];

const input = "rounded-xl border-2 border-purple-200 bg-white px-3 py-2 outline-none focus:border-purple-500";
const btn = "btn3d whitespace-nowrap px-4 py-2 text-white";

export default function ParentPage() {
  const data = useData();
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("Kids");

  useEffect(() => setUnlocked(sessionStorage.getItem("starjar.parent") === "1"), []);

  if (!data) return <SkyBackground />;

  if (!unlocked) {
    const creating = !data.settings.parentPin;
    return (
      <main className="flex min-h-screen items-center justify-center p-4">
        <SkyBackground />
        <div className="card flex flex-col items-center p-6">
          <div className="text-5xl">🔐</div>
          <h1 className="mt-2 text-3xl font-bold">{creating ? "Create a Parent PIN" : "Parents Only"}</h1>
          <div className="mt-4">
            <PinPad
              hint={creating ? "Pick 4 digits the kids don't know" : "Enter parent PIN"}
              onSubmit={(pin) => {
                if (creating) setData((d) => ({ ...d, settings: { ...d.settings, parentPin: pin } }));
                else if (pin !== data.settings.parentPin) return false;
                sessionStorage.setItem("starjar.parent", "1");
                setUnlocked(true);
                return true;
              }}
            />
          </div>
          <Link href="/" className="mt-4 font-semibold text-purple-600 underline">
            ← Back
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-20 pt-4">
      <SkyBackground />
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-outline whitespace-nowrap text-3xl font-bold text-white sm:text-4xl">Parent Zone</h1>
        <div className="flex gap-2">
          <Link href="/" className={`${btn} bg-purple-600`}>
            🏠 Home
          </Link>
          <button
            className={`${btn} bg-slate-500`}
            onClick={() => {
              sessionStorage.removeItem("starjar.parent");
              setUnlocked(false);
            }}
          >
            🔒 Lock
          </button>
        </div>
      </header>

      <nav className="mt-4 flex flex-wrap gap-2 pb-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`btn3d px-3 py-2 text-sm sm:px-4 sm:text-base ${tab === t ? "bg-yellow-300 text-purple-900" : "bg-white/90 text-purple-700"}`}>
            {t}
          </button>
        ))}
      </nav>

      <div className="card mt-4 p-3 sm:p-5">
        {tab === "Kids" && <KidsTab data={data} />}
        {tab === "Activities" && <ActivitiesTab data={data} />}
        {tab === "Milestones" && <MilestonesTab data={data} />}
        {tab === "Log & Gifts" && <LogTab data={data} />}
        {tab === "Settings" && <SettingsTab data={data} />}
      </div>
    </main>
  );
}

/* ---------------- Kids ---------------- */

function KidsTab({ data }: { data: AppData }) {
  const [editing, setEditing] = useState<Kid | null>(null);
  const blank = (): Kid => ({
    id: uid(),
    name: "",
    avatar: AVATARS[data.kids.length % AVATARS.length],
    color: COLORS[data.kids.length % COLORS.length],
    birthdate: "",
    unlocked: {},
    giftsGiven: {},
    createdAt: Date.now(),
  });

  const save = (k: Kid) => {
    setData((d) => ({ ...d, kids: d.kids.some((x) => x.id === k.id) ? d.kids.map((x) => (x.id === k.id ? k : x)) : [...d.kids, k] }));
    setEditing(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Players</h2>
        <button className={`${btn} bg-green-500`} onClick={() => setEditing(blank())}>
          + Add child
        </button>
      </div>
      <ul className="mt-4 space-y-3">
        {data.kids.map((k) => (
          <li key={k.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: `${k.color}22` }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full text-4xl" style={{ background: k.color }}>
              {k.avatar}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-bold">{k.name}</div>
              <div className="text-sm text-purple-700">
                PIN <b>{pinFor(k.birthdate)}</b> · ⭐ {totalStars(data.entries.filter((e) => e.kidId === k.id))}
              </div>
            </div>
            <button className={`${btn} bg-blue-500`} onClick={() => setEditing(k)}>
              Edit
            </button>
            <button
              className={`${btn} bg-red-500`}
              onClick={() => {
                if (confirm(`Delete ${k.name} and all their stars?`))
                  setData((d) => ({ ...d, kids: d.kids.filter((x) => x.id !== k.id), entries: d.entries.filter((e) => e.kidId !== k.id) }));
              }}
            >
              ✕
            </button>
          </li>
        ))}
        {data.kids.length === 0 && <p className="text-purple-500">No players yet. Add your children!</p>}
      </ul>

      {editing && <KidForm kid={editing} onSave={save} onCancel={() => setEditing(null)} />}
    </div>
  );
}

function KidForm({ kid, onSave, onCancel }: { kid: Kid; onSave: (k: Kid) => void; onCancel: () => void }) {
  const [k, setK] = useState(kid);
  const valid = k.name.trim() && /^\d{4}-\d{2}-\d{2}$/.test(k.birthdate);
  return (
    <div className="mt-6 rounded-2xl border-4 border-dashed border-purple-300 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col font-semibold">
          Name
          <input className={input} value={k.name} onChange={(e) => setK({ ...k, name: e.target.value })} />
        </label>
        <label className="flex flex-col font-semibold">
          Birthdate (PIN = DDMM)
          <input type="date" className={input} value={k.birthdate} onChange={(e) => setK({ ...k, birthdate: e.target.value })} />
        </label>
      </div>
      {k.birthdate && <p className="mt-2 text-purple-700">Login PIN: <b className="text-xl">{pinFor(k.birthdate)}</b></p>}
      <div className="mt-3 font-semibold">Avatar</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {AVATARS.map((a) => (
          <button key={a} onClick={() => setK({ ...k, avatar: a })} className={`h-12 w-12 rounded-full text-3xl ${k.avatar === a ? "bg-yellow-300 ring-4 ring-purple-500" : "bg-purple-50"}`}>
            {a}
          </button>
        ))}
      </div>
      <div className="mt-3 font-semibold">Color</div>
      <div className="mt-1 flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setK({ ...k, color: c })} className={`h-10 w-10 rounded-full ${k.color === c ? "ring-4 ring-purple-900" : ""}`} style={{ background: c }} />
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button disabled={!valid} className={`${btn} bg-green-500 disabled:opacity-40`} onClick={() => onSave({ ...k, name: k.name.trim() })}>
          Save
        </button>
        <button className={`${btn} bg-slate-400`} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------------- Activities ---------------- */

function ActivitiesTab({ data }: { data: AppData }) {
  const update = (id: string, patch: Partial<Activity>) =>
    setData((d) => ({ ...d, activities: d.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Activities</h2>
        <div className="flex gap-2">
          <button className={`${btn} bg-green-500`} onClick={() => setData((d) => ({ ...d, activities: [...d.activities, { id: uid(), name: "New activity", emoji: "🌟", points: 5, kind: "good" }] }))}>
            + Good
          </button>
          <button className={`${btn} bg-red-500`} onClick={() => setData((d) => ({ ...d, activities: [...d.activities, { id: uid(), name: "New oops", emoji: "😕", points: -5, kind: "bad" }] }))}>
            + Oops
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-purple-600">Changes save automatically. Past history keeps its old name & points. 🔒 Parents only = hidden from kids (give it from Log & Gifts).</p>
      <ul className="mt-4 space-y-2">
        {data.activities.map((a) => (
          <li key={a.id} className={`flex flex-col gap-2 rounded-2xl p-2 sm:flex-row sm:items-center ${a.kind === "good" ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex min-w-0 flex-1 gap-2">
              <input className={`${input} w-16 shrink-0 text-center text-2xl`} value={a.emoji} onChange={(e) => update(a.id, { emoji: e.target.value })} />
              <input className={`${input} min-w-0 flex-1`} value={a.name} onChange={(e) => update(a.id, { name: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className={`${input} w-20`}
                value={a.points}
                onChange={(e) => {
                  const n = Number(e.target.value) || 0;
                  update(a.id, { points: n, kind: n < 0 ? "bad" : "good" });
                }}
              />
              <span className="whitespace-nowrap text-sm font-bold sm:w-16">{a.kind === "good" ? "😊 good" : "😟 oops"}</span>
              <label className="flex flex-1 items-center gap-1 whitespace-nowrap text-sm font-semibold sm:flex-none" title="Hide from kids; only parents can add it">
                <input type="checkbox" className="h-5 w-5" checked={!!a.parentOnly} onChange={(e) => update(a.id, { parentOnly: e.target.checked || undefined })} />
                🔒 Parents only
              </label>
              <button className={`${btn} bg-red-400 px-3`} onClick={() => setData((d) => ({ ...d, activities: d.activities.filter((x) => x.id !== a.id) }))}>
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Milestones ---------------- */

function MilestonesTab({ data }: { data: AppData }) {
  const update = (id: string, patch: Partial<Milestone>) =>
    setData((d) => ({ ...d, milestones: d.milestones.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
  const sorted = [...data.milestones].sort((a, b) => a.points - b.points);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">Milestones & Gifts</h2>
        <button
          className={`${btn} bg-green-500`}
          onClick={() =>
            setData((d) => ({ ...d, milestones: [...d.milestones, { id: uid(), points: (sorted.at(-1)?.points ?? 0) + 100, title: "New treasure", badge: "💎", gift: "" }] }))
          }
        >
          + Add
        </button>
      </div>
      <p className="mt-1 text-sm text-purple-600">Badge (virtual) · title · stars needed · real gift (optional)</p>
      <ul className="mt-4 space-y-2">
        {sorted.map((m) => (
          <li key={m.id} className="flex flex-col gap-2 rounded-2xl bg-yellow-50 p-2 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 gap-2">
              <input className={`${input} w-16 shrink-0 text-center text-2xl`} value={m.badge} onChange={(e) => update(m.id, { badge: e.target.value })} />
              <input className={`${input} min-w-0 flex-1`} placeholder="Title" value={m.title} onChange={(e) => update(m.id, { title: e.target.value })} />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <label className="flex shrink-0 items-center gap-1 font-bold">
                <input type="number" className={`${input} w-20`} value={m.points} onChange={(e) => update(m.id, { points: Math.max(1, Number(e.target.value) || 1) })} />⭐
              </label>
              <input className={`${input} min-w-0 flex-1`} placeholder="Real gift…" value={m.gift} onChange={(e) => update(m.id, { gift: e.target.value })} />
              <button className={`${btn} shrink-0 bg-red-400 px-3`} onClick={() => setData((d) => ({ ...d, milestones: d.milestones.filter((x) => x.id !== m.id) }))}>
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Log & Gifts ---------------- */

function LogTab({ data }: { data: AppData }) {
  const [kidId, setKidId] = useState(data.kids[0]?.id ?? "");
  const [activityId, setActivityId] = useState(data.activities[0]?.id ?? "");
  const [bonusMsg, setBonusMsg] = useState("");
  const kid = data.kids.find((k) => k.id === kidId);
  if (!kid) return <p>Add a child first.</p>;

  const entries = data.entries.filter((e) => e.kidId === kid.id).sort((a, b) => b.at - a.at);
  const byDay = Object.entries(
    entries.reduce<Record<string, Entry[]>>((acc, e) => {
      const day = isToday(e.at) ? "Today" : new Date(e.at).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      (acc[day] ??= []).push(e);
      return acc;
    }, {}),
  );
  const gifts = data.milestones.filter((m) => kid.unlocked[m.id] && m.gift).sort((a, b) => a.points - b.points);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {data.kids.map((k) => (
          <button key={k.id} onClick={() => {
              setKidId(k.id);
              setBonusMsg("");
            }} className={`btn3d px-4 py-2 text-white ${k.id === kidId ? "ring-4 ring-purple-900" : "opacity-70"}`} style={{ background: k.color }}>
            {k.avatar} {k.name}
          </button>
        ))}
      </div>

      <h3 className="mt-6 text-xl font-bold">🎉 Give a Bonus</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {[5, 10, 20, 50].map((n) => (
          <button
            key={n}
            className={`${btn} bg-gradient-to-br from-yellow-400 to-orange-500 text-lg`}
            onClick={() => {
              giveBonus(kid.id, n);
              setBonusMsg(`✅ +${n} bonus stars for ${kid.name}!`);
            }}
          >
            +{n} ⭐
          </button>
        ))}
      </div>
      {bonusMsg && <p className="mt-2 font-semibold text-green-700">{bonusMsg}</p>}

      <h3 className="mt-6 text-xl font-bold">Add an entry (no time limits)</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <select className={`${input} flex-1`} value={activityId} onChange={(e) => setActivityId(e.target.value)}>
          {(
            [
              ["🔒 Parents only", data.activities.filter((a) => a.parentOnly)],
              ["😊 Good", data.activities.filter((a) => !a.parentOnly && a.kind === "good")],
              ["😟 Oops", data.activities.filter((a) => !a.parentOnly && a.kind === "bad")],
            ] as const
          ).map(([label, list]) =>
            list.length ? (
              <optgroup key={label} label={label}>
                {list.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name} ({a.points > 0 ? "+" : ""}
                    {a.points})
                  </option>
                ))}
              </optgroup>
            ) : null,
          )}
        </select>
        <button className={`${btn} bg-purple-600`} onClick={() => logActivity(kid.id, activityId, true)}>
          Add
        </button>
      </div>

      <h3 className="mt-6 text-xl font-bold">Gifts to hand over 🎁</h3>
      {gifts.length === 0 && <p className="text-purple-500">No real gifts unlocked yet.</p>}
      <ul className="mt-2 space-y-2">
        {gifts.map((m) => {
          const given = kid.giftsGiven[m.id];
          return (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl bg-pink-50 p-2">
              <span className="text-3xl">{m.badge}</span>
              <span className="flex-1">
                <b>{m.gift}</b> <span className="text-sm text-purple-600">({m.points}⭐)</span>
              </span>
              <button
                className={`${btn} ${given ? "bg-green-500" : "bg-pink-500"}`}
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    kids: d.kids.map((k) => {
                      if (k.id !== kid.id) return k;
                      const g = { ...k.giftsGiven };
                      if (given) delete g[m.id];
                      else g[m.id] = Date.now();
                      return { ...k, giftsGiven: g };
                    }),
                  }))
                }
              >
                {given ? "✓ Given" : "Mark given"}
              </button>
            </li>
          );
        })}
      </ul>

      <h3 className="mt-6 text-xl font-bold">History ({entries.length})</h3>
      <p className="text-sm text-purple-600">Tapped something by accident? Remove it here. Stars update instantly.</p>
      <div className="mt-2 max-h-[32rem] space-y-3 overflow-y-auto">
        {byDay.map(([day, list]) => (
          <div key={day}>
            <div className="sticky top-0 z-10 bg-white/95 py-1 text-sm font-bold text-purple-700">
              {day} · {list.reduce((s, e) => s + e.points, 0)} ⭐
            </div>
            <ul className="space-y-1">
              {list.map((e) => (
                <li key={e.id} className="flex items-center gap-2 rounded-xl bg-purple-50 px-3 py-1.5">
                  <span className="text-xl">{e.emoji}</span>
                  <span className="min-w-0 flex-1 font-semibold leading-tight">
                    {e.name} {e.byParent && <span className="text-xs text-purple-500">(parent)</span>}
                    <span className="block text-xs font-normal text-purple-600">{new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                  </span>
                  <span className={`w-9 text-right font-bold ${e.points > 0 ? "text-green-600" : "text-red-600"}`}>{e.points > 0 ? `+${e.points}` : e.points}</span>
                  <button
                    className="btn3d shrink-0 bg-red-500 px-3 py-1 text-sm text-white"
                    onClick={() => confirm(`Remove "${e.name}" (${e.points > 0 ? "+" : ""}${e.points}) from ${kid.name}?`) && removeEntry(e.id)}
                  >
                    🗑 Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */

function SettingsTab({ data }: { data: AppData }) {
  const s = data.settings;
  const set = (patch: Partial<typeof s>) => setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  const download = () => {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `star-jar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold">Sound & Voice</h2>
        <label className="mt-2 flex items-center gap-2 text-lg">
          <input type="checkbox" className="h-6 w-6" checked={s.sound} onChange={(e) => set({ sound: e.target.checked })} /> Sound effects
        </label>
        <label className="mt-1 flex items-center gap-2 text-lg">
          <input type="checkbox" className="h-6 w-6" checked={s.voice} onChange={(e) => set({ voice: e.target.checked })} /> Talking voice (great for kids who can&apos;t read yet)
        </label>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Tap limits (for kids)</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["maxPerDay", "Max per activity / day"],
              ["sameGapMin", "Minutes between same activity"],
              ["anyGapMin", "Minutes between any activity"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex flex-col font-semibold">
              {label}
              <input type="number" min={0} className={input} value={s[key]} onChange={(e) => set({ [key]: Math.max(0, Number(e.target.value) || 0) })} />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Parent PIN</h2>
        <button className={`${btn} mt-2 bg-purple-600`} onClick={() => { set({ parentPin: null }); sessionStorage.removeItem("starjar.parent"); location.reload(); }}>
          Change parent PIN
        </button>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Backup 💾</h2>
        <p className="text-sm text-purple-700">
          Data lives in this browser only. Download a backup regularly; restore it on a new device or if the browser data gets cleared.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={`${btn} bg-blue-500`} onClick={download}>
            ⬇ Download backup
          </button>
          <button className={`${btn} bg-orange-500`} onClick={() => fileRef.current?.click()}>
            ⬆ Restore backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                if (!confirm("Replace ALL current data with this backup?")) return;
                importJson(await f.text());
                setMsg("✅ Backup restored!");
              } catch (err) {
                setMsg(`❌ ${(err as Error).message}`);
              } finally {
                e.target.value = "";
              }
            }}
          />
        </div>
        {msg && <p className="mt-2 font-semibold">{msg}</p>}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-red-600">Danger zone</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button className={`${btn} bg-red-400`} onClick={() => confirm("Clear ALL stars & badges for every child?") && setData((d) => ({ ...d, entries: [], kids: d.kids.map((k) => ({ ...k, unlocked: {}, giftsGiven: {} })) }))}>
            Reset all stars
          </button>
          <button className={`${btn} bg-red-600`} onClick={() => confirm("Erase EVERYTHING (kids, activities, settings)?") && setData(() => defaultData())}>
            Factory reset
          </button>
        </div>
      </section>
    </div>
  );
}

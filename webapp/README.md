# ⭐ Star Jar

A colorful habit-tracking game for kids. Children tap their avatar, enter their birthday PIN (DDMM),
and tap activities to earn (or lose) stars, walk the Treasure Road, and unlock badges + real gifts.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

First visit: tap **Parents** → create a parent PIN → add your children (name, birthdate, avatar, color).

## Deploy to Vercel

Push this folder to GitHub and import it at vercel.com/new (no env vars needed), or run `npx vercel`.

## Where is the data?

All data is stored in the **browser's localStorage** on the device being used.

- ✅ Survives new deployments (as long as the domain stays the same).
- ❌ Not shared between devices, and lost if the browser's site data is cleared.
- 💾 Use **Parents → Settings → Download backup** regularly; **Restore backup** loads it on any device.

## Rules (editable in Parents → Settings)

- Each activity: max **2 times per day**
- Same activity: at least **10 minutes** apart
- Any activity: at least **1 minute** apart
- Parents can add entries from **Log & Gifts** without limits, and undo mistakes.

## Code map

- `src/app/page.tsx`: home (avatar picker + PIN)
- `src/app/kid/[id]/page.tsx`: kid dashboard (jar, activities, treasure road, badges, timeline)
- `src/app/parent/page.tsx`: parent zone (kids, activities, milestones, log, settings, backup)
- `src/lib/defaults.ts`: default activities, milestones, avatars
- `src/lib/messages.ts`: random happy/sad feedback lines
- `src/lib/rules.ts`: star totals and tap limits
- `src/lib/fx.ts`: sounds (Web Audio), voice (speech synthesis), and confetti

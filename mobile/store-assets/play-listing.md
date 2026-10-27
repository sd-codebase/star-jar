# Star Jar: Google Play Console answers

Everything the Play Console asks for, in one place. Keep it in step with the app and with
`webapp/src/app/privacy/page.tsx` when either changes.

## Links

| Field | Value |
|---|---|
| Website | https://star-jar-lovat.vercel.app |
| Privacy policy | https://star-jar-lovat.vercel.app/privacy |
| Account deletion | https://star-jar-lovat.vercel.app/delete-account |
| Terms of use | https://star-jar-lovat.vercel.app/terms |
| Support email | krishna.dhas021815@gmail.com |

## Store listing

- **App name:** Star Jar
- **Category:** Parenting
- **Short description** (80 max):
  A star chart for kids: earn stars for good habits and unlock real rewards.
- **Full description:**

  Star Jar turns good habits into a game your kids will love.

  Every child gets their own jar. Woke up early? Brushed teeth? Finished homework? One tap
  drops a star into the jar, with happy sounds, confetti and a cheering voice. Kids watch the
  jar fill up, walk the treasure road and unlock badges, and you decide which real-world
  rewards they're working towards.

  ⭐ FOR KIDS
  • Big, bright picture buttons made for small fingers
  • A star jar that fills up as they earn
  • A treasure road and badges to collect
  • "Oops moments" that teach honesty without shaming
  • Each child opens their own jar with a 4-digit PIN

  👨‍👩‍👧 FOR PARENTS
  • Choose the activities and how many stars each is worth
  • Set milestones with badges and real gifts, and get reminded when it's time to hand one over
  • Give bonus stars, add missed entries, or undo an accidental tap
  • A Parent Zone protected by your PIN
  • Daily limits and gaps between taps, so stars can't be farmed
  • Share one family with a co-parent: everyone sees the same stars on their own phone
  • Backup and restore your family's chart

  🔒 SAFE BY DESIGN
  • No ads, no in-app purchases, no tracking
  • Children never need an account; parents log in with a WhatsApp code
  • Delete your account and data any time, right in the app

  Star Jar works for Indian (+91) mobile numbers.

- **Graphics:** `play-icon-512.png`, `feature-graphic-1024x500.png`, and phone screenshots
  `screenshots/01-…06-*.png` (upload in that order).
- **AI asset declaration:** Don't label assets. The screenshots are real captures and the
  graphics are drawn by scripts (`scripts/frame-screenshots.mjs`), not a generative model.

## App access (for the review team)

All functionality sits behind a login, so give reviewers the demo account. It logs in
without WhatsApp, and the server refuses to delete it.

- Instructions: "Enter the mobile number, tap Send WhatsApp code, then enter the code. The Parent Zone PIN is 1234."
- The number and code are the server's `DEMO_WHATSAPP_NUMBER` and `DEMO_OTP` (not committed here).

## Ads

No, the app contains no ads.

## Content rating (IARC questionnaire)

Category: All Other App Types. Answer **No** to everything:
violence, fear, sexuality, gambling, drugs, language, crude humour, user-to-user
interaction or communication, sharing location, digital purchases, and unrestricted
internet access. Also No to cash rewards or gift cards (gifts are promised by parents, not
paid out by the app) and to "primarily news or educational". Result: All ages (Brazil: L).

## Target audience and content

- **Target age groups:** **5 and under, 6–8, 9–12**. Play only accepts consecutive age
  groups, so 18 and over is left out; parents still use the app as account holders.
  Including children's ages puts the app under the **Families policy**. Star Jar complies:
  no ads, no third-party SDKs that collect data, no device identifiers, and policies linked
  in the app (Login screen, and Parent Zone → Family).
- The under-13 groups unlock only after the content rating is submitted.
- **App details:** certify compliance with children's privacy laws (COPPA, GDPR).
- **Teacher Approved program:** not joined (can opt in later under Policy and programs).
- Declare that the app does not use the device's advertising ID.

## Data safety

- Does the app collect or share user data? **Collects: Yes.** **Shares: No.** Service
  providers (MongoDB Atlas, Vercel, Meta WhatsApp for login codes) process data on our
  behalf, which Play doesn't count as sharing.
- Data encrypted in transit: **Yes** (HTTPS only).
- Users can request deletion: **Yes** (in app, and at the account deletion URL).
- Show "Committed to follow the Play Families policy" in the Data safety section: **Yes**.

| Data type | Collected | Required | Purpose | What it is |
|---|---|---|---|---|
| Personal info → Name | Yes | Yes | App functionality, Account management | Parent's display name; each child's first name or nickname |
| Personal info → Phone number | Yes | Yes | App functionality, Account management | Parent's login number; numbers invited as co-parents |
| Personal info → Other info | Yes | Yes | App functionality | Child's birth date (makes the child's PIN) |
| App activity → Other user-generated content | Yes | Yes | App functionality | Activities, rewards, star history, badges |

Not collected: location, email, contacts, photos/videos, audio, files, calendar, health,
financial info, messages, web history, device or other IDs, crash logs and diagnostics.
Nothing is processed ephemerally only. None of the data is used for advertising, marketing,
analytics, personalisation or fraud prevention.

## Permissions (release build)

INTERNET, ACCESS_NETWORK_STATE, WAKE_LOCK, VIBRATE (haptics) and MODIFY_AUDIO_SETTINGS
(sound effects). All are normal permissions, so no declarations are needed. Microphone,
foreground service, overlay, storage and biometric permissions pulled in by Expo or library
defaults are blocked in `app.config.ts`.

## Other declarations

- Government app: No. Financial features: None. Health: No. News: No.
- COVID-19 contact tracing: No. Data safety for Families: as above.
- App signing: enable **Play App Signing** and upload `app-release.aab` signed with the local upload key.

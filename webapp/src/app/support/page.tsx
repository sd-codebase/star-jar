import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { APP_NAME, DEVELOPER, Email } from "@/components/LegalPage";

export const metadata: Metadata = { title: `Support · ${APP_NAME}` };

export default function SupportPage() {
  return (
    <LegalPage title="Help & support" emoji="💬">
      <p>
        {APP_NAME} is a family star chart for the web, Android and iPhone, made by {DEVELOPER}. Stuck, found a bug, or have an idea? Email <Email /> and
        we&apos;ll get back to you as soon as we can. Please include your registered mobile number and what you were trying to do.
      </p>

      <h2>Getting started</h2>
      <ol>
        <li>Log in with your Indian (+91) mobile number. We send a one-time code to your WhatsApp.</li>
        <li>
          Tap <b>Parents</b>, create a 4-digit Parent PIN, and add your children, activities and milestones.
        </li>
        <li>Each child opens their own jar with a code made from their birthday: day + month (for example 0507 for 5 July).</li>
      </ol>

      <h2>Common questions</h2>
      <h3>I didn&apos;t get the login code</h3>
      <p>
        The code comes on WhatsApp, not SMS. Check that WhatsApp is set up on that number and connected to the internet, then wait a minute and request a new
        code.
      </p>
      <h3>I forgot the Parent PIN</h3>
      <p>
        Email us from any address with your registered mobile number. We&apos;ll confirm the number is yours and help you reset it.
      </p>
      <h3>How do two parents share one family?</h3>
      <p>
        In <b>Parent Zone → Family</b>, invite the other parent&apos;s mobile number. When they log in they can join, and you both see the same stars on your own
        phones.
      </p>
      <h3>Can I undo a tap?</h3>
      <p>
        Yes. In the child&apos;s history, tap 🔒✕ next to the entry and enter the Parent PIN to remove it. Parents can also add missed entries and bonus stars in the Parent
        Zone.
      </p>
      <h3>How do I turn the sounds off?</h3>
      <p>
        <b>Parent Zone → Settings → Sound effects.</b>
      </p>
      <h3>How do I log out or delete my account?</h3>
      <p>
        Both are in <b>Parent Zone → Family → Account</b>. See <Link href="/delete-account">deleting your account</Link> for what gets removed.
      </p>
    </LegalPage>
  );
}

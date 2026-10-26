import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { APP_NAME, DEVELOPER, Email } from "@/components/LegalPage";

export const metadata: Metadata = { title: `Privacy policy · ${APP_NAME}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" emoji="🔒">
      <p>
        {APP_NAME} is a family reward chart: children collect stars for good habits and unlock badges and treasures that their parents set up. It is made by{" "}
        {DEVELOPER} (&quot;we&quot;) in India. This policy explains what information the {APP_NAME} app (Android and iOS) and website collect, why, and the
        choices you have. Questions: <Email />.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>Only parents have accounts. Children never sign up, never log in and are never asked for contact details.</li>
        <li>We collect only what the app needs to work: a parent&apos;s mobile number to log in, and the family&apos;s chart (children&apos;s names, stars, badges).</li>
        <li>No ads, no analytics or tracking tools, no in-app purchases, and we never sell or rent any data.</li>
        <li>The app does not use location, contacts, the camera, photos or the microphone.</li>
        <li>You can download a copy of your data, and delete your account and your family&apos;s data at any time.</li>
      </ul>

      <h2>Information we collect</h2>
      <h3>About parents</h3>
      <ul>
        <li>
          <b>Mobile number</b> (Indian +91 numbers). It is your login: we send a one-time code to it on WhatsApp. Co-parents see each other&apos;s numbers within
          a family.
        </li>
        <li>
          <b>Name</b> you choose to show (for example &quot;Mom&quot; or &quot;Papa&quot;).
        </li>
        <li>
          <b>Login sessions</b>: when you log in we store a protected (hashed) form of your session key, whether you used the app or website, your device&apos;s
          browser or app identifier string, and when the session was last used. Login codes are stored only in hashed form and deleted within an hour.
        </li>
        <li>
          <b>Co-parent invites</b>: the mobile number you invite, kept until the invite is accepted, cancelled or expires after 7 days.
        </li>
      </ul>
      <h3>About children (entered by a parent)</h3>
      <ul>
        <li>
          <b>First name or nickname</b>, a cartoon emoji avatar and a colour.
        </li>
        <li>
          <b>Birth date</b>: used only to make the child&apos;s 4-digit PIN (day and month) and shown to parents in the Parent Zone. You may enter any date you
          like.
        </li>
        <li>
          <b>Star chart</b>: which activities were tapped and when, stars earned or lost, badges unlocked and gifts handed over.
        </li>
      </ul>
      <h3>Family settings</h3>
      <ul>
        <li>Activities, milestones and rewards you set up, the family name, the Parent Zone PIN, and sound, voice and daily-limit settings.</li>
      </ul>
      <h3>Stored only on your device</h3>
      <ul>
        <li>The app keeps your session key in the device&apos;s secure storage so you stay logged in.</li>
        <li>
          Backup files are created only when you choose <b>Download backup</b>, and go wherever you save or share them. Importing a backup reads only the file you
          pick.
        </li>
      </ul>
      <h3>Technical information</h3>
      <p>
        Like any website, our hosting provider receives your IP address and basic request details (such as time and the page requested) to deliver the service and
        protect it from abuse. We don&apos;t use this to identify or profile you.
      </p>

      <h2>How we use information</h2>
      <ul>
        <li>To log you in and keep you logged in (sessions end after 30 days without use).</li>
        <li>To show and sync your family&apos;s star chart across your devices and with co-parents you invite.</li>
        <li>To keep the service secure, for example limiting how many login codes can be requested.</li>
        <li>To reply when you contact us.</li>
      </ul>
      <p>We do not use any information for advertising, marketing, profiling or selling, and we do not make automated decisions about you or your children.</p>

      <h2>Who we share it with</h2>
      <p>We share information only with these service providers, who process it on our behalf to run {APP_NAME}:</p>
      <ul>
        <li>
          <b>MongoDB Atlas</b>: our database, hosted in Mumbai, India.
        </li>
        <li>
          <b>Vercel</b>: hosts our website and servers (servers run in Mumbai, India).
        </li>
        <li>
          <b>Meta (WhatsApp Business Platform)</b>: receives your mobile number and the login code so it can deliver the code to your WhatsApp.
        </li>
      </ul>
      <p>
        Within your family, everything is visible to the parents in that family. Apart from that, we disclose information only if the law requires it. If{" "}
        {APP_NAME} is ever transferred to someone else, this policy will continue to apply to your information, or we will tell you first.
      </p>

      <h2>Children&apos;s privacy</h2>
      <p>
        {APP_NAME} is made for families with young children, and we take their privacy seriously. A parent creates the account, adds each child and controls
        everything they see. Children use the app on a parent&apos;s device; they can only tap activities and see their own stars, while settings, editing and
        removals sit behind the parent PIN. Children have no accounts, can&apos;t chat with anyone, can&apos;t share anything publicly and can&apos;t open links to
        other sites or make purchases. There are no ads and no third-party analytics or advertising tools in the app.
      </p>
      <p>
        Parents can view, change or delete their children&apos;s information at any time in the Parent Zone, or by contacting us. By adding a child, you confirm
        that you are their parent or legal guardian and consent to us storing the information described above to provide the app.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Your account and family data: while you use {APP_NAME}, until you delete them.</li>
        <li>Login codes: deleted within 1 hour. Invites: up to 7 days. Sessions: deleted after 30 days without use, or when you log out.</li>
        <li>
          When you delete your account, your data is removed from our live database straight away. Copies in our providers&apos; encrypted backups, if any, are
          overwritten as those backups expire.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        All traffic is encrypted with HTTPS. Session keys and login codes are stored only in hashed form, and access to the database is restricted. No system is
        perfectly secure, but we work to protect your information and will tell you if a breach affects you.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>
          <b>See and download</b> your family&apos;s data: Parent Zone → Settings → Download backup.
        </li>
        <li>
          <b>Correct</b> it: edit names, birth dates and activities in the Parent Zone, or remove individual history entries.
        </li>
        <li>
          <b>Delete</b> a child, reset stars, or <Link href="/delete-account">delete your whole account</Link>.
        </li>
        <li>
          <b>Withdraw consent</b> at any time by deleting your account.
        </li>
      </ul>
      <p>
        These rights apply under India&apos;s Digital Personal Data Protection Act, 2023 and similar laws. For any request or complaint, write to our grievance
        contact, {DEVELOPER}, at <Email />. We will reply within 30 days.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy we will update the date at the top of this page, and tell you in the app if the change is significant. We will ask for your consent
        again before using information in a new way.
      </p>
    </LegalPage>
  );
}

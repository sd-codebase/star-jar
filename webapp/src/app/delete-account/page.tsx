import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { APP_NAME, DEVELOPER, Email } from "@/components/LegalPage";

export const metadata: Metadata = { title: `Delete your account · ${APP_NAME}` };

export default function DeleteAccountPage() {
  return (
    <LegalPage title="Delete your account" emoji="🗑️">
      <p>
        You can delete your {APP_NAME} account (by {DEVELOPER}) and your family&apos;s data yourself, at any time, in the app or on this website.
      </p>

      <h2>In the app or on the website</h2>
      <ol>
        <li>
          Open the {APP_NAME} app, or <Link href="/login">log in on the website</Link> with your mobile number.
        </li>
        <li>
          Tap <b>Parents</b> and enter your Parent Zone PIN.
        </li>
        <li>
          Open the <b>Family</b> tab and, under <b>Account</b>, tap <b>Delete my account</b>.
        </li>
        <li>Confirm. You&apos;re logged out on every device straight away.</li>
      </ol>
      <p>
        Want to keep your chart? Download a backup first from <b>Settings → Download backup</b>.
      </p>

      <h2>By email</h2>
      <p>
        If you can&apos;t log in, email <Email /> from any address with the subject &quot;Delete my {APP_NAME} account&quot; and your registered mobile number. We
        will confirm the number belongs to you (for example with a code on WhatsApp) and delete the account within 7 days.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your account: mobile number, name, login sessions and any pending login codes or invites to your number.</li>
        <li>
          If you are the only parent in your family: the whole family too, meaning every child&apos;s name, avatar, birth date, stars, badges, gifts and history,
          plus your activities, milestones, settings and the invites you sent.
        </li>
        <li>
          If your family has other parents: the family and children stay with them. Your account is removed and history entries you added are no longer linked to
          you.
        </li>
      </ul>

      <h2>What we keep, and for how long</h2>
      <p>
        Nothing is kept in our live database after deletion. Copies in our providers&apos; encrypted backups, if any, are overwritten as those backups expire.
        Backup files you downloaded yourself stay wherever you saved them. To reset stars or remove a single child without deleting your account, use the Parent
        Zone instead. See the <Link href="/privacy">privacy policy</Link> for details.
      </p>
    </LegalPage>
  );
}

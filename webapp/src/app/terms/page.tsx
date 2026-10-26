import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { APP_NAME, DEVELOPER, Email } from "@/components/LegalPage";

export const metadata: Metadata = { title: `Terms of use · ${APP_NAME}` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use" emoji="📜">
      <p>
        These terms apply to the {APP_NAME} app and website, provided by {DEVELOPER} in India. By using {APP_NAME} you agree to them. If you don&apos;t agree,
        please don&apos;t use the app.
      </p>

      <h2>Who can use {APP_NAME}</h2>
      <ul>
        <li>Accounts are for parents and guardians aged 18 or over, with an Indian (+91) mobile number that can receive WhatsApp messages.</li>
        <li>Children use {APP_NAME} only on a parent&apos;s device, under that parent&apos;s supervision. Only add children you are the parent or guardian of.</li>
        <li>Keep your phone, WhatsApp and Parent Zone PIN to yourself: anyone with them can manage your family.</li>
      </ul>

      <h2>Your family&apos;s content</h2>
      <p>
        The names, activities, rewards and history you add belong to you. You give us permission to store and show them to you and your co-parents, only to run
        the service. See the <Link href="/privacy">privacy policy</Link> for how we handle them.
      </p>
      <p>Don&apos;t use {APP_NAME} for anything unlawful, to harm others, or to interfere with the service (for example by abusing the login code system).</p>

      <h2>Rewards are between you and your family</h2>
      <p>
        Stars and badges are virtual and have no money value. Real-world gifts are promises a parent makes to their own child; {APP_NAME} only reminds you about
        them.
      </p>

      <h2>The service</h2>
      <p>
        {APP_NAME} is free. We work to keep it running and your data safe, but it is provided &quot;as is&quot;, and we can&apos;t promise it will always be
        available or error-free. Download a backup from Settings from time to time. We may change or stop features, and will give reasonable notice before
        shutting the service down so you can download your data.
      </p>
      <p>
        To the extent the law allows, we are not liable for indirect losses, or for losses caused by events outside our control. Nothing in these terms limits
        rights you have under Indian consumer law.
      </p>

      <h2>Ending your use</h2>
      <p>
        You can stop at any time and <Link href="/delete-account">delete your account</Link>. We may suspend accounts that break these terms.
      </p>

      <h2>Changes and contact</h2>
      <p>
        If we change these terms we will update the date above; continuing to use {APP_NAME} means you accept the new terms. These terms are governed by the laws
        of India. Questions: <Email />.
      </p>
    </LegalPage>
  );
}

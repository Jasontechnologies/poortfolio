import type { Metadata } from 'next';
import Link from 'next/link';
import { CookieSettingsButton } from '@/components/consent/cookie-settings-button';

export const metadata: Metadata = {
  title: 'Cookie Policy | JasonWorldOfTech',
  description: 'Cookie usage and consent controls for JasonWorldOfTech and Koola AI.'
};

export default function CookiePolicyPage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Cookie Policy</h1>
        <p className="mt-3 text-black/75">
          Necessary cookies support authentication, security, and essential site behavior.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CookieSettingsButton className="btn-primary !px-4 !py-2" />
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Optional analytics and marketing cookies</h2>
        <p className="mt-3 text-black/75">
          Optional cookies are disabled by default and activated only after explicit consent.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CookieSettingsButton className="btn-subtle !px-4 !py-2" />
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Manage your preferences</h2>
        <p className="mt-3 text-black/75">
          You can change cookie preferences at any time from the footer.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <CookieSettingsButton className="btn-subtle !px-4 !py-2" />
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>
    </section>
  );
}

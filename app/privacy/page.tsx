import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | JasonWorldOfTech',
  description: 'Privacy policy for JasonWorldOfTech and Koola AI, including data rights, retention, and private-by-default controls.'
};

export default function PrivacyPage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-3 text-black/75">
          JasonWorldOfTech collects the minimum data needed to operate Koola AI, account access, and support workflows.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/account/privacy" className="btn-primary">Open Privacy Controls</Link>
          <Link href="/cookies" className="btn-subtle">Read Cookies Policy</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Your rights and controls</h2>
        <p className="mt-3 text-black/75">
          You can request data export or account deletion through your privacy controls page after signing in.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/sign-in" className="btn-subtle">Create Account</Link>
          <Link href="/account/privacy" className="btn-subtle">Open Privacy Controls</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Private by default</h2>
        <p className="mt-3 text-black/75">
          User-created support content is private by default and access is restricted to authorized roles.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/security" className="btn-subtle">Read Security</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>
    </section>
  );
}

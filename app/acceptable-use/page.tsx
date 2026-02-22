import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy | JasonWorldOfTech',
  description: 'Acceptable use policy for JasonWorldOfTech and Koola AI, including abuse controls and 18+ use requirement.'
};

export default function AcceptableUsePage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Acceptable Use Policy</h1>
        <p className="mt-3 text-black/75">
          The platform may not be used for abuse, fraud, spam, harassment, illegal activity, or attempts to bypass security controls.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/terms" className="btn-primary">Read Terms</Link>
          <Link href="/security" className="btn-subtle">Read Security</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Adult users only</h2>
        <p className="mt-3 text-black/75">
          Support and account services are for users 18+ and must be used lawfully and professionally.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/sign-in" className="btn-subtle">Create Account</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Abuse response</h2>
        <p className="mt-3 text-black/75">
          Confirmed abuse may trigger moderation review, temporary restrictions, or permanent account suspension.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/complaints" className="btn-subtle">Submit Complaint</Link>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>
    </section>
  );
}

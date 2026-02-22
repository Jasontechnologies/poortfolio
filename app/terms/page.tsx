import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | JasonWorldOfTech',
  description: 'Terms of use for JasonWorldOfTech and Koola AI, including 18+ requirement, acceptable use, and enforcement.'
};

export default function TermsPage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Terms of Use</h1>
        <p className="mt-3 text-black/75">
          By using JasonWorldOfTech and Koola AI, you agree to account security, acceptable use, and communication policies.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/acceptable-use" className="btn-primary">Read Acceptable Use</Link>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">18+ requirement</h2>
        <p className="mt-3 text-black/75">
          Account creation and support chat are for adults aged 18 years or older.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/sign-in" className="btn-subtle">Create Account</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Policy enforcement</h2>
        <p className="mt-3 text-black/75">
          Violations may result in moderation actions, account restrictions, or service removal.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/complaints" className="btn-subtle">Submit Complaint</Link>
          <Link href="/security" className="btn-subtle">Read Security</Link>
        </div>
      </article>
    </section>
  );
}

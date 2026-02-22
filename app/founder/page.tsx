import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Founder | JasonWorldOfTech',
  description:
    'Meet the founder of JasonWorldOfTech and learn how Koola AI is built with a practical, security-first operating style.'
};

export default function FounderPage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Founder</h1>
        <p className="mt-3 text-black/75">
          JasonWorldOfTech is led by Jason Ade, focused on product execution, secure architecture, and long-term customer trust.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/support/chat" className="btn-primary">Start Support Chat</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">What I optimize for</h2>
        <p className="mt-3 text-black/75">
          Clarity, reliability, and practical outcomes for teams using Koola AI in production environments.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/blog" className="btn-subtle">Read Blog</Link>
          <Link href="/updates" className="btn-subtle">View Updates</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Direct communication, not noise</h2>
        <p className="mt-3 text-black/75">
          If you need help, use support chat for private discussions and clear follow-up.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/sign-in" className="btn-subtle">Create Account</Link>
          <Link href="/support/chat" className="btn-subtle">Start Support Chat</Link>
        </div>
      </article>
    </section>
  );
}

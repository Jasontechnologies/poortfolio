import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | JasonWorldOfTech',
  description:
    'Learn how JasonWorldOfTech builds practical AI products with founder-led execution, privacy controls, and clear operating standards.'
};

export default function AboutPage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Practical AI software, built with accountability.</h1>
        <p className="mt-3 text-black/75">
          JasonWorldOfTech is a founder-led company focused on useful AI products, strong infrastructure, and clear communication with users.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/products" className="btn-primary">Explore Products</Link>
          <Link href="/security" className="btn-subtle">Read Security</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">How we build</h2>
        <p className="mt-3 text-black/75">
          We prioritize reliable execution, privacy controls, and straightforward product decisions over hype.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/updates" className="btn-subtle">View Updates</Link>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Current product: Koola AI</h2>
        <p className="mt-3 text-black/75">
          Koola AI is the first flagship product in the JasonWorldOfTech portfolio.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/products" className="btn-subtle">Open Koola AI</Link>
          <Link href="/sign-in" className="btn-subtle">Create Account</Link>
        </div>
      </article>
    </section>
  );
}

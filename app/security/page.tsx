import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Security | JasonWorldOfTech',
  description: 'Security practices and responsible disclosure process for JasonWorldOfTech and Koola AI.'
};

export default function SecurityPage() {
  return (
    <section className="space-y-6 py-4">
      <article className="card">
        <h1 className="text-3xl font-bold">Security and responsible AI operations</h1>
        <p className="mt-3 text-black/75">
          JasonWorldOfTech applies role-based access, abuse prevention, and private-by-default data handling across Koola AI and support systems.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn-primary" href="mailto:security@jasonworldoftech.com">Report Security Issue</a>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Data handling commitments</h2>
        <p className="mt-3 text-black/75">
          We collect operationally necessary data only, encrypt data in transit, and restrict access by role.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
          <Link href="/acceptable-use" className="btn-subtle">Read Acceptable Use</Link>
        </div>
      </article>

      <article className="card">
        <h2 className="text-2xl font-semibold">Responsible disclosure</h2>
        <p className="mt-3 text-black/75">
          Report vulnerabilities to security@jasonworldoftech.com with clear reproduction details. Please do not test on customer data.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn-subtle" href="mailto:security@jasonworldoftech.com">Email Security</a>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>
    </section>
  );
}

'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ComplaintsPage() {
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      complaint_type: String(form.get('complaint_type') ?? ''),
      description: String(form.get('description') ?? ''),
      urls: String(form.get('urls') ?? '')
    };

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(data.error ?? 'Unable to submit complaint.');
        return;
      }

      event.currentTarget.reset();
      setStatus('Complaint submitted. Our team will review it.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 py-4">
      <article className="card max-w-3xl">
        <h1 className="text-3xl font-bold">DMCA and Complaints</h1>
        <p className="mt-3 text-black/70">
          Submit legal and policy complaints for review by the JasonWorldOfTech compliance team.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" form="complaints-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <a href="mailto:legal@jasonworldoftech.com" className="btn-subtle">Email Legal</a>
        </div>

        <form id="complaints-form" onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="name"
            className="w-full rounded-lg border border-black/20 p-3"
            placeholder="Your name"
            maxLength={120}
            required
          />
          <input
            type="email"
            name="email"
            className="w-full rounded-lg border border-black/20 p-3"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <select name="complaint_type" className="w-full rounded-lg border border-black/20 p-3" required>
            <option value="">Select complaint type</option>
            <option value="dmca">DMCA</option>
            <option value="copyright">Copyright</option>
            <option value="trademark">Trademark</option>
            <option value="privacy">Privacy</option>
            <option value="other">Other</option>
          </select>
          <textarea
            name="description"
            className="min-h-36 w-full rounded-lg border border-black/20 p-3"
            placeholder="Describe the complaint in detail"
            maxLength={3000}
            required
          />
          <textarea
            name="urls"
            className="min-h-24 w-full rounded-lg border border-black/20 p-3"
            placeholder="Affected URLs (one per line)"
          />
          {status ? <p className="text-sm text-black/70">{status}</p> : null}
        </form>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">Include complete details</h2>
        <p className="mt-3 text-black/70">
          Provide your identity, complaint type, affected URLs, and a clear factual description to avoid review delays.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/terms" className="btn-subtle">View Terms</Link>
          <Link href="/acceptable-use" className="btn-subtle">View Acceptable Use</Link>
        </div>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">What happens next</h2>
        <p className="mt-3 text-black/70">
          Valid submissions are acknowledged, reviewed, and tracked internally. Fraudulent claims may be rejected.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/contact" className="btn-subtle">Contact</Link>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>
    </section>
  );
}

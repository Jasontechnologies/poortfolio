'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function NewComplaintPage() {
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '');
    const details = String(form.get('details') ?? '');

    try {
      const response = await fetch('/support/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, details })
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to submit complaint.');
        return;
      }

      setStatus('Complaint submitted successfully.');
      event.currentTarget.reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 py-4">
      <article className="card max-w-3xl">
        <h1 className="text-3xl font-bold">Submit a product complaint</h1>
        <p className="mt-3 text-black/70">
          Tell us what happened and include enough detail for support review and follow-up.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" type="submit" form="support-complaint-form" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <Link href="/support/chat" className="btn-subtle">Back to Support Chat</Link>
        </div>

        <form id="support-complaint-form" onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="title"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-black/20 p-3"
            placeholder="Complaint title"
            required
          />
          <textarea
            name="details"
            disabled={isSubmitting}
            className="min-h-32 w-full rounded-lg border border-black/20 p-3"
            placeholder="Describe the issue"
            required
          />
          {status ? <p className="text-sm text-black/70">{status}</p> : null}
        </form>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">Include clear facts</h2>
        <p className="mt-3 text-black/70">
          Provide timeline, expected behavior, actual behavior, and impact on your workflow.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
          <Link href="/acceptable-use" className="btn-subtle">Read Acceptable Use</Link>
        </div>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">18+ attestation</h2>
        <p className="mt-3 text-black/70">
          By submitting this complaint, you confirm you are 18+ and the report is accurate to the best of your knowledge.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-subtle" type="submit" form="support-complaint-form" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>
    </section>
  );
}

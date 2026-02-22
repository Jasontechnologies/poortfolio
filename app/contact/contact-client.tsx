'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { getClientFingerprint } from '@/lib/client/fingerprint';

export default function ContactPage() {
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '');
    const email = String(formData.get('email') ?? '');
    const message = String(formData.get('message') ?? '');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          message,
          honeypot,
          fingerprint: getClientFingerprint()
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus(payload.error ?? 'Unable to send contact message.');
        return;
      }

      event.currentTarget.reset();
      setStatus('Message sent. We will reply as soon as possible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6 py-4">
      <article className="card max-w-3xl">
        <h1 className="text-3xl font-bold">Contact</h1>
        <p className="mt-2 text-black/70">Use this form for product inquiries, partnerships, and general support requests.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" form="contact-form" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
          <Link href="/support/chat" className="btn-subtle">Start Support Chat</Link>
        </div>

        <form id="contact-form" onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            name="name"
            placeholder="Your name"
            className="w-full rounded-lg border border-black/20 p-3"
            required
            maxLength={120}
          />
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-black/20 p-3"
            required
            autoComplete="email"
          />
          <textarea
            name="message"
            placeholder="Your message"
            className="min-h-36 w-full rounded-lg border border-black/20 p-3"
            required
            maxLength={2000}
          />
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            name="company_website"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
          {status ? <p className="text-sm text-black/70">{status}</p> : null}
        </form>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">Official contact channels</h2>
        <p className="mt-3 text-black/70">
          Support: support@koolaai.com. Legal: legal@jasonworldoftech.com. Security: security@jasonworldoftech.com.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="btn-subtle" href="mailto:support@koolaai.com">Email Support</a>
          <a className="btn-subtle" href="mailto:legal@jasonworldoftech.com">Email Legal</a>
        </div>
      </article>

      <article className="card max-w-3xl">
        <h2 className="text-2xl font-semibold">Response window</h2>
        <p className="mt-3 text-black/70">
          Business inquiries are reviewed in queue order. Security and legal notices are prioritized.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/security" className="btn-subtle">Read Security</Link>
          <Link href="/complaints" className="btn-subtle">Submit Complaint</Link>
        </div>
      </article>
    </section>
  );
}

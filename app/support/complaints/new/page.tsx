'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function NewComplaintPage() {
  const [status, setStatus] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const title = String(form.get('title') ?? '');
    const details = String(form.get('details') ?? '');

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setStatus('Please sign in to submit a complaint.');
      return;
    }

    const { error } = await supabase.from('complaints').insert({
      user_id: authData.user.id,
      title,
      details,
      status: 'new',
      priority: 'medium'
    });

    setStatus(error ? error.message : 'Complaint submitted successfully.');
    if (!error) event.currentTarget.reset();
  };

  return (
    <section className="card max-w-2xl">
      <h1 className="text-3xl font-bold">Submit a Product Complaint</h1>
      <p className="mt-2 text-black/70">Tell us what happened and we will follow up in your support chat.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input name="title" className="w-full rounded-lg border border-black/20 p-3" placeholder="Complaint title" required />
        <textarea
          name="details"
          className="min-h-32 w-full rounded-lg border border-black/20 p-3"
          placeholder="Describe the issue"
          required
        />
        <button className="btn-accent" type="submit">Submit Complaint</button>
        {status ? <p className="text-sm text-black/70">{status}</p> : null}
      </form>
    </section>
  );
}

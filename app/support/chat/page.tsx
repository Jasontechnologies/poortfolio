'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function ChatPage() {
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = createClient();

    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) {
      setStatus('Please sign in first.');
      return;
    }

    const { error } = await supabase.from('chat_messages').insert({
      sender_id: authData.user.id,
      message
    });

    setStatus(error ? error.message : 'Message sent.');
    if (!error) setMessage('');
  };

  return (
    <section className="max-w-2xl card">
      <h1 className="text-3xl font-bold">Chat with Jason</h1>
      <p className="mt-2 text-black/70">Signed-in users can start direct product support conversations.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          className="min-h-32 w-full rounded-lg border border-black/20 p-3"
          placeholder="Type your message..."
        />
        <button className="btn-primary" type="submit">Send message</button>
        {status ? <p className="text-sm text-black/70">{status}</p> : null}
      </form>
    </section>
  );
}

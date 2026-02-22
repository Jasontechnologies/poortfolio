'use client';

import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  const signInWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
  };

  return (
    <section className="card max-w-xl">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-black/70">Use your Google account to chat and submit complaints.</p>
      <button onClick={signInWithGoogle} className="btn-accent mt-6">
        Continue with Google
      </button>
    </section>
  );
}

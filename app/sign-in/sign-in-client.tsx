'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getClientFingerprint } from '@/lib/client/fingerprint';
import { TurnstileChallenge } from '@/components/security/turnstile-challenge';

function getFriendlyAuthError(message: string) {
  const lower = message.toLowerCase();

  if (lower.includes('user already registered')) {
    return 'This email already has an account. Use Sign in instead.';
  }

  if (lower.includes('password')) {
    return 'Use at least 6 characters for your password.';
  }

  if (lower.includes('invalid email')) {
    return 'Enter a valid email address.';
  }

  if (lower.includes('signup') && lower.includes('disabled')) {
    return 'Email signups are disabled in Supabase. Enable Email provider signups in Auth settings.';
  }

  return message;
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState('');
  const [action, setAction] = useState<'sign-in' | 'sign-up' | null>(null);
  const [captchaMode, setCaptchaMode] = useState<'sign-in' | 'sign-up' | null>(null);
  const [signupEnabled, setSignupEnabled] = useState(true);
  const [flagsReady, setFlagsReady] = useState(false);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const response = await fetch('/api/feature-flags', { cache: 'no-store' });
        const payload = (await response.json()) as {
          flags?: { signup_enabled?: boolean };
        };
        setSignupEnabled(payload.flags?.signup_enabled !== false);
      } finally {
        setFlagsReady(true);
      }
    };
    void loadFlags();
  }, []);

  const submitAuth = async (mode: 'sign-in' | 'sign-up', captchaToken?: string) => {
    setAction(mode);
    setStatus('');

    const response = await fetch(mode === 'sign-in' ? '/auth/login' : '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        honeypot,
        fingerprint: getClientFingerprint(),
        captchaToken
      })
    });
    const payload = (await response.json()) as {
      error?: string;
      captchaRequired?: boolean;
      message?: string;
      role?: 'user' | 'support_agent' | 'admin' | 'super_admin';
    };

    if (!response.ok) {
      if (payload.captchaRequired) {
        setCaptchaMode(mode);
        setStatus('Suspicious activity detected. CAPTCHA challenge is required before signup/login.');
      } else {
        setStatus(
          getFriendlyAuthError(
            payload.error ?? (mode === 'sign-in' ? 'Unable to sign in.' : 'Unable to create account.')
          )
        );
      }
      setAction(null);
      return;
    }

    setCaptchaMode(null);
    setStatus(mode === 'sign-in' ? 'Signed in. Redirecting...' : 'Account created. Redirecting...');
    setAction(null);
    const adminRoles = new Set(['support_agent', 'admin', 'super_admin']);
    const nextPath =
      mode === 'sign-in' && payload.role && adminRoles.has(payload.role) ? '/admin' : '/support/chat';
    router.push(nextPath);
    router.refresh();
  };

  const signInWithEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitAuth('sign-in');
  };

  const signUpWithEmail = async () => {
    if (!signupEnabled) {
      setStatus('Sign up is temporarily disabled.');
      return;
    }

    if (!email || !password) {
      setStatus('Enter an email and password first.');
      return;
    }

    await submitAuth('sign-up');
  };

  const onCaptchaToken = async (token: string) => {
    if (!captchaMode) return;
    await submitAuth(captchaMode, token);
  };

  return (
    <section className="space-y-6 py-4">
      <article className="card max-w-2xl">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-black/70">
          Use your email and password to access private support chat, complaints follow-up, and privacy controls.
        </p>

        {!signupEnabled && flagsReady ? (
          <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sign up is temporarily disabled for maintenance.
          </p>
        ) : null}

        <form onSubmit={signInWithEmail} className="mt-6 space-y-3">
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-lg border border-black/20 p-3"
            placeholder="you@example.com"
            required
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-black/20 p-3 pr-24"
              placeholder="Password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-sm font-semibold text-black/70 hover:bg-black/5 hover:text-black"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <input
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            name="company_website"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={action !== null}>
              {action === 'sign-in' ? 'Signing in...' : 'Sign In'}
            </button>
            <button
              type="button"
              className="btn-accent"
              onClick={signUpWithEmail}
              disabled={action !== null || !flagsReady || !signupEnabled}
            >
              {!flagsReady
                ? 'Loading...'
                : action === 'sign-up'
                  ? 'Creating...'
                  : signupEnabled
                    ? 'Create Account'
                    : 'Create Account'}
            </button>
          </div>

          {captchaMode ? (
            <TurnstileChallenge
              onToken={onCaptchaToken}
              onError={() => setStatus('Unable to initialize CAPTCHA. Refresh and try again.')}
            />
          ) : null}
        </form>

        {status ? <p className="mt-4 text-sm text-black/70">{status}</p> : null}
      </article>

      <article className="card max-w-2xl">
        <h2 className="text-2xl font-semibold">Account requirement</h2>
        <p className="mt-3 text-black/70">
          By continuing, you confirm you are 18 or older and agree to our Terms, Privacy Policy, and Acceptable Use Policy.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/terms" className="btn-subtle">Read Terms</Link>
          <Link href="/privacy" className="btn-subtle">Read Privacy Policy</Link>
        </div>
      </article>

      <article className="card max-w-2xl">
        <h2 className="text-2xl font-semibold">Security verification</h2>
        <p className="mt-3 text-black/70">
          We apply anti-abuse checks, including CAPTCHA when required, to protect account access.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-subtle" onClick={() => setStatus('Continue with Sign In or Create Account above.')}>
            Continue
          </button>
          <Link href="/contact" className="btn-subtle">Contact</Link>
        </div>
      </article>
    </section>
  );
}

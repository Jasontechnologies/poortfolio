'use client';

import { useEffect, useRef } from 'react';

type TurnstileInstance = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      ['expired-callback']?: () => void;
      ['error-callback']?: () => void;
      theme?: 'auto' | 'light' | 'dark';
      size?: 'normal' | 'compact';
    }
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

const SCRIPT_ID = 'jwot-turnstile-script';

export function TurnstileChallenge({
  onToken,
  onError
}: {
  onToken: (token: string) => void;
  onError: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey || !containerRef.current) {
      onError();
      return;
    }

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        size: 'normal',
        callback: (token) => onToken(token),
        'expired-callback': () => onError(),
        'error-callback': () => onError()
      });
    };

    if (window.turnstile) {
      renderWidget();
      return () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
      };
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', renderWidget);
      return () => existingScript.removeEventListener('load', renderWidget);
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderWidget);
    document.head.appendChild(script);

    return () => script.removeEventListener('load', renderWidget);
  }, [onError, onToken]);

  return (
    <div className="rounded-xl border border-[#d0dbef] bg-white/80 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#4f5a77]">
        Verification required
      </p>
      <div ref={containerRef} />
    </div>
  );
}

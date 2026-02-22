'use client';

import { useConsent } from '@/components/consent/consent-provider';

export function CookieSettingsButton({ className }: { className?: string }) {
  const { openSettings } = useConsent();

  return (
    <button
      type="button"
      onClick={openSettings}
      className={
        className ??
        'border-0 bg-transparent p-0 text-left text-sm text-[#4f5a77] underline decoration-[#9fb0d6] underline-offset-4 transition-colors hover:text-[#101a33]'
      }
    >
      Cookie settings
    </button>
  );
}

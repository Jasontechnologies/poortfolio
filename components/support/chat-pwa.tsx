'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function ChatPwa() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installStatus, setInstallStatus] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore registration errors in environments that do not allow service workers.
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    };
  }, []);

  if (!installEvent) return null;

  return (
    <div className="mb-4 rounded-xl border border-[#d4def1] bg-white/70 p-3 text-sm text-[#273257]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p>Install support chat for quick access and offline shell.</p>
        <button
          type="button"
          className="btn-subtle !px-3 !py-1"
          onClick={async () => {
            await installEvent.prompt();
            const choice = await installEvent.userChoice;
            setInstallStatus(choice.outcome === 'accepted' ? 'Installed.' : 'Install dismissed.');
            setInstallEvent(null);
          }}
        >
          Install app
        </button>
      </div>
      {installStatus ? <p className="mt-2 text-xs text-[#4f5a77]">{installStatus}</p> : null}
    </div>
  );
}

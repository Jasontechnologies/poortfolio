'use client';

import Script from 'next/script';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

const CONSENT_COOKIE_NAME = 'jwot_consent';
const CONSENT_VERSION = 'v1';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type ConsentRecord = {
  version: string;
  updatedAt: string;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

type ConsentDraft = {
  analytics: boolean;
  marketing: boolean;
};

type ConsentContextValue = {
  consent: ConsentRecord;
  hasChoice: boolean;
  openSettings: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (draft: ConsentDraft) => void;
};

const defaultConsent: ConsentRecord = {
  version: CONSENT_VERSION,
  updatedAt: '',
  necessary: true,
  analytics: false,
  marketing: false
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

function readCookieValue(name: string) {
  if (typeof document === 'undefined') return null;
  const cookieEntry = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`));

  return cookieEntry ? decodeURIComponent(cookieEntry.split('=')[1] ?? '') : null;
}

function readConsentCookie(): ConsentRecord | null {
  const raw = readCookieValue(CONSENT_COOKIE_NAME);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null;
    if (typeof parsed.analytics !== 'boolean' || typeof parsed.marketing !== 'boolean') return null;
    return {
      version: CONSENT_VERSION,
      updatedAt: parsed.updatedAt || '',
      necessary: true,
      analytics: parsed.analytics,
      marketing: parsed.marketing
    };
  } catch {
    return null;
  }
}

function writeConsentCookie(consent: ConsentRecord) {
  if (typeof document === 'undefined') return;
  const secureFlag = window.location.protocol === 'https:' ? '; Secure' : '';
  const value = encodeURIComponent(JSON.stringify(consent));
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secureFlag}`;
}

function AnalyticsScriptGate({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;

  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

  return (
    <>
      {gaMeasurementId ? (
        <>
          <Script
            id="ga-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {plausibleDomain ? (
        <Script
          id="plausible-loader"
          defer
          data-domain={plausibleDomain}
          strategy="afterInteractive"
          src="https://plausible.io/js/script.js"
        />
      ) : null}
    </>
  );
}

function CookieBanner({
  onAcceptAll,
  onRejectAll,
  onManage
}: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManage: () => void;
}) {
  return (
    <aside className="fixed inset-x-4 bottom-4 z-[95] mx-auto max-w-3xl rounded-2xl border border-[#cfdaf0] bg-white/95 p-4 shadow-[0_16px_40px_rgba(20,32,63,0.22)] backdrop-blur-xl">
      <p className="text-sm font-semibold text-[#1a2545]">Cookie preferences</p>
      <p className="mt-2 text-sm text-[#4f5a77]">
        We use necessary cookies for sign-in and security. Analytics and marketing cookies are off by default.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-primary !px-4 !py-2" onClick={onAcceptAll}>
          Accept all
        </button>
        <button type="button" className="btn-subtle !px-4 !py-2" onClick={onRejectAll}>
          Reject all
        </button>
        <button type="button" className="btn-subtle !px-4 !py-2" onClick={onManage}>
          Manage preferences
        </button>
      </div>
    </aside>
  );
}

function CookieModal({
  open,
  initialConsent,
  optionalCookiesEnabled,
  onClose,
  onAcceptAll,
  onRejectAll,
  onSave
}: {
  open: boolean;
  initialConsent: ConsentRecord;
  optionalCookiesEnabled: boolean;
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (draft: ConsentDraft) => void;
}) {
  const [analytics, setAnalytics] = useState(initialConsent.analytics);
  const [marketing, setMarketing] = useState(initialConsent.marketing);

  useEffect(() => {
    if (!open) return;
    setAnalytics(initialConsent.analytics);
    setMarketing(initialConsent.marketing);
  }, [open, initialConsent.analytics, initialConsent.marketing]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#0f1527]/45 p-4 md:items-center">
      <div className="w-full max-w-xl rounded-2xl border border-[#ced8ee] bg-white p-5 shadow-[0_20px_50px_rgba(12,22,45,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#131c36]">Cookie settings</h2>
            <p className="mt-1 text-sm text-[#4f5a77]">
              Choose which optional cookies are allowed. Necessary cookies stay enabled.
            </p>
          </div>
          <button type="button" className="rounded-full border border-[#d5deee] px-3 py-1 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {!optionalCookiesEnabled ? (
            <p className="rounded-xl border border-[#d6e0f2] bg-[#f8fbff] px-3 py-2 text-sm text-[#243054]">
              Optional analytics and marketing scripts are currently not active.
            </p>
          ) : null}
          <label className="flex items-center justify-between rounded-xl border border-[#d6e0f2] bg-[#f8fbff] px-3 py-2">
            <span className="text-sm text-[#243054]">Necessary</span>
            <input type="checkbox" checked disabled />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-[#d6e0f2] bg-[#f8fbff] px-3 py-2">
            <span className="text-sm text-[#243054]">Analytics</span>
            <input
              type="checkbox"
              checked={analytics}
              disabled={!optionalCookiesEnabled}
              onChange={(event) => setAnalytics(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-[#d6e0f2] bg-[#f8fbff] px-3 py-2">
            <span className="text-sm text-[#243054]">Marketing</span>
            <input
              type="checkbox"
              checked={marketing}
              disabled={!optionalCookiesEnabled}
              onChange={(event) => setMarketing(event.target.checked)}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="btn-primary !px-4 !py-2" onClick={() => onSave({ analytics, marketing })}>
            Save preferences
          </button>
          <button type="button" className="btn-subtle !px-4 !py-2" onClick={onAcceptAll}>
            Accept all
          </button>
          <button type="button" className="btn-subtle !px-4 !py-2" onClick={onRejectAll}>
            Reject all
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const hasOptionalCookieScripts = Boolean(
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN
  );
  const [consent, setConsent] = useState<ConsentRecord>(defaultConsent);
  const [hasChoice, setHasChoice] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const persistConsent = useCallback((draft: ConsentDraft) => {
    const next: ConsentRecord = {
      version: CONSENT_VERSION,
      updatedAt: new Date().toISOString(),
      necessary: true,
      analytics: draft.analytics,
      marketing: draft.marketing
    };

    setConsent(next);
    setHasChoice(true);
    setIsModalOpen(false);
    writeConsentCookie(next);
  }, []);

  const acceptAll = useCallback(() => {
    persistConsent({ analytics: true, marketing: true });
  }, [persistConsent]);

  const rejectAll = useCallback(() => {
    persistConsent({ analytics: false, marketing: false });
  }, [persistConsent]);

  const savePreferences = useCallback((draft: ConsentDraft) => {
    persistConsent(draft);
  }, [persistConsent]);

  const openSettings = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  useEffect(() => {
    if (!hasOptionalCookieScripts) {
      setHasChoice(true);
      setIsReady(true);
      return;
    }

    const existingConsent = readConsentCookie();
    if (existingConsent) {
      setConsent(existingConsent);
      setHasChoice(true);
    }
    setIsReady(true);
  }, [hasOptionalCookieScripts]);

  const value = useMemo<ConsentContextValue>(
    () => ({
      consent,
      hasChoice,
      openSettings,
      acceptAll,
      rejectAll,
      savePreferences
    }),
    [consent, hasChoice, openSettings, acceptAll, rejectAll, savePreferences]
  );

  return (
    <ConsentContext.Provider value={value}>
      {children}
      <AnalyticsScriptGate enabled={hasOptionalCookieScripts && hasChoice && consent.analytics} />
      {isReady && !hasChoice && hasOptionalCookieScripts ? (
        <CookieBanner onAcceptAll={acceptAll} onRejectAll={rejectAll} onManage={openSettings} />
      ) : null}
      <CookieModal
        open={isModalOpen}
        initialConsent={consent}
        optionalCookiesEnabled={hasOptionalCookieScripts}
        onClose={() => setIsModalOpen(false)}
        onAcceptAll={acceptAll}
        onRejectAll={rejectAll}
        onSave={savePreferences}
      />
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used inside ConsentProvider.');
  }
  return context;
}

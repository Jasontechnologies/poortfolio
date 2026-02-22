import './globals.css';
import type { Metadata } from 'next';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { Navbar } from '@/components/navbar';
import { ConsentProvider } from '@/components/consent/consent-provider';
import { CookieSettingsButton } from '@/components/consent/cookie-settings-button';
import { TopProgressBar } from '@/components/navigation/top-progress-bar';
import { RouteTransition } from '@/components/navigation/route-transition';
import { createClient } from '@/lib/supabase/server';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700']
});

export const metadata: Metadata = {
  title: 'JasonWorldOfTech | Founder-Led AI Products',
  description: 'JasonWorldOfTech is a founder-led AI software studio building practical, privacy-first products for creators and businesses.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} min-h-screen overflow-x-hidden antialiased`}>
        <ConsentProvider>
          <TopProgressBar />
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 pb-10 pt-6 md:pt-8">
            <RouteTransition>{children}</RouteTransition>
          </main>
          <footer id="contact" className="mx-auto max-w-6xl px-4 pb-10">
            <div className="rounded-2xl border border-[#d8e2f5] bg-white/78 p-5 text-sm text-[#4f5a77] shadow-[0_10px_26px_rgba(20,31,60,0.08)]">
              <p className="font-semibold text-[#182142]">&copy; 2026 JasonWorldOfTech</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <a href="/privacy" className="hover:text-[#101a33]">Privacy Policy</a>
                <a href="/terms" className="hover:text-[#101a33]">Terms</a>
                <a href="/cookies" className="hover:text-[#101a33]">Cookie Policy</a>
                <CookieSettingsButton />
                <a href="/acceptable-use" className="hover:text-[#101a33]">Acceptable Use</a>
                <a href="/security" className="hover:text-[#101a33]">Security</a>
                <a href="/status" className="hover:text-[#101a33]">Status</a>
                <a href="/contact" className="hover:text-[#101a33]">Contact</a>
                <a href="/complaints" className="hover:text-[#101a33]">Complaints</a>
                {isAuthenticated ? <a href="/account/privacy" className="hover:text-[#101a33]">Privacy controls</a> : null}
              </div>
            </div>
          </footer>
        </ConsentProvider>
      </body>
    </html>
  );
}

import './globals.css';
import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';

export const metadata: Metadata = {
  title: 'JasonWorldOfTech',
  description: 'Personal brand, parent company, and product launcher hub.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import ContactClient from './contact-client';

export const metadata: Metadata = {
  title: 'Contact | JasonWorldOfTech',
  description: 'Contact JasonWorldOfTech for support, legal, security, and product inquiries.'
};

export default function ContactPage() {
  return <ContactClient />;
}

import type { Metadata } from 'next';
import SignInClient from './sign-in-client';

export const metadata: Metadata = {
  title: 'Account Access | JasonWorldOfTech',
  description: 'Sign in or create an account to access private support chat and privacy controls for JasonWorldOfTech and Koola AI.'
};

export default function SignInPage() {
  return <SignInClient />;
}

import type { Metadata } from 'next';
import ComplaintsClient from './complaints-client';

export const metadata: Metadata = {
  title: 'DMCA and Complaints | JasonWorldOfTech',
  description: 'Submit DMCA, copyright, trademark, privacy, and policy complaints to JasonWorldOfTech.'
};

export default function ComplaintsPage() {
  return <ComplaintsClient />;
}

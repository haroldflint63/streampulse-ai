import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'StreamPulse — Real-time streaming analytics',
  description:
    'Live watch metrics, drop-off detection, and AI-powered insights for streaming video platforms.',
  openGraph: {
    title: 'StreamPulse',
    description: 'Real-time streaming analytics with AI-powered insights.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

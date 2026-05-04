import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'StreamPulse AI · Real-time Streaming Observability',
  description:
    'Event-driven analytics platform for streaming video — live watch metrics, drop-off detection, AI insights.',
  openGraph: {
    title: 'StreamPulse AI',
    description: 'Real-time streaming observability with AI-powered insights.',
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

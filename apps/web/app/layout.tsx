import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'StreamPulse AI — Real-time Viral Moment Engine',
  description:
    'Real-time AI stream-discovery platform. Ranks live streams across Twitch, YouTube, Kick, and TikTok using anomaly-based viral scoring with LLM-generated explanations.',
  openGraph: {
    title: 'StreamPulse AI',
    description:
      'Live stream discovery, scored in real time. Anomaly-based viral detection + LLM narratives.',
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

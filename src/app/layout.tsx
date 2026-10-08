import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CyberShield — Enterprise Cyber Defense Simulation OS',
  description: 'Adaptive spear-phishing simulation, real-time HVI telemetry, and automated micro-training.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950/50 to-slate-950 -z-10" />
        {children}
      </body>
    </html>
  );
}

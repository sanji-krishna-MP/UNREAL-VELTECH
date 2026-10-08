import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CyberShield — Human Risk & Awareness Platform',
  description: 'Enterprise adaptive phishing-awareness simulation and training platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090B] text-zinc-100 min-h-screen antialiased selection:bg-zinc-800 selection:text-zinc-100">
        {children}
      </body>
    </html>
  );
}

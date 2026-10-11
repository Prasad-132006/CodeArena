import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'CodeArena — AI-Powered Online Judge & Coding Platform',
  description:
    'High-performance C++ coding platform featuring isolated sandbox execution and an evidence-based AI coding coach with progressive hints.',
  keywords: [
    'Online Judge',
    'C++',
    'AI Coding Coach',
    'Competitive Programming',
    'Next.js',
    'FastAPI',
    'Docker Judge',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0B0F19] text-slate-100 font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

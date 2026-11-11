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
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Fira+Code:wght@300..700&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Source+Code+Pro:ital,wght@0,200..900;1,200..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0D1117] text-[#F0F3F6] font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/shared/AuthProvider';

export const metadata: Metadata = {
  title: 'The Grind Pact',
  description: 'Fitness accountability. No excuses.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className="h-full bg-[#0D0D0D] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

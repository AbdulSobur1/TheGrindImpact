import { Navigation } from '@/components/shared/Navigation';
import { PageTransition } from '@/components/shared/PageTransition';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-screen bg-[#0D0D0D]">
      <Navigation />
      <main className="flex-1 ml-0 md:ml-64 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </div>
  );
}

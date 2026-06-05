import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGate } from '@/components/auth/AuthGate';
import { GuidedTour } from '@/components/tour/GuidedTour';

// Every dashboard route reads URL query params (branch, status, page, etc).
// Mark the whole segment as dynamic so Next.js doesn't try to prerender
// pages that use useSearchParams on the server.
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGate>
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden min-w-0">
          {children}
        </main>
      </div>
      <GuidedTour />
    </AuthGate>
  );
}

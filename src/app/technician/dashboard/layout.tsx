
import { Suspense } from 'react';
import { TechnicianSidebarNav } from '@/components/technician/technician-sidebar-nav';
import { TechnicianHeader } from '@/components/technician/technician-header';
import { PageLoader } from '@/components/ui/loader';
import { RoleGuard } from '@/components/role-guard';


export default function TechnicianDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['technician']}>
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <TechnicianSidebarNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <TechnicianHeader />
            <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                <Suspense fallback={<PageLoader />}>
                    {children}
                </Suspense>
            </main>
        </div>
    </div>
    </RoleGuard>
  );
}

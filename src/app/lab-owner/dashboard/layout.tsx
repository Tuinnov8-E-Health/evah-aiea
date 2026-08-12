
import { Suspense } from 'react';
import { LabOwnerSidebarNav } from '@/components/lab-owner/lab-owner-sidebar-nav';
import { LabOwnerHeader } from '@/components/lab-owner/lab-owner-header';
import { PageLoader } from '@/components/ui/loader';
import { RoleGuard } from '@/components/role-guard';


export default function LabOwnerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['lab_owner']}>
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <LabOwnerSidebarNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <LabOwnerHeader />
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

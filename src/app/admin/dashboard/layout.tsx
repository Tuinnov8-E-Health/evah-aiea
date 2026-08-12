
import { Suspense } from 'react';
import { AdminSidebarNav } from '@/components/admin/admin-sidebar-nav';
import { AdminHeader } from '@/components/admin/admin-header';
import { PageLoader } from '@/components/ui/loader';
import { RoleGuard } from '@/components/role-guard';


export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'supervisor']}>
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <AdminSidebarNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <AdminHeader />
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

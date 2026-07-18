
'use client';

import { MobileNav } from "@/components/mobile-nav";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { Suspense, useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/loader';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getMe, clearSession, getStoredUser } from '@/lib/client-api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('chw');
  const [userName, setUserName] = useState('Care Team');

  useEffect(() => {
    const sessionUser = getStoredUser();
    const demoMode = typeof window !== 'undefined' && localStorage.getItem('is_demo') === 'true';

    if (!sessionUser) {
      router.push('/login');
      return;
    }

    if (demoMode) {
      setRole(sessionUser.role);
      setUserName(sessionUser.name);
      setLoading(false);
      return;
    }

    getMe()
      .then((result) => {
        setRole(result.user.role);
        setUserName(result.user.name);
        setLoading(false);
      })
      .catch(() => {
        clearSession();
        router.push('/login');
      });
  }, [router]);

  if (loading) {
    return <PageLoader />;
  }

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      {/* Desktop Sidebar */}
      <SidebarNav />

      <div className="flex flex-1 flex-col md:pl-44">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">{userName}</span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                {role.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/notifications" className="relative p-2 hover:bg-muted rounded-full transition-colors">
              <Bell className="h-5 w-5 text-primary" />
              <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-full border-2 border-background">
                3
              </span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{userName}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{role}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/account">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 pb-24 md:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <Suspense fallback={<PageLoader />}>
              {children}
            </Suspense>
          </div>
        </main>

        {/* Mobile Navigation */}
        <MobileNav userRole={role} />
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Bell, ClipboardList, FileText, Home, Menu, User, BarChart3, Users, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getStoredUser } from '@/lib/client-api';
import { cn } from '@/lib/utils';

export default function ClinicianDashboardLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [profile, setProfile] = useState({
        name: 'Dr. Antony Ngemu',
        role: 'Clinician',
        facilityCode: '13077',
        county: 'Nairobi',
    });

    const activeView = searchParams.get('view') === 'my-reports'
        ? 'my-reports'
        : searchParams.get('view') === 'new-reports'
            ? 'new-reports'
            : searchParams.get('view') === 'patients'
                ? 'patients'
                : 'home';

    useEffect(() => {
        const savedUser = getStoredUser();
        if (savedUser) {
            setProfile({
                name: savedUser.name || 'Dr. Antony Ngemu',
                role: savedUser.role === 'clinician' ? 'Clinician' : savedUser.role,
                facilityCode: savedUser.facilityCode || '13077',
                county: savedUser.county || savedUser.location || 'Nairobi',
            });
        }
    }, []);

    const navItems = [
        { href: '/clinician/dashboard', label: 'Home', icon: Home, key: 'home' },
        { href: '/clinician/dashboard?view=new-reports', label: 'New Reports', icon: ClipboardList, key: 'new-reports' },
        { href: '/clinician/dashboard?view=patients', label: 'Patients', icon: Users, key: 'patients' },
        { href: '/clinician/dashboard?view=my-reports', label: 'My Reports', icon: FileText, key: 'my-reports' },
    ];

    return (
        <div className="min-h-screen bg-muted/10">
            <div className="flex min-h-screen flex-col md:flex-row">
                <aside className="hidden w-64 flex-col border-r bg-background/95 p-4 shadow-sm md:flex">
                    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-primary/10 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Brain className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-primary">Clinician Workspace</p>
                            <h2 className="text-sm font-semibold text-foreground">Review Hub</h2>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.key;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                    )}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto rounded-2xl border border-primary/10 bg-card/70 p-3 text-sm text-muted-foreground">
                        <p className="font-semibold text-foreground">Review summary</p>
                        <p className="mt-1">12 pending reports • 3 urgent flags • 5 reviewed this week</p>
                    </div>
                </aside>

                <div className="flex-1">
                    <header className="border-b bg-background/95 px-4 py-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Button size="icon" variant="outline" className="md:hidden">
                                    <Menu className="h-4 w-4" />
                                </Button>
                                <div>
                                    <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Clinical Review</p>
                                    <h1 className="text-xl font-semibold text-foreground">
                                        {activeView === 'my-reports' ? 'My Reports' : activeView === 'new-reports' ? 'New Reports' : activeView === 'patients' ? 'Patients' : 'Home'}
                                    </h1>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="hidden items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-2 text-sm text-primary md:flex">
                                    <BarChart3 className="h-4 w-4" />
                                    <span className="font-medium">12 pending</span>
                                </div>

                                <div className="group relative">
                                    <Button variant="outline" size="icon" className="relative">
                                        <Bell className="h-4 w-4" />
                                        <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                                    </Button>
                                    <div className="pointer-events-none absolute right-0 top-full mt-2 w-72 rounded-xl border bg-background p-3 text-sm shadow-lg opacity-0 transition-all group-hover:pointer-events-auto group-hover:opacity-100">
                                        <p className="font-semibold text-foreground">System summary</p>
                                        <ul className="mt-2 space-y-2 text-muted-foreground">
                                            <li>• 12 new reports awaiting review</li>
                                            <li>• 3 red-flag cases need urgent triage</li>
                                            <li>• 5 reviews completed this week</li>
                                        </ul>
                                    </div>
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="icon" className="rounded-full">
                                            <User className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold">{profile.name}</span>
                                                <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{profile.role}</span>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem asChild>
                                            <Link href="/dashboard/profile">Profile</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href="/clinician">Logout</Link>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-4 md:p-6">
                        <div className="mx-auto max-w-6xl">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );
}

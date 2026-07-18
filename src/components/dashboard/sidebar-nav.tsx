'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Brain,
  History,
  List,
  Activity as DataIcon,
  ClipboardList,
  FileText,
  Send
} from "lucide-react";
import { cn } from "@/lib/utils";

export function SidebarNav() {
  const pathname = usePathname();
  const [role, setRole] = useState('chw');

  useEffect(() => {
    const savedRole = localStorage.getItem('demo_role');
    if (savedRole) setRole(savedRole);
  }, []);

  const baseItems = [
    { href: "/dashboard", icon: Home, label: "Home", roles: ['chw', 'clinician', 'supervisor'] },
    {
      href: "/dashboard/assess",
      icon: role === 'clinician' ? ClipboardList : Brain,
      label: role === 'clinician' ? "Review" : "AI",
      roles: ['chw', 'clinician']
    },
    { href: "/dashboard/reports", icon: Send, label: "Reports", roles: ['chw', 'clinician'] },
    { href: "/dashboard/drafts", icon: FileText, label: "Drafts", roles: ['chw', 'clinician'] },
    { href: "/dashboard/records", icon: List, label: role === 'supervisor' ? "Users" : "Records", roles: ['chw', 'clinician', 'supervisor'] },
    { href: "/dashboard/analytics", icon: DataIcon, label: "Data", roles: ['supervisor'] },
  ];

  const navItems = baseItems.filter(item => item.roles.includes(role));

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-44 flex-col border-r bg-background md:flex">
      <nav className="flex flex-col gap-2 px-2.5 py-3">
        <Link
          href="/dashboard"
          className="group flex items-center justify-center rounded-xl bg-primary px-2 py-2 text-primary-foreground shadow-lg shadow-primary/20"
        >
          <Brain className="h-4 w-4 text-accent" />
        </Link>

        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard/assess' && pathname.startsWith('/dashboard/assess'));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-primary"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

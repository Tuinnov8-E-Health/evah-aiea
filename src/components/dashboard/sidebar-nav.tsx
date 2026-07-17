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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-14 flex-col border-r bg-background md:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base shadow-lg shadow-primary/20"
        >
          <Brain className="h-4 w-4 transition-all group-hover:scale-110 text-accent" />
          <span className="sr-only">AIEA Assistant</span>
        </Link>
        <TooltipProvider>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-all hover:text-primary md:h-8 md:w-8",
                    (pathname === item.href || (item.href === '/dashboard/assess' && pathname.startsWith('/dashboard/assess'))) && "bg-primary/5 text-primary"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", (pathname === item.href || (item.href === '/dashboard/assess' && pathname.startsWith('/dashboard/assess'))) && "fill-primary/10")} />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
    </aside>
  );
}

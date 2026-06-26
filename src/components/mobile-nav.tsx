'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Brain, List, User, Activity, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  userRole?: string;
}

export function MobileNav({ userRole }: MobileNavProps) {
  const pathname = usePathname();

  const baseItems = [
    { href: "/dashboard", icon: Home, label: "Home", roles: ['chw', 'clinician', 'supervisor'] },
    {
      href: "/dashboard/assess",
      icon: userRole === 'clinician' ? ClipboardList : Brain,
      label: userRole === 'clinician' ? "Review" : "AI",
      roles: ['chw', 'clinician']
    },
    { href: "/dashboard/analytics", icon: Activity, label: "Data", roles: ['supervisor'] },
    { href: "/dashboard/records", icon: List, label: userRole === 'supervisor' ? "Users" : "Records", roles: ['chw', 'clinician', 'supervisor'] },
    { href: "/dashboard/account", icon: User, label: "Account", roles: ['chw', 'clinician', 'supervisor'] },
  ];

  const navItems = baseItems.filter(item => !userRole || item.roles.includes(userRole));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard/assess' && pathname.startsWith('/dashboard/assess'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "fill-primary/10")} />
              <span className="text-[10px] font-medium mt-1 uppercase tracking-tighter">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 h-1 w-8 bg-primary rounded-b-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

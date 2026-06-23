'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  History,
  LogOut,
  User,
  Bell,
  Menu,
  Brain,
  ClipboardList,
  List,
  Activity
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "../theme-toggle";
import Image from "next/image";
import { mockNotifications, mockUserProfile } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const pathname = usePathname();
  const [role, setRole] = useState('chw');

  useEffect(() => {
    const savedRole = localStorage.getItem('demo_role');
    if (savedRole) setRole(savedRole);
  }, []);

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Home", roles: ['chw', 'clinician', 'supervisor'] },
    { 
      href: "/dashboard/assess", 
      icon: role === 'clinician' ? ClipboardList : Brain, 
      label: role === 'clinician' ? "Review" : "AI", 
      roles: ['chw', 'clinician'] 
    },
    { href: "/dashboard/records", icon: List, label: role === 'supervisor' ? "Users" : "Records", roles: ['chw', 'clinician', 'supervisor'] },
    { href: "/dashboard/analytics", icon: Activity, label: "Data", roles: ['supervisor'] },
    { href: "/dashboard/history", icon: History, label: "History", roles: ['chw', 'clinician', 'supervisor'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(role));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground",
                  pathname === item.href && "text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search patients..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
       <ThemeToggle />
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Alerts</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {mockNotifications.slice(0, 3).map((notification) => (
            <DropdownMenuItem key={notification.id} asChild>
                <Link href={notification.href} className="flex items-start gap-3">
                    <notification.icon className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex flex-col">
                        <span>{notification.text}</span>
                        <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </span>
                    </div>
                </Link>
            </DropdownMenuItem>
          ))}
           <DropdownMenuSeparator />
           <DropdownMenuItem asChild className="justify-center text-sm text-muted-foreground hover:text-primary">
                <Link href="/dashboard/notifications">View all alerts</Link>
           </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Image
              src={mockUserProfile.imageUrl}
              width={36}
              height={36}
              alt="Avatar"
              className="overflow-hidden rounded-full"
              data-ai-hint={mockUserProfile.imageHint}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
              <Link href="/login">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

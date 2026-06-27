"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Edit,
  Bell,
  Lock,
  Eye,
  LogOut,
  CheckCircle,
  ChevronRight,
  Globe,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { getStoredUser, UserSession } from '@/lib/client-api';
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Set dark mode state based on current theme
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);
  }, []);

  const handleDarkModeToggle = (checked: boolean) => {
    setIsDarkMode(checked);
    setTheme(checked ? "dark" : "light");
  };

  const handleLogout = () => {
    localStorage.removeItem('demo_session');
    localStorage.removeItem('demo_role');
    router.push('/login');
  };

  const menuItems = [
    {
      icon: Edit,
      label: "Edit Profile",
      href: "/dashboard/edit-profile",
    },
    {
      icon: Bell,
      label: "Notifications",
      href: "/dashboard/notifications",
    },
    {
      icon: Lock,
      label: "Security",
      href: "/dashboard/security",
    },
    {
      icon: Eye,
      label: "Dark Mode",
      hasToggle: true,
      value: isDarkMode,
      onChange: handleDarkModeToggle,
    },
    {
      icon: Globe,
      label: "Language",
      href: "/dashboard/language",
    },
    {
      icon: LogOut,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6 border-b">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <Link href="/dashboard/edit-profile">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary hover:bg-primary/10"
          >
            <Edit className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center py-8 px-4">
        {/* Profile Image with Verification Badge */}
        <div className="relative mb-4">
          <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200">
            {user?.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-xl font-bold">
                {user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2) || 'CH'}
              </div>
            )}
          </div>
          {/* Verification Badge */}
          <div className="absolute bottom-2 right-2 bg-accent rounded-full p-1.5">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        </div>

        {/* User Name */}
        <h2 className="text-2xl font-semibold text-gray-900">
          {user?.name || 'User'}
        </h2>
      </div>

      {/* Menu Items */}
      <div className="px-4 py-2">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;

          if (item.hasToggle) {
            return (
              <div
                key={index}
                className="flex items-center gap-4 py-4 px-3 rounded-lg"
              >
                {/* Icon */}
                <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                  <IconComponent className="h-5 w-5 text-primary" />
                </div>

                {/* Label */}
                <span className="flex-1 font-medium text-gray-900">
                  {item.label}
                </span>

                {/* Toggle */}
                <Switch
                  checked={item.value || false}
                  onCheckedChange={item.onChange}
                />
              </div>
            );
          }

          if (item.href) {
            return (
              <Link key={index} href={item.href}>
                <div className="flex items-center gap-4 py-4 px-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100">
                  {/* Icon */}
                  <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>

                  {/* Label */}
                  <span className="flex-1 font-medium text-gray-900">
                    {item.label}
                  </span>

                  {/* Arrow */}
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </Link>
            );
          }

          return (
            <div
              key={index}
              onClick={item.onClick}
              className="flex items-center gap-4 py-4 px-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 active:bg-gray-100"
            >
              {/* Icon */}
              <div className="bg-primary/10 rounded-full p-3 flex-shrink-0">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>

              {/* Label */}
              <span className="flex-1 font-medium text-gray-900">
                {item.label}
              </span>

              {/* Arrow */}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

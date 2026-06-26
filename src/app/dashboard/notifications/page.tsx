
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Bell, MessageSquare, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NotificationSettings {
  appointments: boolean;
  messages: boolean;
  alerts: boolean;
  reminders: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings>({
    appointments: true,
    messages: true,
    alerts: true,
    reminders: true,
    emailNotifications: true,
    smsNotifications: true,
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      router.back();
    }, 1000);
  };

  const notificationOptions = [
    {
      key: 'appointments' as const,
      label: 'Appointment Reminders',
      description: 'Get notified about upcoming appointments',
      icon: Bell,
    },
    {
      key: 'messages' as const,
      label: 'Messages',
      description: 'Receive notifications for new messages',
      icon: MessageSquare,
    },
    {
      key: 'alerts' as const,
      label: 'Health Alerts',
      description: 'Get notified about critical health alerts',
      icon: AlertCircle,
    },
    {
      key: 'reminders' as const,
      label: 'Daily Reminders',
      description: 'Receive daily medication reminders',
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-6 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Notification Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Push Notifications Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Push Notifications</h2>
            {notificationOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between py-4 px-3 border-b last:border-b-0 -mx-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 rounded-full p-2">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings[option.key]}
                    onCheckedChange={() => handleToggle(option.key)}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Notification Channels Section */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Notification Channels</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 px-3 border-b">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle('emailNotifications')}
                />
              </div>
              <div className="flex items-center justify-between py-4 px-3">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via SMS
                  </p>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={() => handleToggle('smsNotifications')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

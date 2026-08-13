
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldAlert, TrendingUp, AlertTriangle, ShieldCheck, ClipboardList, BarChart3 } from 'lucide-react';
import { PageLoader } from '@/components/ui/loader';
import { fetchAnalyticsOverview, getStoredUser } from '@/lib/client-api';

export default function SafetyDashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [urgentCount, setUrgentCount] = useState<number>(0);

  useEffect(() => {
    setIsClient(true);
    const storedUser = getStoredUser();
    setRole(storedUser?.role || localStorage.getItem('demo_role'));

    fetchAnalyticsOverview().then((data: any) => {
      setUrgentCount(data?.urgent_count ?? data?.urgentCount ?? 0);
    }).catch(() => {});
  }, []);

  if (!isClient) return <PageLoader />;

  const isSupervisor = role === 'supervisor';

  if (!isSupervisor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-muted-foreground">This dashboard is restricted to supervisors. (Current Session Role: {role || 'CHW'})</p>
      </div>
    );
  }


  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-headline font-bold text-primary tracking-tight italic">Safety & MEL Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitoring AI Discordance & Quality Metrics</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-red-50 border-red-100">
          <CardHeader className="p-4 pb-0"><AlertTriangle className="h-5 w-5 text-red-600" /></CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-bold text-red-600">12.4%</div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Override Rate</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="p-4 pb-0"><TrendingUp className="h-5 w-5 text-primary" /></CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-bold text-primary">{urgentCount}</div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Red Flag Triggers</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Discordance Analysis</CardTitle>
          <CardDescription>Top reasons for clinical authority overrides</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Patient Context missed by AI</span>
              <Badge variant="outline">45%</Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[45%]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>MoH Protocol Variance</span>
              <Badge variant="outline">30%</Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div className="bg-accent h-full w-[30%]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span>Expert Clinical Judgment</span>
              <Badge variant="outline">25%</Badge>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full w-[25%]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 text-slate-100 border-none">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-accent" /> System Compliance</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 border border-slate-700 rounded-lg">
            <div className="text-xl font-bold text-accent">98.2%</div>
            <p className="text-[9px] uppercase font-bold text-slate-400">Consent Obtained</p>
          </div>
          <div className="text-center p-3 border border-slate-700 rounded-lg">
            <div className="text-xl font-bold text-accent">14m</div>
            <p className="text-[9px] uppercase font-bold text-slate-400">Avg. Consult Time</p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/30 p-4 rounded-xl border border-dashed text-center">
        <ClipboardList className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs font-medium text-muted-foreground">MEL Audit logs are synced to regional health management office via secured PHC protocols.</p>
      </div>
    </div>
  );
}

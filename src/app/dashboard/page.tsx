'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  Users, 
  AlertTriangle, 
  MoreVertical, 
  UserPlus, 
  History, 
  UserCheck,
  Stethoscope,
  Building2,
  CalendarClock,
  Brain
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { mockPatients, mockUserProfile, mockCHWs, mockClinicians, mockHealthFacilities } from "@/lib/mock-data";
import { differenceInDays, parseISO, isValid } from "date-fns";

export default function Dashboard() {
  const [role, setRole] = useState<string>('chw');
  const [patients, setPatients] = useState<any[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  
  useEffect(() => {
    const savedRole = localStorage.getItem('demo_role');
    const demoFlag = localStorage.getItem('is_demo') === 'true';
    if (savedRole) setRole(savedRole);
    setIsDemo(demoFlag);
    
    if (demoFlag) {
      setPatients(mockPatients);
    } else {
      setPatients([]);
    }
  }, []);

  const isSupervisor = role === 'supervisor';
  const isClinician = role === 'clinician';
  const isCHW = role === 'chw';
  
  const urgentCount = patients.filter(p => p.status === 'Urgent').length;
  const myPatientsCount = isCHW ? (isDemo ? 28 : 0) : (isDemo ? 1240 : 0);

  const getFollowUpDays = (patient: any) => {
    if (patient.status === 'Urgent') return 0;
    if (!patient.nextFollowUpDate) return null;
    const nextDate = parseISO(patient.nextFollowUpDate);
    if (!isValid(nextDate)) return null;
    const diff = differenceInDays(nextDate, new Date());
    return Math.max(0, diff);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-headline font-bold text-primary">
          Habari, {mockUserProfile.firstName}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSupervisor ? "System Supervision & Monitoring" : isClinician ? "Clinical Review & CHW Oversight" : "AI Epilepsy Assistant Dashboard"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Universal Stats */}
        <Card className="bg-primary/5 border-primary/10 col-span-2">
          <CardHeader className="p-4 pb-0">
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-3xl font-bold text-primary">{myPatientsCount}</div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">
              {isCHW ? "My Registered Patients" : "Regional Patient Registry"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-100">
          <CardHeader className="p-4 pb-0">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent className="p-4 pt-2">
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Urgent Alerts</p>
          </CardContent>
        </Card>

        {isSupervisor && (
          <>
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="p-4 pb-0">
                <Stethoscope className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold text-primary">{isDemo ? mockClinicians.length : '0'}</div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Clinicians</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
              <CardHeader className="p-4 pb-0">
                <Building2 className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold text-primary">{isDemo ? mockHealthFacilities.length : '0'}</div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Health Facilities</p>
              </CardContent>
            </Card>
          </>
        )}

        {(isSupervisor || isClinician) && (
          <Card className={cn("bg-primary/5 border-primary/10", !isSupervisor && "col-span-1")}>
            <CardHeader className="p-4 pb-0">
              <UserCheck className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold text-primary">{isDemo ? mockCHWs.length : '0'}</div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">CHWs in Circle</p>
            </CardContent>
          </Card>
        )}

        {isCHW && (
          <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="p-4 pb-0">
              <History className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-bold text-primary">{isDemo ? '28' : '0'}</div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Encounters Done</p>
            </CardContent>
          </Card>
        )}
      </div>

      {isCHW && (
        <Button asChild size="lg" className="w-full h-16 text-lg font-headline gap-3 shadow-lg shadow-primary/20">
          <Link href="/dashboard/assess">
            <Brain className="h-6 w-6" />
            Open AI Assistant
          </Link>
        </Button>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-headline font-bold text-primary">
            {isSupervisor || isClinician ? "Active Case Registry" : "Registered Patients"}
          </h2>
          <Link href="/dashboard/records" className="text-xs font-semibold text-primary/60 hover:text-primary">
            View All
          </Link>
        </div>

        <div className="space-y-3 pb-10">
          {patients.length > 0 ? (
            patients.map((patient) => {
              const followUpDays = getFollowUpDays(patient);
              return (
                <Card key={patient.id} className="border-none shadow-sm bg-card/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground uppercase">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/dashboard/records/${patient.id}/history`} className="hover:underline decoration-primary/40 underline-offset-2">
                        <h3 className="font-bold text-foreground truncate">{patient.name}</h3>
                      </Link>
                      <div className="flex flex-col gap-1 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{patient.age}Y • {patient.gender}</span>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[10px] h-5 px-2",
                              patient.status === 'Urgent' && "bg-red-100 text-red-700",
                              patient.status === 'Stable' && "bg-green-100 text-green-700",
                              patient.status === 'Follow-up' && "bg-blue-100 text-blue-700",
                            )}
                          >
                            {patient.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn(
                            "text-[9px] h-5 px-2 gap-1 font-bold",
                            followUpDays === 0 ? "border-red-200 text-red-600 bg-red-50" : "text-muted-foreground"
                          )}>
                            <CalendarClock className="h-3 w-3" />
                            {followUpDays === 0 ? "Follow-up Due" : `Follow-up in ${followUpDays} Days`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {isCHW && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/assess?patientId=${patient.id}`}>
                                <Brain className="mr-2 h-4 w-4" /> AI Assessment
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/new-encounter?patientId=${patient.id}`}>
                                <UserPlus className="mr-2 h-4 w-4" /> Guided Encounter
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/records/${patient.id}/history`}>
                            <History className="mr-2 h-4 w-4" /> Full History
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="py-10 text-center border-2 border-dashed rounded-xl bg-muted/10">
              <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-medium">No patients found in your registry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

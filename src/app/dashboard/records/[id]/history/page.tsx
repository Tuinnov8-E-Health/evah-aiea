'use client';

import { use, useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChevronLeft,
  Download,
  Calendar as CalendarIcon,
  FileText,
  Clock,
  Filter,
  User,
  Edit3,
  FileSearch
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, isAfter, subHours, isValid, differenceInHours, eachDayOfInterval, startOfDay } from 'date-fns';
import { useRouter } from 'next/navigation';
import { usePrint } from '@/hooks/usePrint';
import { mockPatients, mockEncounters } from '@/lib/mock-data';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Encounter } from '@/lib/types';

const formatSafeDate = (dateValue: any, formatStr: string = 'PPP p') => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (!isValid(date)) return 'Invalid Date';
  return format(date, formatStr);
};

export default function PatientHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { print } = usePrint();
  const { toast } = useToast();
  const [timeFilter, setTimeFilter] = useState('all');
  const [selectedEncounter, setSelectedEncounter] = useState<any | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideNotes, setOverrideNotes] = useState("");
  const [sessionEncounters, setSessionEncounters] = useState<Encounter[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('session_encounters');
    if (saved) {
      setSessionEncounters(JSON.parse(saved));
    }
  }, []);

  const role = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : 'chw';
  const isClinician = role === 'clinician';

  const patient = mockPatients.find(p => p.id === id);

  const patientEncounters = useMemo(() => {
    const base = mockEncounters.filter(e => e.patientId === id);
    const session = sessionEncounters.filter(e => e.patientId === id);
    return [...session, ...base].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [id, sessionEncounters]);

  const filteredEncounters = useMemo(() => {
    if (!patientEncounters) return [];
    if (timeFilter === 'all') return patientEncounters;
    const now = new Date();
    const days = parseInt(timeFilter);
    const cutoff = subHours(now, days * 24);

    return patientEncounters.filter(e => {
      const date = new Date(e.date);
      return isValid(date) && isAfter(date, cutoff);
    });
  }, [patientEncounters, timeFilter]);

  const dailyHistory = useMemo(() => {
    return filteredEncounters
      .reduce((groups: { date: Date; encounters: Encounter[] }[], encounter) => {
        const encounterDate = startOfDay(new Date(encounter.date));
        const existing = groups.find((group) => format(group.date, 'yyyy-MM-dd') === format(encounterDate, 'yyyy-MM-dd'));
        if (existing) {
          existing.encounters.push(encounter);
        } else {
          groups.push({ date: encounterDate, encounters: [encounter] });
        }
        return groups;
      }, [])
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredEncounters]);

  const handleOverrideSubmit = () => {
    if (selectedEncounter) {
      const updatedEncounter: Encounter = {
        ...selectedEncounter,
        id: `rev-${Date.now()}`,
        date: new Date().toISOString(),
        summary: `Specialist Update: ${overrideNotes}`,
        authorName: 'Dr. Specialist',
        authorRole: 'CLINICIAN',
        isClinicianUpdated: true,
        discordanceNote: `Clinician certification: ${overrideNotes}`
      };

      const newSession = [...sessionEncounters, updatedEncounter];
      setSessionEncounters(newSession);
      localStorage.setItem('session_encounters', JSON.stringify(newSession));
    }

    toast({ title: "Clinical Update Saved", description: "Assessment updated with specialist clinical oversight notes." });
    setShowOverride(false);
    setOverrideNotes("");
  };

  const handleDownload = (encounterToPrint?: any) => {
    const p = patient;
    const e = encounterToPrint || filteredEncounters[0];
    if (!p || !e) return;

    const reportContent = (
      <div className="p-8 max-w-4xl mx-auto bg-white text-slate-900" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
        <header className="border-b-2 border-primary pb-6 mb-8 flex justify-between items-start bg-white">
          <div className="bg-white">
            <h1 className="text-3xl font-bold text-primary uppercase">Clinical Encounter Report</h1>
            <p className="text-sm text-slate-500 mt-1 uppercase font-bold tracking-tight">AI Epilepsy Assistant • Medical Record</p>
          </div>
          <div className="text-right bg-white">
            <p className="font-bold">{format(new Date(), 'PPP')}</p>
            <p className="text-xs text-slate-400">Record ID: {e.id.toUpperCase()}</p>
          </div>
        </header>

        <section className="mb-10 bg-white">
          <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">1. Patient Profile</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm bg-white">
            <p><strong>Full Name:</strong> {p.name}</p>
            <p><strong>Age / Sex:</strong> {p.age}Y • {p.gender}</p>
            <p><strong>Location:</strong> {p.location}</p>
          </div>
        </section>

        <section className="mb-10 bg-white">
          <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">2. Clinical Findings</h2>
          <div className="space-y-4 text-sm bg-white">
            <p><strong>Urgency Level:</strong> {e.recommendation.urgencyLevel} RISK</p>
            <p><strong>Action Type:</strong> {e.recommendation.action}</p>
            <div className="bg-white p-4 border rounded">
              <p className="font-bold underline mb-1">Clinical Summary:</p>
              <p>{e.summary}</p>
            </div>
            {e.redFlags && e.redFlags.length > 0 && (
              <div className="bg-white mt-4">
                <p className="font-bold text-red-600">Red Flags Triggered:</p>
                <ul className="list-disc pl-5 font-bold text-red-900">
                  {e.redFlags.map((rf: string, idx: number) => <li key={idx}>{rf}</li>)}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className="mb-10 bg-white">
          <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">3. Follow-up Plan</h2>
          <p className="text-sm font-bold italic bg-white">"{e.recommendation.followUpPlan || 'Routine monthly review.'}"</p>
        </section>

        <section className="mb-10 bg-white">
          <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">4. Counseling & Safety</h2>
          <div className="grid grid-cols-1 gap-4 text-sm bg-white">
            <div className="bg-white">
              <p className="font-bold underline mb-1 uppercase">Counselling points:</p>
              <ul className="list-disc pl-5">
                {e.recommendation.antiStigmaMessages?.map((m: string, i: number) => <li key={i}>{m}</li>)}
              </ul>
            </div>
            <div className="bg-white">
              <p className="font-bold underline mb-1 uppercase text-red-600">Safety warnings:</p>
              <ul className="list-disc pl-5 text-red-900 font-bold">
                {e.recommendation.safetyAdvice?.map((s: string, i: number) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {e.discordanceNote && (
          <section className="mb-10 bg-white p-4 border border-red-100 rounded">
            <h2 className="text-base font-bold uppercase border-b pb-1 mb-4 text-red-800">5. Clinical Discordance</h2>
            <p className="text-sm italic text-red-900">"{e.discordanceNote}"</p>
          </section>
        )}

        <section className="mb-10 pt-10 bg-white">
          <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">Record Attribution</h2>
          <div className="text-sm space-y-1 italic bg-white">
            <p><strong>Generated By:</strong> {e.authorName}</p>
            <p><strong>Role:</strong> {e.authorRole}</p>
            <p><strong>Facility:</strong> Regional Health Circle</p>
          </div>
        </section>

        <footer className="mt-20 pt-8 border-t bg-white">
          <div className="flex justify-between items-end bg-white">
            <div className="text-xs text-slate-400 bg-white">
              <p>© 2026 AI Epilepsy Assistant Project</p>
            </div>
            <div className="text-center border-t border-slate-900 pt-2 px-10 bg-white">
              <p className="text-xs font-bold uppercase">Authorized Clinician Signature</p>
            </div>
          </div>
        </footer>
      </div>
    );

    print(reportContent);
  };

  if (!patient) return <div className="p-10 text-center">Patient not found</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="-ml-2 text-muted-foreground">
          <ChevronLeft className="h-4 w-4 mr-1" /> Records
        </Button>
        <Button onClick={() => handleDownload()} variant="outline" size="sm" className="gap-2 border-primary text-primary hover:bg-primary/5">
          <Download className="h-4 w-4" /> Download History
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-headline font-bold text-primary">{patient.name}</h1>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground italic">CHW: {patient.chwName}</p>
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest">{patient.status}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-muted shadow-sm">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filter Period</span>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="h-9 border-none bg-transparent focus:ring-0 text-sm font-bold">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Full History</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-6">
        {filteredEncounters.length > 0 ? (
          filteredEncounters.map((encounter) => (
            <Card key={encounter.id} className={cn(
              'border-none shadow-md overflow-hidden bg-card/40',
              encounter.isClinicianUpdated && 'ring-1 ring-blue-500/20'
            )}>
              <CardHeader className="p-4 bg-muted/20 border-b">
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatSafeDate(encounter.date, 'PPP')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{encounter.authorName} ({encounter.authorRole})</p>
                  </div>
                  {encounter.isClinicianUpdated && (
                    <Badge className="bg-blue-600 w-fit h-4 text-[8px] uppercase">Clinician Certified</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="rounded-2xl border border-muted/70 bg-white/80 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">{encounter.type} report</p>
                      <p className="text-sm font-semibold text-foreground">{encounter.summary}</p>
                    </div>
                    <Badge variant="outline" className="h-7 text-[10px] uppercase font-bold tracking-widest">
                      {encounter.recommendation.urgencyLevel}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-3 text-[12px] leading-relaxed">
                      <p className="font-bold uppercase text-[10px] tracking-widest">AI Recommendation</p>
                      <p>{encounter.recommendation.action}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{encounter.recommendation.followUpPlan}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-[12px] leading-relaxed">
                      <p className="font-bold uppercase text-[10px] tracking-widest">Safety Advice</p>
                      <ul className="list-disc pl-4">
                        {encounter.recommendation.safetyAdvice?.map((advice, idx) => (
                          <li key={idx}>{advice}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest" onClick={() => { setSelectedEncounter(encounter); setShowFullReport(true); }}>
                      <FileSearch className="h-3 w-3 mr-2" /> View Detailed Report
                    </Button>
                    <Button variant="ghost" size="sm" className="shrink-0 h-9" onClick={() => handleDownload(encounter)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
            <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground font-medium">No encounters found for this period.</p>
          </div>
        )}
      </div>

      {/* Full Report Preview Dialog */}
      <Dialog open={showFullReport} onOpenChange={setShowFullReport}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Clinical Report Preview</DialogTitle>
            <DialogDescription>Detailed view of clinical parameters.</DialogDescription>
          </DialogHeader>
          {selectedEncounter && (
            <div className="bg-white p-8 text-slate-900 leading-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
              <div className="text-center border-b pb-6 mb-8 bg-white">
                <h1 className="text-xl font-bold uppercase">Clinical Encounter Report</h1>
                <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">AI Epilepsy Assistant • Confidential Record</p>
                <p className="text-[10px] mt-2">Generated: {format(new Date(), 'PPPP p')}</p>
              </div>

              <div className="space-y-6 bg-white">
                <section className="bg-white">
                  <h2 className="text-sm font-bold uppercase border-b pb-1 mb-3">1. Patient Profile</h2>
                  <div className="grid grid-cols-2 gap-y-1 text-xs bg-white">
                    <p><strong>Name:</strong> {patient.name}</p>
                    <p><strong>Age/Sex:</strong> {patient.age}Y • {patient.gender}</p>
                    <p><strong>Author:</strong> {selectedEncounter.authorName}</p>
                  </div>
                </section>

                <section className="bg-white">
                  <h2 className="text-sm font-bold uppercase border-b pb-1 mb-3">2. Clinical Findings</h2>
                  <div className="space-y-3 text-xs bg-white">
                    <p><strong>Urgency Level:</strong> {selectedEncounter.recommendation.urgencyLevel} RISK</p>
                    <p><strong>Action Type:</strong> {selectedEncounter.recommendation.action}</p>
                    <div className="bg-white p-2 border rounded italic">
                      <p><strong>Summary:</strong> {selectedEncounter.summary}</p>
                    </div>
                  </div>
                </section>

                <section className="bg-white">
                  <h2 className="text-sm font-bold uppercase border-b pb-1 mb-3">3. Follow-up Plan</h2>
                  <p className="text-xs italic bg-white">"{selectedEncounter.recommendation.followUpPlan || 'Routine assessment scheduled.'}"</p>
                </section>

                <section className="bg-white">
                  <h2 className="text-sm font-bold uppercase border-b pb-1 mb-3">4. Counseling & Safety</h2>
                  <div className="space-y-3 text-xs bg-white">
                    <div className="bg-white">
                      <p className="underline font-bold">Counseling Points:</p>
                      <ul className="list-disc pl-4 space-y-1 mt-1">
                        {selectedEncounter.recommendation.antiStigmaMessages?.map((m: string, i: number) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                    <div className="bg-white">
                      <p className="underline font-bold text-red-600">Safety Warnings:</p>
                      <ul className="list-disc pl-4 space-y-1 mt-1 text-red-900 font-bold">
                        {selectedEncounter.recommendation.safetyAdvice?.map((s: string, i: number) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="pt-6 bg-white">
                  <h2 className="text-xs font-bold uppercase border-b pb-1 mb-2">Attribution</h2>
                  <div className="text-[10px] italic text-slate-500 bg-white">
                    <p>Performed by: {selectedEncounter.authorName} ({selectedEncounter.authorRole})</p>
                    <p>Facility: Regional Health Circle</p>
                  </div>
                </section>
              </div>

              <div className="mt-10 pt-6 border-t flex flex-col items-center bg-white">
                <Button size="sm" className="w-full bg-slate-900 text-white gap-2 h-10 no-print" onClick={() => handleDownload(selectedEncounter)}>
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Clinician Review Dialog */}
      <Dialog open={showOverride} onOpenChange={setShowOverride}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline italic text-primary">Clinician Update</DialogTitle>
            <DialogDescription>Updating assessment with manual clinical oversight notes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">CHW Author</Label>
              <div className="p-3 bg-muted/30 rounded-xl text-xs font-bold">{selectedEncounter?.authorName}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Specialist Review Notes</Label>
              <Textarea
                value={overrideNotes}
                onChange={e => setOverrideNotes(e.target.value)}
                placeholder="Add manual clinical findings or diagnostic plans..."
                className="rounded-xl min-h-[120px] border-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full h-14 font-bold rounded-2xl shadow-lg bg-primary" disabled={!overrideNotes} onClick={handleOverrideSubmit}>
              Update & Certify Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

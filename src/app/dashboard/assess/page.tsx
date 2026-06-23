'use client';

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  Plus, 
  Send, 
  Paperclip, 
  X, 
  History, 
  ChevronLeft, 
  Sparkles,
  CheckCircle2,
  Edit3,
  Loader2,
  MoreVertical,
  MapPin,
  FileText,
  Download,
  ShieldAlert,
  Clock,
  UserCircle,
  FileSearch,
  Stethoscope,
  ChevronRight,
  ClipboardCheck,
  Brain
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { runClinicalLogic } from "@/lib/clinical-engine/engine";
import { Recommendation, ClinicalInput } from "@/lib/clinical-engine/types";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { FacilityMap } from "@/components/dashboard/facility-map";
import { mockPatients, mockUserProfile, mockEncounters } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { usePrint } from "@/hooks/usePrint";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Encounter } from "@/lib/types";

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'audio' | 'analysis' | 'file' | 'question';
  fileName?: string;
  recommendation?: Recommendation;
};

export default function AssessPage() {
  const { toast } = useToast();
  const { print } = usePrint();
  const router = useRouter();

  const [role, setRole] = useState<string>('chw');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionDraft, setTranscriptionDraft] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [overrideData, setOverrideData] = useState({ reason: '', notes: '' });
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);
  
  const [conversationStage, setConversationStage] = useState(0); 

  useEffect(() => {
    const savedRole = localStorage.getItem('demo_role') || 'chw';
    setRole(savedRole);
    setPatients(mockPatients);
  }, []);

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, transcriptionDraft]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setShowHistory(false);
    
    if (role === 'clinician') return;

    setConversationStage(0);
    setMessages([
      {
        id: '1',
        role: 'ai',
        content: `I'm ready to assist with ${patients?.find(p => p.id === id)?.name}. Describe symptoms or upload reports for WHO-aligned suggestive analysis. Decision authority remains with you.`,
        type: 'text'
      }
    ]);
  };

  const saveEncounterToHistory = (recommendation: Recommendation, isOverride: boolean = false) => {
    if (!selectedPatientId) return;

    const newEncounter: Encounter = {
      id: `e-${Date.now()}`,
      patientId: selectedPatientId,
      date: new Date().toISOString(),
      summary: role === 'clinician' 
        ? `Clinician Review: ${overrideData.notes}` 
        : `Conversational assessment: ${messages.filter(m => m.role === 'user').map(m => m.content).join(' | ')}`,
      redFlags: recommendation.detectedRedFlags,
      recommendation: {
        action: recommendation.actionDescription,
        urgencyLevel: recommendation.urgencyLevel,
        referralDestination: recommendation.referralDestination,
        antiStigmaMessages: recommendation.counselingPoints,
        safetyAdvice: recommendation.safetyWarnings
      },
      type: recommendation.urgencyLevel === 'EMERGENCY' ? 'Emergency' : 'Routine',
      discordanceNote: isOverride ? `${overrideData.reason}: ${overrideData.notes}` : undefined,
      authorName: mockUserProfile.name,
      authorRole: mockUserProfile.role.toUpperCase(),
      isClinicianUpdated: role === 'clinician'
    };

    const existingLogs = JSON.parse(localStorage.getItem('session_encounters') || '[]');
    localStorage.setItem('session_encounters', JSON.stringify([...existingLogs, newEncounter]));
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    processClinicalConversation(inputText);
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      setTranscriptionDraft("Mgonjwa amepata kifafa mara tatu leo asubuhi. Kila mara kilidumu kwa dakika mbili.");
    }, 3000);
  };

  const handleFinalizeTranscription = () => {
    if (!transcriptionDraft) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: transcriptionDraft, type: 'audio' };
    setMessages(prev => [...prev, userMsg]);
    const textToAnalyze = transcriptionDraft;
    setTranscriptionDraft(null);
    processClinicalConversation(textToAnalyze);
  };

  const processClinicalConversation = (input: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      if (conversationStage === 0 && input.split(' ').length < 10) {
        const clarifyingMsg: Message = {
          id: Date.now().toString(),
          role: 'ai',
          content: "I need a bit more context to align with mhGAP protocols. Could you specify how long the episodes lasted and if there were any 'Red Flags' like current fever or neck stiffness?",
          type: 'question'
        };
        setMessages(prev => [...prev, clarifyingMsg]);
        setConversationStage(1);
        setIsProcessing(false);
      } else {
        runOnDeviceAnalysis(input);
      }
    }, 1500);
  };

  const runOnDeviceAnalysis = (input: string) => {
    setIsProcessing(true);
    const isEmergency = input.toLowerCase().includes("mara tatu") || input.toLowerCase().includes("repeated") || input.toLowerCase().includes("emergency") || input.toLowerCase().includes("status");
    const isMedFail = input.toLowerCase().includes("amekosa dawa") || input.toLowerCase().includes("missed") || input.toLowerCase().includes("fail");

    const clinicalInput: ClinicalInput = {
      patientProfile: { age: selectedPatient?.age || 30, sex: (selectedPatient?.gender || 'other').toLowerCase() },
      seizureHistory: { type: 'convulsive', semiology: ['Motor Jerking'], duration: isEmergency ? '7' : '2', frequency: '3/day', triggers: ['missed medication'], comorbidities: [] },
      underlyingCauses: { fever: false, headTrauma: false, perinatalInsult: false, metabolicSuspicion: false, suddenOnsetNeurological: false },
      redFlags: { repeated: isEmergency, feverNeck: false, injury: false, newOnsetUnder5: false, medicationFail: isMedFail, prolongedSeizure: isEmergency }
    };

    setTimeout(() => {
      const result = runClinicalLogic(clinicalInput);
      setActiveRecommendation(result);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(), role: 'ai',
        content: `Analysis complete based on WHO protocols. Urgency: ${result.urgencyLevel}. Decision authority remains with you.`,
        type: 'analysis', recommendation: result
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsProcessing(false);
      if (result.urgencyLevel === 'EMERGENCY') setShowSafetyDialog(true);
    }, 2000);
  };

  const handleAction = (type: 'approve' | 'override') => {
    if (type === 'approve') {
      if (activeRecommendation) {
        saveEncounterToHistory(activeRecommendation);
      }
      setShowFinalReport(true);
      toast({ title: "Recommendation Approved", description: "Clinical encounter added to patient history." });
    } else {
      setShowOverrideDialog(true);
    }
  };

  const handleOverrideComplete = () => {
    const baseRecommendation: Recommendation = activeRecommendation || {
      urgencyLevel: 'URGENT',
      action: 'Refer',
      actionDescription: 'Updated by specialist review.',
      referralDestination: 'Regional Hospital',
      followUpPlan: 'Per specialist protocol.',
      counselingPoints: [],
      safetyWarnings: [],
      riskScore: 0,
      clinicalReasoning: 'Manual specialist review.',
      detectedRedFlags: []
    };

    saveEncounterToHistory(baseRecommendation, true);
    setShowOverrideDialog(false);
    setShowFinalReport(true);
    toast({ title: "Specialist Review Logged", description: "Assessment updated with specialist oversight in registry." });
  };

  const handleDownload = () => {
    const reportHtml = document.getElementById('assess-final-report');
    if (reportHtml) {
      print(<div className="report-print-container" dangerouslySetInnerHTML={{ __html: reportHtml.innerHTML }} />);
    }
  };

  // --- RENDER LOGIC FOR CLINICIAN REVIEW ---
  if (role === 'clinician' && selectedPatientId && !showFinalReport) {
    const sessionEncounters = JSON.parse(localStorage.getItem('session_encounters') || '[]');
    const latestEncounter = [...sessionEncounters, ...mockEncounters]
      .filter((e: Encounter) => e.patientId === selectedPatientId)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    return (
      <div className="max-w-md mx-auto space-y-6 pb-20">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPatientId(null)}><ChevronLeft /></Button>
          <div>
            <h1 className="text-xl font-headline font-bold text-primary italic">Specialist Review</h1>
            <p className="text-xs text-muted-foreground uppercase font-bold">{selectedPatient?.name} • {selectedPatient?.status}</p>
          </div>
        </header>

        {latestEncounter ? (
          <div className="bg-white p-6 border shadow-sm text-slate-900 leading-normal rounded-xl" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
            <div className="text-center border-b pb-4 mb-6">
              <h2 className="text-lg font-bold uppercase">Clinical Report for Review</h2>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase">Author: {latestEncounter.authorName} ({latestEncounter.authorRole})</p>
              <p className="text-[10px]">Date: {format(new Date(latestEncounter.date), 'PPPP p')}</p>
            </div>

            <div className="space-y-6">
              <section>
                <h3 className="text-xs font-bold uppercase border-b pb-1 mb-2">1. Patient Profile</h3>
                <div className="grid grid-cols-2 gap-y-1 text-[11px]">
                  <p><strong>Name:</strong> {selectedPatient?.name}</p>
                  <p><strong>Age/Sex:</strong> {selectedPatient?.age}Y • {selectedPatient?.gender}</p>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase border-b pb-1 mb-2">2. CHW Clinical Findings</h3>
                <div className="space-y-2 text-[11px]">
                  <p><strong>Urgency Level:</strong> {latestEncounter.recommendation.urgencyLevel}</p>
                  <p><strong>Action Type:</strong> {latestEncounter.recommendation.action}</p>
                  <div className="p-2 border rounded italic">
                    <p><strong>Summary:</strong> {latestEncounter.summary}</p>
                  </div>
                  {latestEncounter.redFlags.length > 0 && (
                    <div className="mt-2 text-red-600">
                      <p className="font-bold underline uppercase text-[9px]">Emergency Triggers:</p>
                      <ul className="list-disc pl-4 font-bold">
                        {latestEncounter.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold uppercase border-b pb-1 mb-2">3. Recommended Action</h3>
                <p className="text-[11px] font-bold">"{latestEncounter.recommendation.action}" to {latestEncounter.recommendation.referralDestination}</p>
              </section>
            </div>
          </div>
        ) : (
          <Card className="border-none shadow-sm bg-card/50">
            <CardContent className="p-8 text-center">
              <ClipboardCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No clinical encounters found for this patient record.</p>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-md overflow-hidden bg-white border-t-4 border-primary">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Stethoscope className="h-5 w-5" />
              <h3 className="text-base font-headline font-bold italic">Manual Specialist Oversight</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-tighter">Clinical Recommendation</Label>
                <Select onValueChange={v => setOverrideData({...overrideData, reason: v})}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Update Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certification">Certify CHW Plan</SelectItem>
                    <SelectItem value="medication">Update Medication Protocol</SelectItem>
                    <SelectItem value="referral">Escalate Referral</SelectItem>
                    <SelectItem value="monitoring">Routine Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-tighter">Diagnostic & Follow-up Notes</Label>
                <Textarea 
                  placeholder="Enter manual specialist assessment findings and certification notes..." 
                  className="min-h-[120px] rounded-2xl" 
                  value={overrideData.notes}
                  onChange={e => setOverrideData({...overrideData, notes: e.target.value})}
                />
              </div>
            </div>

            <Button 
              className="w-full h-14 font-bold rounded-2xl bg-primary text-white shadow-lg" 
              disabled={!overrideData.reason || !overrideData.notes}
              onClick={handleOverrideComplete}
            >
              Submit Specialist Update
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showFinalReport) {
    const finalRec = activeRecommendation || {
      urgencyLevel: 'URGENT',
      action: 'Refer',
      actionDescription: overrideData.notes || 'Updated by specialist review.',
      referralDestination: 'Regional Health Center',
      followUpPlan: 'As per specialist directive.',
      counselingPoints: [],
      safetyWarnings: [],
      detectedRedFlags: []
    };

    return (
      <div className="max-w-md mx-auto space-y-6 pb-20 pt-4 animate-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-headline font-bold text-primary italic">Final Report</h2>
          <Badge className="bg-green-600">CERTIFIED</Badge>
        </div>

        <div id="assess-final-report" className="bg-white p-8 border shadow-sm min-h-[600px] text-slate-900 leading-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <div className="text-center border-b pb-6 mb-8 bg-white">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Clinical Encounter Report</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1 uppercase">AI Epilepsy Assistant • Confidential Record</p>
            <p className="text-xs mt-2">Date: {format(new Date(), 'PPPP p')}</p>
          </div>

          <div className="space-y-8 bg-white">
            <section className="bg-white">
              <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">1. Patient Profile</h2>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <p><strong>Full Name:</strong> {selectedPatient?.name}</p>
                <p><strong>Age / Sex:</strong> {selectedPatient?.age}Y • {selectedPatient?.gender}</p>
                <p><strong>Address:</strong> {selectedPatient?.location}</p>
              </div>
            </section>

            <section className="bg-white">
              <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">2. Clinical Findings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 text-sm">
                  <p><strong>Urgency Level:</strong> {finalRec.urgencyLevel}</p>
                  <p><strong>Action Type:</strong> {finalRec.action}</p>
                </div>
                <div className="p-3 bg-white border rounded text-sm italic">
                  <p><strong>Action Description:</strong> {finalRec.actionDescription}</p>
                </div>
                {finalRec.detectedRedFlags.length > 0 && (
                  <div className="bg-white p-3 border border-red-100 rounded">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1 underline">Emergency Triggers Detected:</p>
                    <ul className="list-disc pl-5 text-sm font-bold text-red-900">
                      {finalRec.detectedRedFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white">
              <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">3. Follow-up Plan</h2>
              <p className="text-sm font-bold italic">"{finalRec.followUpPlan}"</p>
            </section>

            {role === 'chw' && (
              <section className="bg-white">
                <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">4. Counseling & Safety</h2>
                <div className="grid grid-cols-1 gap-4 text-xs">
                  <div>
                    <p className="font-bold underline mb-1 uppercase">Counselling Points:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {finalRec.counselingPoints.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold underline mb-1 uppercase text-red-600">Safety Warnings:</p>
                    <ul className="list-disc pl-5 space-y-1 text-red-900 font-bold">
                      {finalRec.safetyWarnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {overrideData.reason && (
              <section className="bg-white p-4 border border-red-100 rounded-lg">
                <h2 className="text-base font-bold uppercase border-b border-red-200 pb-1 mb-4 text-red-800">5. Specialist Review / Override</h2>
                <div className="space-y-2 text-sm italic text-red-900">
                  <p><strong>Review Category:</strong> {overrideData.reason.toUpperCase()}</p>
                  <p><strong>Clinical Justification:</strong> {overrideData.notes}</p>
                </div>
              </section>
            )}

            <section className="pt-10 bg-white">
              <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">Record Attribution</h2>
              <div className="text-sm space-y-1 italic">
                <p><strong>Author:</strong> {mockUserProfile.name}</p>
                <p><strong>Role:</strong> {mockUserProfile.role.toUpperCase()}</p>
                <p><strong>Sector:</strong> {mockUserProfile.location}</p>
              </div>
            </section>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-4">
          <Button className="h-12 font-bold bg-primary text-white" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
          <Button variant="ghost" className="col-span-2 h-12 text-muted-foreground font-bold" onClick={() => router.push('/dashboard')}><X className="mr-2 h-4 w-4" /> Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] bg-background relative overflow-hidden">
      <div className={cn("absolute inset-0 z-50 bg-background transition-transform duration-300 ease-in-out", showHistory ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
            <h2 className="font-headline font-bold flex items-center gap-2">
              {role === 'clinician' ? <FileSearch className="h-5 w-5" /> : <History className="h-5 w-5" />} 
              {role === 'clinician' ? "Specialist Review Queue" : "Patient Registry"}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(false)}><X className="h-5 w-5" /></Button>
          </div>
          {role === 'chw' && (
            <div className="p-4">
              <Button asChild className="w-full justify-start gap-2 h-12" variant="outline">
                <Link href="/dashboard/new-encounter"><Plus className="h-5 w-5 text-primary" /> New Guided Encounter</Link>
              </Button>
            </div>
          )}
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 py-4">
              {patients.length > 0 ? (
                patients
                  .filter(p => role === 'chw' || p.status !== 'Stable') 
                  .map(patient => (
                  <button key={patient.id} onClick={() => handleSelectPatient(patient.id)} className="w-full text-left p-4 rounded-xl border hover:bg-muted transition-colors group">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-primary group-hover:text-primary/80">{patient.name}</span>
                      <Badge variant="outline" className={cn("text-[10px] uppercase", patient.status === 'Urgent' ? "border-red-200 text-red-600 bg-red-50" : "")}>{patient.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{patient.location} • {patient.gender}</p>
                    {role === 'clinician' && (
                      <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                        <ChevronRight className="h-3 w-3" /> Review Latest Report
                      </div>
                    )}
                  </button>
                ))
              ) : (
                <div className="text-center py-10">
                  <p className="text-sm text-muted-foreground">No patients found in your registry.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {!selectedPatientId ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
          <div className="bg-primary/5 p-6 rounded-full">
            {role === 'clinician' ? <FileSearch className="h-12 w-12 text-primary/40" /> : <Brain className="h-12 w-12 text-primary/40" />}
          </div>
          <h2 className="text-xl font-headline font-bold text-primary">{role === 'clinician' ? "Case Review Queue" : "AI Clinical Suggester"}</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {role === 'clinician' 
              ? "Select an urgent case from the queue to review CHW reports and certify clinical paths."
              : "Decision authority remains with you. Select a patient to begin mhGAP suggestive analysis."}
          </p>
          <Button onClick={() => setShowHistory(true)} variant="outline" className="gap-2">
            <History className="h-4 w-4" /> {role === 'clinician' ? "Open Review Queue" : "Open Registry"}
          </Button>
        </div>
      ) : (
        <>
          <header className="p-3 border-b bg-card flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowHistory(true)}><ChevronLeft className="h-5 w-5" /></Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold truncate">{selectedPatient?.name}</span>
                <Badge variant="secondary" className="h-4 text-[9px]">{selectedPatient?.status}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{selectedPatient?.location} • AI Assisted • SUGGESTIONS ONLY</p>
            </div>
            <Button variant="ghost" size="icon"><MoreVertical className="h-5 w-5" /></Button>
          </header>
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-6 pb-4">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm shadow-sm", 
                    msg.role === 'user' ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-white border rounded-tl-none",
                    msg.type === 'question' && "border-primary/20 bg-primary/5"
                  )}>
                    {msg.type === 'audio' && <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px] font-bold uppercase"><Mic className="h-3 w-3" /> Voice Input</div>}
                    {msg.type === 'question' && <div className="flex items-center gap-2 mb-1 text-primary text-[10px] font-bold uppercase"><Sparkles className="h-3 w-3" /> Clarifying Question</div>}
                    {msg.type === 'file' && (
                      <div className="flex items-center gap-3 mb-2 p-2 bg-white/10 rounded-lg">
                        <FileText className="h-8 w-8 text-accent" />
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-tight">Document Scan</span>
                          <span className="text-xs font-mono">{msg.fileName}</span>
                        </div>
                      </div>
                    )}
                    {msg.content}
                  </div>
                  {msg.type === 'analysis' && msg.recommendation && (
                    <div className="w-full mt-2 space-y-3">
                      <Card className={cn("w-full shadow-md border-l-4", msg.recommendation.urgencyLevel === 'EMERGENCY' ? "border-red-600 bg-red-50" : "border-primary bg-primary/5")}>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className={msg.recommendation.urgencyLevel === 'EMERGENCY' ? "bg-red-600 text-white" : "bg-primary text-white"}>{msg.recommendation.urgencyLevel}</Badge>
                            <Sparkles className="h-4 w-4 text-primary opacity-50" />
                          </div>
                          <section>
                            <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Suggestive Action</h4>
                            <p className="text-xs font-bold text-slate-800">{msg.recommendation.action}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">To: {msg.recommendation.referralDestination}</p>
                          </section>
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
                            <Button size="sm" onClick={() => handleAction('approve')} className="h-8 text-[10px] font-bold gap-1 bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                            <Button size="sm" onClick={() => handleAction('override')} variant="outline" className="h-8 text-[10px] font-bold gap-1"><Edit3 className="h-3 w-3" /> Override</Button>
                          </div>
                        </CardContent>
                      </Card>
                      {msg.recommendation.urgencyLevel !== 'ROUTINE' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-2 text-primary px-1"><MapPin className="h-3 w-3" /><span className="text-[10px] font-bold uppercase tracking-widest">Nearest Referral Pathway</span></div>
                          <FacilityMap urgency={msg.recommendation.urgencyLevel} patientLocation={selectedPatient?.location} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isProcessing && <div className="flex items-center gap-2 text-muted-foreground animate-pulse"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-xs font-medium">Applying Clinical Suggestive Logic...</span></div>}
              {transcriptionDraft && (
                <div className="ml-auto w-[85%] space-y-2 animate-in slide-in-from-right-4">
                  <div className="bg-accent/10 border border-accent/30 p-4 rounded-2xl rounded-tr-none space-y-3">
                    <div className="flex items-center justify-between border-b border-accent/20 pb-2 mb-2">
                      <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1"><Mic className="h-3 w-3" /> Clinical Transcription</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTranscriptionDraft(null)}><X className="h-4 w-4" /></Button>
                    </div>
                    <Textarea value={transcriptionDraft} onChange={(e) => setTranscriptionDraft(e.target.value)} className="text-sm bg-white border-none shadow-none focus-visible:ring-0 min-h-[80px]" />
                    <div className="flex gap-2"><Button onClick={handleFinalizeTranscription} className="flex-1 h-9 text-xs font-bold bg-primary text-white">Send for Analysis</Button></div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-card border-t border-muted pb-6">
            <div className="flex items-end gap-2 max-w-md mx-auto">
              <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground shrink-0 hover:bg-muted" onClick={() => toast({ title: "Check Governance", description: "Minimal PII scanning enabled for clinical records." })}><Paperclip className="h-5 w-5" /></Button>
              <div className="flex-1 relative">
                <Textarea 
                  placeholder="Type clinical observations..." 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  className="min-h-[40px] max-h-[120px] pr-10 resize-none py-2 rounded-2xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary" 
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }} 
                />
                {inputText.trim() && <Button onClick={handleSendText} size="icon" className="absolute right-1 bottom-1 h-8 w-8 rounded-xl bg-primary shadow-md"><Send className="h-4 w-4" /></Button>}
              </div>
              {!inputText.trim() && <Button onClick={isRecording ? () => setIsRecording(false) : startRecording} size="icon" className={cn("h-10 w-10 rounded-full transition-all duration-300 shrink-0", isRecording ? "bg-red-500 scale-110 shadow-lg text-white" : "bg-accent text-accent-foreground")}><Mic className={cn("h-5 w-5", isRecording && "animate-pulse")} /></Button>}
            </div>
          </div>
        </>
      )}

      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline italic text-primary">Clinical Decision Override</DialogTitle>
            <DialogDescription>Documenting clinical discordance for regional quality audit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Discordance Reason</Label>
              <Select onValueChange={v => setOverrideData({...overrideData, reason: v})}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="context">AI missed clinical context</SelectItem>
                  <SelectItem value="protocol">Local protocol variation</SelectItem>
                  <SelectItem value="judgment">Expert clinical judgment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Justification Notes</Label>
              <Textarea value={overrideData.notes} onChange={e => setOverrideData({...overrideData, notes: e.target.value})} placeholder="Describe clinical reasoning..." className="rounded-xl min-h-[100px]" />
            </div>
          </div>
          <DialogFooter><Button variant="destructive" className="w-full h-14 font-bold rounded-2xl" disabled={!overrideData.reason} onClick={handleOverrideComplete}>Confirm Override</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
        <DialogContent className="bg-red-600 text-white border-none shadow-2xl">
          <DialogHeader>
            <div className="mx-auto bg-white/20 p-3 rounded-full mb-2"><ShieldAlert className="h-10 w-10 text-white animate-pulse" /></div>
            <DialogTitle className="text-2xl font-bold text-center">EMERGENCY PROTOCOL</DialogTitle>
            <DialogDescription className="text-white/90 text-center text-lg leading-relaxed"><strong>STATUS EPILEPTICUS RISK</strong>. Immediate specialist intervention and facility referral required per national protocol.</DialogDescription>
          </DialogHeader>
          <DialogFooter><Button onClick={() => setShowSafetyDialog(false)} className="w-full h-14 bg-white text-red-600 font-bold hover:bg-white/90">I ACKNOWLEDGE EMERGENCY</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Mic, 
  Send, 
  Paperclip, 
  X, 
  ChevronLeft, 
  Sparkles,
  CheckCircle2,
  Edit3,
  Loader2,
  Download,
  ShieldAlert,
  Stethoscope,
  ChevronRight,
  Brain,
  Search,
  UserCircle,
  MessageSquare
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { runClinicalLogic } from "@/lib/clinical-engine/engine";
import { Recommendation, ClinicalInput } from "@/lib/clinical-engine/types";
import { generalAiQuery } from "@/ai/flows/general-ai-query";
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
import { mockPatients, mockUserProfile } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { usePrint } from "@/hooks/usePrint";
import { format } from "date-fns";
import { Encounter } from "@/lib/types";

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'audio' | 'analysis' | 'question' | 'general';
  recommendation?: Recommendation;
};

function AssessContent() {
  const { toast } = useToast();
  const { print } = usePrint();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [role, setRole] = useState<string>('chw');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
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

  useEffect(() => {
    const savedRole = localStorage.getItem('demo_role') || 'chw';
    setRole(savedRole);
    setPatients(mockPatients);

    if (urlPatientId) {
      handleSelectPatient(urlPatientId);
    } else {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          content: "Hello! I am your AI Clinical Assistant. You can ask me general questions about epilepsy management or select a patient to perform a WHO-aligned risk assessment.",
          type: 'general'
        }
      ]);
    }
  }, [urlPatientId]);

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, transcriptionDraft]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setShowPatientPicker(false);
    
    const patientName = patients?.find(p => p.id === id)?.name || "the patient";
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'ai',
        content: `Context active for **${patientName}**. I've loaded their clinical history. You can now describe current symptoms for analysis or ask specific questions about this case.`,
        type: 'text'
      }
    ]);
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;

    // Check for @mention logic
    if (inputText.startsWith('@')) {
      const mentionName = inputText.slice(1).toLowerCase();
      const matchedPatient = patients.find(p => p.name.toLowerCase().includes(mentionName));
      if (matchedPatient) {
        handleSelectPatient(matchedPatient.id);
        setInputText("");
        return;
      }
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: inputText };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText("");
    
    await processInquiry(currentInput);
  };

  const processInquiry = async (input: string) => {
    setIsProcessing(true);

    // Logic: If there is a patient context AND keywords suggesting symptoms/episodes, run clinical logic.
    // Otherwise, run a general AI query.
    const symptomKeywords = ['seizure', 'fit', 'episode', 'convulsion', 'jerking', 'attack', 'kifafa', 'anguka'];
    const hasSymptomMarkers = symptomKeywords.some(kw => input.toLowerCase().includes(kw));

    try {
      if (selectedPatientId && hasSymptomMarkers) {
        // Trigger Clinical Engine
        await runOnDeviceAnalysis(input);
      } else {
        // Trigger General AI Flow
        const context = selectedPatient ? `Patient: ${selectedPatient.name}, Age: ${selectedPatient.age}, Status: ${selectedPatient.status}` : 'No patient selected.';
        const response = await generalAiQuery({ query: input, context });
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: response.answer,
          type: 'general'
        }]);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to process your request.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const runOnDeviceAnalysis = async (input: string) => {
    // Simulated engine processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isEmergency = input.toLowerCase().includes("repeated") || input.toLowerCase().includes("status") || input.toLowerCase().includes("prolonged");
    
    const clinicalInput: ClinicalInput = {
      patientProfile: { age: selectedPatient?.age || 30, sex: (selectedPatient?.gender || 'other').toLowerCase() },
      seizureHistory: { type: 'convulsive', semiology: ['Motor Jerking'], duration: isEmergency ? '7' : '2', frequency: '3/month', triggers: [], comorbidities: [] },
      underlyingCauses: { fever: false, headTrauma: false, perinatalInsult: false, metabolicSuspicion: false, suddenOnsetNeurological: false },
      redFlags: { repeated: isEmergency, feverNeck: false, injury: false, newOnsetUnder5: false, medicationFail: false, prolongedSeizure: isEmergency }
    };

    const result = runClinicalLogic(clinicalInput);
    setActiveRecommendation(result);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'ai',
      content: `I've analyzed the inputs based on WHO protocols. Here is my suggestive recommendation. Decision authority remains with you.`,
      type: 'analysis',
      recommendation: result
    }]);

    if (result.urgencyLevel === 'EMERGENCY') setShowSafetyDialog(true);
  };

  const handleAction = (type: 'approve' | 'override') => {
    if (type === 'approve') {
      if (activeRecommendation) saveEncounterToHistory(activeRecommendation);
      setShowFinalReport(true);
      toast({ title: "Recommendation Approved", description: "Encounter logged to patient history." });
    } else {
      setShowOverrideDialog(true);
    }
  };

  const handleOverrideComplete = () => {
    const baseRec = activeRecommendation || {
      urgencyLevel: 'URGENT',
      action: 'Refer',
      actionDescription: 'Updated by clinician oversight.',
      referralDestination: 'Regional Hospital',
      followUpPlan: 'As per specialist directive.',
      counselingPoints: [],
      safetyWarnings: [],
      riskScore: 0,
      clinicalReasoning: 'Manual review.',
      detectedRedFlags: []
    };

    saveEncounterToHistory(baseRec, true);
    setShowOverrideDialog(false);
    setShowFinalReport(true);
    toast({ title: "Override Logged", description: "Encounter registered with custom clinician notes." });
  };

  const saveEncounterToHistory = (rec: Recommendation, isOverride: boolean = false) => {
    if (!selectedPatientId) return;

    const newEncounter: Encounter = {
      id: `e-${Date.now()}`,
      patientId: selectedPatientId,
      date: new Date().toISOString(),
      summary: isOverride ? overrideData.notes : `Conversational AI Analysis: ${messages.filter(m => m.role === 'user').pop()?.content}`,
      redFlags: rec.detectedRedFlags,
      recommendation: {
        action: rec.action,
        urgencyLevel: rec.urgencyLevel,
        referralDestination: rec.referralDestination,
        antiStigmaMessages: rec.counselingPoints,
        safetyAdvice: rec.safetyWarnings
      },
      type: rec.urgencyLevel === 'EMERGENCY' ? 'Emergency' : 'Routine',
      discordanceNote: isOverride ? `${overrideData.reason}: ${overrideData.notes}` : undefined,
      authorName: mockUserProfile.name,
      authorRole: mockUserProfile.role.toUpperCase(),
    };

    const existingLogs = JSON.parse(localStorage.getItem('session_encounters') || '[]');
    localStorage.setItem('session_encounters', JSON.stringify([...existingLogs, newEncounter]));
  };

  const handleDownload = () => {
    const reportHtml = document.getElementById('assess-final-report');
    if (reportHtml) {
      print(<div className="report-print-container" dangerouslySetInnerHTML={{ __html: reportHtml.innerHTML }} />);
    }
  };

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
      <div className="max-w-2xl mx-auto space-y-6 pb-20 pt-4 animate-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-headline font-bold text-primary italic">Final Clinical Report</h2>
          <Badge className="bg-green-600">CERTIFIED</Badge>
        </div>

        <div id="assess-final-report" className="bg-white p-10 border shadow-xl min-h-[700px] text-slate-900 leading-relaxed rounded-lg" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
          <div className="text-center border-b-2 border-primary pb-6 mb-8 bg-white">
            <h1 className="text-2xl font-bold uppercase tracking-tight">Clinical Encounter Report</h1>
            <p className="text-sm font-bold text-muted-foreground mt-1 uppercase">AI Epilepsy Assistant • Confidential medical Record</p>
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
                {finalRec.detectedRedFlags.length > 0 && (
                  <div className="bg-white p-3 border border-red-200 rounded">
                    <p className="text-xs font-bold text-red-600 uppercase mb-1 underline">Emergency Triggers Detected:</p>
                    <ul className="list-disc pl-5 text-sm font-bold text-red-900">
                      {finalRec.detectedRedFlags.map((flag, i) => <li key={i}>{flag}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white">
              <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">3. Management Plan</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Follow-up Plan:</strong> {finalRec.followUpPlan}</p>
                <p><strong>Action Description:</strong> {finalRec.actionDescription}</p>
              </div>
            </section>

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

            {overrideData.reason && (
              <section className="bg-white p-4 border border-red-100 rounded-lg">
                <h2 className="text-base font-bold uppercase border-b border-red-200 pb-1 mb-4 text-red-800">5. Clinical Discordance (Override)</h2>
                <div className="space-y-2 text-sm italic text-red-900">
                  <p><strong>Reason:</strong> {overrideData.reason.toUpperCase()}</p>
                  <p><strong>Justification:</strong> {overrideData.notes}</p>
                </div>
              </section>
            )}

            <section className="pt-10 bg-white">
              <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">Record Attribution</h2>
              <div className="text-sm space-y-1 italic">
                <p><strong>Author:</strong> {mockUserProfile.name}</p>
                <p><strong>Role:</strong> {mockUserProfile.role.toUpperCase()}</p>
                <p><strong>Facility:</strong> {mockUserProfile.location}</p>
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
    <div className="flex flex-col h-[calc(100vh-130px)] bg-background relative overflow-hidden max-w-4xl mx-auto border-x shadow-sm">
      {/* Patient Picker Layer */}
      <div className={cn("absolute inset-0 z-50 bg-background transition-transform duration-300 ease-in-out", showPatientPicker ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between bg-primary text-primary-foreground">
            <h2 className="font-headline font-bold flex items-center gap-2">
              <Search className="h-5 w-5" /> Select Patient context
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setShowPatientPicker(false)}><X className="h-5 w-5" /></Button>
          </div>
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2 py-4">
              {patients.length > 0 ? (
                patients.map(patient => (
                  <button key={patient.id} onClick={() => handleSelectPatient(patient.id)} className="w-full text-left p-4 rounded-xl border hover:bg-muted transition-colors group">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-primary group-hover:text-primary/80">{patient.name}</span>
                      <Badge variant="outline" className={cn("text-[10px] uppercase", patient.status === 'Urgent' ? "border-red-200 text-red-600 bg-red-50" : "")}>{patient.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{patient.location} • {patient.gender}</p>
                  </button>
                ))
              ) : (
                <p className="text-center py-10 text-muted-foreground">No patients in registry.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Interface */}
      <header className="p-4 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowPatientPicker(true)} className="gap-2 rounded-full h-9">
            <UserCircle className="h-4 w-4 text-primary" />
            <span className="max-w-[120px] truncate">{selectedPatient?.name || "Select Patient"}</span>
          </Button>
          {selectedPatient && (
            <Button variant="ghost" size="icon" onClick={() => setSelectedPatientId(null)} className="h-8 w-8 text-muted-foreground"><X className="h-4 w-4" /></Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase bg-primary/5 text-primary border-primary/20">AI Clinical Assistant</Badge>
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-8">
        <div className="max-w-2xl mx-auto py-8 space-y-8">
          {messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col gap-2",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
              <div className="flex items-center gap-2 mb-1 px-1">
                {msg.role === 'ai' ? <Brain className="h-4 w-4 text-primary" /> : <UserCircle className="h-4 w-4 text-muted-foreground" />}
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{msg.role === 'ai' ? "AIEA Assistant" : "You"}</span>
              </div>
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted/50 border rounded-tl-none text-foreground"
              )}>
                {msg.content}
              </div>

              {msg.type === 'analysis' && msg.recommendation && (
                <div className="w-full mt-4 animate-in slide-in-from-bottom-2 duration-300">
                  <Card className={cn(
                    "border-l-4 overflow-hidden",
                    msg.recommendation.urgencyLevel === 'EMERGENCY' ? "border-red-600 bg-red-50/50" : "border-primary bg-primary/5"
                  )}>
                    <CardContent className="p-6 space-y-5">
                      <div className="flex justify-between items-center">
                        <Badge className={msg.recommendation.urgencyLevel === 'EMERGENCY' ? "bg-red-600 text-white" : "bg-primary text-white"}>
                          {msg.recommendation.urgencyLevel}
                        </Badge>
                        <Sparkles className="h-4 w-4 text-primary opacity-50" />
                      </div>
                      
                      <div className="space-y-4">
                        <section>
                          <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Suggestive Action ({msg.recommendation.action})</h4>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{msg.recommendation.actionDescription}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Destination: {msg.recommendation.referralDestination}</p>
                        </section>

                        <section className="bg-white/50 p-3 rounded-lg border border-dashed">
                          <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Follow-up Plan</h4>
                          <p className="text-xs italic text-slate-700">"{msg.recommendation.followUpPlan}"</p>
                        </section>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
                        <Button onClick={() => handleAction('approve')} className="h-10 text-xs font-bold gap-2 bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => handleAction('override')} variant="outline" className="h-10 text-xs font-bold gap-2">
                          <Edit3 className="h-4 w-4" /> Override
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          ))}
          {isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground px-1 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">AIEA is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 md:p-8 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto relative group">
          <div className="absolute -inset-0.5 bg-primary/20 rounded-2xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
          <div className="relative flex items-end gap-2 bg-card border rounded-2xl p-2 shadow-lg">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground rounded-xl" onClick={() => toast({ title: "Clinical Attachment", description: "Minimal PII scanning is active." })}><Paperclip className="h-5 w-5" /></Button>
            <div className="flex-1">
              <Textarea 
                placeholder={selectedPatient ? `Describe symptoms for ${selectedPatient.name}...` : "Ask a general epilepsy question or type @patient..."}
                value={inputText} 
                onChange={(e) => setInputText(e.target.value)} 
                className="min-h-[44px] max-h-[150px] resize-none border-none focus-visible:ring-0 py-3 bg-transparent text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }} 
              />
            </div>
            <div className="flex items-center gap-1 pb-1 pr-1">
              {!inputText.trim() ? (
                <Button onClick={isRecording ? () => setIsRecording(false) : () => setIsRecording(true)} size="icon" className={cn("h-9 w-9 rounded-xl transition-all", isRecording ? "bg-red-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
                  <Mic className={cn("h-4 w-4", isRecording && "animate-pulse")} />
                </Button>
              ) : (
                <Button onClick={handleSendText} size="icon" className="h-9 w-9 rounded-xl bg-primary text-white shadow-md">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-[9px] text-center text-muted-foreground mt-2 uppercase tracking-widest font-bold">
            AIEA can make clinical errors. Final authority remains with the healthcare worker.
          </p>
        </div>
      </div>

      {/* Dialogs */}
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
          <DialogFooter><Button variant="destructive" className="w-full h-14 font-bold rounded-2xl shadow-lg" disabled={!overrideData.reason || !overrideData.notes} onClick={handleOverrideComplete}>Confirm Specialist Update</Button></DialogFooter>
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

export default function AssessPage() { 
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <AssessContent />
    </Suspense>
  ); 
}

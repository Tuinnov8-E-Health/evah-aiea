'use client';

import { useState, useRef, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mic,
  Send,
  Paperclip,
  X,
  Sparkles,
  CheckCircle2,
  Edit3,
  Loader2,
  Download,
  ShieldAlert,
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
import { mockPatients } from "@/lib/mock-data";
import { getStoredUser, UserSession } from '@/lib/client-api';
import { useToast } from "@/hooks/use-toast";
import { usePrint } from "@/hooks/usePrint";
import { format } from "date-fns";
import { Encounter } from "@/lib/types"; import { appendStoredEncounter } from '@/lib/encounter-storage';
type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type?: 'text' | 'file' | 'audio' | 'analysis' | 'question' | 'general';
  recommendation?: Recommendation;
  attachmentName?: string;
};

function AssessContent() {
  const { toast } = useToast();
  const { print } = usePrint();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [role, setRole] = useState<string>('chw');
  const [user, setUser] = useState<UserSession | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const recordingTimeoutRef = useRef<number | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [overrideData, setOverrideData] = useState({ reason: '', customReason: '', notes: '' });

  const getOverrideReasonLabel = () => {
    if (!overrideData.reason) return '';
    return overrideData.reason === 'other' ? overrideData.customReason.trim() : overrideData.reason;
  };
  const [activeRecommendation, setActiveRecommendation] = useState<Recommendation | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const lastAiMessageIndex = messages.map((msg) => msg.role).lastIndexOf('ai');
  const canGenerateReport = Boolean(
    selectedPatientId &&
    lastAiMessageIndex >= 0 &&
    messages[messages.length - 1]?.role === 'ai' &&
    messages[messages.length - 1]?.type !== 'question' &&
    messages.some((msg) => msg.role === 'user')
  );

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setRole(storedUser.role);
    } else {
      const savedRole = localStorage.getItem('demo_role') || 'chw';
      setRole(savedRole);
    }
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
  }, [messages]);

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setShowPatientPicker(false);

    const patientName = patients?.find(p => p.id === id)?.name || "the patient";
    setMessages(prev => [
      ...prev,
      {
        id: generateId(),
        role: 'ai',
        content: `Context active for **${patientName}**. I've loaded their clinical history. You can now describe current symptoms for analysis or ask specific questions about this case.`,
        type: 'text'
      }
    ]);
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result?.toString() || '';
        addMessage({
          id: generateId(),
          role: 'user',
          content: text,
          type: 'file',
          attachmentName: file.name
        });
        processInquiry(text, 'file');
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Unable to read the selected file.' });
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('handleFileUpload error', error);
      toast({ variant: 'destructive', title: 'Upload Failed', description: 'Unable to process the selected file.' });
    }
  };

  const finishVoiceRecording = () => {
    if (recordingTimeoutRef.current) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    setIsRecording(false);
    const transcript = 'Voice note transcribed: patient reports several episodes of jerking and confusion, with no new medication changes.';
    addMessage({
      id: generateId(),
      role: 'user',
      content: transcript,
      type: 'audio'
    });
    processInquiry(transcript, 'audio');
  };

  const handleVoiceButton = () => {
    if (isRecording) {
      finishVoiceRecording();
      return;
    }

    setIsRecording(true);
    recordingTimeoutRef.current = window.setTimeout(() => {
      finishVoiceRecording();
    }, 4000);
  };

  const summarizeReport = (records: Message[]) => {
    const relevant = records.filter(msg => msg.role === 'user');
    const summaryLines = relevant.map((msg, index) => `Input ${index + 1}: ${msg.content}`);
    return summaryLines.join('\n');
  };

  const handleGenerateReportFromInputs = async () => {
    if (!selectedPatientId) {
      toast({ variant: 'destructive', title: 'No Patient Selected', description: 'Please select a patient context before generating a report.' });
      return;
    }

    const collectedText = summarizeReport(messages);
    if (!collectedText) {
      toast({ variant: 'destructive', title: 'No Inputs Provided', description: 'Enter text, upload a file, or simulate voice input first.' });
      return;
    }

    const patient = patients.find(p => p.id === selectedPatientId);
    const answer = `AI Generated Report from combined inputs for ${patient?.name}:\n${collectedText}`;
    addMessage({
      id: generateId(),
      role: 'ai',
      content: answer,
      type: 'analysis'
    });

    const clinicalInput: ClinicalInput = {
      patientProfile: { age: patient?.age || 30, sex: (patient?.gender || 'other').toLowerCase() },
      seizureHistory: {
        type: 'convulsive',
        semiology: ['Motor jerking', 'loss of awareness'],
        duration: '5',
        frequency: '2/week',
        triggers: ['stress'],
        comorbidities: [],
        isRepeated: true
      },
      underlyingCauses: {
        fever: false,
        headTrauma: false,
        perinatalInsult: false,
        metabolicSuspicion: false,
        suddenOnsetNeurological: false
      },
      redFlags: {
        repeated: true,
        feverNeck: false,
        injury: false,
        newOnsetUnder5: false,
        medicationFail: false,
        prolongedSeizure: true
      }
    };

    const result = runClinicalLogic(clinicalInput);
    setActiveRecommendation(result);
    setShowFinalReport(true);
    setReportSubmitted(false);
    addMessage({
      id: generateId(),
      role: 'ai',
      content: 'I have converted the combined inputs into a WHO-aligned clinical recommendation and prepared the final report.',
      type: 'analysis',
      recommendation: result
    });
  };

  const handleSendText = async () => {
    if (!inputText.trim()) return;

    if (inputText.startsWith('@')) {
      const mentionName = inputText.slice(1).toLowerCase();
      const matchedPatient = patients.find(p => p.name.toLowerCase().includes(mentionName));
      if (matchedPatient) {
        handleSelectPatient(matchedPatient.id);
        setInputText("");
        return;
      }
    }

    const userMsg: Message = { id: generateId(), role: 'user', content: inputText, type: 'text' };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputText;
    setInputText("");

    await processInquiry(currentInput);
  };

  const processInquiry = async (input: string) => {
    setIsProcessing(true);

    const symptomKeywords = ['seizure', 'fit', 'episode', 'convulsion', 'jerking', 'attack', 'kifafa', 'anguka'];
    const hasSymptomMarkers = symptomKeywords.some(kw => input.toLowerCase().includes(kw));

    try {
      if (selectedPatientId && hasSymptomMarkers) {
        const hasDuration = input.match(/\d+\s*(min|minute|hour|sec|second)/i);
        if (!hasDuration) {
          setMessages(prev => [...prev, {
            id: generateId(),
            role: 'ai',
            content: "I've noted the episodes. For a more accurate risk score, could you specify approximately how long the episode lasted?",
            type: 'question'
          }]);
          return;
        }
        await runOnDeviceAnalysis(input);
      } else {
        const answer = selectedPatient
          ? `I received your input for ${selectedPatient.name}. Here is a clinical note based on the text provided:\n${input}`
          : `I received your request. Based on the information given, here is a general clinical summary:\n${input}`;

        setMessages(prev => [...prev, {
          id: generateId(),
          role: 'ai',
          content: answer,
          type: 'general'
        }]);
      }
    } catch (error) {
      console.error('processInquiry error', error);
      toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to process your request. Please try again.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const runOnDeviceAnalysis = async (input: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const isEmergency = input.toLowerCase().includes("repeated") || input.toLowerCase().includes("status") || input.toLowerCase().includes("prolonged") || input.toLowerCase().includes("7");

    const clinicalInput: ClinicalInput = {
      patientProfile: { age: selectedPatient?.age || 30, sex: (selectedPatient?.gender || 'other').toLowerCase() },
      seizureHistory: { type: 'convulsive', semiology: ['Motor Jerking'], duration: isEmergency ? '7' : '2', frequency: '3/month', triggers: [], comorbidities: [] },
      underlyingCauses: { fever: false, headTrauma: false, perinatalInsult: false, metabolicSuspicion: false, suddenOnsetNeurological: false },
      redFlags: { repeated: isEmergency, feverNeck: false, injury: false, newOnsetUnder5: false, medicationFail: false, prolongedSeizure: isEmergency }
    };

    const result = runClinicalLogic(clinicalInput);
    setActiveRecommendation(result);

    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'ai',
      content: `I've analyzed the inputs based on WHO protocols. Here is my suggestive recommendation. Decision authority remains with you.`,
      type: 'analysis',
      recommendation: result
    }]);

    if (result.urgencyLevel === 'EMERGENCY') setShowSafetyDialog(true);
  };

  const handleAction = (type: 'approve' | 'override') => {
    if (type === 'approve') {
      setShowFinalReport(true);
      setReportSubmitted(false);
      setShowOverrideDialog(false);
      toast({ title: "Recommendation Ready", description: "Review and submit the final report before downloading." });
    } else {
      setShowOverrideDialog(true);
      setShowFinalReport(true);
    }
  };

  const handleOverrideComplete = () => {
    const resolvedReason = getOverrideReasonLabel();

    if (!resolvedReason || !overrideData.notes.trim()) {
      toast({ variant: 'destructive', title: 'Override Required', description: 'Please provide an override reason and clinical notes.' });
      return;
    }

    if (!activeRecommendation) {
      toast({ variant: 'destructive', title: 'No Recommendation', description: 'There is no AI recommendation available to override.' });
      return;
    }

    setOverrideData(prev => ({ ...prev, reason: resolvedReason }));
    setShowOverrideDialog(false);
    setShowFinalReport(true);
    setReportSubmitted(false);
    toast({ title: "Override Applied", description: "The report now includes your clinical override details." });
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
      authorName: user?.name || 'Unknown',
      authorRole: user?.role?.toUpperCase() || 'UNKNOWN',
    };

    appendStoredEncounter(newEncounter);
  };

  const handleSubmitReport = () => {
    if (!activeRecommendation) {
      toast({ variant: 'destructive', title: 'Submit Failed', description: 'No recommendation is available to submit.' });
      return;
    }

    const isOverride = Boolean(overrideData.reason);
    saveEncounterToHistory(activeRecommendation, isOverride);
    setReportSubmitted(true);
    toast({ title: 'Report Submitted', description: 'The final report is ready for PDF download.' });
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
          <Badge className="bg-green-600 text-white">CERTIFIED</Badge>
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
                  <p className="text-xs text-muted-foreground">CHW override note captured for documentation.</p>
                  <div className="text-sm space-y-1 italic">
                    <p><strong>Author:</strong> {user?.name || 'Unknown'}</p>
                    <p><strong>Role:</strong> {user?.role?.toUpperCase() || 'UNKNOWN'}</p>
                    <p><strong>Facility:</strong> {user?.location || 'Not specified'}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {!reportSubmitted ? (
            <>
              <p className="text-sm text-muted-foreground">The AI report is ready. You can review it, override if needed, then submit to unlock the PDF download option.</p>
              <div className="grid grid-cols-3 gap-3 pt-4">
                <Button className="h-12 font-bold bg-primary text-white" onClick={handleSubmitReport}>Submit Report</Button>
                <Button variant="outline" className="h-12 font-bold text-muted-foreground" onClick={() => handleAction('override')}>Override Report</Button>
                <Button variant="ghost" className="h-12 font-bold text-muted-foreground" onClick={() => router.push('/dashboard')}><X className="mr-2 h-4 w-4" /> Return</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">The report has been submitted. You can now download the PDF or return to the dashboard.</p>
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button className="h-12 font-bold bg-primary text-white" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download PDF</Button>
                <Button variant="ghost" className="col-span-2 h-12 text-muted-foreground font-bold" onClick={() => router.push('/dashboard')}><X className="mr-2 h-4 w-4" /> Return to Dashboard</Button>
              </div>
            </>
          )}
        </div>

        <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
          <DialogContent className="max-w-sm rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline italic text-primary">Clinical Decision Override</DialogTitle>
              <DialogDescription>Documenting clinical discordance for regional quality audit.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Override Reason</Label>
                <Select onValueChange={v => setOverrideData({ ...overrideData, reason: v })}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI missed clinical context">AI missed clinical context</SelectItem>
                    <SelectItem value="Local protocol variation">Local protocol variation</SelectItem>
                    <SelectItem value="Expert clinical judgment">Expert clinical judgment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {overrideData.reason === 'other' && (
                  <input
                    type="text"
                    value={overrideData.customReason}
                    onChange={e => setOverrideData({ ...overrideData, customReason: e.target.value })}
                    className="w-full rounded-xl border border-muted px-3 py-2 text-sm"
                    placeholder="Enter your override reason"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest">Clinician Notes</Label>
                <Textarea value={overrideData.notes} onChange={e => setOverrideData({ ...overrideData, notes: e.target.value })} placeholder="Describe clinical reasoning and CHW notes..." className="rounded-xl min-h-[100px]" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="destructive" className="w-full h-14 font-bold rounded-2xl shadow-lg" disabled={!overrideData.reason || !overrideData.notes || (overrideData.reason === 'other' && !overrideData.customReason.trim())} onClick={handleOverrideComplete}>
                Apply Override
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
      <header className="p-4 border-b bg-card">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowPatientPicker(true)} className="gap-2 rounded-full h-9">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="max-w-[120px] truncate">{selectedPatient?.name || "Select Patient"}</span>
            </Button>
            {selectedPatient && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedPatientId(null)} className="h-8 w-8 text-muted-foreground"><X className="h-4 w-4" /></Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">AI can make mistakes. Final authority remains with the healthcare worker.</p>
        </div>
      </header>

      <ScrollArea ref={scrollRef} className="flex-1 px-4 md:px-8 pb-32">
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
                    "border-l-4 overflow-hidden bg-white",
                    msg.recommendation.urgencyLevel === 'EMERGENCY' ? "border-red-600" : "border-primary"
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

                        <section className="bg-white p-3 rounded-lg border border-dashed">
                          <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Follow-up Plan</h4>
                          <p className="text-xs italic text-slate-700">"{msg.recommendation.followUpPlan}"</p>
                        </section>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10">
                        <Button onClick={() => handleAction('approve')} className="h-10 text-xs font-bold gap-2 bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle2 className="h-4 w-4" /> Submit
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
          {canGenerateReport && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" size="sm" className="min-w-[180px]" onClick={handleGenerateReportFromInputs}>Generate Report</Button>
            </div>
          )}
          {isProcessing && (
            <div className="flex items-center gap-3 text-muted-foreground px-1 animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs font-medium">AIEA is thinking...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-8 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center gap-2 bg-card border border-muted rounded-full px-3 py-2 shadow-lg">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = '';
            }} />
            <Textarea
              placeholder={selectedPatient ? `Describe symptoms for ${selectedPatient.name}...` : "Ask a general epilepsy question or type @patient..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[48px] h-full w-full resize-none rounded-full border-none focus-visible:ring-0 py-3 pl-3 pr-28 bg-transparent text-sm"
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendText(); } }}
            />
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full absolute right-4 text-primary" onClick={handleVoiceButton}>
              <Mic className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full absolute right-14 text-primary" onClick={handleSendText}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {isRecording && (
            <div className="mt-2 text-xs text-red-600 font-semibold text-center">Recording... tap again to stop and transcribe.</div>
          )}
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
              <Label className="text-xs font-bold uppercase tracking-widest">Override Reason</Label>
              <Select onValueChange={v => setOverrideData({ ...overrideData, reason: v })}>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select reason" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AI missed clinical context">AI missed clinical context</SelectItem>
                  <SelectItem value="Local protocol variation">Local protocol variation</SelectItem>
                  <SelectItem value="Expert clinical judgment">Expert clinical judgment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {overrideData.reason === 'other' && (
                <input
                  type="text"
                  value={overrideData.customReason}
                  onChange={e => setOverrideData({ ...overrideData, customReason: e.target.value })}
                  className="w-full rounded-xl border border-muted px-3 py-2 text-sm"
                  placeholder="Enter your override reason"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest">Clinician Notes</Label>
              <Textarea value={overrideData.notes} onChange={e => setOverrideData({ ...overrideData, notes: e.target.value })} placeholder="Describe clinical reasoning and CHW notes..." className="rounded-xl min-h-[100px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="destructive" className="w-full h-14 font-bold rounded-2xl shadow-lg" disabled={!overrideData.reason || !overrideData.notes || (overrideData.reason === 'other' && !overrideData.customReason.trim())} onClick={handleOverrideComplete}>
              Apply Override
            </Button>
          </DialogFooter>
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

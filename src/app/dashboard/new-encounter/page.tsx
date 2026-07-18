'use client';

import { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronRight,
  ChevronLeft,
  UserCircle,
  Loader2,
  Edit3,
  MapPin,
  Heart,
  Brain,
  FileText,
  Pill,
  Activity,
  Shield,
  Info,
  CheckCircle2,
  Download,
  X,
  AlertTriangle,
  ShieldAlert,
  WifiOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { runClinicalLogic } from '@/lib/clinical-engine/engine';
import { Recommendation, ClinicalInput } from '@/lib/clinical-engine/types';
import { getStoredUser, UserSession } from '@/lib/client-api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { FacilityMap } from '@/components/dashboard/facility-map';
import { usePrint } from '@/hooks/usePrint';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Encounter } from '@/lib/types';
import { appendStoredEncounter } from '@/lib/encounter-storage';

type Step = 'consent' | 'patient' | 'infectious' | 'classify' | 'seizure_details' | 'symptoms' | 'adherence' | 'review' | 'assessment' | 'report' | 'final';

function NewEncounterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');
  const { toast } = useToast();
  const { print } = usePrint();

  const [step, setStep] = useState<Step>('consent');
  const [drafts, setDrafts] = useState<Array<any>>([]);
  const [showDraftsDialog, setShowDraftsDialog] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  const [showSafetyDialog, setShowSafetyDialog] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [user, setUser] = useState<UserSession | null>(null);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [overrideData, setOverrideData] = useState({ reason: '', notes: '' });
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [patientSearchResults, setPatientSearchResults] = useState<Array<{ id: string; full_name: string; community_register_id: string; sex?: string }>>([]);
  const [selectedExistingPatient, setSelectedExistingPatient] = useState<{ id: string; full_name: string; community_register_id: string; sex?: string } | null>(null);

  // Comprehensive Form Data
  const [formData, setFormData] = useState({
    // Consent
    consentGivenBy: '',
    consentGuardianName: '',
    consentGuardianRelationship: '',
    consentConfirmed: false,

    // Patient Info
    patientMode: '',
    existingPatientId: null,
    firstName: '',
    surname: '',
    dateOfBirth: '',
    placeOfBirth: '',
    idPassportNumber: '',
    gender: '',
    county: '',
    country: '',
    pregnantOrBreastfeeding: false,

    // Infectious Disease History
    historyCerebralMalaria: false,
    historyMeningitisEncephalitis: false,
    suspectedNeurocysticercosis: false,
    onchocerciasisEndemicResidence: false,
    hivPositiveStatus: '',

    // Seizure History
    seizureDuration: '',
    clusterSeizures: false,
    feverPresent: false,
    injuryDuringSeizure: false,
    suspectedNonEpileptic: false,
    eventWitnessed: '',

    // Symptoms & Mood
    newOrChangedSymptom: false,
    phq2Q1: null as number | null,
    phq2Q2: null as number | null,
    notes: '',

    // Medication Adherence
    missedDoses: 0,
    currentMedications: '',
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) setUser(storedUser);
    loadDrafts();
  }, []);

  const loadDrafts = () => {
    try {
      const ds = JSON.parse(localStorage.getItem('encounter_drafts') || '[]');
      setDrafts(Array.isArray(ds) ? ds : []);
    } catch (e) {
      setDrafts([]);
    }
  };

  const persistDrafts = (next: any[]) => {
    localStorage.setItem('encounter_drafts', JSON.stringify(next));
    setDrafts(next);
  };

  const saveDraft = (manual: boolean = false) => {
    const draftPayload = {
      id: currentDraftId || `d-${Date.now()}`,
      timestamp: new Date().toISOString(),
      step,
      title: `${formData.firstName || 'Unnamed'} ${formData.surname || ''}`.trim() || 'Untitled draft',
      formData
    } as any;

    let next = drafts.slice();
    const idx = next.findIndex(d => d.id === draftPayload.id);
    if (idx >= 0) next[idx] = draftPayload; else next.unshift(draftPayload);
    persistDrafts(next);
    setCurrentDraftId(draftPayload.id);
    if (manual) {
      toast({ title: 'Saved draft', description: 'Your encounter has been saved to Drafts.' });
      router.push('/dashboard');
    }
  };

  // Autosave (debounced) whenever formData changes and encounter not completed
  useEffect(() => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      // consider an encounter incomplete if we're not at final step
      if (step !== 'final' && step !== 'report' && step !== 'assessment') {
        saveDraft(false);
      }
    }, 4000);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  const resumeDraft = (d: any) => {
    setFormData(d.formData);
    setStep(d.step || 'consent');
    setCurrentDraftId(d.id);
    setShowDraftsDialog(false);
  };

  const deleteDraft = (id: string) => {
    const next = drafts.filter(d => d.id !== id);
    persistDrafts(next);
    if (currentDraftId === id) setCurrentDraftId(null);
  };

  const calculatedAge = useMemo(() => {
    if (!formData.dateOfBirth) return 30;
    const birthDate = new Date(formData.dateOfBirth);
    if (isNaN(birthDate.getTime())) return 30;
    return new Date().getFullYear() - birthDate.getFullYear();
  }, [formData.dateOfBirth]);

  const stepProgress = {
    consent: 12,
    patient: 25,
    infectious: 38,
    classify: 50,
    seizure_details: 62,
    symptoms: 74,
    adherence: 82,
    review: 90,
    assessment: 94,
    report: 98,
    final: 100
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const saveEncounterToHistory = (rec: Recommendation, isOverride: boolean = false) => {
    const newEncounter: Encounter = {
      id: `e-${Date.now()}`,
      patientId: formData.existingPatientId || 'new-patient',
      date: new Date().toISOString(),
      summary: `Comprehensive encounter: ${formData.firstName} ${formData.surname}. Seizure duration: ${formData.seizureDuration}, Fever: ${formData.feverPresent ? 'Yes' : 'No'}, Medication adherence: ${formData.missedDoses} missed doses.`,
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
      isClinicianUpdated: user?.role === 'clinician'
    };

    appendStoredEncounter(newEncounter);
  };

  const runAssessment = () => {
    setStep('assessment');
    const input: ClinicalInput = {
      patientProfile: {
        age: calculatedAge,
        sex: formData.gender,
        isPregnant: formData.pregnantOrBreastfeeding,
        weightKg: 0
      },
      seizureHistory: {
        type: '',
        semiology: [],
        duration: formData.seizureDuration === '<5min' ? 2 : 5,
        frequency: 0,
        isRepeated: formData.clusterSeizures,
        triggers: [],
        comorbidities: [],
      },
      underlyingCauses: {
        fever: formData.feverPresent,
        headTrauma: false,
        perinatalInsult: false,
        metabolicSuspicion: false,
        suddenOnsetNeurological: formData.newOrChangedSymptom,
        neckStiffness: false,
        otherCause: formData.notes,
      },
      redFlags: {
        repeated: formData.clusterSeizures,
        feverNeck: formData.feverPresent,
        injury: formData.injuryDuringSeizure,
        newOnsetUnder5: calculatedAge < 5,
        medicationFail: formData.missedDoses > 1,
        isPregnant: formData.pregnantOrBreastfeeding,
        prolongedSeizure: formData.seizureDuration === '>5min'
      }
    };

    setTimeout(() => {
      const result = runClinicalLogic(input);
      setRecommendation(result);
      if (result.urgencyLevel === 'EMERGENCY') setShowSafetyDialog(true);
      setStep('report');
    }, 1500);
  };

  const handlePrepareFinalReport = () => {
    setStep('final');
    setReportSubmitted(false);
  };

  const handleSubmitReport = () => {
    if (!recommendation) {
      toast({ variant: 'destructive', title: 'No Recommendation' });
      return;
    }
    const isOverride = Boolean(overrideData.reason);
    saveEncounterToHistory(recommendation, isOverride);
    setReportSubmitted(true);
  };

  const canProceedToNext = (currentStep: Step): boolean => {
    switch (currentStep) {
      case 'consent':
        return formData.consentConfirmed && formData.consentGivenBy &&
          (formData.consentGivenBy !== 'guardian' || formData.consentGuardianName.trim());
      case 'patient':
        return formData.patientMode && (
          formData.patientMode === 'returning' ? !!formData.existingPatientId :
            formData.firstName.trim() || formData.surname.trim()
        );
      default:
        return true;
    }
  };

  const searchPatients = (query: string) => {
    setPatientSearchQuery(query);
    setSearchingPatients(true);
    setPatientSearchResults([]);
    setSelectedExistingPatient(null);

    setTimeout(() => {
      setSearchingPatients(false);
      setPatientSearchResults([]);
    }, 400);
  };

  return (
    <>
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        {step !== 'final' && (
          <div className="flex flex-col gap-2 sticky top-0 bg-background pt-2 z-10">
            <div className="flex justify-between items-center px-1">
              <h1 className="text-xl font-headline font-bold text-primary italic">Comprehensive Encounter</h1>
            </div>
            <Progress value={stepProgress[step]} className="h-1.5" />
          </div>
        )}

        {/* REVIEW STEP: show all answers and allow edit or submit (runs clinical engine) */}
        {step === 'review' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Review responses</h3>

              <div className="space-y-3">
                <section>
                  <h4 className="text-sm font-bold text-primary">Consent</h4>
                  <p className="text-xs text-primary/70">Who gave consent: {formData.consentGivenBy || '—'}</p>
                  {formData.consentGivenBy === 'guardian' && (
                    <p className="text-xs text-primary/70">Guardian: {formData.consentGuardianName} ({formData.consentGuardianRelationship})</p>
                  )}
                  <p className="text-xs text-primary/70">Confirmed: {formData.consentConfirmed ? 'Yes' : 'No'}</p>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-primary">Patient</h4>
                  <p className="text-xs text-primary/70">Mode: {formData.patientMode || '—'}</p>
                  <p className="text-xs text-primary/70">Name: {formData.firstName} {formData.surname}</p>
                  <p className="text-xs text-primary/70">DOB: {formData.dateOfBirth || '—'}</p>
                  <p className="text-xs text-primary/70">Gender: {formData.gender || '—'}</p>
                  <p className="text-xs text-primary/70">Location: {formData.county || ''} {formData.country ? `, ${formData.country}` : ''}</p>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-primary">Infectious history</h4>
                  <p className="text-xs text-primary/70">Cerebral malaria: {formData.historyCerebralMalaria ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Meningitis/encephalitis: {formData.historyMeningitisEncephalitis ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Suspected neurocysticercosis: {formData.suspectedNeurocysticercosis ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Onchocerciasis residence: {formData.onchocerciasisEndemicResidence ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">HIV status: {formData.hivPositiveStatus || 'Unknown'}</p>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-primary">Seizure details</h4>
                  <p className="text-xs text-primary/70">Duration: {formData.seizureDuration || '—'}</p>
                  <p className="text-xs text-primary/70">Cluster seizures: {formData.clusterSeizures ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Fever: {formData.feverPresent ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Injury during seizure: {formData.injuryDuringSeizure ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Event seems unusual: {formData.suspectedNonEpileptic ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">Event witnessed: {formData.eventWitnessed || '—'}</p>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-primary">Symptoms & Mood</h4>
                  <p className="text-xs text-primary/70">New/worse focal symptoms: {formData.newOrChangedSymptom ? 'Yes' : 'No'}</p>
                  <p className="text-xs text-primary/70">PHQ-2 Q1: {formData.phq2Q1 !== null ? (['Not at all', 'Several days', 'More than half the days', 'Nearly every day'][formData.phq2Q1 as number]) : '—'}</p>
                  <p className="text-xs text-primary/70">PHQ-2 Q2: {formData.phq2Q2 !== null ? (['Not at all', 'Several days', 'More than half the days', 'Nearly every day'][formData.phq2Q2 as number]) : '—'}</p>
                  <p className="text-xs text-primary/70">Notes: {formData.notes || '—'}</p>
                </section>

                <section>
                  <h4 className="text-sm font-bold text-primary">Medication adherence</h4>
                  <p className="text-xs text-primary/70">Doses missed (last 2 weeks): {formData.missedDoses}</p>
                  <p className="text-xs text-primary/70">Current medications: {formData.currentMedications || '—'}</p>
                </section>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('patient')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Edit
                </button>
                <button
                  onClick={runAssessment}
                  className="flex items-center gap-1 bg-green-600 disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Submit and Analyze <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* CONSENT STEP */}
        {step === 'consent' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Consent</h3>
              <p className="text-xs text-primary/60 leading-relaxed -mt-2">
                Before recording anything, explain to the patient (or their guardian, if they are a minor) — in their own language — why this information is being collected, what will be recorded, and that taking part is voluntary.
              </p>

              <div className="rounded-lg bg-primary/[0.03] p-3.5 space-y-2">
                <p className="text-xs text-primary/75 font-medium">Cover these points before continuing — in the patient's own language:</p>
                <ul className="text-xs text-primary/65 space-y-1.5 list-disc pl-4">
                  <li><strong>Name the condition clearly</strong> — say "epilepsy" and explain what it means in plain terms. Avoid vague language like "a brain problem." Patients cope better when they understand their diagnosis by name.</li>
                  <li><strong>Explain what is being recorded</strong> — name the specific categories: seizure history, infectious disease history (including past malaria, meningitis, or neurocysticercosis exposure), and <strong>HIV status</strong>. Do not just say "health information."</li>
                  <li><strong>Who will see it</strong> — the clinician at this facility, and researchers reviewing de-identified results for the EVAH programme evaluation. No one else.</li>
                  <li><strong>Medication matters</strong> — explain that taking antiseizure medication as prescribed, every day, is the single most important thing a person with epilepsy can do to reduce seizures. Missing doses is the most common reason seizures return.</li>
                  <li><strong>Participation is voluntary</strong> — taking part does not affect access to normal care. They can ask questions or withdraw at any time.</li>
                  <li><strong>Invite questions</strong> — ask the patient or guardian: "Is there anything you would like to ask me before we continue?" Good communication is two-way, not just a disclosure.</li>
                </ul>
              </div>

              <div>
                <Label className="block text-xs font-medium text-primary/60 mb-1.5">Who is giving consent?</Label>
                <div className="flex gap-2">
                  {[
                    { val: 'patient', label: 'Patient themself' },
                    { val: 'guardian', label: 'Parent / guardian (minor)' }
                  ].map(who => (
                    <button
                      key={who.val}
                      onClick={() => handleInputChange('consentGivenBy', who.val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border capitalize transition-colors ${formData.consentGivenBy === who.val
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/15 text-primary/70'
                        }`}
                    >
                      {who.label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.consentGivenBy === 'guardian' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="block text-xs font-medium text-primary/60 mb-1.5">Guardian's name</Label>
                    <Input
                      value={formData.consentGuardianName}
                      onChange={e => handleInputChange('consentGuardianName', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-medium text-primary/60 mb-1.5">Relationship to patient</Label>
                    <Input
                      value={formData.consentGuardianRelationship}
                      onChange={e => handleInputChange('consentGuardianRelationship', e.target.value)}
                      placeholder="e.g. mother, father"
                      className="rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-primary/10 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={formData.consentConfirmed}
                    onCheckedChange={c => handleInputChange('consentConfirmed', !!c)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-primary/80">I have explained the points above, in the patient's own language, and they have given verbal consent to proceed.</span>
                </label>
              </div>

              <p className="text-[11px] text-primary/40">This confirmation, the date, and your name are recorded with the patient's file. Consent is never recorded as withdrawn just by leaving this unchecked on a later visit — once given, it stands unless the patient explicitly withdraws it.</p>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button disabled className="flex items-center gap-1 text-sm font-medium text-primary/60 disabled:opacity-0 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('patient')}
                  disabled={!canProceedToNext('consent')}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* PATIENT STEP */}
        {step === 'patient' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Who are we seeing?</h3>

              <div>
                <Label className="block text-xs font-medium text-primary/60 mb-1.5">Is this a new or returning patient?</Label>
                <div className="flex gap-2">
                  {[
                    ['new', 'New patient'],
                    ['returning', 'Returning patient']
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { handleInputChange('patientMode', val); handleInputChange('existingPatientId', null); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${formData.patientMode === val
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/15 text-primary/70'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {formData.patientMode === 'new' ? (
                <div className="space-y-4">
                  <p className="text-[11px] text-primary/40">A unique patient ID will be assigned automatically once you finish this encounter — no need to invent one.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="block text-xs font-medium text-primary/60 mb-1.5">First name</Label>
                      <Input
                        value={formData.firstName}
                        onChange={e => handleInputChange('firstName', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-primary/60 mb-1.5">Surname</Label>
                      <Input
                        value={formData.surname}
                        onChange={e => handleInputChange('surname', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="block text-xs font-medium text-primary/60 mb-1.5">Date of birth</Label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-primary/60 mb-1.5">Place of birth</Label>
                      <Input
                        value={formData.placeOfBirth}
                        onChange={e => handleInputChange('placeOfBirth', e.target.value)}
                        placeholder="e.g. Kiambu"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="block text-xs font-medium text-primary/60 mb-1.5">National ID / Passport (Optional)</Label>
                    <Input
                      value={formData.idPassportNumber}
                      onChange={e => handleInputChange('idPassportNumber', e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-medium text-primary/60 mb-1.5">Gender</Label>
                    <div className="flex gap-2">
                      {['female', 'male', 'other'].map(g => (
                        <button
                          key={g}
                          onClick={() => handleInputChange('gender', g)}
                          className={`flex-1 py-2.5 rounded-lg text-sm font-medium border capitalize transition-colors ${formData.gender === g
                            ? 'bg-primary text-white border-primary'
                            : 'border-primary/15 text-primary/70'
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  {formData.gender === 'female' && (
                    <div className="rounded-lg border border-primary/10 p-3">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={formData.pregnantOrBreastfeeding}
                          onCheckedChange={c => handleInputChange('pregnantOrBreastfeeding', !!c)}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-primary/80">Is the patient currently pregnant or breastfeeding?</span>
                      </label>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="block text-xs font-medium text-primary/60 mb-1.5">County</Label>
                      <Input
                        value={formData.county}
                        onChange={e => handleInputChange('county', e.target.value)}
                        placeholder="e.g. Kiambu"
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-medium text-primary/60 mb-1.5">Country</Label>
                      <Input
                        value={formData.country}
                        onChange={e => handleInputChange('country', e.target.value)}
                        placeholder="Country"
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <Label className="block text-xs font-medium text-primary/60 mb-1.5">Search by name or patient ID</Label>
                    <Input
                      value={patientSearchQuery}
                      onChange={e => searchPatients(e.target.value)}
                      placeholder="e.g. KBU-0000000003 or patient name"
                      className="rounded-lg"
                    />
                  </div>
                  {searchingPatients && (
                    <div className="flex items-center gap-2 text-xs text-primary/60">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                    </div>
                  )}
                  {!selectedExistingPatient && patientSearchResults.length > 0 && (
                    <div className="space-y-1.5">
                      {patientSearchResults.map((p) => (
                        <button key={p.id} onClick={() => {
                          setSelectedExistingPatient(p);
                          handleInputChange('existingPatientId', p.id);
                          if (p.sex) handleInputChange('gender', p.sex);
                        }}
                          className="w-full text-left bg-primary/[0.08] hover:bg-primary/[0.12] rounded-lg p-2.5 transition-colors">
                          <div className="text-sm font-medium text-primary">{p.full_name || 'Unnamed'}</div>
                          <div className="text-xs text-primary/50 font-mono">{p.community_register_id}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedExistingPatient && (
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary">{selectedExistingPatient.full_name || 'Unnamed'}</p>
                        <p className="text-xs text-primary/50 font-mono">{selectedExistingPatient.community_register_id}</p>
                      </div>
                      <button onClick={() => {
                        setSelectedExistingPatient(null);
                        handleInputChange('existingPatientId', null);
                      }}
                        className="text-xs text-primary/40 underline">
                        Change
                      </button>
                    </div>
                  )}
                  {((formData.gender === 'female') || selectedExistingPatient?.sex === 'female') && (
                    <div className="rounded-lg border border-primary/10 p-3">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={formData.pregnantOrBreastfeeding}
                          onCheckedChange={c => handleInputChange('pregnantOrBreastfeeding', !!c)}
                          className="mt-0.5"
                        />
                        <span className="text-sm text-primary/80">Pregnant or breastfeeding</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('consent')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('infectious')}
                  disabled={!canProceedToNext('patient')}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* INFECTIOUS DISEASE HISTORY STEP */}
        {step === 'infectious' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Infectious disease history</h3>
              <p className="text-xs text-primary/60 leading-relaxed -mt-2">
                Several infectious diseases are leading, often treatable, causes of epilepsy in this setting. Ask about each — the answers don't diagnose anything on their own but help the clinician understand a possible underlying cause.
              </p>

              <div className="rounded-lg bg-primary/[0.03] p-3.5 space-y-2">
                {[
                  { field: 'historyCerebralMalaria', label: 'History of cerebral malaria' },
                  { field: 'historyMeningitisEncephalitis', label: 'History of meningitis or encephalitis' },
                  { field: 'suspectedNeurocysticercosis', label: 'Possible neurocysticercosis exposure (contact with free-roaming/backyard pigs, undercooked pork, or limited sanitation access)' },
                  { field: 'onchocerciasisEndemicResidence', label: 'Resident in an area associated with onchocerciasis / nodding syndrome' }
                ].map(item => (
                  <label key={item.field} className="flex items-start gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={(formData as any)[item.field]}
                      onCheckedChange={c => handleInputChange(item.field, !!c)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-primary/80">{item.label}</span>
                  </label>
                ))}
              </div>

              <div>
                <Label className="block text-xs font-medium text-primary/60 mb-1.5">HIV status</Label>
                <div className="flex gap-2">
                  {[
                    { val: 'positive', label: 'Positive' },
                    { val: 'negative', label: 'Negative' },
                    { val: 'unknown', label: 'Unknown' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleInputChange('hivPositiveStatus', opt.val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border capitalize transition-colors ${formData.hivPositiveStatus === opt.val
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/15 text-primary/70'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('patient')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('classify')}
                  disabled={!canProceedToNext('infectious')}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* CLASSIFY SEIZURE STEP */}
        {step === 'classify' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Classify the seizure</h3>
              <p className="text-xs text-primary/60 leading-relaxed -mt-2">
                WHO/ILAE-aligned recognition flowchart, built for CHW use. Answer based on what was witnessed or reported.
              </p>

              <div className="rounded-lg bg-primary/[0.03] p-3.5 space-y-3">
                <Label className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold">Did anyone see how the event started?</Label>
                <div className="flex gap-2">
                  {[
                    { val: 'yes', label: 'Yes' },
                    { val: 'no', label: 'No' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleInputChange('eventWitnessed', opt.val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border capitalize transition-colors ${formData.eventWitnessed === opt.val
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/15 text-primary/70'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-slate-500 font-bold">Provisional classification so far</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">Unclassified</p>
                  </div>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] uppercase tracking-widest text-slate-600">Unclassified Seizure</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Features don't fit any known category, or documentation is too limited.
                </p>
                <p className="text-xs text-primary font-semibold mt-3">
                  Avoid forcing a category. Refer for clinician review.
                </p>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('infectious')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('seizure_details')}
                  disabled={!formData.eventWitnessed}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* SEIZURE DETAILS STEP */}
        {step === 'seizure_details' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">What Happened During the Seizure?</h3>
              <p className="text-xs text-primary/60 leading-relaxed -mt-2">
                Details about the seizure event help determine what kind of seizure this is.
              </p>

              <div>
                <Label className="block text-xs font-medium text-primary/60 mb-1.5">How long did the seizure last?</Label>
                <div className="flex gap-2">
                  {[
                    { val: '<5min', label: 'Under 5 minutes' },
                    { val: '>5min', label: '5+ minutes' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      onClick={() => handleInputChange('seizureDuration', opt.val)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${formData.seizureDuration === opt.val
                        ? 'bg-primary text-white border-primary'
                        : 'border-primary/15 text-primary/70'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-primary/[0.03] p-3.5 space-y-2">
                {[
                  { field: 'clusterSeizures', label: 'Second seizure within 24 hours' },
                  { field: 'feverPresent', label: 'Fever was present' },
                  { field: 'injuryDuringSeizure', label: 'Patient was injured' },
                  { field: 'suspectedNonEpileptic', label: 'Event seems unusual' }
                ].map(item => (
                  <label key={item.field} className="flex items-start gap-2.5 cursor-pointer">
                    <Checkbox
                      checked={(formData as any)[item.field]}
                      onCheckedChange={c => handleInputChange(item.field, !!c)}
                      className="mt-0.5"
                    />
                    <span className="text-sm text-primary/80">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('infectious')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('symptoms')}
                  disabled={!canProceedToNext('seizure_details')}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* SYMPTOMS & MOOD STEP */}
        {step === 'symptoms' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Any new symptoms since last visit?</h3>

              <div className="rounded-lg border border-primary/10 p-3">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={formData.newOrChangedSymptom}
                    onCheckedChange={c => handleInputChange('newOrChangedSymptom', !!c)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-primary/80">New or worsening weakness, confusion, vision change, or speech difficulty</span>
                </label>
              </div>

              {calculatedAge >= 13 && (
                <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-4 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Heart size={14} className="text-primary" />
                    <span className="text-xs font-semibold text-primary uppercase">Mood screen (PHQ-2)— result flagged to clinician only, does not change risk band</span>
                  </div>
                  <p className="text-xs text-primary/60">Over the last 2 weeks, how often has the patient been bothered by each of the following?</p>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium mb-2 block text-primary/70">Little interest or pleasure in doing things</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 0, label: 'Not at all' },
                          { val: 1, label: 'Several days' },
                          { val: 2, label: 'More than half the days' },
                          { val: 3, label: 'Nearly every day' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => handleInputChange('phq2Q1', opt.val)}
                            className={`py-2 rounded-lg text-xs font-medium border transition-colors ${formData.phq2Q1 === opt.val
                              ? 'bg-primary text-white border-primary'
                              : 'border-primary/15 text-primary/70'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium mb-2 block text-primary/70">Feeling down, depressed, or hopeless</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 0, label: 'Not at all' },
                          { val: 1, label: 'Several days' },
                          { val: 2, label: 'More than half the days' },
                          { val: 3, label: 'Nearly every day' }
                        ].map(opt => (
                          <button
                            key={opt.val}
                            onClick={() => handleInputChange('phq2Q2', opt.val)}
                            className={`py-2 rounded-lg text-xs font-medium border transition-colors ${formData.phq2Q2 === opt.val
                              ? 'bg-primary text-white border-primary'
                              : 'border-primary/15 text-primary/70'
                              }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-primary/70 mt-2">Ask both questions directly. This screen does not alter the seizure risk band or referral suggestion — it is additional context for the clinician, not a clinical decision.</p>
                </div>
              )}

              <div>
                <Label className="block text-xs font-medium text-primary/60 mb-1.5">Additional notes for the clinician</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional concerns…"
                  className="rounded-lg min-h-[80px]"
                />
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('seizure_details')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('adherence')}
                  disabled={!canProceedToNext('symptoms')}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Continue <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* MEDICATION ADHERENCE STEP */}
        {step === 'adherence' && (
          <Card className="p-5 border-none shadow-sm">
            <div className="space-y-4">
              <h3 className="font-serif text-xl text-primary">Medication adherence, last 2 weeks</h3>
              <p className="text-sm text-primary/80">Number of doses missed</p>
              <div className="flex gap-2 mt-1">
                {[0, 1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => handleInputChange('missedDoses', n)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${formData.missedDoses === n
                      ? 'bg-primary text-white border-primary'
                      : 'border-primary/15 text-primary/70'
                      }`}
                  >
                    {n === 3 ? '3+' : n}
                  </button>
                ))}
              </div>

              <p className="text-xs text-primary/60 mt-3">Ask the patient or caregiver directly. If unsure, estimate conservatively — round up, don't guess down.</p>

              <div className="mt-4">
                <Label className="block text-xs font-medium text-primary/60 mb-1.5">Current antiseizure medication(s) — optional</Label>
                <Input
                  value={formData.currentMedications}
                  onChange={e => handleInputChange('currentMedications', e.target.value)}
                  placeholder="Ask the patient to show their medication packet if they have it."
                  className="rounded-lg"
                />
                <p className="text-xs text-primary/70 mt-2">Ask the patient to show their medication packet if they have it. This helps the clinician assess whether a different drug or dose may be needed.</p>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-primary/10">
                <button onClick={() => setStep('symptoms')} className="flex items-center gap-1 text-sm font-medium text-primary/60 px-2 py-2">
                  <ChevronLeft size={16} /> Back
                </button>
                <button
                  onClick={() => setStep('review')}
                  disabled={!canProceedToNext('adherence')}
                  className="flex items-center gap-1 bg-primary disabled:opacity-30 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
                >
                  Review <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* ASSESSMENT LOADING */}
        {step === 'assessment' && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-xl font-bold font-headline text-primary italic">Analyzing Clinical Inputs...</h3>
            <p className="text-sm text-muted-foreground">Processing through clinical logic engine.</p>
          </div>
        )}

        {/* REPORT STEP */}
        {
          step === 'report' && recommendation && (
            <div className="space-y-6">
              <Card className="border-none shadow-lg">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-headline italic text-primary">Clinical Suggestion</CardTitle>
                    <Badge className={cn(
                      "uppercase font-bold tracking-widest text-[10px]",
                      recommendation.urgencyLevel === 'EMERGENCY' ? "bg-red-600 text-white" : "bg-green-600 text-white"
                    )}>
                      {recommendation.urgencyLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {recommendation.detectedRedFlags.length > 0 && (
                    <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                      <h4 className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Emergency Triggers
                      </h4>
                      <ul className="space-y-1">
                        {recommendation.detectedRedFlags.map((flag, i) => (
                          <li key={i} className="text-xs text-red-900">• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold">Urgency Level</Label>
                      <p className={cn("text-lg font-bold mt-1", recommendation.urgencyLevel === 'EMERGENCY' ? "text-red-600" : "text-green-600")}>
                        {recommendation.urgencyLevel}
                      </p>
                    </div>

                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground tracking-widest font-bold">Action</Label>
                      <p className="text-sm font-bold text-slate-800 mt-1">{recommendation.actionDescription}</p>
                    </div>

                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <Label className="text-[10px] uppercase text-primary tracking-widest font-bold mb-2 block">Counseling Points</Label>
                      <ul className="space-y-1">
                        {recommendation.counselingPoints.map((m, i) => (
                          <li key={i} className="text-xs font-medium text-slate-700 flex items-start gap-2">
                            <div className="h-1 w-1 bg-primary rounded-full mt-1.5 shrink-0" /> {m}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                <Button className="w-full h-14 font-bold shadow-lg bg-primary text-white" onClick={handlePrepareFinalReport}>
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Submit Report
                </Button>
                <Button variant="outline" className="w-full h-12" onClick={() => setShowOverrideDialog(true)}>
                  <Edit3 className="h-4 w-4 mr-2" /> Override Report
                </Button>
              </div>
            </div>
          )
        }

        {/* FINAL REPORT & SUBMIT */}
        {
          step === 'final' && recommendation && (
            <div className="space-y-6 pb-20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-headline font-bold text-primary italic">Final Report</h2>
                <Badge className="bg-green-600 text-white">CERTIFIED</Badge>
              </div>

              <div id="clinical-report-content" className="bg-white p-8 border shadow-sm min-h-[600px] text-slate-900 leading-normal" style={{ fontFamily: '"Times New Roman", Times, serif' }}>
                <div className="text-center border-b-2 border-primary pb-6 mb-8">
                  <h1 className="text-2xl font-bold uppercase tracking-tight">Clinical Encounter Report</h1>
                  <p className="text-sm font-bold text-muted-foreground mt-1 uppercase">AI Epilepsy Assistant</p>
                  <p className="text-xs mt-2">Date: {format(new Date(), 'PPP')}</p>
                </div>

                <div className="space-y-8">
                  <section>
                    <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">Patient Information</h2>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {formData.firstName} {formData.surname}</p>
                      <p><strong>Age:</strong> {calculatedAge} years</p>
                      <p><strong>Gender:</strong> {formData.gender}</p>
                      <p><strong>Consent:</strong> {formData.consentGivenBy === 'patient' ? 'Patient' : 'Guardian'}</p>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">Clinical Assessment</h2>
                    <div className="space-y-2 text-sm">
                      <p><strong>Seizure Duration:</strong> {formData.seizureDuration}</p>
                      <p><strong>Fever:</strong> {formData.feverPresent ? 'Yes' : 'No'}</p>
                      <p><strong>Cluster Seizures:</strong> {formData.clusterSeizures ? 'Yes' : 'No'}</p>
                      <p><strong>Doses Missed:</strong> {formData.missedDoses}</p>
                      <p><strong>Urgency Level:</strong> <strong className={recommendation.urgencyLevel === 'EMERGENCY' ? 'text-red-600' : 'text-green-600'}>{recommendation.urgencyLevel}</strong></p>
                    </div>
                  </section>

                  {formData.notes && (
                    <section>
                      <h2 className="text-base font-bold uppercase border-b pb-1 mb-4">Clinical Notes</h2>
                      <p className="text-sm">{formData.notes}</p>
                    </section>
                  )}
                </div>
              </div>

              {!reportSubmitted ? (
                <div className="flex flex-col gap-2">
                  <Button className="w-full h-12 font-bold bg-green-600 text-white" onClick={handleSubmitReport}>
                    <CheckCircle2 className="mr-2 h-5 w-5" /> Submit Report
                  </Button>
                  <Button variant="ghost" className="w-full h-12" onClick={() => router.push('/dashboard')}>
                    <X className="mr-2 h-4 w-4" /> Return
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button className="w-full h-12 font-bold bg-green-600 text-white">
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                  <Button variant="ghost" className="w-full h-12" onClick={() => router.push('/dashboard')}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Return
                  </Button>
                </div>
              )}

              {/* OVERRIDE DIALOG */}
              <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
                <DialogContent className="max-w-sm rounded-3xl">
                  <DialogHeader>
                    <DialogTitle className="font-headline italic text-primary">Clinical Decision Override</DialogTitle>
                    <DialogDescription>Document your clinical reasoning</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Reason</Label>
                      <Select onValueChange={v => setOverrideData({ ...overrideData, reason: v })}>
                        <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="context">AI missed clinical context</SelectItem>
                          <SelectItem value="protocol">Local protocol variation</SelectItem>
                          <SelectItem value="judgment">Expert clinical judgment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">Justification</Label>
                      <Textarea
                        value={overrideData.notes}
                        onChange={e => setOverrideData({ ...overrideData, notes: e.target.value })}
                        placeholder="Describe your reasoning…"
                        className="rounded-xl min-h-[100px]"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      className="w-full h-14 font-bold rounded-2xl shadow-lg"
                      disabled={!overrideData.reason || !overrideData.notes}
                      onClick={() => {
                        setShowOverrideDialog(false);
                        setStep('final');
                      }}
                    >
                      Confirm Override
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* SAFETY ALERT DIALOG */}
              <Dialog open={showSafetyDialog} onOpenChange={setShowSafetyDialog}>
                <DialogContent className="bg-red-600 text-white border-none shadow-2xl">
                  <DialogHeader>
                    <div className="mx-auto bg-white/20 p-3 rounded-full mb-2">
                      <ShieldAlert className="h-10 w-10 text-white animate-pulse" />
                    </div>
                    <DialogTitle className="text-2xl font-bold text-center text-white">EMERGENCY PROTOCOL</DialogTitle>
                  </DialogHeader>
                  <p className="text-center text-lg leading-relaxed font-medium">
                    <strong>HIGH-RISK SCENARIO DETECTED</strong>. Immediate specialist intervention required.
                  </p>
                  <DialogFooter>
                    <Button
                      onClick={() => setShowSafetyDialog(false)}
                      className="w-full h-14 bg-white text-red-600 font-bold hover:bg-white/90"
                    >
                      I ACKNOWLEDGE
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* DRAFTS DIALOG */}
              <Dialog open={showDraftsDialog} onOpenChange={setShowDraftsDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-headline italic text-primary">Drafts</DialogTitle>
                    <DialogDescription>Select a saved draft to resume or delete it.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    {drafts.length === 0 ? (
                      <p className="text-sm text-primary/60">No drafts saved.</p>
                    ) : (
                      drafts.map(d => (
                        <div key={d.id} className="p-3 rounded-lg border bg-background flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-primary">{d.title}</div>
                            <div className="text-xs text-primary/70">Saved: {new Date(d.timestamp).toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => resumeDraft(d)}>Resume</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteDraft(d.id)}>Delete</Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setShowDraftsDialog(false)}>Close</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

        {/* Floating Save & Exit shown while encounter is in progress */}
        {step !== 'final' && step !== 'report' && (
          <div className="fixed left-0 right-0 bottom-6 flex justify-center z-50 pointer-events-none">
            <div className="pointer-events-auto">
              <button
                onClick={() => saveDraft(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg"
              >
                Save & Exit
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Floating Save & Exit button shown while collecting data
function SaveExitFloating({ onSave }: { onSave: () => void }) {
  return (
    <div className="fixed left-0 right-0 bottom-6 flex justify-center z-50 pointer-events-none">
      <div className="pointer-events-auto">
        <button onClick={onSave} className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg">
          Save & Exit
        </button>
      </div>
    </div>
  );
}

export default function NewEncounterPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    }>
      <NewEncounterContent />
    </Suspense>
  );
}

// Wrap page to include floating Save & Exit so it shows across steps
export function NewEncounterWrapper() {
  return (
    <>
      <NewEncounterPage />
      {/* The wrapper can't access inner save handler directly; embedding floating in page instead */}
    </>
  );
}


import { AlertCircle, Calendar, ClipboardCheck } from 'lucide-react';
import type { Notification, Patient, UserProfile, Encounter } from './types';
import type { HealthFacility } from './clinical-engine/types';
import { addDays, subDays, subYears } from 'date-fns';

/**
 * @fileOverview FHIR-aligned mock data for the AI Epilepsy Assistant prototype.
 */

export const mockNotifications: Notification[] = [
  { id: '1', icon: AlertCircle, text: "Urgent review needed for Zahara Hassan", href: "/dashboard/records", timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), read: false },
  { id: '2', icon: ClipboardCheck, text: "Clinical guidance updated to mhGAP 2024", href: "/dashboard", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), read: false },
  { id: '3', icon: Calendar, text: "Monthly sync completed successfully", href: "/dashboard", timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), read: true },
];

export const mockUserProfile: UserProfile = {
  firstName: "Demo",
  surname: "Health Worker",
  name: "Demo Health Worker",
  role: "chw",
  email: "chw@demo.ai",
  phone: "+254 700 000 000",
  dob: "1990-05-15",
  gender: "Other",
  address: {
    line1: "Kijiji Health Post",
    city: "Local",
    country: "Kenya"
  },
  allowLocation: true,
  imageUrl: 'https://picsum.photos/seed/worker/200/200',
  location: "Kijiji Sector",
  imageHint: "profile person"
};

export const mockPatients: Patient[] = [
  {
    id: 'p1',
    active: true,
    name: 'Zahara Hassan',
    birthDate: subYears(new Date(), 24).toISOString().split('T')[0],
    gender: 'female',
    address: { text: 'Kijiji Village', city: 'Local' },
    status: 'Urgent',
    telecom: { system: 'phone', value: '+254 711 000 111' },
    updatedAt: new Date().toISOString(),
    nextFollowUpDate: new Date().toISOString(),
    chwId: 'chw1',
    chwName: 'Alex Mutua'
  },
  {
    id: 'p2',
    active: true,
    name: 'John Kamau',
    birthDate: subYears(new Date(), 45).toISOString().split('T')[0],
    gender: 'male',
    address: { text: 'Mlimani Sector', city: 'Local' },
    status: 'Stable',
    telecom: { system: 'phone', value: '+254 722 000 222' },
    updatedAt: new Date().toISOString(),
    nextFollowUpDate: addDays(new Date(), 14).toISOString(),
    chwId: 'chw2',
    chwName: 'Grace Achieng'
  },
  {
    id: 'p3',
    active: true,
    name: 'Amina Juma',
    birthDate: subYears(new Date(), 12).toISOString().split('T')[0],
    gender: 'female',
    address: { text: 'Pwani Area', city: 'Local' },
    status: 'Follow-up',
    telecom: { system: 'phone', value: '+254 733 000 333' },
    updatedAt: new Date().toISOString(),
    nextFollowUpDate: addDays(new Date(), 3).toISOString(),
    chwId: 'chw1',
    chwName: 'Alex Mutua'
  },
  {
    id: 'p4',
    active: true,
    name: 'David Omondi',
    birthDate: subYears(new Date(), 31).toISOString().split('T')[0],
    gender: 'male',
    address: { text: 'Ziwani Block', city: 'Local' },
    status: 'Stable',
    telecom: { system: 'phone', value: '+254 744 000 444' },
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    nextFollowUpDate: addDays(new Date(), 21).toISOString(),
    chwId: 'chw2',
    chwName: 'Grace Achieng'
  },
];

export const mockEncounters: Encounter[] = [
  {
    id: 'e1',
    status: 'finished',
    subject: 'p1',
    patientId: 'p1',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    summary: 'Emergency presentation: Prolonged convulsive seizure lasting 7 minutes. Status Epilepticus protocol initiated.',
    redFlags: ['Status Epilepticus Risk (Duration >= 5m)', 'Repeated Seizures (Cluster Risk)'],
    recommendation: {
      action: 'Refer',
      urgencyLevel: 'EMERGENCY',
      referralDestination: 'KUTRRH Specialist Unit',
      followUpPlan: 'Urgent specialist review within 24 hours.',
      antiStigmaMessages: ['Epilepsy is medical condition.', 'Epilepsy is NOT contagious.'],
      safetyAdvice: ['Avoid cooking over open fires alone.']
    },
    type: 'Emergency',
    authorName: 'Alex Mutua',
    authorRole: 'CHW'
  },
  {
    id: 'e2',
    status: 'finished',
    subject: 'p1',
    patientId: 'p1',
    date: subDays(new Date(), 1).toISOString(),
    summary: 'Routine follow-up: no seizure activity reported. Medication adherence discussed and reassurance provided.',
    redFlags: [],
    recommendation: {
      action: 'Continue Treatment',
      urgencyLevel: 'ROUTINE',
      followUpPlan: 'Review after 14 days and monitor seizure diaries.',
      antiStigmaMessages: ['Maintain medication schedule.', 'Keep a seizure diary for patterns.'],
      safetyAdvice: ['Encourage the patient to rest and stay hydrated.']
    },
    type: 'Routine',
    authorName: 'Alex Mutua',
    authorRole: 'CHW'
  },
  {
    id: 'e3',
    status: 'finished',
    subject: 'p2',
    patientId: 'p2',
    date: subDays(new Date(), 3).toISOString(),
    summary: 'New onset focal seizures with preserved awareness. AI suggests outpatient neurologic evaluation and medication review.',
    redFlags: ['New seizure onset', 'Focal seizure characteristics'],
    recommendation: {
      action: 'Monitor & Review',
      urgencyLevel: 'FOLLOW-UP',
      followUpPlan: 'Schedule clinician visit in 7 days for medication adjustment.',
      antiStigmaMessages: ['Seizures can be managed with consistent care.'],
      safetyAdvice: ['Avoid heavy lifting and stay near family support.']
    },
    type: 'Routine',
    authorName: 'Grace Achieng',
    authorRole: 'CHW'
  },
  {
    id: 'e4',
    status: 'finished',
    subject: 'p3',
    patientId: 'p3',
    date: subDays(new Date(), 5).toISOString(),
    summary: 'Child presented with nighttime jerking episodes. AI assessment indicated low emergency risk but recommended sleep hygiene education.',
    redFlags: ['Nighttime episodes'],
    recommendation: {
      action: 'Educate',
      urgencyLevel: 'FOLLOW-UP',
      followUpPlan: 'Return for monitoring after 10 days.',
      antiStigmaMessages: ['Seizure support improves quality of life.'],
      safetyAdvice: ['Ensure safe sleeping environment and avoid unsupervised bathing.']
    },
    type: 'Routine',
    authorName: 'Alex Mutua',
    authorRole: 'CHW'
  },
  {
    id: 'e5',
    status: 'finished',
    subject: 'p4',
    patientId: 'p4',
    date: subDays(new Date(), 7).toISOString(),
    summary: 'Patient reported improved control since medication change. AI review recommended continuing current plan and checking blood levels if symptoms recur.',
    redFlags: [],
    recommendation: {
      action: 'Continue',
      urgencyLevel: 'ROUTINE',
      followUpPlan: 'Next evaluation in 21 days unless new symptoms arise.',
      antiStigmaMessages: ['Medication adherence is key to stability.'],
      safetyAdvice: ['Keep a record of any breakthrough events.']
    },
    type: 'Routine',
    authorName: 'Grace Achieng',
    authorRole: 'CHW'
  },
  {
    id: 'e6',
    status: 'finished',
    subject: 'p2',
    patientId: 'p2',
    date: subDays(new Date(), 10).toISOString(),
    summary: 'Acute headache and dizziness after seizure-like event. AI flagged potential medication side effects and advised clinical review.',
    redFlags: ['New headache', 'Seizure-like events'],
    recommendation: {
      action: 'Review Medication',
      urgencyLevel: 'URGENCY',
      referralDestination: 'Community Clinic Review',
      followUpPlan: 'Call clinician if symptoms worsen within 48 hours.',
      antiStigmaMessages: ['Side effects can be managed with provider support.'],
      safetyAdvice: ['Monitor for drowsiness and avoid driving.']
    },
    type: 'Routine',
    authorName: 'Grace Achieng',
    authorRole: 'CHW'
  },
];

export const mockClinicians = [
  { id: 'c1', name: 'Dr. Sarah Mwangi', role: 'Senior Neurologist', hospital: 'National Referral', email: 's.mwangi@health.go.ke', phone: '+254 700 111 222', license: 'KMPDC-9982', status: 'Approved' },
];

export const mockCHWs = [
  { id: 'chw1', name: 'Alex Mutua', sector: 'Kijiji Village', activePatients: 28, email: 'a.mutua@chw.org', phone: '+254 711 555 666', performance: 'Excellent', status: 'Approved' },
];

export const mockHealthFacilities: HealthFacility[] = [
  {
    id: 'f1',
    name: 'Kenyatta University Teaching Hospital (KUTRRH)',
    type: 'specialist',
    coordinates: { lat: -1.1747, lng: 36.9264 },
    capabilities: ['Tertiary Epilepsy Care', 'Neurology Specialist'],
    contact: '+254 800 721 038',
    isOpen24h: true
  }
];

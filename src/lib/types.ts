
import type { LucideIcon } from "lucide-react";

export type Role = 'chw' | 'clinician' | 'supervisor';

/**
 * FHIR-Aligned Patient Type
 */
export type Patient = {
  id: string;
  active: boolean;
  name: string; // HumanName.text
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string; // YYYY-MM-DD
  status: 'Stable' | 'Urgent' | 'Follow-up';
  telecom: {
    system: string;
    value: string;
  };
  address: {
    text: string;
    city?: string;
    district?: string;
  };
  updatedAt?: string;
  nextFollowUpDate?: string;
  chwId?: string;
  chwName?: string;
};

/**
 * FHIR-Aligned Encounter Type
 */
export type Encounter = {
  id: string;
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'finished' | 'cancelled';
  subject?: string; // Patient ID
  patientId: string;
  date: string; // period.start equivalent
  summary: string;
  redFlags: string[]; // maps to reasonCode
  recommendation: {
    action: string;
    urgencyLevel: string;
    referralDestination?: string;
    antiStigmaMessages?: string[];
    safetyAdvice?: string[];
    followUpPlan?: string;
  };
  type: 'Initial' | 'Routine' | 'Emergency';
  discordanceNote?: string;
  authorName: string;
  authorRole: string;
  isClinicianUpdated?: boolean;
};

export type UserProfile = {
    firstName?: string;
    surname?: string;
    name: string;
    role: string;
    email: string;
    imageUrl: string;
    location: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: any;
    allowLocation?: boolean;
    imageHint?: string;
};

export type Notification = {
    id: string;
    icon: LucideIcon;
    text: string;
    href: string;
    timestamp: string;
    read: boolean;
};

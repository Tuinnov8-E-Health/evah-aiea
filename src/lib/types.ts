
import type { LucideIcon } from "lucide-react";

export type Role = 'chw' | 'clinician' | 'supervisor';

/**
 * Backend-Aligned Patient Type
 */
export type Patient = {
  id: string;
  communityRegisterId: string;
  firstName: string;
  lastName: string;
  fullName: string;
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
  nationalIdNumber?: string;
  facilityId?: string;
  enrolledById?: number;
  nextFollowUpDate?: string;
  updatedAt: string;
  createdAt: string;
};

/**
 * Backend-Aligned Encounter Type
 */
export type Encounter = {
  id: string;
  patient: string; // UUID of patient
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'finished' | 'cancelled';
  encounterClass: string;
  date: string;
  authorId: number;
  localId?: string;
  rulesetVersion?: string;
  summary: string;
  redFlags: string[];
  recommendation: {
    action: string;
    urgency_level?: string;
    urgencyLevel?: string;
    referral_destination?: string;
    referralDestination?: string;
    antiStigmaMessages?: string[];
    safetyAdvice?: string[];
    followUpPlan?: string;
    clinical_reasoning?: string;
  };
  riskScore: number;
  riskBand: string;
  urgencyLevel: string;
  intakeData: Record<string, any>;
  isClinicianUpdated: boolean;
  discordanceNote?: string;
  reviewedById?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  seizureClassifications: any[];
  observations: any[];
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

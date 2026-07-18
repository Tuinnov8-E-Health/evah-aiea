import type { Patient, Encounter } from '@/lib/types';

const TOKEN_KEY = 'aiea_auth_token';
const USER_KEY = 'aiea_auth_user';

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: string;
  imageUrl: string;
  location: string;
  facilityCode?: string;
  county?: string;
  specialty?: string;
  phoneNumber?: string;
};

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: UserSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('is_demo');
}

async function apiFetch<T>(input: RequestInfo, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(input, { ...init, headers, credentials: 'same-origin' });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = data?.error || res.statusText || 'Request failed';
    throw new Error(error);
  }

  return data as T;
}

export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: UserSession }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}) {
  return apiFetch<{ token: string; user: UserSession }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  return apiFetch<{ user: UserSession }>('/api/auth/me', {
    method: 'GET',
  });
}

export async function fetchPatients() {
  return apiFetch<{ patients: Patient[] }>('/api/patients', {
    method: 'GET',
  });
}

export async function fetchPatientById(id: string) {
  return apiFetch<{ patient: Patient }>(`/api/patients/${id}`, {
    method: 'GET',
  });
}

export async function fetchEncounters(patientId?: string) {
  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
  return apiFetch<{ encounters: Encounter[] }>(`/api/encounters${query}`, {
    method: 'GET',
  });
}

export async function createEncounter(encounter: Omit<Encounter, 'id'>) {
  return apiFetch<{ encounter: Encounter }>('/api/encounters', {
    method: 'POST',
    body: JSON.stringify(encounter),
  });
}

export async function fetchRegistry() {
  return apiFetch<{ registry: { patients: Patient[]; clinicians: any[]; chws: any[]; facilities: any[] } }>('/api/registry', {
    method: 'GET',
  });
}

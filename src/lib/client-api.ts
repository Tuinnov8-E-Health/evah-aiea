import type { Patient, Encounter } from '@/lib/types';

const TOKEN_KEY = 'aiea_auth_token';
const REFRESH_TOKEN_KEY = 'aiea_refresh_token';
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

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
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

export function saveSession(token: string, refreshToken: string | null, user: UserSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

async function apiFetch<T>(input: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> || {}),
  };

  const apiKey = process.env.NEXT_PUBLIC_API_KEY;
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://apireg.tuinnov8.com/api';
  const url = input.startsWith('http') ? input : `${baseUrl}${input}`;

  let res = await fetch(url, { ...init, headers });

  // Handle 401 via token refresh
  if (res.status === 401 && !input.includes('/auth/refresh') && !input.includes('/auth/login')) {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${baseUrl}/auth/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            saveSession(data.access_token, data.refresh_token, data.user);
            onRefreshed(data.access_token);
          } else {
            clearSession();
            onRefreshed('');
            if (typeof window !== 'undefined') window.location.href = '/login';
          }
        } catch {
          clearSession();
          onRefreshed('');
        } finally {
          isRefreshing = false;
        }
      }

      // Wait for the refresh to complete
      const newToken = await new Promise<string>(resolve => {
        refreshSubscribers.push(resolve);
      });

      if (newToken) {
        headers.Authorization = `Bearer ${newToken}`;
        res = await fetch(url, { ...init, headers }); // Retry original request
      }
    } else {
      clearSession();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = data?.error || res.statusText || 'Request failed';
    throw new Error(error);
  }

  return data as T;
}

export async function login(identifier: string, password: string) {
  return apiFetch<{ access_token: string; refresh_token: string; user: UserSession }>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, password }), // Backend expects email
  });
}

export async function logout() {
  try {
    await apiFetch('/auth/logout/', { method: 'POST' });
  } catch {
    // Ignore if already logged out or network error
  } finally {
    clearSession();
  }
}


export async function register(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}) {
  return apiFetch<{ access_token: string; refresh_token: string; user: UserSession }>('/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe() {
  return apiFetch<{ user: UserSession }>('/auth/me/', {
    method: 'GET',
  });
}

export async function fetchPatients() {
  // Assuming pagination is handled or we get results directly
  const data = await apiFetch<any>('/patients/', {
    method: 'GET',
  });
  return { patients: data.results || data };
}

export async function fetchPatientById(id: string) {
  return apiFetch<Patient>(`/patients/${id}/`, {
    method: 'GET',
  });
}

export async function fetchEncounters(patientId?: string) {
  const query = patientId ? `?patientId=${encodeURIComponent(patientId)}` : '';
  const data = await apiFetch<any>(`/encounters/${query}`, {
    method: 'GET',
  });
  return { encounters: data.results || data };
}

export async function createEncounter(encounter: Omit<Encounter, 'id'>) {
  return apiFetch<Encounter>('/encounters/', {
    method: 'POST',
    body: JSON.stringify(encounter),
  });
}

export async function fetchRegistry() {
  return apiFetch<{ registry: { patients: Patient[]; clinicians: any[]; chws: any[]; facilities: any[] } }>('/registry/', {
    method: 'GET',
  });
}

export async function analyzeClinicalHistory(payload: { historyJson: string }) {
  return apiFetch<{ insights: string }>('/ai/analyze-history/', {
    method: 'POST',
    body: JSON.stringify({ historyJson: payload.historyJson }),
  });
}

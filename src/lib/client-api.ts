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
  firstName?: string;
  lastName?: string;
};

/** Normalize the backend user payload into our frontend UserSession shape. */
export function mapBackendUser(u: Record<string, any>): UserSession {
  const firstName = u.firstName || u.first_name || '';
  const lastName = u.lastName || u.last_name || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || u.email || 'User';
  return {
    id: String(u.id),
    name: fullName,
    email: u.email || '',
    role: u.role || 'chw',
    imageUrl: u.avatar || u.imageUrl || '',
    location: u.locationLabel || u.location || u.county || '',
    county: u.county,
    specialty: u.specialty,
    phoneNumber: u.phone || u.phoneNumber,
    facilityCode: u.facility?.code || u.facilityCode,
    firstName,
    lastName,
  };
}

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
  const res = await apiFetch<Record<string, any>>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, password }),
  });
  // Backend returns both 'access_token' and 'token' (compat alias)
  const accessToken: string = res.access_token || res.token;
  const refreshToken: string | null = res.refresh_token || null;
  const user = mapBackendUser(res.user);
  return { access_token: accessToken, refresh_token: refreshToken, user };
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

export async function forgotPassword(email: string) {
  return apiFetch('/auth/password/reset/', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(uidb64: string, token: string, newPassword: string) {
  return apiFetch('/auth/password/reset/confirm/', {
    method: 'POST',
    body: JSON.stringify({ uidb64, token, new_password: newPassword }),
  });
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
  const raw = await apiFetch<Record<string, any>>('/auth/me/', { method: 'GET' });
  // MeView returns the flat user object directly (no 'user' wrapper)
  const user = mapBackendUser(raw.user ?? raw);
  return { user };
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

// Additional wrappers for Dashboards

export async function fetchFollowups() {
  const data = await apiFetch<any>('/followups/', { method: 'GET' });
  return { followups: data.results || data };
}

export async function createFollowup(payload: any) {
  return apiFetch<any>('/followups/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateFollowup(id: string, payload: any) {
  return apiFetch<any>(`/followups/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function fetchReferrals() {
  const data = await apiFetch<any>('/referrals/', { method: 'GET' });
  return { referrals: data.results || data };
}

export async function createReferral(payload: any) {
  return apiFetch<any>('/referrals/', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchFacilities() {
  const data = await apiFetch<any>('/facilities/', { method: 'GET' });
  return { facilities: data.results || data };
}

export async function fetchUsers() {
  const data = await apiFetch<any>('/users/', { method: 'GET' });
  return { users: data.results || data };
}

export async function updateUser(id: string, payload: any) {
  return apiFetch<any>(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function approveUser(id: string, is_approved: boolean) {
  return apiFetch<any>(`/users/${id}/approve/`, { method: 'POST', body: JSON.stringify({ is_approved }) });
}

export async function updateEncounter(id: string, payload: any) {
  return apiFetch<any>(`/encounters/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function fetchAnalyticsOverview() {
  return apiFetch<any>('/analytics/overview/', { method: 'GET' });
}

export async function fetchNotifications() {
  const data = await apiFetch<any>('/notifications/', { method: 'GET' });
  return { notifications: data.results || data };
}

export async function fetchLabRequests() {
  const data = await apiFetch<any>('/lab-requests/', { method: 'GET' });
  return { labRequests: data.results || data };
}

export async function updateLabRequest(id: string, payload: any) {
  return apiFetch<any>(`/lab-requests/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export async function fetchLabTests() {
  const data = await apiFetch<any>('/lab-tests/', { method: 'GET' });
  return { labTests: data.results || data };
}

export async function fetchLabEarnings() {
  const data = await apiFetch<any>('/lab-earnings/', { method: 'GET' });
  return { labEarnings: data.results || data };
}

export async function fetchMessages() {
  const data = await apiFetch<any>('/chat-messages/', { method: 'GET' });
  return { messages: data.results || data };
}

export async function sendMessage(payload: any) {
  return apiFetch<any>('/chat-messages/', { method: 'POST', body: JSON.stringify(payload) });
}

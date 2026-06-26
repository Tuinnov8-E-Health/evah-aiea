import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Patient, Encounter, Role } from '@/lib/types';
import { mockPatients, mockEncounters, mockClinicians, mockCHWs, mockHealthFacilities, mockUserProfile } from '@/lib/mock-data';

type StoredUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  imageUrl: string;
  location: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: any;
  allowLocation?: boolean;
};

type Session = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

type DB = {
  users: StoredUser[];
  patients: Patient[];
  encounters: Encounter[];
  clinicians: any[];
  chws: any[];
  facilities: any[];
  sessions: Session[];
};

const dataFile = path.join(process.cwd(), 'data', 'aiea-db.json');
const tempDataFile = path.join(os.tmpdir(), 'aiea-db.json');

const defaultUsers: StoredUser[] = [
  {
    id: 'user-chw',
    firstName: 'Demo',
    lastName: 'Health Worker',
    name: 'Demo Health Worker',
    email: 'chw@demo.ai',
    password: 'demo123',
    role: 'chw',
    imageUrl: mockUserProfile.imageUrl,
    location: mockUserProfile.location,
    phone: mockUserProfile.phone,
    dob: mockUserProfile.dob,
    gender: mockUserProfile.gender,
    address: mockUserProfile.address,
    allowLocation: mockUserProfile.allowLocation,
  },
  {
    id: 'user-clinician',
    firstName: 'Sarah',
    lastName: 'Mwangi',
    name: 'Dr. Sarah Mwangi',
    email: 'clinician@demo.ai',
    password: 'demo123',
    role: 'clinician',
    imageUrl: 'https://picsum.photos/seed/clinician/200/200',
    location: 'Regional Referral',
    phone: '+254 700 111 222',
    gender: 'female',
    address: { line1: 'Kigogo Hospital' },
    allowLocation: true,
  },
  {
    id: 'user-supervisor',
    firstName: 'System',
    lastName: 'Supervisor',
    name: 'System Supervisor',
    email: 'supervisor@demo.ai',
    password: 'demo123',
    role: 'supervisor',
    imageUrl: 'https://picsum.photos/seed/supervisor/200/200',
    location: 'Ministry of Health',
    phone: '+254 700 222 333',
    gender: 'female',
    address: { line1: 'Ministry Offices' },
    allowLocation: true,
  },
];

const defaultDb: DB = {
  users: defaultUsers,
  patients: mockPatients,
  encounters: mockEncounters.map((encounter) => ({
    ...encounter,
    patientId: (encounter as any).patientId || encounter.subject,
    subject: (encounter as any).patientId || encounter.subject,
  })),
  clinicians: mockClinicians,
  chws: mockCHWs,
  facilities: mockHealthFacilities,
  sessions: [],
};

async function isWritable(filePath: string) {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.access(filePath, fs.constants.W_OK).catch(() => { });
    await fs.writeFile(filePath, '', { flag: 'a' });
    return true;
  } catch {
    return false;
  }
}

async function ensureDataFile() {
  try {
    await fs.access(dataFile);
  } catch {
    try {
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, JSON.stringify(defaultDb, null, 2), 'utf-8');
      return;
    } catch {
      await fs.writeFile(tempDataFile, JSON.stringify(defaultDb, null, 2), 'utf-8');
      return;
    }
  }
}

async function readDb(): Promise<DB> {
  await ensureDataFile();

  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    return JSON.parse(raw) as DB;
  } catch {
    const raw = await fs.readFile(tempDataFile, 'utf-8');
    return JSON.parse(raw) as DB;
  }
}

async function writeDb(db: DB): Promise<void> {
  try {
    await fs.writeFile(dataFile, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    await fs.writeFile(tempDataFile, JSON.stringify(db, null, 2), 'utf-8');
  }
}

export async function getUserByEmail(email: string): Promise<StoredUser | undefined> {
  const db = await readDb();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: string): Promise<StoredUser | undefined> {
  const db = await readDb();
  return db.users.find((user) => user.id === id);
}

export async function validateUser(email: string, password: string): Promise<StoredUser | null> {
  const user = await getUserByEmail(email);
  if (!user || user.password !== password) return null;
  return user;
}

export async function createUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: Role;
}): Promise<StoredUser> {
  const db = await readDb();
  const existing = db.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  if (existing) {
    throw new Error('User already exists');
  }

  const newUser: StoredUser = {
    id: `user-${crypto.randomUUID()}`,
    firstName: input.firstName,
    lastName: input.lastName,
    name: `${input.firstName} ${input.lastName}`,
    email: input.email.toLowerCase(),
    password: input.password,
    role: input.role,
    imageUrl: `https://picsum.photos/seed/${input.email.replace(/[^a-zA-Z0-9]/g, '')}/200/200`,
    location: 'Community Clinic',
    allowLocation: true,
  };

  db.users.push(newUser);
  await writeDb(db);
  return newUser;
}

export async function createSession(userId: string): Promise<Session> {
  const db = await readDb();
  const token = crypto.randomUUID();
  const now = new Date();
  const session: Session = {
    token,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
  db.sessions.push(session);
  await writeDb(db);
  return session;
}

export async function getUserByToken(token: string): Promise<StoredUser | null> {
  const db = await readDb();
  const session = db.sessions.find((item) => item.token === token);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    await clearSession(token);
    return null;
  }
  return db.users.find((user) => user.id === session.userId) || null;
}

export async function clearSession(token: string): Promise<void> {
  const db = await readDb();
  db.sessions = db.sessions.filter((session) => session.token !== token);
  await writeDb(db);
}

const demoUserIds = new Set(['user-chw', 'user-clinician', 'user-supervisor']);

export async function getPatients(user?: StoredUser | null): Promise<Patient[]> {
  if (!user || !demoUserIds.has(user.id)) {
    return [];
  }
  const db = await readDb();
  return db.patients;
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  const db = await readDb();
  return db.patients.find((patient) => patient.id === id);
}

export async function getEncounters(patientId?: string): Promise<Encounter[]> {
  const db = await readDb();
  const encounters = db.encounters.map((encounter) => ({
    ...encounter,
    patientId: (encounter as any).patientId || encounter.subject,
    subject: (encounter as any).patientId || encounter.subject,
  }));
  return patientId ? encounters.filter((encounter) => encounter.patientId === patientId) : encounters;
}

export async function addEncounter(payload: Omit<Encounter, 'id'>): Promise<Encounter> {
  const db = await readDb();
  const newEncounter: Encounter = {
    ...payload,
    id: `e-${crypto.randomUUID()}`,
    patientId: payload.patientId || payload.subject,
    subject: payload.patientId || payload.subject,
  } as Encounter;
  db.encounters.push(newEncounter);
  await writeDb(db);
  return newEncounter;
}

export async function getRegistry(user?: StoredUser | null) {
  if (!user || !demoUserIds.has(user.id)) {
    return {
      patients: [],
      clinicians: [],
      chws: [],
      facilities: [],
    };
  }

  const db = await readDb();
  return {
    patients: db.patients,
    clinicians: db.clinicians,
    chws: db.chws,
    facilities: db.facilities,
  };
}

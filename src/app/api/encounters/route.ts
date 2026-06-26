'use server';

import { NextResponse } from 'next/server';
import { getEncounters, addEncounter, getUserByToken } from '@/lib/server/data-store';

export async function GET(req: Request) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.replace('Bearer ', '');
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patientId = new URL(req.url).searchParams.get('patientId') || undefined;
  const encounters = await getEncounters(patientId || undefined);
  return NextResponse.json({ encounters });
}

export async function POST(req: Request) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.replace('Bearer ', '');
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await req.json();
    const requiredFields = ['patientId', 'date', 'summary', 'recommendation', 'type', 'authorName', 'authorRole'];
    for (const field of requiredFields) {
      if (!(field in payload)) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    const encounter = await addEncounter(payload);
    return NextResponse.json({ encounter });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save encounter' }, { status: 500 });
  }
}

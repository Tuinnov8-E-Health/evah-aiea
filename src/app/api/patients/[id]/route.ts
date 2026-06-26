'use server';

import { NextResponse } from 'next/server';
import { getPatientById, getUserByToken } from '@/lib/server/data-store';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authorization = req.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authorization.replace('Bearer ', '');
  const user = await getUserByToken(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const patient = await getPatientById(params.id);
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  return NextResponse.json({ patient });
}

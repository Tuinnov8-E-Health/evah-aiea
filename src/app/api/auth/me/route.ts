'use server';

import { NextResponse } from 'next/server';
import { getUserByToken } from '@/lib/server/data-store';

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

  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, imageUrl: user.imageUrl, location: user.location } });
}

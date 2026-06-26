'use server';

import { NextResponse } from 'next/server';
import { createUser, createSession } from '@/lib/server/data-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { firstName, lastName, email, password, role } = body;
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json({ error: 'All registration fields are required' }, { status: 400 });
    }

    const user = await createUser({ firstName, lastName, email, password, role });
    const session = await createSession(user.id);
    return NextResponse.json({ token: session.token, user: { id: user.id, name: user.name, email: user.email, role: user.role, imageUrl: user.imageUrl, location: user.location } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}

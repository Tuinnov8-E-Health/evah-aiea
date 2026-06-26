'use server';

import { NextResponse } from 'next/server';
import { validateUser, createSession } from '@/lib/server/data-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await validateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = await createSession(user.id);
    return NextResponse.json({ token: session.token, user: { id: user.id, name: user.name, email: user.email, role: user.role, imageUrl: user.imageUrl, location: user.location } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}

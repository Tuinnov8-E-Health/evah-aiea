'use server';

import { NextResponse } from 'next/server';
import { getEncounterAnalytics, getUserByToken } from '@/lib/server/data-store';

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

    if (user.role !== 'supervisor') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const analytics = await getEncounterAnalytics();
    return NextResponse.json(analytics);
}

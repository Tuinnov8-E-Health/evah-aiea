'use server';

import { NextResponse } from 'next/server';
import { getUserByToken, updateEncounterReview } from '@/lib/server/data-store';

export async function PATCH(req: Request) {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authorization.replace('Bearer ', '');
    const user = await getUserByToken(token);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'clinician') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const encounterId = url.searchParams.get('id') || url.pathname.split('/').pop();
    if (!encounterId) {
        return NextResponse.json({ error: 'Missing encounter ID' }, { status: 400 });
    }

    try {
        const body = await req.json();
        const notes = body?.notes;
        if (typeof notes !== 'string') {
            return NextResponse.json({ error: 'Missing notes' }, { status: 400 });
        }

        const encounter = await updateEncounterReview(encounterId, { notes }, user);
        if (!encounter) {
            return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
        }

        return NextResponse.json({ encounter });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update encounter review' }, { status: 500 });
    }
}

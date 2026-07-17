'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const STORAGE_KEY = 'encounter_drafts';

type DraftItem = {
    id: string;
    timestamp: string;
    title: string;
    step: string;
    formData: any;
};

export default function DraftsPage() {
    const router = useRouter();
    const [drafts, setDrafts] = useState<DraftItem[]>([]);

    const loadDrafts = () => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            setDrafts(Array.isArray(stored) ? stored : []);
        } catch {
            setDrafts([]);
        }
    };

    useEffect(() => {
        loadDrafts();
    }, []);

    const handleDelete = (id: string) => {
        const next = drafts.filter((draft) => draft.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setDrafts(next);
    };

    const handleResume = (id: string) => {
        router.push(`/dashboard/new-encounter?draftId=${encodeURIComponent(id)}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-headline font-bold text-primary tracking-tight">Drafts</h1>
                        <p className="text-sm text-muted-foreground">
                            Resume saved encounter drafts or start a new one.
                        </p>
                    </div>
                </div>
                <Link href="/dashboard/new-encounter">
                    <Button size="sm">New Encounter</Button>
                </Link>
            </div>

            {drafts.length === 0 ? (
                <Card className="border-dashed border-border/50 bg-background/50">
                    <CardContent className="space-y-3 p-8 text-center text-sm text-muted-foreground">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <FileText className="h-5 w-5" />
                        </div>
                        <p className="font-semibold text-foreground">No drafts saved yet.</p>
                        <p>Open a new encounter and save progress to create a draft.</p>
                        <Link href="/dashboard/new-encounter">
                            <Button variant="secondary" size="sm">Start New Encounter</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {drafts.map((draft) => (
                        <Card key={draft.id} className="border border-border/50">
                            <CardHeader className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                        <FileText className="h-4 w-4" />
                                        Draft saved on {format(new Date(draft.timestamp), 'MMM d, yyyy HH:mm')}
                                    </div>
                                    <p className="text-lg font-bold text-foreground">{draft.title || 'Untitled draft'}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="uppercase">{draft.step || 'consent'}</Badge>
                                    <Button size="sm" variant="outline" onClick={() => handleResume(draft.id)} className="gap-2">
                                        Resume
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => handleDelete(draft.id)} className="text-destructive gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                <p>{draft.formData?.firstName || 'No patient name yet'} {draft.formData?.surname || ''}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

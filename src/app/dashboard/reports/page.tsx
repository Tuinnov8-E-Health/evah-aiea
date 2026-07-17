'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Send, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { mockEncounters, mockPatients } from '@/lib/mock-data';
import { Encounter } from '@/lib/types';

const STORAGE_KEY = 'session_encounters';

type ReportItem = Encounter & {
    viewed?: boolean;
    viewerNotes?: string;
};

export default function ReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<ReportItem[]>([]);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

    useEffect(() => {
        const savedReports = localStorage.getItem(STORAGE_KEY);
        if (savedReports) {
            const parsed: ReportItem[] = JSON.parse(savedReports).map((report: any) => ({
                ...report,
                viewed: report.viewed ?? false,
                viewerNotes: report.viewerNotes ?? ''
            }));
            setReports(parsed.reverse());
            return;
        }

        const demoReports: ReportItem[] = mockEncounters.map((encounter) => ({
            ...encounter,
            viewed: false,
            viewerNotes: ''
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setReports(demoReports);
    }, []);

    const saveReports = (nextReports: ReportItem[]) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReports.reverse()));
        setReports(nextReports);
    };

    const handleView = (report: ReportItem) => {
        if (!report.viewed) {
            const nextReports = reports.map((item) =>
                item.id === report.id ? { ...item, viewed: true } : item
            );
            saveReports(nextReports);
        }
        setSelectedReportId(report.id);
    };

    const handleDelete = (id: string) => {
        const nextReports = reports.filter((report) => report.id !== id);
        saveReports(nextReports);
        if (selectedReportId === id) {
            setSelectedReportId(null);
        }
    };

    const handleBack = () => {
        setSelectedReportId(null);
    };

    const patientHistoryGroups = useMemo(() => {
        const groups = reports.reduce((acc, report) => {
            const existing = acc.get(report.patientId);
            if (!existing) {
                acc.set(report.patientId, {
                    patientId: report.patientId,
                    reports: [report],
                });
            } else {
                existing.reports.push(report);
            }
            return acc;
        }, new Map<string, { patientId: string; reports: ReportItem[] }>());

        return Array.from(groups.values()).map((group) => {
            const sorted = group.reports.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return {
                patientId: group.patientId,
                reports: sorted,
                latestReport: sorted[0],
                unviewedCount: sorted.filter((report) => !report.viewed).length,
            };
        }).sort((a, b) => new Date(b.latestReport.date).getTime() - new Date(a.latestReport.date).getTime());
    }, [reports]);

    const selectedReport = reports.find((report) => report.id === selectedReportId);
    const selectedPatient = selectedReport
        ? mockPatients.find((patient) => patient.id === selectedReport.patientId)
        : undefined;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Send className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-headline font-bold text-primary italic">Reports</h1>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => router.push('/dashboard/new-encounter')}>
                        New Encounter
                    </Button>
                </div>
            </div>

            {reports.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-muted/50 bg-muted/10 p-10 text-center">
                    <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 text-sm font-medium text-muted-foreground">No submitted reports yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Submit an encounter report and it will appear here.</p>
                </div>
            ) : selectedReport ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Button size="sm" variant="outline" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground">Viewing report</p>
                            <h2 className="truncate text-xl font-semibold text-primary">
                                {mockPatients.find((p) => p.id === selectedReport.patientId)?.name || `Case #${selectedReport.patientId.slice(-6)}`}
                            </h2>
                        </div>
                    </div>

                    <Card className="w-full max-w-full min-w-0 border border-border/60">
                        <CardContent className="space-y-6 p-6 min-w-0">
                            <div className="text-center border-b border-primary/20 pb-6 mb-6">
                                <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Clinical Encounter Report</p>
                                <h2 className="mt-2 text-2xl font-headline font-bold text-primary">{selectedPatient?.name || `Case #${selectedReport.patientId.slice(-6)}`}</h2>
                                <p className="text-sm text-muted-foreground mt-2">{format(new Date(selectedReport.date), 'PPP p')}</p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                                <div className="rounded-2xl bg-muted/10 p-4">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Patient Information</p>
                                    <div className="space-y-2 text-sm text-slate-700">
                                        <p><strong>Name:</strong> {selectedPatient?.name || 'Unknown'}</p>
                                        <p><strong>Gender:</strong> {selectedPatient?.gender || 'Unknown'}</p>
                                        <p><strong>Address:</strong> {selectedPatient?.address.text || 'Unknown'}</p>
                                        <p><strong>Contact:</strong> {selectedPatient?.telecom.value || 'Unknown'}</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-muted/10 p-4">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Encounter Details</p>
                                    <div className="space-y-2 text-sm text-slate-700">
                                        <p><strong>Type:</strong> {selectedReport.type}</p>
                                        <p><strong>Status:</strong> {selectedReport.status}</p>
                                        <p><strong>Author:</strong> {selectedReport.authorName} • {selectedReport.authorRole}</p>
                                        <p><strong>Viewed:</strong> {selectedReport.viewed ? 'Yes' : 'No'}</p>
                                    </div>
                                </div>
                            </div>

                            <section className="space-y-3">
                                <h3 className="text-sm uppercase tracking-[0.25em] text-muted-foreground">Clinical Assessment</h3>
                                <p className="text-sm text-slate-700">{selectedReport.summary}</p>
                                <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
                                    <div className="rounded-2xl bg-muted/10 p-4">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Recommendation</p>
                                        <p className="text-sm text-slate-700">{selectedReport.recommendation.action}</p>
                                    </div>
                                    <div className="rounded-2xl bg-muted/10 p-4">
                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Urgency Level</p>
                                        <p className="text-sm text-slate-700">{selectedReport.recommendation.urgencyLevel}</p>
                                    </div>
                                </div>
                            </section>

                            {selectedReport.recommendation.followUpPlan ? (
                                <section className="rounded-2xl bg-muted/10 p-4">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Follow-up Plan</p>
                                    <p className="text-sm text-slate-700">{selectedReport.recommendation.followUpPlan}</p>
                                </section>
                            ) : null}

                            {selectedReport.redFlags?.length ? (
                                <section className="rounded-2xl bg-red-100 border border-red-200 p-4">
                                    <p className="text-[10px] uppercase tracking-widest text-red-700 mb-2">Red Flags</p>
                                    <ul className="list-disc space-y-1 pl-4 text-sm text-red-900">
                                        {selectedReport.redFlags.map((flag, index) => (
                                            <li key={index}>{flag}</li>
                                        ))}
                                    </ul>
                                </section>
                            ) : null}

                            <section className="rounded-2xl bg-muted/10 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Clinician Notes</p>
                                    <span className={`text-[10px] uppercase tracking-widest ${selectedReport.viewerNotes ? 'text-emerald-700' : 'text-muted-foreground'}`}>
                                        {selectedReport.viewerNotes ? 'Added' : 'Not added'}
                                    </span>
                                </div>
                                {selectedReport.viewerNotes ? (
                                    <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">{selectedReport.viewerNotes}</p>
                                ) : (
                                    <p className="mt-3 text-sm text-muted-foreground">No clinician notes have been added to this report yet.</p>
                                )}
                            </section>

                            <div className="flex flex-wrap gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleDelete(selectedReport.id)}>
                                    <Trash2 className="h-4 w-4" />
                                    Delete Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid w-full max-w-full gap-6 lg:grid-cols-[1.2fr_0.8fr] min-w-0">
                    <Card className="w-full max-w-full min-w-0 border border-border/60">
                        <CardContent className="p-0 min-w-0">
                            {patientHistoryGroups.map((group) => {
                                const latest = group.latestReport;
                                const patient = mockPatients.find((p) => p.id === group.patientId);
                                return (
                                    <button
                                        key={group.patientId}
                                        type="button"
                                        className="w-full max-w-full min-w-0 border-b border-border/60 bg-background px-4 py-4 text-left transition hover:bg-muted/30 last:border-b-0"
                                        onClick={() => handleView(latest)}
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                                            <div className="min-w-0 space-y-1">
                                                <p className="text-sm font-semibold text-primary truncate">
                                                    {patient?.name || `Case #${group.patientId.slice(-6)}`}
                                                </p>
                                                <p className="text-sm text-muted-foreground truncate">{latest.summary}</p>
                                            </div>

                                            <div className="flex flex-col items-start gap-2 text-left sm:items-end sm:text-right min-w-0 max-w-full">
                                                <span className="text-sm font-medium text-slate-700 truncate">{format(new Date(latest.date), 'PPP p')}</span>
                                                <div className="flex flex-wrap items-center gap-2 max-w-full">
                                                    <Badge variant={group.unviewedCount > 0 ? 'destructive' : 'secondary'} className="text-[10px] uppercase py-1 px-2">
                                                        {group.unviewedCount > 0 ? 'Not viewed' : 'Viewed'}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] uppercase py-1 px-2">
                                                        {group.reports.length} updates
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card className="w-full max-w-full min-w-0 border border-border/60">
                        <CardContent className="space-y-4 p-4 min-w-0">
                            <div className="text-center text-sm text-muted-foreground">
                                Select a report on the left to view the full submitted details.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/loader';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useClinicianReportsContext } from './clinician-reports-context';
import { submitClinicianReview } from '@/lib/client-api';
import { updateStoredEncounter } from '@/lib/encounter-storage';
import { format, parseISO, isValid } from 'date-fns';

function formatAge(birthDate: string) {
    if (!birthDate) return '??';
    const date = parseISO(birthDate);
    if (!isValid(date)) return '??';
    return new Date().getFullYear() - date.getFullYear();
}

export default function ClinicianDashboardPage() {
    const { loading, reports, patients, newReports, myReports, updateReport } = useClinicianReportsContext();
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeView, setActiveView] = useState('home');
    const [patientId, setPatientId] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const view = params.get('view');
        setActiveView(
            view === 'my-reports'
                ? 'my-reports'
                : view === 'new-reports'
                    ? 'new-reports'
                    : view === 'patients'
                        ? 'patients'
                        : 'home'
        );
        setPatientId(params.get('patientId'));
    }, [pathname]);

    const patientsWithReports = useMemo(
        () => patients
            .map((patient) => ({
                ...patient,
                reportCount: reports.filter((report) => report.patientId === patient.id).length,
            }))
            .filter((patient) => patient.reportCount > 0),
        [patients, reports]
    );

    const selectedPatient = useMemo(
        () => patients.find((patient) => patient.id === patientId) || null,
        [patients, patientId]
    );

    const selectedPatientHistory = useMemo(
        () => reports
            .filter((report) => report.patientId === selectedPatient?.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [reports, selectedPatient]
    );

    const selectedPatientName = useMemo(
        () => selectedReport ? patients.find((patient) => patient.id === selectedReport.patientId)?.name || 'Patient' : 'Patient',
        [selectedReport, patients]
    );

    const handleOpenReport = (report: any) => {
        setSelectedReport(report);
        setNotes(report.clinicianReview?.notes ?? '');
        setShowReportDialog(true);
    };

    const handleSubmitReview = async () => {
        if (!selectedReport) return;
        setSubmitting(true);

        try {
            const response = await submitClinicianReview(selectedReport.id, notes);
            const updatedEncounter = response.encounter;
            updateReport(selectedReport.id, updatedEncounter);
            updateStoredEncounter(selectedReport.id, updatedEncounter);
            setSelectedReport(updatedEncounter);
            toast({ title: 'Review saved', description: 'The clinician review has been recorded successfully.' });
            setShowReportDialog(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Review failed', description: error?.message || 'Unable to save the clinician review.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-6">
            {activeView === 'new-reports' ? (
                <>
                    <div className="rounded-2xl border bg-background p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">New reports awaiting review</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Review CHW reports and add your clinical recommendations.</p>
                    </div>

                    {newReports.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center text-muted-foreground">No new reports awaiting review</div>
                    ) : (
                        <div className="grid gap-4">
                            {newReports.map((report) => {
                                const patient = patients.find((patient) => patient.id === report.patientId);
                                return (
                                    <button
                                        key={report.id}
                                        type="button"
                                        onClick={() => handleOpenReport(report)}
                                        className="w-full rounded-3xl border bg-card/60 p-5 text-left transition hover:border-primary/50"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-base font-semibold text-foreground">{patient?.name || 'Unknown patient'}</p>
                                                <p className="text-sm text-muted-foreground">{new Date(report.date).toLocaleString()}</p>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary">{report.recommendation.urgencyLevel}</Badge>
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground">{report.summary}</p>
                                        <p className="mt-3 text-sm text-foreground font-semibold">Recommendation: {report.recommendation.action}</p>
                                        {report.redFlags?.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {report.redFlags.map((flag: string) => (
                                                    <Badge key={flag} className="bg-red-100 text-red-700">{flag}</Badge>
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : activeView === 'patients' ? (
                selectedPatient ? (
                    <div className="space-y-4">
                        <Button variant="outline" size="sm" onClick={() => router.push('/clinician/dashboard?view=patients')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to patients
                        </Button>

                        <Card className="border border-border/60">
                            <CardHeader>
                                <CardTitle>{selectedPatient.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Age</p>
                                        <p className="mt-1 text-sm text-foreground">{formatAge(selectedPatient.birthDate)} years</p>
                                    </div>
                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Gender</p>
                                        <p className="mt-1 text-sm text-foreground">{selectedPatient.gender}</p>
                                    </div>
                                    <div className="rounded-2xl border bg-muted/20 p-4">
                                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
                                        <p className="mt-1 text-sm text-foreground">{selectedPatient.status}</p>
                                    </div>
                                    {selectedPatient.chwName ? (
                                        <div className="rounded-2xl border bg-muted/20 p-4">
                                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">CHW</p>
                                            <p className="mt-1 text-sm text-foreground">{selectedPatient.chwName}</p>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-3">
                                    {selectedPatientHistory.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center text-muted-foreground">No encounters found for this patient.</div>
                                    ) : (
                                        selectedPatientHistory.map((report) => (
                                            <Card key={report.id} className="border bg-card/60">
                                                <CardContent className="space-y-3">
                                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <p className="text-base font-semibold text-foreground">{new Date(report.date).toLocaleString()}</p>
                                                            <p className="text-sm text-muted-foreground">{report.summary}</p>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge className="bg-primary/10 text-primary">{report.recommendation.urgencyLevel}</Badge>
                                                            <Badge className="bg-muted/10 text-muted-foreground">{report.reviewStatus ?? 'new'}</Badge>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground">Recommendation: {report.recommendation.action}</p>
                                                    {report.reviewStatus === 'reviewed' && report.clinicianReview ? (
                                                        <div className="rounded-2xl border bg-background p-4">
                                                            <p className="text-sm font-semibold text-foreground">Clinician notes</p>
                                                            <p className="mt-2 text-sm text-muted-foreground">{report.clinicianReview.notes}</p>
                                                            <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">Reviewed by {report.clinicianReview.reviewedByName} on {new Date(report.clinicianReview.reviewedAt).toLocaleString()}</p>
                                                        </div>
                                                    ) : null}
                                                    <div className="flex justify-end">
                                                        <Button size="sm" variant="outline" onClick={() => handleOpenReport(report)}>
                                                            View report
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card className="border border-border/60">
                        <CardHeader>
                            <CardTitle>Patients</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {patientsWithReports.map((patient) => (
                                    <button
                                        key={patient.id}
                                        type="button"
                                        onClick={() => router.push(`/clinician/dashboard?view=patients&patientId=${patient.id}`)}
                                        className="flex w-full items-center justify-between rounded-xl border bg-card/60 p-4 text-left transition hover:bg-muted/40"
                                    >
                                        <div>
                                            <p className="font-semibold text-foreground">{patient.name}</p>
                                            <p className="text-sm text-muted-foreground">{patient.status} • {patient.address?.text || 'No address'}</p>
                                        </div>
                                        <Badge className="bg-primary/10 text-primary">{patient.reportCount} reports</Badge>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            ) : activeView === 'my-reports' ? (
                <>
                    <div className="rounded-2xl border bg-background p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">Reports you reviewed</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Access the reports you completed and update your notes if needed.</p>
                    </div>

                    {myReports.length === 0 ? (
                        <div className="rounded-2xl border border-dashed bg-card/40 p-10 text-center text-muted-foreground">You haven't reviewed any reports yet.</div>
                    ) : (
                        <div className="space-y-4">
                            {myReports.map((report) => {
                                const patient = patients.find((patient) => patient.id === report.patientId);
                                return (
                                    <button
                                        key={report.id}
                                        type="button"
                                        onClick={() => handleOpenReport(report)}
                                        className="w-full rounded-3xl border bg-card/60 p-5 text-left transition hover:border-primary/50"
                                    >
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-foreground">{patient?.name || 'Unknown patient'}</p>
                                                <p className="text-sm text-muted-foreground">Reviewed on {report.clinicianReview ? new Date(report.clinicianReview.reviewedAt).toLocaleString() : 'Unknown'}</p>
                                            </div>
                                            <Badge className="bg-primary/10 text-primary">Reviewed</Badge>
                                        </div>
                                        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{report.clinicianReview?.notes || 'No notes yet.'}</p>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </>
            ) : (
                <>
                    <div className="rounded-2xl border bg-background p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">Clinical review overview</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Review CHW reports, manage cases, and keep care moving.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-semibold">New reports</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{newReports.length}</p>
                        </div>
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Clock3 className="h-4 w-4" />
                                <span className="text-sm font-semibold">Pending review</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{newReports.length}</p>
                        </div>
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-semibold">Reviewed</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{myReports.length}</p>
                        </div>
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-semibold">Patients</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{patientsWithReports.length}</p>
                        </div>
                    </div>
                </>
            )}

            {showReportDialog && selectedReport ? (
                <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Report review</DialogTitle>
                            <DialogDescription>{selectedPatientName}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Encounter date</p>
                                    <p className="mt-2 text-sm text-foreground">{new Date(selectedReport.date).toLocaleString()}</p>
                                </div>
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Review status</p>
                                    <p className="mt-2 text-sm text-foreground">{selectedReport.reviewStatus === 'reviewed' ? 'Reviewed' : 'New'}</p>
                                </div>
                            </div>

                            <div className="space-y-2 rounded-2xl border bg-card/60 p-4">
                                <p className="text-sm font-semibold text-foreground">Summary</p>
                                <p className="text-sm text-muted-foreground">{selectedReport.summary}</p>
                            </div>

                            {selectedReport.redFlags?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {selectedReport.redFlags.map((flag: string) => (
                                        <Badge key={flag} className="bg-red-100 text-red-700">{flag}</Badge>
                                    ))}
                                </div>
                            )}

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recommendation</p>
                                    <p className="mt-2 text-sm text-foreground">{selectedReport.recommendation.action}</p>
                                </div>
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Urgency</p>
                                    <p className="mt-2 text-sm text-foreground">{selectedReport.recommendation.urgencyLevel}</p>
                                </div>
                            </div>

                            {selectedReport.recommendation.referralDestination && (
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Referral destination</p>
                                    <p className="mt-2 text-sm text-foreground">{selectedReport.recommendation.referralDestination}</p>
                                </div>
                            )}

                            {selectedReport.recommendation.followUpPlan && (
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Follow-up plan</p>
                                    <p className="mt-2 text-sm text-foreground">{selectedReport.recommendation.followUpPlan}</p>
                                </div>
                            )}

                            {selectedReport.recommendation.safetyAdvice?.length > 0 && (
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Safety advice</p>
                                    <ul className="list-disc pl-5 text-sm text-foreground">
                                        {selectedReport.recommendation.safetyAdvice.map((item: string) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedReport.recommendation.antiStigmaMessages?.length > 0 && (
                                <div className="rounded-2xl border bg-muted/10 p-4">
                                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Anti-stigma messages</p>
                                    <ul className="list-disc pl-5 text-sm text-foreground">
                                        {selectedReport.recommendation.antiStigmaMessages.map((item: string) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="rounded-2xl border bg-muted/10 p-4">
                                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Clinician notes</p>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Enter your review notes here"
                                    rows={6}
                                />
                                {selectedReport.reviewStatus === 'reviewed' && selectedReport.clinicianReview ? (
                                    <p className="mt-2 text-xs text-muted-foreground">Reviewed by {selectedReport.clinicianReview.reviewedByName} on {new Date(selectedReport.clinicianReview.reviewedAt).toLocaleString()}</p>
                                ) : null}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowReportDialog(false)}>
                                Close
                            </Button>
                            <Button type="button" disabled={submitting} onClick={handleSubmitReview}>
                                {selectedReport.reviewStatus === 'reviewed' ? 'Update review' : 'Submit review'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    );
}

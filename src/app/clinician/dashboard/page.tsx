'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStoredUser } from '@/lib/client-api';
import { PageLoader } from '@/components/ui/loader';
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3, Users } from 'lucide-react';
import { mockEncounters, mockPatients } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { mergeStoredEncounters } from '@/lib/encounter-storage';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

function ClinicianDashboardContent({
    reports,
    selectedReport,
    setSelectedReport,
    showReportDialog,
    setShowReportDialog,
    profile,
}: {
    reports: any[];
    selectedReport: any | null;
    setSelectedReport: (report: any | null) => void;
    showReportDialog: boolean;
    setShowReportDialog: (value: boolean) => void;
    profile: {
        name: string;
        role: string;
        facilityCode: string;
        county: string;
        specialty: string;
    };
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [activeView, setActiveView] = useState('home');
    const [patientId, setPatientId] = useState<string | null>(null);

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
    const chwSubmittedReports = reports.filter((encounter) => encounter.authorRole?.toUpperCase() === 'CHW' || encounter.authorRole?.toLowerCase() === 'chw');
    const reviewedReports = chwSubmittedReports.slice(0, 2);
    const reviewedPatients = mockPatients.map((patient) => ({
        ...patient,
        reportCount: chwSubmittedReports.filter((report) => report.patientId === patient.id).length,
    }));
    const selectedPatient = reviewedPatients.find((patient) => patient.id === patientId) || null;
    const selectedPatientHistory = chwSubmittedReports.filter((report) => report.patientId === selectedPatient?.id);
    const selectedPatientName = selectedReport ? mockPatients.find((patient) => patient.id === selectedReport.patientId)?.name || 'Patient' : 'Patient';

    return (
        <div className="space-y-6">
            {activeView === 'patients' ? (
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
                                <div className="rounded-2xl border bg-muted/20 p-4">
                                    <p className="text-sm text-muted-foreground">Patient history</p>
                                    <p className="mt-1 text-lg font-semibold text-foreground">{selectedPatientHistory.length} reviewed report{selectedPatientHistory.length === 1 ? '' : 's'}</p>
                                </div>

                                <div className="space-y-3">
                                    {selectedPatientHistory.map((report) => (
                                        <div key={report.id} className="rounded-xl border bg-card/60 p-4">
                                            <p className="font-semibold text-foreground">{report.id}</p>
                                            <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
                                            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-primary">
                                                {report.recommendation.urgencyLevel}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <Card className="border border-border/60">
                        <CardHeader>
                            <CardTitle>Patients reviewed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {reviewedPatients.map((patient) => (
                                    <button
                                        key={patient.id}
                                        type="button"
                                        onClick={() => router.push(`/clinician/dashboard?view=patients&patientId=${patient.id}`)}
                                        className="flex w-full items-center justify-between rounded-xl border bg-card/60 p-4 text-left transition hover:bg-muted/40"
                                    >
                                        <div>
                                            <p className="font-semibold text-foreground">{patient.name}</p>
                                            <p className="text-sm text-muted-foreground">{patient.address?.text || 'No address listed'}</p>
                                        </div>
                                        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                            {patient.status}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )
            ) : activeView === 'home' ? (
                <>
                    <div className="rounded-2xl border bg-background p-4 shadow-sm">
                        <h2 className="text-lg font-semibold text-foreground">Clinical review overview</h2>
                        <p className="mt-1 text-sm text-muted-foreground">Track CHW-submitted reports, review pending cases, and monitor patients under care.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-sm font-semibold">New reports</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{chwSubmittedReports.length}</p>
                        </div>
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Clock3 className="h-4 w-4" />
                                <span className="text-sm font-semibold">Pending review</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{Math.max(chwSubmittedReports.length - 2, 0)}</p>
                        </div>
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm font-semibold">Reviewed</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{reviewedReports.length}</p>
                        </div>
                        <div className="rounded-2xl border bg-background p-4">
                            <div className="flex items-center gap-2 text-primary">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-semibold">Patients</span>
                            </div>
                            <p className="mt-2 text-2xl font-semibold">{mockPatients.length}</p>
                        </div>
                    </div>

                    <Card className="border border-border/60">
                        <CardHeader>
                            <CardTitle>New Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {chwSubmittedReports.map((report) => (
                                    <button
                                        key={report.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setShowReportDialog(true);
                                        }}
                                        className="w-full rounded-xl border bg-card/60 p-4 text-left transition hover:bg-muted/40"
                                    >
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="font-semibold text-foreground">{report.id} • {mockPatients.find((patient) => patient.id === report.patientId)?.name || 'Patient'}</p>
                                                <p className="mt-1 text-sm text-muted-foreground">{report.summary}</p>
                                            </div>
                                            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                                {report.recommendation.urgencyLevel}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            ) : null}

            {showReportDialog && selectedReport ? (
                <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Report summary</DialogTitle>
                            <DialogDescription>{selectedPatientName}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-semibold text-foreground">Summary</p>
                                <p className="text-sm text-muted-foreground mt-1">{selectedReport.summary}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Urgency</p>
                                <p className="text-sm text-muted-foreground mt-1">{selectedReport.recommendation.urgencyLevel}</p>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setShowReportDialog(false)}>Close</Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            ) : null}
        </div>
    );
}

export default function ClinicianDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<any[]>([]);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [profile, setProfile] = useState({
        name: 'Dr. Antony Ngemu',
        role: 'Clinician',
        facilityCode: '13077',
        county: 'Nairobi',
        specialty: 'Clinical Review / Neurology Support',
    });
    const router = useRouter();

    useEffect(() => {
        const sessionUser = getStoredUser();
        if (!sessionUser || sessionUser.role !== 'clinician') {
            router.push('/clinician');
            return;
        }

        setProfile({
            name: sessionUser.name || 'Dr. Antony Ngemu',
            role: 'Clinician',
            facilityCode: sessionUser.facilityCode || '13077',
            county: sessionUser.county || sessionUser.location || 'Nairobi',
            specialty: sessionUser.specialty || 'Clinical Review / Neurology Support',
        });
        const seededReports = mockEncounters.map((encounter) => ({ ...encounter, viewed: false, viewerNotes: '' }));
        setReports(mergeStoredEncounters(seededReports));
        setLoading(false);
    }, [router]);

    if (loading) {
        return <PageLoader />;
    }

    return (
        <Suspense fallback={<PageLoader />}>
            <ClinicianDashboardContent
                reports={reports}
                selectedReport={selectedReport}
                setSelectedReport={setSelectedReport}
                showReportDialog={showReportDialog}
                setShowReportDialog={setShowReportDialog}
                profile={profile}
            />
        </Suspense>
    );
}

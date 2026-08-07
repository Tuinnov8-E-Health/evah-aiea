'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchEncounters, getStoredUser } from '@/lib/client-api';
import { mergeStoredEncounters } from '@/lib/encounter-storage';
import { mockEncounters, mockPatients } from '@/lib/mock-data';
import type { Encounter } from '@/lib/types';

export type ClinicianReportsContextValue = {
    loading: boolean;
    user: UserSession | null;
    reports: Encounter[];
    patients: typeof mockPatients;
    newReports: Encounter[];
    myReports: Encounter[];
    newReportsCount: number;
    myReportsCount: number;
    urgentFlagsCount: number;
    activeView: 'home' | 'new-reports' | 'patients' | 'my-reports';
    patientId: string | null;
    updateReport: (encounterId: string, updates: Partial<Encounter>) => void;
};

const ClinicianReportsContext = createContext<ClinicianReportsContextValue | undefined>(undefined);

function normalizeReviewStatus(report: Encounter) {
    return {
        ...report,
        reviewStatus: report.reviewStatus ?? 'new',
    };
}

export function ClinicianReportsProvider({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const activeView = searchParams.get('view') === 'my-reports'
        ? 'my-reports'
        : searchParams.get('view') === 'new-reports'
            ? 'new-reports'
            : searchParams.get('view') === 'patients'
                ? 'patients'
                : 'home';
    const patientId = searchParams.get('patientId');

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserSession | null>(null);
    const [reports, setReports] = useState<Encounter[]>([]);

    useEffect(() => {
        const sessionUser = getStoredUser();
        if (!sessionUser || sessionUser.role !== 'clinician') {
            setLoading(false);
            return;
        }

        setUser(sessionUser);

        const loadReports = async () => {
            let serverReports: Encounter[] = [];

            try {
                const response = await fetchEncounters();
                serverReports = (response?.encounters ?? []).map((report: any) => normalizeReviewStatus(report));
            } catch {
                serverReports = [];
            }

            const seedReports = mockEncounters.map((encounter) => normalizeReviewStatus(encounter as Encounter));
            const merged = mergeStoredEncounters(seedReports, undefined, serverReports).map(normalizeReviewStatus);
            setReports(merged);
            setLoading(false);
        };

        void loadReports();
    }, []);

    const normalizedReports = useMemo(() => reports.map(normalizeReviewStatus), [reports]);

    const chwSubmittedReports = useMemo(
        () => normalizedReports.filter(
            (report) => report.authorRole?.toLowerCase() === 'chw' || report.authorRole?.toUpperCase() === 'CHW'
        ),
        [normalizedReports]
    );

    const newReports = useMemo(
        () => [...chwSubmittedReports].filter((report) => report.reviewStatus !== 'reviewed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [chwSubmittedReports]
    );

    const myReports = useMemo(
        () => [...chwSubmittedReports]
            .filter((report) => report.reviewStatus === 'reviewed' && report.clinicianReview?.reviewedById === user?.id)
            .sort((a, b) => new Date(b.clinicianReview?.reviewedAt ?? '').getTime() - new Date(a.clinicianReview?.reviewedAt ?? '').getTime()),
        [chwSubmittedReports, user]
    );

    const urgentFlagsCount = useMemo(
        () => newReports.reduce((count, report) => count + ((report.redFlags?.length ?? 0) > 0 ? 1 : 0), 0),
        [newReports]
    );

    const updateReport = (encounterId: string, updates: Partial<Encounter>) => {
        setReports((current) => current.map((report) => (report.id === encounterId ? { ...report, ...updates } : report)));
    };

    const value = useMemo(
        () => ({
            loading,
            user,
            reports: normalizedReports,
            patients: mockPatients,
            newReports,
            myReports,
            newReportsCount: newReports.length,
            myReportsCount: myReports.length,
            urgentFlagsCount,
            activeView,
            patientId,
            updateReport,
        }),
        [loading, user, normalizedReports, newReports, myReports, urgentFlagsCount, activeView, patientId]
    );

    return <ClinicianReportsContext.Provider value={value}>{children}</ClinicianReportsContext.Provider>;
}

export function useClinicianReportsContext() {
    const context = useContext(ClinicianReportsContext);
    if (!context) {
        throw new Error('useClinicianReportsContext must be used within a ClinicianReportsProvider');
    }
    return context;
}

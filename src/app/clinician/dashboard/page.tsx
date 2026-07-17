'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getStoredUser } from '@/lib/client-api';
import { PageLoader } from '@/components/ui/loader';

export default function ClinicianDashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const sessionUser = getStoredUser();
        if (!sessionUser || sessionUser.role !== 'clinician') {
            router.push('/clinician');
            return;
        }

        setLoading(false);
    }, [router]);

    if (loading) {
        return <PageLoader />;
    }

    return (
        <div className="space-y-6">
            <Card className="border border-border/60">
                <CardHeader>
                    <CardTitle>Clinician Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-700">
                        This clinician workspace is separate from the CHW UI. Reports submitted by CHWs will be reviewed and annotated here, with clinician notes and certification as the top priority.
                    </p>
                </CardContent>
            </Card>

            <Card className="border border-border/60">
                <CardHeader>
                    <CardTitle>Next steps</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-slate-700">
                        A dedicated clinician report inbox and edit experience will be built under this route. Until then, the clinician section remains isolated from CHW routes.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

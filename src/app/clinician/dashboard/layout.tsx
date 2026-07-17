import type { ReactNode } from 'react';

export default function ClinicianDashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-muted/10">
            <div className="flex min-h-screen flex-col">
                <header className="border-b bg-background/90 px-4 py-4 shadow-sm">
                    <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Clinician Workspace</p>
                            <h1 className="text-2xl font-headline font-bold text-primary">Clinician Dashboard</h1>
                        </div>
                        <div className="rounded-2xl bg-primary/5 px-3 py-2 text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                            Reports first • CHW report review
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4">
                    <div className="mx-auto max-w-5xl">{children}</div>
                </main>
            </div>
        </div>
    );
}

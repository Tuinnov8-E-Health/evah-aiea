import Link from 'next/link';
import { HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';

const cards = [
  {
    href: '/login',
    title: 'Community Health Worker',
    description: 'Field screening and encounter reporting',
    icon: HeartPulse,
    accent: false,
  },
  {
    href: '/clinician',
    title: 'Clinician',
    description: 'Review CHW reports and guide next steps',
    icon: Stethoscope,
    accent: true,
  },
  {
    href: '/admin/login',
    title: 'Administrator',
    description: 'System oversight and account management',
    icon: ShieldCheck,
    accent: false,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <Logo />
        </header>

        <section className="mx-auto mt-16 max-w-3xl">
          <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            Community health platform
          </span>
          <h1 className="mt-6 text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">
            AI-assisted epilepsy care, from community to clinic
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            AIEA connects community health workers and clinicians on one platform, from first seizure screening in the field to clinical review and follow-up care.
          </p>
        </section>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Sign in to your portal
            </p>
          </div>

          <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} className="group">
                  <Card className={`h-full rounded-3xl border ${card.accent ? 'border-2 border-accent' : ''}`}>
                    <CardContent className="flex h-full flex-col gap-6">
                      <div />

                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${card.accent ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold text-foreground">{card.title}</CardTitle>
                          <CardDescription className="mt-2 text-sm text-muted-foreground">
                            {card.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Not registered as a health worker?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Join the mission
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '@/lib/client-api';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSubmitted(true);
      toast({ title: 'Request Sent', description: 'If an account exists, a reset link has been sent.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to request reset.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-12">
          <Logo />
        </div>
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 text-center">
            <CardTitle className="text-3xl font-headline font-bold text-primary">Reset Password</CardTitle>
            <CardDescription className="text-lg">
              {submitted ? "Check your email for the reset link." : "Enter your email address and we'll send you a link to reset your password."}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 mt-4">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="h-12 text-lg"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-primary h-14 text-xl font-headline shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <Button variant="outline" className="w-full h-14" onClick={() => setSubmitted(false)}>
                  Send Again
                </Button>
              </div>
            )}
            <div className="text-center mt-6">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

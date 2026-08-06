'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '@/lib/client-api';

function ResetPasswordForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'Passwords do not match.' });
      return;
    }

    if (!uid || !token) {
      toast({ variant: 'destructive', title: 'Error', description: 'Invalid reset link. Missing token.' });
      return;
    }

    setLoading(true);

    try {
      await resetPassword(uid, token, password);
      toast({ title: 'Success', description: 'Your password has been reset. You can now log in.' });
      router.push('/login');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error?.message || 'Failed to reset password.' });
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="text-center p-4">
        <p className="text-destructive mb-4 font-semibold">Invalid or missing reset token.</p>
        <Button onClick={() => router.push('/login/forgot-password')} variant="outline">
          Request New Link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            className="h-12 text-lg pr-10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            className="h-12 text-lg pr-10"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-primary h-14 text-xl font-headline shadow-lg shadow-primary/20" disabled={loading}>
        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Reset Password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-12">
          <Logo />
        </div>
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 text-center">
            <CardTitle className="text-3xl font-headline font-bold text-primary">Set New Password</CardTitle>
            <CardDescription className="text-lg">
              Please enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 mt-4">
            <Suspense fallback={<div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

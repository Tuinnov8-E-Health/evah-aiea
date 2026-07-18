'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key, UserCheck, Shield, Eye, EyeOff } from 'lucide-react';
import { login, saveSession } from '@/lib/client-api';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('ChangeMe123');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await login(phoneNumber, password);
      saveSession(response.token, response.user);
      toast({ title: 'Login Success', description: `Logged in as ${response.user.role.toUpperCase()}` });
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Login Failed', description: error?.message || 'Unable to authenticate.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    setLoading(true);

    const demoUsers: Record<string, { id: string; name: string; email: string; role: string; imageUrl: string; location: string }> = {
      'chw-minimal': {
        id: 'user-chw-minimal',
        name: 'Amina Njoroge',
        email: 'chw-minimal@demo.ai',
        role: 'chw',
        imageUrl: '',
        location: '',
      },
    };

    try {
      const demoUser = demoUsers[role];
      if (!demoUser) throw new Error('Invalid demo role');
      saveSession(`demo-token-${demoUser.id}`, demoUser);
      localStorage.setItem('demo_role', demoUser.role);
      localStorage.setItem('is_demo', 'true');
      toast({ title: 'Demo Login', description: `Logged in as ${role.toUpperCase()}` });
      window.location.href = '/dashboard';
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Demo Login Failed', description: error?.message || 'Unable to authenticate demo user.' });
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
            <CardTitle className="text-3xl font-headline font-bold text-primary">Secure Login</CardTitle>
            <CardDescription className="text-lg">Sign in with a registered account to access the dashboard.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+254700000001"
                  className="h-12 text-lg"
                  value={phoneNumber}
                  onChange={(e) => {
                    const nextPhone = e.target.value;
                    setPhoneNumber(nextPhone);
                    if (nextPhone.trim()) {
                      setPassword('ChangeMe123');
                    }
                  }}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-sm text-primary/60 font-semibold cursor-pointer">Forgot?</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="h-12 text-lg pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary h-14 text-xl font-headline shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Log In'}
              </Button>
            </form>

            <div className="pt-6 border-t mt-6">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-3 text-center tracking-widest">Demo Account</p>
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="text-[10px] h-14 flex flex-col gap-1" onClick={() => handleDemoLogin('chw-minimal')}>
                  <UserCheck className="h-4 w-4 text-blue-600" /> CHW Minimal
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-0 flex flex-col gap-6 mt-6">
            <div className="text-center text-sm text-muted-foreground font-medium">
              Not registered?{' '}
              <Link href="/register" className="font-bold text-primary hover:underline underline-offset-4">
                Join the Mission
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

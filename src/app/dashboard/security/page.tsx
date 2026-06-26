'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Lock, Mail, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';

type ActiveSection = null | 'password' | 'email' | 'phone';

export default function SecurityPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ActiveSection>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Email change state
  const [emailData, setEmailData] = useState({
    newEmail: '',
    verificationCode: '',
    step: 1 as 1 | 2,
  });

  // Phone change state
  const [phoneData, setPhoneData] = useState({
    newPhone: '',
    verificationCode: '',
    step: 1 as 1 | 2,
  });

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setActiveSection(null);
      alert('Password changed successfully');
    }, 1000);
  };

  const handleSendEmailCode = async () => {
    setIsLoading(true);
    // Simulate sending verification code
    setTimeout(() => {
      setIsLoading(false);
      setEmailData((prev) => ({ ...prev, step: 2 }));
    }, 1000);
  };

  const handleVerifyEmailCode = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Email changed successfully');
      setEmailData({
        newEmail: '',
        verificationCode: '',
        step: 1,
      });
      setActiveSection(null);
    }, 1000);
  };

  const handleSendPhoneCode = async () => {
    setIsLoading(true);
    // Simulate sending verification code
    setTimeout(() => {
      setIsLoading(false);
      setPhoneData((prev) => ({ ...prev, step: 2 }));
    }, 1000);
  };

  const handleVerifyPhoneCode = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      alert('Phone number changed successfully');
      setPhoneData({
        newPhone: '',
        verificationCode: '',
        step: 1,
      });
      setActiveSection(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 py-6 border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-semibold">Security Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          {activeSection === 'password' && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveSection(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePasswordChange}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          )}
          {activeSection !== 'password' && (
            <CardContent>
              <Button
                onClick={() => setActiveSection('password')}
                variant="outline"
                className="w-full"
              >
                Change Password
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Change Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Change Email
            </CardTitle>
            <CardDescription>
              Update your email address with verification
            </CardDescription>
          </CardHeader>
          {activeSection === 'email' && (
            <CardContent className="space-y-4">
              {emailData.step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-email">New Email Address</Label>
                    <Input
                      id="new-email"
                      type="email"
                      placeholder="Enter new email"
                      value={emailData.newEmail}
                      onChange={(e) =>
                        setEmailData((prev) => ({
                          ...prev,
                          newEmail: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Alert>
                    <AlertDescription>
                      A verification code will be sent to your new email address
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveSection(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmailCode}
                      disabled={isLoading || !emailData.newEmail}
                      className="flex-1"
                    >
                      {isLoading ? 'Sending...' : 'Send Code'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      Verification code sent to {emailData.newEmail}
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="email-code">Verification Code</Label>
                    <Input
                      id="email-code"
                      placeholder="Enter 6-digit code"
                      value={emailData.verificationCode}
                      onChange={(e) =>
                        setEmailData((prev) => ({
                          ...prev,
                          verificationCode: e.target.value,
                        }))
                      }
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setEmailData((prev) => ({ ...prev, step: 1 }))
                      }
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyEmailCode}
                      disabled={isLoading || emailData.verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Update'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          )}
          {activeSection !== 'email' && (
            <CardContent>
              <Button
                onClick={() => setActiveSection('email')}
                variant="outline"
                className="w-full"
              >
                Change Email
              </Button>
            </CardContent>
          )}
        </Card>

        {/* Change Phone Number */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Change Phone Number
            </CardTitle>
            <CardDescription>
              Update your phone number with verification
            </CardDescription>
          </CardHeader>
          {activeSection === 'phone' && (
            <CardContent className="space-y-4">
              {phoneData.step === 1 ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="new-phone">New Phone Number</Label>
                    <Input
                      id="new-phone"
                      type="tel"
                      placeholder="Enter new phone number"
                      value={phoneData.newPhone}
                      onChange={(e) =>
                        setPhoneData((prev) => ({
                          ...prev,
                          newPhone: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Alert>
                    <AlertDescription>
                      A verification code will be sent via SMS to your new number
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setActiveSection(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendPhoneCode}
                      disabled={isLoading || !phoneData.newPhone}
                      className="flex-1"
                    >
                      {isLoading ? 'Sending...' : 'Send Code'}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Alert>
                    <AlertDescription>
                      Verification code sent to {phoneData.newPhone}
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="phone-code">Verification Code</Label>
                    <Input
                      id="phone-code"
                      placeholder="Enter 6-digit code"
                      value={phoneData.verificationCode}
                      onChange={(e) =>
                        setPhoneData((prev) => ({
                          ...prev,
                          verificationCode: e.target.value,
                        }))
                      }
                      maxLength={6}
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPhoneData((prev) => ({ ...prev, step: 1 }))
                      }
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyPhoneCode}
                      disabled={isLoading || phoneData.verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {isLoading ? 'Verifying...' : 'Verify & Update'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          )}
          {activeSection !== 'phone' && (
            <CardContent>
              <Button
                onClick={() => setActiveSection('phone')}
                variant="outline"
                className="w-full"
              >
                Change Phone Number
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

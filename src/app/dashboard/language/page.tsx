'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
];

export default function LanguagePage() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to save language preference
    setTimeout(() => {
      setIsSaving(false);
      // In a real app, you would update the i18n configuration here
      router.back();
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
        <h1 className="text-2xl font-semibold">Language Settings</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Language Selection */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Select Your Language
            </h2>
            <p className="text-sm text-muted-foreground">
              Choose your preferred language for the application interface
            </p>

            <div className="space-y-2 pt-4">
              {AVAILABLE_LANGUAGES.map((language) => (
                <div
                  key={language.code}
                  onClick={() => setSelectedLanguage(language.code)}
                  className="flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all hover:bg-muted/50"
                  style={{
                    borderColor:
                      selectedLanguage === language.code
                        ? 'hsl(var(--primary))'
                        : 'hsl(var(--border))',
                    backgroundColor:
                      selectedLanguage === language.code
                        ? 'hsl(var(--primary) / 0.05)'
                        : 'transparent',
                  }}
                >
                  <div className="flex-1">
                    <p className="font-medium">{language.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {language.nativeName}
                    </p>
                  </div>
                  {selectedLanguage === language.code && (
                    <div className="bg-primary rounded-full p-1">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? 'Saving...' : 'Save Language'}
          </Button>
        </div>
      </div>
    </div>
  );
}

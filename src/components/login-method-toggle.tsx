'use client';

import { cn } from '@/lib/utils';

type LoginMethod = 'phone' | 'email';

type LoginMethodToggleProps = {
  value: LoginMethod;
  onChange: (value: LoginMethod) => void;
};

export function LoginMethodToggle({ value, onChange }: LoginMethodToggleProps) {
  return (
    <div className="grid grid-cols-2 rounded-md bg-muted p-1" role="group" aria-label="Login method">
      {(['phone', 'email'] as const).map((method) => (
        <button
          key={method}
          type="button"
          aria-pressed={value === method}
          onClick={() => onChange(method)}
          className={cn(
            'rounded-sm px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            value === method
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {method === 'phone' ? 'Phone' : 'Email'}
        </button>
      ))}
    </div>
  );
}

'use client';

import { SerwistProvider as Serwist } from '@serwist/next/react';
import type { ReactNode } from 'react';

export function SerwistProvider({ children }: { children: ReactNode }) {
  return (
    <Serwist swUrl="/sw.js" disable={process.env.NODE_ENV === 'development'}>
      {children}
    </Serwist>
  );
}

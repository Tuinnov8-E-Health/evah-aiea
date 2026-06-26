
import type { Metadata } from 'next';
import { Poppins, PT_Sans } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

const fontPTSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
});

export const metadata: Metadata = {
  title: 'AI Epilepsy Assistant (AIEA)',
  description:
    'Helping community health workers manage epilepsy in remote areas with AI-guided tools.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=PT+Sans:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const suppressExtensionErrors = (e) => {
                  const isExtensionError = 
                    (e.message && (e.message.includes('MetaMask') || e.message.includes('extension'))) ||
                    (e.filename && e.filename.includes('chrome-extension')) ||
                    (e.reason && e.reason.stack && e.reason.stack.includes('chrome-extension'));
                  
                  if (isExtensionError) {
                    e.stopImmediatePropagation();
                    if (e.preventDefault) e.preventDefault();
                    return true;
                  }
                  return false;
                };

                window.addEventListener('error', suppressExtensionErrors, true);
                window.addEventListener('unhandledrejection', suppressExtensionErrors, true);
              })();
            `,
          }}
        />
      </head>
      <body
        className={cn(
          'min-h-screen bg-muted/30 font-body antialiased',
          fontPoppins.variable,
          fontPTSans.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}


import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { PWAInstallProvider } from '@/components/pwa-install-provider';
import { MoodProvider } from '@/components/mood-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { ChatSelectionProvider } from '@/components/chat-selection-provider';

export const metadata: Metadata = {
  title: 'Z Messenger',
  description: 'A modern messaging app with AI-powered features.',
  manifest: '/manifest.json',
  icons: {
    apple: '/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <PWAInstallProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
            >
              <MoodProvider>
                <ChatSelectionProvider>
                  {children}
                </ChatSelectionProvider>
                <Toaster />
              </MoodProvider>
            </ThemeProvider>
          </PWAInstallProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

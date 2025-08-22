
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { AuditLogProvider } from '@/contexts/audit-log-context';
import { SettingsProvider } from '@/contexts/settings-context';

export const metadata: Metadata = {
  title: 'Ted 1.0',
  description: 'Plataforma de Gestão de Iniciativas Estratégicas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AuditLogProvider>
              <SettingsProvider>
                {children}
                <Toaster />
              </SettingsProvider>
            </AuditLogProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

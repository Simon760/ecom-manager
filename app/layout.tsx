import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: 'EcomManager — Gestion e-commerce',
  description: 'Application interne de gestion e-commerce : tracker, calculateur, P&L, créatives.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        {/* Supprime les erreurs causées par les extensions Chrome (ex: wallets crypto) */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('error', function(e) {
            if (e.message && e.message.includes('ethereum')) e.stopImmediatePropagation();
          }, true);
        `}} />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

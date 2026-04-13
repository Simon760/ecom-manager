'use client'
// Layout partagé pour toutes les pages protégées
// Monté UNE SEULE FOIS — le sidebar persiste entre les navigations
import AppLayout from '@/components/layout/AppLayout'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}

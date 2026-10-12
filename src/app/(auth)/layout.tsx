import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'FinancasCasa — Acesso',
  description: 'Acesse sua conta ou crie um workspace familiar no FinancasCasa.',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthProvider>
        {children}
      </AuthProvider>
    </div>
  )
}

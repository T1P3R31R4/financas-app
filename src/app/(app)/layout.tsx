import type { Metadata } from 'next'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { AuthProvider } from '@/components/auth-provider'

export const metadata: Metadata = {
  title: 'FinancasCasa — Portal da Família',
  description: 'Gestão financeira moderna e compartilhada para famílias.',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-foreground flex flex-col md:flex-row h-screen overflow-hidden">
      <AuthProvider>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <MobileNav />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>
      </AuthProvider>
    </div>
  )
}

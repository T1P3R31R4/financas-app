import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinancasCasa - Controle Financeiro SaaS Multi-Tenant',
  description: 'Gestão financeira moderna e compartilhada para famílias e projetos.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.className} bg-background text-foreground flex flex-col md:flex-row h-screen overflow-hidden`}>
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <MobileNav />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

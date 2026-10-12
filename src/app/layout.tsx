import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinancasCasa — Controle Financeiro SaaS Multi-Tenant',
  description: 'Gestão financeira moderna e compartilhada para famílias e projetos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}


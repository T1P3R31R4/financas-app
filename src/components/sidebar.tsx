'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, List, Briefcase, Users, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/lancamentos', label: 'Lançamentos', icon: List },
  { href: '/renda-variavel', label: 'Renda Variável', icon: Briefcase, highlight: true },
  { href: '/membros', label: 'Membros', icon: Users },
  { href: '/admin', label: 'Painel Admin', icon: ShieldCheck, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
          FinancasCasa
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">SaaS Multi-Tenant Financeiro</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, highlight, adminOnly }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                highlight && !isActive && 'text-emerald-400 hover:text-emerald-300',
                adminOnly && !isActive && 'text-indigo-400 hover:text-indigo-300'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {adminOnly && (
                <span className="ml-auto text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-semibold border border-indigo-500/20">
                  Admin
                </span>
              )}
              {isActive && !adminOnly && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground border-t border-border flex items-center justify-between">
        <span>FinancasCasa SaaS</span>
        <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-mono">v1.0-pg</span>
      </div>
    </aside>
  )
}

'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Home, List, Briefcase, Users, FileText, Settings, ShieldCheck, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/lancamentos', label: 'Lançamentos', icon: List },
  { href: '/renda-variavel', label: 'Renda Variável', icon: Briefcase, highlight: true },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/membros', label: 'Membros', icon: Users },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/admin', label: 'Painel Admin', icon: ShieldCheck, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role || 'USER'
  const userName = session?.user?.name || 'Família'
  const userEmail = session?.user?.email || 'portal@financascasa.com'

  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return userRole === 'ADMIN'
    }
    return true
  })

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col shrink-0">
      {/* Top Branding */}
      <div className="p-6 border-b border-border">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-indigo-400 to-primary bg-clip-text text-transparent">
          FinancasCasa
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">SaaS Financeiro Multi-Tenant</p>
      </div>

      {/* Navegação Principal */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map(({ href, label, icon: Icon, highlight, adminOnly }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
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

      {/* Footer com Perfil do Usuário e Botão de Sair */}
      <div className="p-4 border-t border-border bg-card/60 space-y-3">
        <div className="flex items-center justify-between">
          <Link href="/configuracoes" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">
                {userName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sair da Conta (Sign Out)"
            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

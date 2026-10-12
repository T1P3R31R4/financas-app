'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Home, List, Briefcase, FileText, Settings, ShieldCheck, Menu, X, LogOut } from 'lucide-react'
import { navItems } from '@/components/sidebar'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()

  const userRole = (session?.user as any)?.role || 'USER'
  const userName = session?.user?.name || 'Família'
  const userEmail = session?.user?.email || 'portal@financascasa.com'

  const bottomItems = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/lancamentos', label: 'Lançamentos', icon: List },
    { href: '/renda-variavel', label: 'Renda Var.', icon: Briefcase },
    { href: '/relatorios', label: 'Relatórios', icon: FileText },
    { href: '/configuracoes', label: 'Ajustes', icon: Settings },
  ]

  const visibleNavItems = navItems.filter(item => {
    if (item.adminOnly) {
      return userRole === 'ADMIN'
    }
    return true
  })

  return (
    <>
      {/* Top Header Mobile */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
            FinancasCasa
          </span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-medium">
            SaaS
          </span>
          {userRole === 'ADMIN' && (
            <span className="text-[10px] bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded font-semibold border border-indigo-500/20">
              Admin
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-md hover:bg-accent text-foreground transition-colors"
            aria-label="Abrir menu"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Drawer / Sheet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-card border-r border-border p-6 shadow-xl flex flex-col justify-between"
            onClick={e => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
                    FinancasCasa
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Menu de Navegação</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-6 space-y-1.5">
                {visibleNavItems.map(({ href, label, icon: Icon, highlight, adminOnly }) => {
                  const isActive = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        highlight && !isActive && 'text-emerald-400',
                        adminOnly && !isActive && 'text-indigo-400'
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{label}</span>
                      {adminOnly && (
                        <span className="ml-auto text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-semibold border border-indigo-500/20">
                          Admin
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Footer com Usuário e Logout */}
            <div className="pt-4 border-t border-border space-y-3">
              <div className="flex items-center justify-between">
                <Link
                  href="/configuracoes"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-foreground">
                      {userName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
                  </div>
                </Link>

                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  title="Sair da Conta"
                  className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <div className="text-[10px] text-muted-foreground flex items-center justify-between pt-1">
                <span>FinancasCasa Mobile</span>
                <span className="font-mono text-primary">v2.5 SaaS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar para Acesso Rápido com Polegar no Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around py-1.5 px-1 pb-safe">
        {bottomItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-md transition-colors text-[10px] font-medium gap-0.5',
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Link>
          )
        })}

        {userRole === 'ADMIN' && (
          <Link
            href="/admin"
            className={cn(
              'flex flex-col items-center justify-center py-1 px-2 rounded-md transition-colors text-[10px] font-medium gap-0.5',
              pathname.startsWith('/admin')
                ? 'text-indigo-400 font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin</span>
          </Link>
        )}
      </nav>
    </>
  )
}

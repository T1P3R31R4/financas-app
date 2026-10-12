import { ReactNode } from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowLeft, Activity, Users, Database } from 'lucide-react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Top Banner de Navegação Administrativa Isolada */}
      <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2.5 flex items-center justify-between text-xs mb-6">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>PAINEL ADMINISTRATIVO GLOBAL</span>
          <span className="text-muted-foreground hidden sm:inline">| Controle SaaS & Telemetria</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-accent/60 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors font-medium text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Portal da Família
          </Link>
        </div>
      </div>

      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}

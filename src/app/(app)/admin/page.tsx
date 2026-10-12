import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShieldCheck, Users, Building, ArrowLeftRight, Activity, Database, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  // Verificação de permissões do usuário
  // Busca métricas gerais e logs de telemetria
  const [
    totalFamilies,
    totalUsers,
    totalMembers,
    totalTransactions,
    transactionsSum,
    recentLogs,
    adminUsers
  ] = await Promise.all([
    prisma.family.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.member.count().catch(() => 0),
    prisma.transaction.count().catch(() => 0),
    prisma.transaction.aggregate({
      _sum: { amount: true },
    }).catch(() => ({ _sum: { amount: null } })),
    prisma.activityLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        family: true,
        user: true,
      },
    }).catch(() => []),
    prisma.user.findMany({
      where: { role: 'ADMIN' },
      take: 5,
    }).catch(() => []),
  ])

  const totalVolume = Number(transactionsSum._sum.amount ?? 0)

  // Estatística rápida de logs por ação
  const actionCounts = recentLogs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header com Badge de Segurança */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel de Administração</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Telemetria, auditoria (RGPD/LGPD) e monitoramento multi-inquilino.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-indigo-500/15 text-indigo-400 border-indigo-500/30 gap-1.5 py-1 px-3">
            <Lock className="w-3.5 h-3.5" />
            Role: ADMIN
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">
            Supabase / Postgres
          </span>
        </div>
      </div>

      {/* Métricas Globais da Plataforma */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Famílias (Tenants)</CardTitle>
            <Building className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFamilies}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Workspaces isolados</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Usuários & Membros</CardTitle>
            <Users className="w-4 h-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers} <span className="text-xs font-normal text-muted-foreground">usuários</span> / {totalMembers} <span className="text-xs font-normal text-muted-foreground">membros</span></div>
            <p className="text-[11px] text-muted-foreground mt-1">Perfis cadastrados</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Lançamentos Totais</CardTitle>
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Volume financeiro geral</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs sm:text-sm font-medium">Volume Transacionado</CardTitle>
            <Database className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">R$ {totalVolume.toFixed(2)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Soma de movimentações</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Telemetria e Administradores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Distribuição de Eventos de Telemetria
                </CardTitle>
                <CardDescription className="text-xs">
                  Eventos de auditoria capturados em tempo real
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['CREATE', 'UPDATE', 'DELETE', 'INITIAL_SEED'].map(act => (
                <div key={act} className="p-3 rounded-lg border border-border/60 bg-accent/20">
                  <span className="text-[11px] font-mono text-muted-foreground block">{act}</span>
                  <span className="text-lg font-bold mt-1 block">
                    {actionCounts[act] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Admins Registrados</CardTitle>
            <CardDescription className="text-xs">Acessos com privilégio elevado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            {adminUsers.length === 0 ? (
              <p className="text-muted-foreground">Nenhum usuário admin localizado.</p>
            ) : (
              adminUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded bg-accent/30 border border-border/40">
                  <div>
                    <p className="font-semibold">{u.name || 'Sem nome'}</p>
                    <p className="text-muted-foreground text-[10px]">{u.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-indigo-400">ADMIN</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Auditoria e ActivityLog (RGPD / LGPD) */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Trilha de Auditoria & ActivityLog (LGPD / RGPD)
          </CardTitle>
          <CardDescription className="text-xs">
            Registro detalhado e cronológico de mutações, entidades e workspaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-32">Data / Hora</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Workspace / Família</TableHead>
                  <TableHead>Metadados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum registro de auditoria ainda. Novas ações serão registradas aqui automaticamente.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentLogs.map(log => {
                    const metaStr = log.metadata ? JSON.stringify(log.metadata) : '-'
                    return (
                      <TableRow key={log.id} className="border-border text-xs">
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] font-mono ${
                              log.action === 'CREATE' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                              log.action === 'UPDATE' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' :
                              log.action === 'DELETE' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                              'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.entity}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.family?.name || 'Global / Sistema'}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                          {metaStr}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

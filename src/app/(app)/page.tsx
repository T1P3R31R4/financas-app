import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, TrendingDown, PiggyBank, CalendarClock, ArrowRight } from 'lucide-react'
import { TransactionType, StatusType } from '@prisma/client'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const session = await getServerSession(authOptions)
  const user    = session?.user as { familyId?: string; name?: string } | undefined

  // Redireciona se não autenticado ou sem workspace provisionado
  if (!user?.familyId) {
    redirect('/login')
  }

  const familyId = user.familyId

  const [family, transactions, members] = await Promise.all([
    prisma.family.findUnique({ where: { id: familyId } }),
    prisma.transaction.findMany({
      where:   { familyId },
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.member.findMany({
      where:   { familyId },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  // Totais
  const totalIncomes = transactions
    .filter(t => t.type === TransactionType.INCOME && t.status === StatusType.PAID)
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.status === StatusType.PAID)
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  const pendingExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE && t.status === StatusType.PENDING)
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  const pendingIncomes = transactions
    .filter(t => t.type === TransactionType.INCOME && t.status === StatusType.PENDING)
    .reduce((acc, curr) => acc + Number(curr.amount), 0)

  const balance = totalIncomes - totalExpenses

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground text-sm">
            {family ? `Workspace: ${family.name}` : 'Resumo financeiro da família.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/lancamentos"
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            Ver todos os lançamentos <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cards de Métricas Principais (Responsivos: 1 col mobile, 2 sm, 4 lg) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Renda Recebida</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-emerald-500">
              R$ {totalIncomes.toFixed(2)}
            </div>
            {pendingIncomes > 0 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                + R$ {pendingIncomes.toFixed(2)} a receber
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Pago</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-500">
              R$ {totalExpenses.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Despesas efetivadas no período
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Saldo Livre da Casa</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-amber-500'}`}>
              R$ {balance.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Recebido menos pago
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Contas Pendentes</CardTitle>
            <CalendarClock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-amber-500">
              R$ {pendingExpenses.toFixed(2)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              A pagar / vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Balanço por Membro */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">Saldo por Participante</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {members.map(member => {
            const memberIncomes = transactions
              .filter(t => t.memberId === member.id && t.type === TransactionType.INCOME && t.status === StatusType.PAID)
              .reduce((acc, curr) => acc + Number(curr.amount), 0)

            const memberExpenses = transactions
              .filter(t => t.memberId === member.id && t.type === TransactionType.EXPENSE && t.status === StatusType.PAID)
              .reduce((acc, curr) => acc + Number(curr.amount), 0)

            const memberBalance = memberIncomes - memberExpenses

            return (
              <Card
                key={member.id}
                className="overflow-hidden border-border hover:border-primary/40 transition-colors"
                style={{ borderTopColor: member.color || '#6366f1', borderTopWidth: 4 }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">{member.name}</CardTitle>
                    <span className="text-[10px] text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                      {member.isFixedIncome ? 'Renda Fixa' : 'Renda Variável'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recebeu:</span>
                    <span className="font-medium text-emerald-500">R$ {memberIncomes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pagou:</span>
                    <span className="font-medium text-red-400">R$ {memberExpenses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border/80">
                    <span>Saldo Individual:</span>
                    <span className={memberBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      R$ {memberBalance.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

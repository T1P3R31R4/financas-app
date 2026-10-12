'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { Download, Printer, TrendingUp, TrendingDown, Wallet, Calendar, PieChart as PieIcon, FileText } from 'lucide-react'

interface ReportTransaction {
  id: string
  description: string
  amount: number
  date: string
  dueDate: string | null
  type: 'INCOME' | 'EXPENSE'
  isFixed: boolean
  status: 'PENDING' | 'PAID'
  isHouseholdExpense: boolean
  receiptUrl: string | null
  audioNote: string | null
  tags: string[]
  memberName: string
  memberColor: string
  categoryName: string
  categoryColor: string
}

interface RelatoriosClientProps {
  transactions: ReportTransaction[]
  members: { id: string; name: string; color: string | null }[]
  familyName: string
}

export function RelatoriosClient({ transactions, members, familyName }: RelatoriosClientProps) {
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | '90d'>('all')

  const filtered = useMemo(() => {
    if (filterPeriod === 'all') return transactions
    const now = new Date().getTime()
    const days = filterPeriod === '30d' ? 30 : 90
    const limit = now - days * 24 * 60 * 60 * 1000
    return transactions.filter(t => new Date(t.date).getTime() >= limit)
  }, [transactions, filterPeriod])

  const totalIncomes = filtered.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const netSavings = totalIncomes - totalExpenses

  // 1. Dados por Categoria (Despesas)
  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>()
    filtered
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
      .forEach(t => {
        const curr = map.get(t.categoryName) || { name: t.categoryName, value: 0, color: t.categoryColor }
        curr.value += t.amount
        map.set(t.categoryName, curr)
      })
    return Array.from(map.values()).sort((a, b) => b.value - a.value)
  }, [filtered])

  // 2. Dados por Membro (Gastos)
  const memberData = useMemo(() => {
    const map = new Map<string, { name: string; gasto: number; recebido: number; color: string }>()
    filtered.forEach(t => {
      const curr = map.get(t.memberName) || { name: t.memberName, gasto: 0, recebido: 0, color: t.memberColor }
      if (t.type === 'EXPENSE' && t.status === 'PAID') curr.gasto += t.amount
      if (t.type === 'INCOME' && t.status === 'PAID') curr.recebido += t.amount
      map.set(t.memberName, curr)
    })
    return Array.from(map.values())
  }, [filtered])

  // 3. Dados por Mês (Últimos meses)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; Entradas: number; Saidas: number }>()
    filtered.forEach(t => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      const curr = map.get(key) || { month: monthLabel, Entradas: 0, Saidas: 0 }
      if (t.type === 'INCOME' && t.status === 'PAID') curr.Entradas += t.amount
      if (t.type === 'EXPENSE' && t.status === 'PAID') curr.Saidas += t.amount
      map.set(key, curr)
    })
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(e => e[1])
  }, [filtered])

  // Exportação CSV
  function handleExportCSV() {
    const headers = [
      'Data',
      'Descrição',
      'Tipo',
      'Valor (R$)',
      'Status',
      'Membro',
      'Categoria',
      'Fixo/Variável',
      'Despesa Casa',
      'Tags',
      'Comprovante URL',
    ]

    const rows = filtered.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      `"${t.description.replace(/"/g, '""')}"`,
      t.type === 'INCOME' ? 'Receita' : 'Despesa',
      t.amount.toFixed(2).replace('.', ','),
      t.status === 'PAID' ? 'Concluído' : 'Pendente',
      `"${t.memberName}"`,
      `"${t.categoryName}"`,
      t.isFixed ? 'Fixo' : 'Variável',
      t.isHouseholdExpense ? 'Sim' : 'Não',
      `"${t.tags.join(', ')}"`,
      `"${t.receiptUrl || ''}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio-financeiro-${familyName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Exportação PDF via Print
  function handlePrintPDF() {
    window.print()
  }

  const PIE_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#14b8a6', '#ef4444']

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header com botões de Exportação */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Relatórios & Análises</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Métricas de fluxo de caixa, despesas por categoria e rateio familiar.
          </p>
        </div>

        <div className="flex items-center gap-2.5 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="gap-1.5 text-xs h-9 bg-card hover:bg-accent"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Exportar CSV
          </Button>

          <Button
            size="sm"
            onClick={handlePrintPDF}
            className="gap-1.5 text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Entradas Efetivadas</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-500 mt-1">
              R$ {totalIncomes.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Saídas Totais</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-red-400 mt-1">
              R$ {totalExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Wallet className="w-4 h-4" />
              <span className="text-xs font-medium">Economia Líquida (Saldo)</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-1 ${netSavings >= 0 ? "text-blue-400" : "text-amber-400"}`}>
              R$ {netSavings.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Fluxo de Caixa Mensal */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Fluxo de Caixa Mensal</CardTitle>
            <CardDescription className="text-xs">Comparativo de entradas vs despesas pagas</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              {monthlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                  Sem dados suficientes para o período.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: any) => `R$ ${Number(val).toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saidas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Despesas por Categoria (Donut) */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Gastos por Categoria</CardTitle>
            <CardDescription className="text-xs">Distribuição percentual das despesas</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full flex items-center justify-center">
              {categoryData.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhuma despesa para exibir.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 12 }}
                      formatter={(val: any) => `R$ ${Number(val).toFixed(2)}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico 3: Participação Financeira por Membro */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Balanço por Membro da Família</CardTitle>
          <CardDescription className="text-xs">Volume de entradas recebidas vs gastos realizados por participante</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-64 w-full">
            {memberData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Nenhum membro com movimentação financeira.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                  <YAxis stroke="#888888" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 12 }}
                    formatter={(val: any) => `R$ ${Number(val).toFixed(2)}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="recebido" name="Recebeu (R$)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="gasto" name="Gastou (R$)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

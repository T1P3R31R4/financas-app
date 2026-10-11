'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Briefcase, TrendingUp, TrendingDown, Clock, CheckCircle2, RefreshCw } from "lucide-react"

interface Member {
  id: string
  name: string
  color: string | null
  isFixedIncome: boolean
}

interface Category {
  id: string
  name: string
  type: string
}

interface TransactionItem {
  id: string
  description: string
  amount: number
  date: string
  type: 'INCOME' | 'EXPENSE'
  status: 'PENDING' | 'PAID'
  member: { name: string; color: string | null }
  category: { name: string }
}

interface RendaVariavelClientProps {
  members: Member[]
  categories: Category[]
  initialTransactions: TransactionItem[]
}

export function RendaVariavelClient({ members, categories, initialTransactions }: RendaVariavelClientProps) {
  const router = useRouter()
  const [memberId, setMemberId] = useState(
    members.find(m => !m.isFixedIncome)?.id || members[0]?.id || ''
  )
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loadingType, setLoadingType] = useState<'INCOME' | 'EXPENSE' | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  // Filtrar categorias pertinentes
  const defaultIncomeCat = categories.find(c => c.type === 'INCOME' && c.name.toLowerCase().includes('autônomo')) ||
    categories.find(c => c.type === 'INCOME')
  const defaultExpenseCat = categories.find(c => c.type === 'EXPENSE' && (c.name.toLowerCase().includes('serviço') || c.name.toLowerCase().includes('pessoal'))) ||
    categories.find(c => c.type === 'EXPENSE')

  async function handleQuickSubmit(type: 'INCOME' | 'EXPENSE') {
    if (!amount || !memberId) return
    const cat = type === 'INCOME' ? defaultIncomeCat : defaultExpenseCat
    if (!cat) return

    setLoadingType(type)
    setSuccessMsg('')
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim() || (type === 'INCOME' ? 'Serviço / Venda Rápida' : 'Despesa Operacional'),
          amount: Number(amount),
          date: new Date().toISOString().split('T')[0],
          type,
          isFixed: false,
          status: 'PAID',
          isHouseholdExpense: false,
          memberId,
          categoryId: cat.id,
        }),
      })

      if (res.ok) {
        setAmount('')
        setDescription('')
        setSuccessMsg(type === 'INCOME' ? 'Entrada registrada com sucesso!' : 'Saída registrada com sucesso!')
        setTimeout(() => setSuccessMsg(''), 4000)
        router.refresh()
      }
    } finally {
      setLoadingType(null)
    }
  }

  const selectedMember = members.find(m => m.id === memberId)

  // Totais variáveis
  const totalVariableIncome = initialTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0)
  const totalVariableExpense = initialTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0)
  const netVariableBalance = totalVariableIncome - totalVariableExpense

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Renda Variável & Projetos</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Lançamentos ágeis para membros autônomos, prestadores de serviço e fluxo de caixa diário.
        </p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Entradas Recentes</span>
            </div>
            <p className="text-xl font-bold text-emerald-500 mt-1">R$ {totalVariableIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Saídas Recentes</span>
            </div>
            <p className="text-xl font-bold text-red-400 mt-1">R$ {totalVariableExpense.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs font-medium">Saldo Líquido</span>
            </div>
            <p className={`text-xl font-bold mt-1 ${netVariableBalance >= 0 ? 'text-blue-400' : 'text-amber-400'}`}>
              R$ {netVariableBalance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Registro Rápido */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Novo Registro Rápido</CardTitle>
          <CardDescription>
            Lance entradas e saídas instantaneamente com 1 toque no telemóvel ou desktop.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMsg && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-md text-sm flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Membro Responsável</Label>
              <Select value={memberId} onValueChange={(v) => setMemberId(v ?? '')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecionar membro...">
                    {(val) => members.find(m => m.id === val)?.name ?? "Selecionar..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} {!m.isFixedIncome ? '(Autônomo)' : '(Fixo)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quick-amount">Valor (R$) *</Label>
              <Input
                id="quick-amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="text-xl font-semibold h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-desc">Descrição / Cliente (Opcional)</Label>
            <Input
              id="quick-desc"
              placeholder="Ex: Atendimento cliente, Serviço freelance, Materiais..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <Button
              type="button"
              onClick={() => handleQuickSubmit('INCOME')}
              disabled={!amount || !memberId || !!loadingType}
              className="bg-emerald-600 hover:bg-emerald-700 h-12 text-base font-medium gap-2"
            >
              {loadingType === 'INCOME' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Recebido (Entrada)
            </Button>
            <Button
              type="button"
              onClick={() => handleQuickSubmit('EXPENSE')}
              disabled={!amount || !memberId || !!loadingType}
              className="bg-red-600 hover:bg-red-700 h-12 text-base font-medium gap-2"
            >
              {loadingType === 'EXPENSE' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingDown className="w-4 h-4" />}
              Pago (Saída)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico Recente de Fluxo Variável */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Lançamentos Variáveis Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {initialTransactions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhum lançamento variável encontrado.
              </p>
            ) : (
              initialTransactions.slice(0, 8).map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tx.member.color || '#6366f1' }}
                    />
                    <div>
                      <p className="text-sm font-medium leading-none">{tx.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tx.member.name} • {tx.category.name} • {new Date(tx.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {tx.type === 'INCOME' ? 'Recebido' : 'Pago'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

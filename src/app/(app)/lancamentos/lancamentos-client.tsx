'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TransactionDialog } from '@/components/transaction-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, TrendingUp, TrendingDown, CheckCircle2, Clock, Pencil, Trash2, RefreshCw, Paperclip, Mic } from 'lucide-react'

interface Member { id: string; name: string; color: string | null }
interface Category { id: string; name: string; type: string }
interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  dueDate: string | null
  type: 'INCOME' | 'EXPENSE'
  isFixed: boolean
  status: 'PENDING' | 'PAID'
  isHouseholdExpense: boolean
  notes: string | null
  receiptUrl: string | null
  audioNote: string | null
  tags: string[]
  memberId: string
  categoryId: string
  member: Member
  category: Category
}

interface LancamentosClientProps {
  transactions: Transaction[]
  members: Member[]
  categories: Category[]
}

export function LancamentosClient({ transactions, members, categories }: LancamentosClientProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [filterMember, setFilterMember] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterFixed, setFilterFixed] = useState('all')

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      if (filterMember !== 'all' && t.memberId !== filterMember) return false
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterStatus !== 'all' && t.status !== filterStatus) return false
      if (filterFixed !== 'all') {
        if (filterFixed === 'fixed' && !t.isFixed) return false
        if (filterFixed === 'variable' && t.isFixed) return false
      }
      return true
    })
  }, [transactions, search, filterMember, filterType, filterStatus, filterFixed])

  const totalIncome = filtered.filter(t => t.type === 'INCOME' && t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((s, t) => s + t.amount, 0)
  const totalPending = filtered.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0)

  function openNew() {
    setEditingTx(null)
    setDialogOpen(true)
  }

  function openEdit(tx: Transaction) {
    setEditingTx(tx)
    setDialogOpen(true)
  }

  async function toggleStatus(tx: Transaction) {
    setTogglingId(tx.id)
    try {
      const newStatus = tx.status === 'PAID' ? 'PENDING' : 'PAID'
      await fetch(`/api/transactions/${tx.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este lançamento?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeletingId(null)
    }
  }

  const memberColor = (memberId: string) => members.find(m => m.id === memberId)?.color || '#6366f1'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos</h1>
          <p className="text-muted-foreground">Entradas e saídas de toda a família.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Total Recebido</span>
            </div>
            <p className="text-xl font-bold text-emerald-500 mt-1">R$ {totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-red-400">
              <TrendingDown className="w-4 h-4" />
              <span className="text-xs font-medium">Total Pago</span>
            </div>
            <p className="text-xl font-bold text-red-400 mt-1">R$ {totalExpense.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Pendente</span>
            </div>
            <p className="text-xl font-bold text-amber-400 mt-1">R$ {totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterMember} onValueChange={(v) => setFilterMember(v ?? 'all')}>
          <SelectTrigger className="w-40 bg-card">
            <SelectValue placeholder="Membro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? 'all')}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="INCOME">Entradas</SelectItem>
            <SelectItem value="EXPENSE">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? 'all')}>
          <SelectTrigger className="w-44 bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="PAID">Pago / Recebido</SelectItem>
            <SelectItem value="PENDING">Pendente / A Receber</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterFixed} onValueChange={(v) => setFilterFixed(v ?? 'all')}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue placeholder="Natureza" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="fixed">Fixo</SelectItem>
            <SelectItem value="variable">Variável</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela com scroll horizontal no mobile */}
      <Card className="border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-4"></TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Membro</TableHead>
                <TableHead className="hidden md:table-cell">Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Tipo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                    Nenhum lançamento encontrado.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(tx => (
                <TableRow key={tx.id} className="border-border group">
                  {/* Barra colorida do membro */}
                  <TableCell className="p-0 w-1">
                    <div className="w-1 h-8 rounded-full mx-auto" style={{ backgroundColor: memberColor(tx.memberId) }} />
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm">{tx.description}</span>
                      {tx.receiptUrl && (
                        <a
                          href={tx.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver Comprovante Anexado"
                          className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/20"
                        >
                          <Paperclip className="w-2.5 h-2.5" />
                          Recibo
                        </a>
                      )}
                      {tx.audioNote && (
                        <span
                          title={`Transcrito por voz: "${tx.audioNote}"`}
                          className="inline-flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20"
                        >
                          <Mic className="w-2.5 h-2.5" />
                          Voz
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {tx.isFixed && (
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm">Fixo</span>
                      )}
                      {tx.isHouseholdExpense && (
                        <span className="text-[10px] text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-sm">Casa</span>
                      )}
                      {tx.tags && tx.tags.map(t => (
                        <span key={t} className="text-[10px] text-muted-foreground bg-accent/60 px-1 rounded">
                          #{t}
                        </span>
                      ))}
                      <div className="flex flex-wrap gap-1 sm:hidden">
                        <span className="text-[10px] text-muted-foreground">{tx.category.name}</span>
                        <span className="text-[10px] text-muted-foreground">• {new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ backgroundColor: memberColor(tx.memberId) }}
                      >
                        {tx.member.name.charAt(0)}
                      </div>
                      <span className="text-sm hidden sm:inline">{tx.member.name}</span>
                    </div>
                  </TableCell>

                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{tx.category.name}</span>
                  </TableCell>

                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <span className={`font-semibold ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-400'}`}>
                      {tx.type === 'INCOME' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                    </span>
                  </TableCell>

                  <TableCell className="text-center hidden sm:table-cell">
                    {tx.type === 'INCOME' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">Entrada</Badge>
                    ) : (
                      <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Saída</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-center">
                    {/* Toggle de status dinâmico */}
                    <button
                      onClick={() => toggleStatus(tx)}
                      disabled={togglingId === tx.id}
                      title="Alternar status"
                      className="group/btn"
                    >
                      {tx.status === 'PAID' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs gap-1 hover:bg-emerald-500/20 cursor-pointer">
                          {togglingId === tx.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          {tx.type === 'INCOME' ? 'Recebido' : 'Pago'}
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs gap-1 hover:bg-amber-500/20 cursor-pointer">
                          {togglingId === tx.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                          {tx.type === 'INCOME' ? 'A Receber' : 'Pendente'}
                        </Badge>
                      )}
                    </button>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(tx)}
                        className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id)}
                        disabled={deletingId === tx.id}
                        className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        {deletingId === tx.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="px-4 py-2 border-t border-border text-xs text-muted-foreground">
          {filtered.length} lançamento(s) encontrado(s)
        </div>
      </Card>

      {/* Dialog */}
      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        members={members}
        categories={categories}
        initialData={editingTx ? {
          id: editingTx.id,
          description: editingTx.description,
          amount: String(editingTx.amount),
          date: editingTx.date.split('T')[0],
          dueDate: editingTx.dueDate?.split('T')[0] || '',
          type: editingTx.type,
          isFixed: editingTx.isFixed,
          status: editingTx.status,
          isHouseholdExpense: editingTx.isHouseholdExpense,
          notes: editingTx.notes || '',
          receiptUrl: editingTx.receiptUrl || '',
          audioNote: editingTx.audioNote || '',
          tags: editingTx.tags || [],
          memberId: editingTx.memberId,
          categoryId: editingTx.categoryId,
        } : undefined}
      />
    </div>
  )
}

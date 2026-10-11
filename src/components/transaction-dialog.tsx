'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Member { id: string; name: string }
interface Category { id: string; name: string; type: string }

interface TransactionFormData {
  id?: string
  description: string
  amount: string
  date: string
  dueDate: string
  type: 'INCOME' | 'EXPENSE'
  isFixed: boolean
  status: 'PENDING' | 'PAID'
  isHouseholdExpense: boolean
  notes: string
  memberId: string
  categoryId: string
}

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  categories: Category[]
  initialData?: Partial<TransactionFormData>
}

export function TransactionDialog({ open, onOpenChange, members, categories, initialData }: TransactionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<TransactionFormData>({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    type: initialData?.type || 'EXPENSE',
    isFixed: initialData?.isFixed ?? false,
    status: initialData?.status || 'PENDING',
    isHouseholdExpense: initialData?.isHouseholdExpense ?? true,
    notes: initialData?.notes || '',
    memberId: initialData?.memberId || '',
    categoryId: initialData?.categoryId || '',
  })

  const isEditing = !!initialData?.id
  const filteredCategories = categories.filter(c => c.type === form.type)

  function handleChange<K extends keyof TransactionFormData>(field: K, value: TransactionFormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.description || !form.amount || !form.memberId || !form.categoryId) return
    setLoading(true)
    try {
      const url = isEditing ? `/api/transactions/${initialData?.id}` : '/api/transactions'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        onOpenChange(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Tipo: Entrada / Saída */}
          <div className="grid gap-2">
            <Label>Tipo *</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { handleChange('type', 'INCOME'); handleChange('categoryId', '') }}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                  form.type === 'INCOME'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'border-border hover:border-emerald-500/50'
                }`}
              >
                ↑ Entrada
              </button>
              <button
                type="button"
                onClick={() => { handleChange('type', 'EXPENSE'); handleChange('categoryId', '') }}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                  form.type === 'EXPENSE'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'border-border hover:border-red-500/50'
                }`}
              >
                ↓ Saída
              </button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder="Ex: Aluguel, Mercado, Serviço..."
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Membro *</Label>
              <Select value={form.memberId} onValueChange={v => handleChange('memberId', v ?? '')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecionar...">
                    {(val) => members.find(m => m.id === val)?.name ?? "Selecionar..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Categoria *</Label>
              <Select value={form.categoryId} onValueChange={v => handleChange('categoryId', v ?? '')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecionar...">
                    {(val) => filteredCategories.find(c => c.id === val)?.name ?? "Selecionar..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Frequência</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('isFixed', true)}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    form.isFixed ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border'
                  }`}
                >Fixo</button>
                <button
                  type="button"
                  onClick={() => handleChange('isFixed', false)}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    !form.isFixed ? 'bg-amber-600 text-white border-amber-600' : 'border-border'
                  }`}
                >Variável</button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('status', 'PAID')}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    form.status === 'PAID' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border'
                  }`}
                >
                  {form.type === 'INCOME' ? 'Recebido' : 'Pago'}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('status', 'PENDING')}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    form.status === 'PENDING' ? 'bg-amber-600 text-white border-amber-600' : 'border-border'
                  }`}
                >
                  {form.type === 'INCOME' ? 'A Receber' : 'Pendente'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDate">Vencimento (opcional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={form.dueDate}
              onChange={e => handleChange('dueDate', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-background/50">
            <input
              id="household"
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={form.isHouseholdExpense}
              onChange={e => handleChange('isHouseholdExpense', e.target.checked)}
            />
            <Label htmlFor="household" className="cursor-pointer text-sm">
              Esta é uma despesa da casa (compartilhada)
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              placeholder="Notas opcionais..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.description || !form.amount || !form.memberId || !form.categoryId}
            className={form.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Lançamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const RELATIONSHIP_OPTIONS = [
  { value: 'TITULAR', label: 'Titular' },
  { value: 'CONJUGE', label: 'Cônjuge' },
  { value: 'PAI_MAE', label: 'Pai / Mãe' },
  { value: 'FILHO', label: 'Filho(a)' },
  { value: 'OUTRO', label: 'Outro' },
]

const COLOR_OPTIONS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#6366f1', label: 'Índigo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#14b8a6', label: 'Teal' },
]

interface MemberFormData {
  id?: string
  name: string
  color: string
  relationship: string
  age: string
  isFixedIncome: boolean
  baseSalary: string
}

interface MemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Partial<MemberFormData>
}

export function MemberDialog({ open, onOpenChange, initialData }: MemberDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<MemberFormData>({
    name: initialData?.name || '',
    color: initialData?.color || '#3b82f6',
    relationship: initialData?.relationship || 'OUTRO',
    age: initialData?.age || '',
    isFixedIncome: initialData?.isFixedIncome ?? true,
    baseSalary: initialData?.baseSalary || '',
  })

  const isEditing = !!initialData?.id

  function handleChange(field: keyof MemberFormData, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const url = isEditing ? `/api/members/${initialData.id}` : '/api/members'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : null,
          baseSalary: form.baseSalary ? Number(form.baseSalary) : null,
        }),
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
      <DialogContent className="sm:max-w-[480px] bg-card border-border max-h-[90vh] overflow-y-auto w-[92vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Membro' : 'Novo Membro'}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              placeholder="Nome do membro"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Parentesco</Label>
              <Select value={form.relationship} onValueChange={v => handleChange('relationship', v ?? 'OUTRO')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione...">
                    {(val) => RELATIONSHIP_OPTIONS.find(o => o.value === val)?.label ?? "Selecione..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                placeholder="Ex: 35"
                value={form.age}
                onChange={e => handleChange('age', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Cor de identificação</Label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => handleChange('color', c.value)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderColor: form.color === c.value ? 'white' : 'transparent',
                    transform: form.color === c.value ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Tipo de Renda</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange('isFixedIncome', true)}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                  form.isFixedIncome
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                Renda Fixa
              </button>
              <button
                type="button"
                onClick={() => handleChange('isFixedIncome', false)}
                className={`flex-1 py-2 px-4 rounded-md border text-sm font-medium transition-colors ${
                  !form.isFixedIncome
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                Renda Variável
              </button>
            </div>
          </div>

          {form.isFixedIncome && (
            <div className="grid gap-2">
              <Label htmlFor="baseSalary">Salário Base (R$)</Label>
              <Input
                id="baseSalary"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.baseSalary}
                onChange={e => handleChange('baseSalary', e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name.trim()}>
            {loading ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Membro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

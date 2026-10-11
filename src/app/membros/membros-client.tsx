'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MemberDialog } from '@/components/member-dialog'
import { Plus, Pencil, Trash2, User, TrendingUp, TrendingDown, Wallet } from 'lucide-react'

const RELATIONSHIP_LABELS: Record<string, string> = {
  TITULAR: 'Titular',
  CONJUGE: 'Cônjuge',
  PAI_MAE: 'Pai / Mãe',
  FILHO: 'Filho(a)',
  OUTRO: 'Outro',
}

interface Member {
  id: string
  name: string
  color: string | null
  relationship: string
  age: number | null
  isFixedIncome: boolean
  baseSalary: unknown
  avatarUrl: string | null
  totalIncome: number
  totalExpense: number
}

export function MembrosClient({ members }: { members: Member[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function openNew() {
    setEditingMember(null)
    setDialogOpen(true)
  }

  function openEdit(member: Member) {
    setEditingMember(member)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este membro? Os lançamentos vinculados serão mantidos.')) return
    setDeleting(id)
    try {
      await fetch(`/api/members/${id}`, { method: 'DELETE' })
      router.refresh()
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membros</h1>
          <p className="text-muted-foreground">Gerencie os participantes da casa.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Membro
        </Button>
      </div>

      {/* Cards de membros */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <User className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Nenhum membro cadastrado</h2>
          <p className="text-muted-foreground text-sm mt-1">Clique em "Novo Membro" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {members.map(member => {
            const balance = member.totalIncome - member.totalExpense
            const memberColor = member.color || '#6366f1'
            return (
              <Card
                key={member.id}
                className="overflow-hidden border-border hover:border-primary/30 transition-colors"
                style={{ borderTopColor: memberColor, borderTopWidth: 4 }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Avatar com initial */}
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                        style={{ backgroundColor: memberColor }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg leading-tight">{member.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {RELATIONSHIP_LABELS[member.relationship] || 'Outro'}
                          </Badge>
                          {member.age && (
                            <span className="text-xs text-muted-foreground">{member.age} anos</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Ações */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        disabled={deleting === member.id}
                        className="p-1.5 rounded hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Tipo de renda */}
                  <div className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-border/50">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {member.isFixedIncome
                        ? `Renda Fixa${member.baseSalary ? ` · R$ ${Number(member.baseSalary).toFixed(2)}` : ''}`
                        : 'Renda Variável (Autônomo)'}
                    </span>
                  </div>

                  {/* Resumo financeiro */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-md bg-emerald-500/10">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mx-auto mb-0.5" />
                      <p className="text-[10px] text-muted-foreground">Recebeu</p>
                      <p className="text-xs font-semibold text-emerald-500">R$ {member.totalIncome.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded-md bg-red-500/10">
                      <TrendingDown className="w-3.5 h-3.5 text-red-400 mx-auto mb-0.5" />
                      <p className="text-[10px] text-muted-foreground">Pagou</p>
                      <p className="text-xs font-semibold text-red-400">R$ {member.totalExpense.toFixed(2)}</p>
                    </div>
                    <div className={`p-2 rounded-md ${balance >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
                      <Wallet className={`w-3.5 h-3.5 mx-auto mb-0.5 ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`} />
                      <p className="text-[10px] text-muted-foreground">Saldo</p>
                      <p className={`text-xs font-semibold ${balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                        R$ {balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog de cadastro / edição */}
      <MemberDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={editingMember ? {
          id: editingMember.id,
          name: editingMember.name,
          color: editingMember.color || '#3b82f6',
          relationship: editingMember.relationship,
          age: editingMember.age?.toString() || '',
          isFixedIncome: editingMember.isFixedIncome,
          baseSalary: editingMember.baseSalary ? String(editingMember.baseSalary) : '',
        } : undefined}
      />
    </div>
  )
}

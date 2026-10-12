import { prisma } from '@/lib/prisma'
import { RelatoriosClient } from './relatorios-client'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
  const [transactions, members, categories, family] = await Promise.all([
    prisma.transaction.findMany({
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.member.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.family.findFirst(),
  ])

  const serializedTransactions = transactions.map(t => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    dueDate: t.dueDate?.toISOString() || null,
    type: t.type,
    isFixed: t.isFixed,
    status: t.status,
    isHouseholdExpense: t.isHouseholdExpense,
    receiptUrl: t.receiptUrl || null,
    audioNote: t.audioNote || null,
    tags: t.tags || [],
    memberName: t.member.name,
    memberColor: t.member.color || '#6366f1',
    categoryName: t.category.name,
    categoryColor: t.category.color || '#94a3b8',
  }))

  return (
    <RelatoriosClient
      transactions={serializedTransactions}
      members={members}
      familyName={family?.name || 'Família Principal'}
    />
  )
}

import { prisma } from '@/lib/prisma'
import { LancamentosClient } from './lancamentos-client'

export const dynamic = 'force-dynamic'

export default async function LancamentosPage() {
  const [transactions, members, categories] = await Promise.all([
    prisma.transaction.findMany({
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.member.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ])

  // Serializa Decimal para número
  const serialized = transactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
    dueDate: t.dueDate?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))

  return <LancamentosClient transactions={serialized} members={members} categories={categories} />
}

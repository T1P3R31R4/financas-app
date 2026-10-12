import { prisma } from '@/lib/prisma'
import { RendaVariavelClient } from './renda-variavel-client'

export const dynamic = 'force-dynamic'

export default async function RendaVariavelPage() {
  const [members, categories, transactions] = await Promise.all([
    prisma.member.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.transaction.findMany({
      where: { isFixed: false },
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
      take: 20,
    }),
  ])

  const serializedTransactions = transactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    date: t.date.toISOString(),
  }))

  return (
    <RendaVariavelClient
      members={members}
      categories={categories}
      initialTransactions={serializedTransactions}
    />
  )
}

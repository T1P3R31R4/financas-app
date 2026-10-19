import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RelatoriosClient } from './relatorios-client'

export const dynamic = 'force-dynamic'

export default async function RelatoriosPage() {
  const session = await getServerSession(authOptions)
  const user    = session?.user as { familyId?: string } | undefined

  if (!user?.familyId) {
    redirect('/login')
  }

  const familyId = user.familyId

  const [transactions, members, categories, family] = await Promise.all([
    prisma.transaction.findMany({
      where:   { familyId },
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.member.findMany({
      where:   { familyId },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where:   { familyId },
      orderBy: { name: 'asc' },
    }),
    prisma.family.findUnique({ where: { id: familyId } }),
  ])

  const serializedTransactions = transactions.map(t => ({
    id:                 t.id,
    description:        t.description,
    amount:             Number(t.amount),
    date:               t.date.toISOString(),
    dueDate:            t.dueDate?.toISOString() || null,
    type:               t.type,
    isFixed:            t.isFixed,
    status:             t.status,
    isHouseholdExpense: t.isHouseholdExpense,
    receiptUrl:         t.receiptUrl   || null,
    audioNote:          t.audioNote    || null,
    tags:               t.tags         || [],
    memberName:         t.member.name,
    memberColor:        t.member.color || '#6366f1',
    categoryName:       t.category.name,
    categoryColor:      t.category.color || '#94a3b8',
  }))

  return (
    <RelatoriosClient
      transactions={serializedTransactions}
      members={members}
      familyName={family?.name || 'Minha Família'}
    />
  )
}

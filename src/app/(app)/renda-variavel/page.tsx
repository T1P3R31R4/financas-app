import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { RendaVariavelClient } from './renda-variavel-client'

export const dynamic = 'force-dynamic'

export default async function RendaVariavelPage() {
  const session = await getServerSession(authOptions)
  const user    = session?.user as { familyId?: string } | undefined

  if (!user?.familyId) {
    redirect('/login')
  }

  const familyId = user.familyId

  const [members, categories, transactions] = await Promise.all([
    prisma.member.findMany({
      where:   { familyId },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where:   { familyId },
      orderBy: { name: 'asc' },
    }),
    prisma.transaction.findMany({
      where:   { familyId, isFixed: false },
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
      take:    20,
    }),
  ])

  const serializedTransactions = transactions.map(t => ({
    ...t,
    amount: Number(t.amount),
    date:   t.date.toISOString(),
  }))

  return (
    <RendaVariavelClient
      members={members}
      categories={categories}
      initialTransactions={serializedTransactions}
    />
  )
}

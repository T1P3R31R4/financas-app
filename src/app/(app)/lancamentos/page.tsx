import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { LancamentosClient } from './lancamentos-client'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LancamentosPage() {
  const session = await getServerSession(authOptions)
  
  // Faz o cast para o TypeScript reconhecer o familyId
  const user = session?.user as { familyId?: string } | undefined

  if (!user?.familyId) {
    redirect('/auth/login')
  }

  const familyId = user.familyId

  const [transactions, members, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { familyId },
      include: { member: true, category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.member.findMany({
      where: { familyId },
      orderBy: { name: 'asc' },
    }),
    prisma.category.findMany({
      where: { familyId },
      orderBy: { name: 'asc' },
    }),
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
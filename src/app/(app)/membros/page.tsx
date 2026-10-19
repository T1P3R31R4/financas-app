import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { MembrosClient } from './membros-client'

export const dynamic = 'force-dynamic'

export default async function MembrosPage() {
  const session = await getServerSession(authOptions)
  const user    = session?.user as { familyId?: string } | undefined

  if (!user?.familyId) {
    redirect('/login')
  }

  const familyId = user.familyId

  // Lista apenas os membros do tenant autenticado
  const members = await prisma.member.findMany({
    where:   { familyId },
    orderBy: { createdAt: 'asc' },
  })

  // Busca totais por membro — todas as queries filtradas por familyId
  const membersWithTotals = await Promise.all(
    members.map(async (member) => {
      const incomes = await prisma.transaction.aggregate({
        where: { memberId: member.id, familyId, type: 'INCOME', status: 'PAID' },
        _sum:  { amount: true },
      })
      const expenses = await prisma.transaction.aggregate({
        where: { memberId: member.id, familyId, type: 'EXPENSE', status: 'PAID' },
        _sum:  { amount: true },
      })
      return {
        ...member,
        totalIncome:  Number(incomes._sum.amount  ?? 0),
        totalExpense: Number(expenses._sum.amount ?? 0),
      }
    })
  )

  return <MembrosClient members={membersWithTotals} />
}

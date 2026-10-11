import { prisma } from '@/lib/prisma'
import { MembrosClient } from './membros-client'

export const dynamic = 'force-dynamic'

export default async function MembrosPage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: 'asc' },
  })

  // Busca totais por membro
  const membersWithTotals = await Promise.all(
    members.map(async (member) => {
      const incomes = await prisma.transaction.aggregate({
        where: { memberId: member.id, type: 'INCOME', status: 'PAID' },
        _sum: { amount: true },
      })
      const expenses = await prisma.transaction.aggregate({
        where: { memberId: member.id, type: 'EXPENSE', status: 'PAID' },
        _sum: { amount: true },
      })
      return {
        ...member,
        totalIncome: Number(incomes._sum.amount ?? 0),
        totalExpense: Number(expenses._sum.amount ?? 0),
      }
    })
  )

  return <MembrosClient members={membersWithTotals} />
}

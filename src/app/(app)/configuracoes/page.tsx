import { prisma } from '@/lib/prisma'
import { ConfiguracoesClient } from './configuracoes-client'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const [family, members, user] = await Promise.all([
    prisma.family.findFirst({
      include: {
        _count: { select: { transactions: true, members: true, users: true } }
      }
    }),
    prisma.member.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findFirst({
      orderBy: { createdAt: 'asc' }
    }),
  ])

  return (
    <ConfiguracoesClient
      initialFamily={family ? {
        id: family.id,
        name: family.name,
        transactionsCount: family._count.transactions,
        membersCount: family._count.members,
      } : null}
      initialUser={user ? {
        id: user.id,
        name: user.name || 'Usuário',
        email: user.email || '',
        phone: user.phone || '',
        currency: user.currency || 'BRL',
        timezone: user.timezone || 'America/Sao_Paulo',
        role: user.role,
      } : null}
      membersCount={members.length}
    />
  )
}

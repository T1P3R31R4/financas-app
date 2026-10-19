import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { ConfiguracoesClient } from './configuracoes-client'

export const dynamic = 'force-dynamic'

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)
  const sessionUser = session?.user as { id?: string; familyId?: string } | undefined

  if (!sessionUser?.familyId || !sessionUser?.id) {
    redirect('/login')
  }

  const familyId = sessionUser.familyId
  const userId   = sessionUser.id

  const [family, members, user] = await Promise.all([
    // findUnique com ID explícito — sem findFirst() global
    prisma.family.findUnique({
      where:   { id: familyId },
      include: {
        _count: { select: { transactions: true, members: true, users: true } },
      },
    }),
    prisma.member.findMany({
      where:   { familyId },
      orderBy: { name: 'asc' },
    }),
    // Busca o utilizador autenticado pelo seu ID — não o primeiro da tabela
    prisma.user.findUnique({
      where: { id: userId },
    }),
  ])

  return (
    <ConfiguracoesClient
      initialFamily={family ? {
        id:                family.id,
        name:              family.name,
        transactionsCount: family._count.transactions,
        membersCount:      family._count.members,
      } : null}
      initialUser={user ? {
        id:       user.id,
        name:     user.name     || 'Usuário',
        email:    user.email    || '',
        phone:    user.phone    || '',
        currency: user.currency || 'BRL',
        timezone: user.timezone || 'America/Sao_Paulo',
        role:     user.role,
      } : null}
      membersCount={members.length}
    />
  )
}

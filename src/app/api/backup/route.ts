import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user    = session?.user as { id?: string; familyId?: string } | undefined

    if (!user?.familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const familyId = user.familyId

    // Usa o familyId da sessão — nunca do query string (evita acesso a outros tenants)
    const family = await prisma.family.findUnique({ where: { id: familyId } })
    if (!family) {
      return NextResponse.json({ error: 'Família não encontrada' }, { status: 404 })
    }

    const [members, categories, transactions, users] = await Promise.all([
      prisma.member.findMany({ where: { familyId } }),
      // Exporta apenas categorias do próprio tenant
      prisma.category.findMany({ where: { familyId } }),
      prisma.transaction.findMany({ where: { familyId } }),
      prisma.user.findMany({
        where:  { familyId },
        select: { id: true, name: true, email: true, role: true, currency: true, timezone: true },
      }),
    ])

    const backupData = {
      version:    '2.0',
      exportedAt: new Date().toISOString(),
      family: {
        id:   family.id,
        name: family.name,
      },
      users,
      members: members.map(m => ({
        ...m,
        baseSalary: m.baseSalary ? Number(m.baseSalary) : null,
      })),
      categories,
      transactions: transactions.map(t => ({
        ...t,
        amount:    Number(t.amount),
        date:      t.date.toISOString(),
        dueDate:   t.dueDate?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    }

    await prisma.activityLog.create({
      data: {
        action:   'BACKUP_EXPORT',
        entity:   'BACKUP',
        familyId,
        metadata: {
          transactionsCount: transactions.length,
          membersCount:      members.length,
          categoriesCount:   categories.length,
        },
      },
    }).catch(() => {})

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type':        'application/json',
        'Content-Disposition': `attachment; filename="backup-financascasa-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('[BACKUP_GET]', error)
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 })
  }
}

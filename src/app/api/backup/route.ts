import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const familyId = searchParams.get('familyId')

    const family = familyId
      ? await prisma.family.findUnique({ where: { id: familyId } })
      : await prisma.family.findFirst()

    if (!family) {
      return NextResponse.json({ error: 'Nenhuma família encontrada para backup' }, { status: 404 })
    }

    const [members, categories, transactions, users] = await Promise.all([
      prisma.member.findMany({ where: { familyId: family.id } }),
      prisma.category.findMany({
        where: { OR: [{ familyId: family.id }, { familyId: null }] },
      }),
      prisma.transaction.findMany({ where: { familyId: family.id } }),
      prisma.user.findMany({
        where: { familyId: family.id },
        select: { id: true, name: true, email: true, role: true, currency: true, timezone: true },
      }),
    ])

    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      family: {
        id: family.id,
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
        amount: Number(t.amount),
        date: t.date.toISOString(),
        dueDate: t.dueDate?.toISOString() || null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
    }

    // Registrar no ActivityLog
    await prisma.activityLog.create({
      data: {
        action: 'BACKUP_EXPORT',
        entity: 'BACKUP',
        familyId: family.id,
        metadata: {
          transactionsCount: transactions.length,
          membersCount: members.length,
          categoriesCount: categories.length,
        },
      },
    }).catch(() => {})

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="backup-financascasa-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    return NextResponse.json({ error: 'Erro ao gerar backup' }, { status: 500 })
  }
}

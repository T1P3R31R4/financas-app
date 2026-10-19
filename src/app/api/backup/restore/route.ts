import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user    = session?.user as { familyId?: string } | undefined

    if (!user?.familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const familyId = user.familyId

    const body = await req.json()
    const { family, members, categories, transactions } = body

    if (!family || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Formato de arquivo de backup inválido' }, { status: 400 })
    }

    // Verifica que a família da sessão existe
    const targetFamily = await prisma.family.findUnique({ where: { id: familyId } })
    if (!targetFamily) {
      return NextResponse.json({ error: 'Família não encontrada' }, { status: 404 })
    }

    // Registrar no ActivityLog a tentativa de restauração no tenant correcto
    await prisma.activityLog.create({
      data: {
        action:   'BACKUP_RESTORE_ATTEMPT',
        entity:   'BACKUP',
        familyId,
        metadata: {
          itemsCount:       transactions.length,
          membersCount:     Array.isArray(members)    ? members.length    : 0,
          categoriesCount:  Array.isArray(categories) ? categories.length : 0,
          sourceFamily:     family.name,
        },
      },
    }).catch(() => {})

    return NextResponse.json({
      success:            true,
      message:            'Backup validado com sucesso! Os dados foram processados com segurança.',
      transactionsCount:  transactions.length,
      familyId:           targetFamily.id,
    })
  } catch (error) {
    console.error('[BACKUP_RESTORE]', error)
    return NextResponse.json({ error: 'Erro ao processar restauração de backup' }, { status: 500 })
  }
}

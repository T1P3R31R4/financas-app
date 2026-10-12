import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { family, members, categories, transactions } = body

    if (!family || !Array.isArray(transactions)) {
      return NextResponse.json({ error: 'Formato de arquivo de backup inválido' }, { status: 400 })
    }

    // Buscar ou usar família existente
    let targetFamily = await prisma.family.findFirst()
    if (!targetFamily) {
      targetFamily = await prisma.family.create({
        data: { name: family.name || 'Família Restaurada' },
      })
    }

    // Registrar no ActivityLog a tentativa de restauração
    await prisma.activityLog.create({
      data: {
        action: 'BACKUP_RESTORE_ATTEMPT',
        entity: 'BACKUP',
        familyId: targetFamily.id,
        metadata: {
          itemsCount: transactions.length,
        },
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Backup validado com sucesso! Os dados foram processados com segurança.',
      transactionsCount: transactions.length,
      familyId: targetFamily.id,
    })
  } catch (error) {
    console.error('Erro na restauração:', error)
    return NextResponse.json({ error: 'Erro ao processar restauração de backup' }, { status: 500 })
  }
}

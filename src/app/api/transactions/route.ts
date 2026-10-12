import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TransactionType, StatusType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { familyId?: string } | undefined

    if (!user?.familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type') as TransactionType | null
    const status = searchParams.get('status') as StatusType | null
    const isFixed = searchParams.get('isFixed')

    // Obrigatoriamente filtra sempre pela família do utilizador logado
    const where: Record<string, unknown> = {
      familyId: user.familyId,
    }

    if (memberId) where.memberId = memberId
    if (categoryId) where.categoryId = categoryId
    if (type) where.type = type
    if (status) where.status = status
    if (isFixed !== null && isFixed !== undefined) where.isFixed = isFixed === 'true'

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        member: true,
        category: true,
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar lançamentos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user = session?.user as { familyId?: string } | undefined

    if (!user?.familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const {
      description, amount, date, dueDate, type, isFixed, status,
      isHouseholdExpense, notes, memberId, categoryId,
      receiptUrl, audioNote, tags
    } = body

    if (!description || !amount || !date || !memberId || !categoryId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    // Valida se o membro pertence à mesma família do utilizador para segurança extra
    const member = await prisma.member.findFirst({
      where: { id: memberId, familyId: user.familyId }
    })

    if (!member) {
      return NextResponse.json({ error: 'Membro inválido para esta família' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Browser'

    // Utiliza estritamente o familyId da sessão ativa
    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount: Number(amount),
        date: new Date(date),
        dueDate: dueDate ? new Date(dueDate) : null,
        type: type as TransactionType,
        isFixed: isFixed ?? false,
        status: (status as StatusType) || StatusType.PENDING,
        isHouseholdExpense: isHouseholdExpense ?? true,
        notes: notes || null,
        receiptUrl: receiptUrl || null,
        audioNote: audioNote || null,
        tags: Array.isArray(tags) ? tags : [],
        memberId,
        categoryId,
        familyId: user.familyId,
      },
      include: { member: true, category: true }
    })

    // Telemetria / Auditoria
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'TRANSACTION',
        familyId: user.familyId,
        ip,
        userAgent,
        metadata: {
          transactionId: transaction.id,
          amount: Number(transaction.amount),
          type: transaction.type,
          description: transaction.description,
          hasReceipt: !!receiptUrl,
          hasAudioNote: !!audioNote,
        },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 })
  }
}
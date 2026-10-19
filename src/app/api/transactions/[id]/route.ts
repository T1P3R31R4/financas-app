import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TransactionType, StatusType } from '@prisma/client'

/** Helper que extrai e valida o familyId da sessão activa. */
async function getSessionFamilyId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const user    = session?.user as { familyId?: string | null } | undefined
  return user?.familyId ?? null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const familyId = await getSessionFamilyId()
    if (!familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    const transaction = await prisma.transaction.findUnique({
      where:   { id },
      include: { member: true, category: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }

    // Verifica ownership — impede acesso a lançamentos de outros tenants
    if (transaction.familyId !== familyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('[TRANSACTION_GET_ID]', error)
    return NextResponse.json({ error: 'Erro ao buscar lançamento' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const familyId = await getSessionFamilyId()
    if (!familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verifica ownership antes de atualizar
    const existing = await prisma.transaction.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }
    if (existing.familyId !== familyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    // Valida que o memberId (se fornecido) pertence à mesma família
    const body = await req.json()
    const {
      description, amount, date, dueDate, type, isFixed, status,
      isHouseholdExpense, notes, memberId, categoryId,
      receiptUrl, audioNote, tags,
    } = body

    if (memberId) {
      const member = await prisma.member.findFirst({
        where: { id: memberId, familyId },
      })
      if (!member) {
        return NextResponse.json({ error: 'Membro inválido para esta família' }, { status: 400 })
      }
    }

    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || 'Browser'

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount:            amount      ? Number(amount) : undefined,
        date:              date        ? new Date(date)  : undefined,
        dueDate:           dueDate     ? new Date(dueDate) : null,
        type:              type        as TransactionType | undefined,
        isFixed:           isFixed     ?? undefined,
        status:            status      as StatusType | undefined,
        isHouseholdExpense: isHouseholdExpense ?? undefined,
        notes:             notes       ?? null,
        receiptUrl:        receiptUrl  !== undefined ? receiptUrl  : undefined,
        audioNote:         audioNote   !== undefined ? audioNote   : undefined,
        tags:              Array.isArray(tags) ? tags : undefined,
        memberId:          memberId    || undefined,
        categoryId:        categoryId  || undefined,
        // familyId nunca é alterado via PUT — protege contra mudança de tenant
      },
      include: { member: true, category: true },
    })

    await prisma.activityLog.create({
      data: {
        action:   'UPDATE',
        entity:   'TRANSACTION',
        familyId,
        ip,
        userAgent,
        metadata: {
          transactionId: transaction.id,
          description:   transaction.description,
          status:        transaction.status,
          amount:        Number(transaction.amount),
        },
      },
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('[TRANSACTION_PUT_ID]', error)
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const familyId = await getSessionFamilyId()
    if (!familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verifica ownership antes de apagar
    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }
    if (transaction.familyId !== familyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await prisma.transaction.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        action:   'DELETE',
        entity:   'TRANSACTION',
        familyId,
        metadata: {
          transactionId: transaction.id,
          description:   transaction.description,
        },
      },
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[TRANSACTION_DELETE_ID]', error)
    return NextResponse.json({ error: 'Erro ao excluir lançamento' }, { status: 500 })
  }
}

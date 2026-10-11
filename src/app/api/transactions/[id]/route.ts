import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, StatusType } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { member: true, category: true }
    })
    if (!transaction) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }
    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar lançamento' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      description, amount, date, dueDate, type, isFixed, status,
      isHouseholdExpense, notes, memberId, categoryId
    } = body

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        description,
        amount: amount ? Number(amount) : undefined,
        date: date ? new Date(date) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
        type: type as TransactionType | undefined,
        isFixed: isFixed ?? undefined,
        status: status as StatusType | undefined,
        isHouseholdExpense: isHouseholdExpense ?? undefined,
        notes: notes ?? null,
        memberId: memberId || undefined,
        categoryId: categoryId || undefined,
      },
      include: { member: true, category: true }
    })

    // Telemetria / Auditoria (ActivityLog)
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'TRANSACTION',
        familyId: transaction.familyId,
        metadata: {
          transactionId: transaction.id,
          description: transaction.description,
          status: transaction.status,
          amount: Number(transaction.amount),
        },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(transaction)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao atualizar lançamento' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await prisma.transaction.findUnique({ where: { id } })
    if (!transaction) {
      return NextResponse.json({ error: 'Lançamento não encontrado' }, { status: 404 })
    }

    await prisma.transaction.delete({ where: { id } })

    // Telemetria / Auditoria (ActivityLog)
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'TRANSACTION',
        familyId: transaction.familyId,
        metadata: {
          transactionId: transaction.id,
          description: transaction.description,
        },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir lançamento' }, { status: 500 })
  }
}

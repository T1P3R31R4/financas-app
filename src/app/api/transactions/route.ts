import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType, StatusType } from '@prisma/client'

async function getOrCreateDefaultFamilyId(): Promise<string> {
  const existing = await prisma.family.findFirst()
  if (existing) return existing.id
  const created = await prisma.family.create({
    data: { name: 'Família Principal' }
  })
  return created.id
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const memberId = searchParams.get('memberId')
    const categoryId = searchParams.get('categoryId')
    const familyId = searchParams.get('familyId')
    const type = searchParams.get('type') as TransactionType | null
    const status = searchParams.get('status') as StatusType | null
    const isFixed = searchParams.get('isFixed')

    const where: Record<string, unknown> = {}
    if (memberId) where.memberId = memberId
    if (categoryId) where.categoryId = categoryId
    if (familyId) where.familyId = familyId
    if (type) where.type = type
    if (status) where.status = status
    if (isFixed !== null) where.isFixed = isFixed === 'true'

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
    const body = await req.json()
    const {
      description, amount, date, dueDate, type, isFixed, status,
      isHouseholdExpense, notes, memberId, categoryId, familyId
    } = body

    if (!description || !amount || !date || !memberId || !categoryId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } })
    const effectiveFamilyId = familyId || member?.familyId || (await getOrCreateDefaultFamilyId())

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
        memberId,
        categoryId,
        familyId: effectiveFamilyId,
      },
      include: { member: true, category: true }
    })

    // Telemetria / Auditoria (ActivityLog)
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'TRANSACTION',
        familyId: effectiveFamilyId,
        metadata: {
          transactionId: transaction.id,
          amount: Number(transaction.amount),
          type: transaction.type,
          description: transaction.description,
        },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar lançamento' }, { status: 500 })
  }
}

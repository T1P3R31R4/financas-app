import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RelationshipType } from '@prisma/client'

async function getOrCreateDefaultFamilyId(requestedFamilyId?: string | null): Promise<string> {
  if (requestedFamilyId) return requestedFamilyId
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
    const familyId = searchParams.get('familyId')

    const where: Record<string, unknown> = {}
    if (familyId) where.familyId = familyId

    const members = await prisma.member.findMany({
      where,
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(members)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, color, relationship, age, isFixedIncome, baseSalary, avatarUrl, familyId } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const effectiveFamilyId = await getOrCreateDefaultFamilyId(familyId)

    const member = await prisma.member.create({
      data: {
        name,
        color: color || '#6366f1',
        relationship: (relationship as RelationshipType) || RelationshipType.OUTRO,
        age: age ? Number(age) : null,
        isFixedIncome: isFixedIncome ?? true,
        baseSalary: baseSalary ? Number(baseSalary) : null,
        avatarUrl: avatarUrl || null,
        familyId: effectiveFamilyId,
      }
    })

    // Telemetria / Auditoria (ActivityLog)
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'MEMBER',
        familyId: effectiveFamilyId,
        metadata: { memberName: member.name, memberId: member.id },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar membro' }, { status: 500 })
  }
}

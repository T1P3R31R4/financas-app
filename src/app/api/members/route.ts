import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { RelationshipType } from '@prisma/client'

/** Helper que extrai e valida o familyId da sessão activa. */
async function getSessionFamilyId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const user    = session?.user as { familyId?: string | null } | undefined
  return user?.familyId ?? null
}

export async function GET(_req: NextRequest) {
  try {
    const familyId = await getSessionFamilyId()
    if (!familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Filtra obrigatoriamente pela família do utilizador logado
    const members = await prisma.member.findMany({
      where: { familyId },
      include: {
        _count: { select: { transactions: true } }
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('[MEMBERS_GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const familyId = await getSessionFamilyId()
    if (!familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await req.json()
    const { name, color, relationship, age, isFixedIncome, baseSalary, avatarUrl } = body
    // Nota: qualquer `familyId` enviado no body é ignorado — usa-se sempre o da sessão

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    const member = await prisma.member.create({
      data: {
        name,
        color:         color        || '#6366f1',
        relationship:  (relationship as RelationshipType) || RelationshipType.OUTRO,
        age:           age ? Number(age) : null,
        isFixedIncome: isFixedIncome ?? true,
        baseSalary:    baseSalary ? Number(baseSalary) : null,
        avatarUrl:     avatarUrl || null,
        familyId,   // ← sempre o da sessão, nunca do body
      },
    })

    await prisma.activityLog.create({
      data: {
        action:   'CREATE',
        entity:   'MEMBER',
        familyId,
        metadata: { memberName: member.name, memberId: member.id },
      },
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('[MEMBERS_POST]', error)
    return NextResponse.json({ error: 'Erro ao criar membro' }, { status: 500 })
  }
}

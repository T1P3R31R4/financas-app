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

    // Verifica existência E ownership numa única query
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        transactions: {
          include:  { category: true },
          orderBy:  { date: 'desc' },
          take: 10,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    // Garante que o membro pertence à família do utilizador autenticado
    if (member.familyId !== familyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('[MEMBER_GET_ID]', error)
    return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 })
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
    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }
    if (existing.familyId !== familyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await req.json()
    const { name, color, relationship, age, isFixedIncome, baseSalary, avatarUrl } = body

    const member = await prisma.member.update({
      where: { id },
      data: {
        name,
        color,
        relationship: relationship as RelationshipType,
        age:          age ? Number(age) : null,
        isFixedIncome: isFixedIncome ?? true,
        baseSalary:   baseSalary ? Number(baseSalary) : null,
        avatarUrl:    avatarUrl || null,
      },
    })

    await prisma.activityLog.create({
      data: {
        action:   'UPDATE',
        entity:   'MEMBER',
        familyId,
        metadata: { memberId: member.id, memberName: member.name },
      },
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(member)
  } catch (error) {
    console.error('[MEMBER_PUT_ID]', error)
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 })
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
    const member = await prisma.member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }
    if (member.familyId !== familyId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    await prisma.member.delete({ where: { id } })

    await prisma.activityLog.create({
      data: {
        action:   'DELETE',
        entity:   'MEMBER',
        familyId,
        metadata: { memberId: member.id, memberName: member.name },
      },
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[MEMBER_DELETE_ID]', error)
    return NextResponse.json({ error: 'Erro ao excluir membro' }, { status: 500 })
  }
}

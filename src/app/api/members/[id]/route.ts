import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { RelationshipType } from '@prisma/client'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        transactions: {
          include: { category: true },
          orderBy: { date: 'desc' },
          take: 10
        }
      }
    })
    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }
    return NextResponse.json(member)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar membro' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, color, relationship, age, isFixedIncome, baseSalary, avatarUrl } = body

    const member = await prisma.member.update({
      where: { id },
      data: {
        name,
        color,
        relationship: relationship as RelationshipType,
        age: age ? Number(age) : null,
        isFixedIncome: isFixedIncome ?? true,
        baseSalary: baseSalary ? Number(baseSalary) : null,
        avatarUrl: avatarUrl || null,
      }
    })

    // Telemetria / Auditoria
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'MEMBER',
        familyId: member.familyId,
        metadata: { memberId: member.id, memberName: member.name },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json(member)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const member = await prisma.member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 })
    }

    await prisma.member.delete({ where: { id } })

    // Telemetria / Auditoria
    await prisma.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'MEMBER',
        familyId: member.familyId,
        metadata: { memberId: member.id, memberName: member.name },
      }
    }).catch(err => console.error('Erro ao gravar log:', err))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir membro' }, { status: 500 })
  }
}

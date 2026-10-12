import { NextRequest, NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, familyName } = body

    // --- Validações ---
    if (!name?.trim()) {
      return NextResponse.json({ error: 'O campo nome é obrigatório.' }, { status: 400 })
    }
    if (!email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Informe um e-mail válido.' }, { status: 400 })
    }
    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 8 caracteres.' }, { status: 400 })
    }
    if (!familyName?.trim()) {
      return NextResponse.json({ error: 'O nome da família/workspace é obrigatório.' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verificar e-mail duplicado
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Tente fazer login ou use outro endereço.' },
        { status: 409 }
      )
    }

    // Hash seguro da senha
    const hashedPassword = await hash(password, 12)

    // Criar Família (Workspace) do novo tenant
    const newFamily = await prisma.family.create({
      data: { name: familyName.trim() },
    })

    // Criar usuário vinculado ao workspace
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        familyId: newFamily.id,
      },
    })

    // Registrar auditoria
    await prisma.activityLog.create({
      data: {
        action: 'REGISTER',
        entity: 'USER',
        userId: newUser.id,
        familyId: newFamily.id,
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
        userAgent: req.headers.get('user-agent') ?? undefined,
        metadata: {
          email: normalizedEmail,
          familyName: newFamily.name,
          provider: 'credentials',
        },
      },
    })

    return NextResponse.json(
      { message: 'Conta criada com sucesso!', userId: newUser.id },
      { status: 201 }
    )
  } catch (err) {
    console.error('[REGISTER_ERROR]', err)
    return NextResponse.json(
      { error: 'Erro interno ao criar conta. Tente novamente em instantes.' },
      { status: 500 }
    )
  }
}

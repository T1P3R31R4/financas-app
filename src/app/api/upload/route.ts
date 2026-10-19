import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const user    = session?.user as { familyId?: string } | undefined

    if (!user?.familyId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const familyId = user.familyId

    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const bytes  = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Nome único seguro
    const timestamp    = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName     = `${timestamp}_${sanitizedName}`

    // Diretório de upload
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filePath  = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    const publicUrl = `/uploads/${fileName}`

    // Registrar no ActivityLog usando o familyId da sessão — sem findFirst()
    await prisma.activityLog.create({
      data: {
        action:   'UPLOAD_RECEIPT',
        entity:   'TRANSACTION',
        familyId,
        metadata: {
          fileName,
          size:     file.size,
          mimeType: file.type,
          url:      publicUrl,
        },
      },
    }).catch(() => {})

    return NextResponse.json({
      url:      publicUrl,
      fileName,
      size:     file.size,
      mimeType: file.type,
    }, { status: 201 })
  } catch (error) {
    console.error('[UPLOAD_POST]', error)
    return NextResponse.json({ error: 'Erro ao fazer upload do comprovante' }, { status: 500 })
  }
}

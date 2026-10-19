import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createDefaultCategories } from '@/lib/defaultCategories'
import { Role } from '@prisma/client'
import type { Adapter } from 'next-auth/adapters'

// Typed shape used locally to avoid `any` casts
type AuthUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: Role
  familyId?: string | null
}

/**
 * Provisiona um workspace completo para um novo tenant:
 *   1. Cria a família (workspace isolado)
 *   2. Associa o utilizador à família
 *   3. Cria as categorias padrão (receitas + despesas) exclusivas desse tenant
 *   4. Regista o evento de auditoria
 *
 * Idempotente — seguro chamar múltiplas vezes para o mesmo utilizador.
 */
async function provisionNewTenant(
  userId: string,
  userName: string | null | undefined,
  userEmail: string | null | undefined,
  provider: string
): Promise<string> {
  const familyName = userName ? `Família de ${userName}` : 'Minha Família'

  const newFamily = await prisma.family.create({ data: { name: familyName } })

  await prisma.user.update({
    where: { id: userId },
    data:  { familyId: newFamily.id },
  })

  // Criar categorias padrão para este tenant — nunca globais
  await createDefaultCategories(prisma, newFamily.id)

  await prisma.activityLog.create({
    data: {
      action:   'REGISTER_OAUTH',
      entity:   'USER',
      userId,
      familyId: newFamily.id,
      metadata: {
        email:    userEmail,
        provider,
        note:     'Novo workspace + categorias criados automaticamente',
      },
    },
  }).catch(() => {})

  return newFamily.id
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as Adapter,
  providers: [
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      id:   'credentials',
      name: 'E-mail e Senha',
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Senha', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email) return null

        const email = credentials.email.toLowerCase().trim()

        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) return null

        // Utilizador OAuth sem senha definida
        if (!user.password) return null

        const passwordMatch = await compare(credentials.password ?? '', user.password)
        if (!passwordMatch) return null

        // Edge-case: utilizador credentials sem familyId (dados legados)
        // → provisionar workspace automaticamente
        let familyId = user.familyId
        if (!familyId) {
          familyId = await provisionNewTenant(user.id, user.name, user.email, 'credentials')
        }

        await prisma.activityLog.create({
          data: {
            action:   'LOGIN',
            entity:   'AUTH',
            userId:   user.id,
            familyId,
            metadata: { email: user.email, role: user.role, provider: 'credentials' },
          },
        }).catch(() => {})

        return {
          id:       user.id,
          name:     user.name,
          email:    user.email,
          image:    user.image,
          role:     user.role,
          familyId,
        } as unknown as AuthUser
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // Primeiro login — dados chegam via `user`
      if (user) {
        const u = user as AuthUser
        token.id       = u.id
        token.role     = u.role || Role.USER
        token.familyId = u.familyId || null
      }

      // Re-validação do familyId a cada renovação do token (trigger 'update')
      // ou quando o token não possui familyId (utilizador legado sem workspace)
      if (!token.familyId || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.id as string },
          select: { familyId: true, name: true, email: true },
        })

        if (dbUser) {
          if (dbUser.familyId) {
            token.familyId = dbUser.familyId
          } else {
            // Provisionar workspace para utilizador legado sem familyId
            const newFamilyId = await provisionNewTenant(
              token.id as string,
              dbUser.name,
              dbUser.email,
              'auto-provision'
            )
            token.familyId = newFamilyId
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token) {
        const su     = session.user as AuthUser
        su.id        = token.id       as string
        su.role      = (token.role    as Role)          || Role.USER
        su.familyId  = (token.familyId as string | null) || null
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      // Provisionamento automático para utilizadores OAuth (Google)
      // O evento `createUser` só dispara na primeira vez — seguro provisionar aqui.
      try {
        await provisionNewTenant(user.id, user.name, user.email, 'google')
      } catch (err) {
        console.error('[AUTH] Erro ao provisionar família OAuth:', err)
      }
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },
}

import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import type { Adapter } from 'next-auth/adapters'

// Small typed shape used locally to avoid `any` casts
type AuthUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role?: Role
  familyId?: string | null
}


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as unknown as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      id: 'credentials',
      name: 'E-mail e Senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email) return null

        const email = credentials.email.toLowerCase().trim()

        // ── Fluxo de Login real (E-mail + Senha) ──────────────────────────────
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
          // Não revelar se o e-mail existe ou não (segurança)
          return null
        }

        // Usuário OAuth sem senha definida
        if (!user.password) {
          return null
        }

        // Verificar senha com bcryptjs
        const passwordMatch = await compare(credentials.password ?? '', user.password)
        if (!passwordMatch) {
          return null
        }

        await prisma.activityLog.create({
          data: {
            action: 'LOGIN',
            entity: 'AUTH',
            userId: user.id,
            familyId: user.familyId,
            metadata: { email: user.email, role: user.role, provider: 'credentials' },
          },
        }).catch(() => {})

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          familyId: user.familyId,
        } as unknown as AuthUser
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as AuthUser
        token.id = u.id
        token.role = u.role || Role.USER
        token.familyId = u.familyId || null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        const su = session.user as AuthUser
        su.id = token.id as string
        su.role = (token.role as Role) || Role.USER
        su.familyId = token.familyId || null
      }
      return session
    },
  },

  events: {
    async createUser({ user }) {
      try {
        // Provisionamento automático de workspace para usuários OAuth (Google)
        const familyName = user.name ? `Família de ${user.name}` : 'Minha Família'
        const newFamily = await prisma.family.create({ data: { name: familyName } })

        await prisma.user.update({
          where: { id: user.id },
          data: { familyId: newFamily.id },
        })

        await prisma.activityLog.create({
          data: {
            action: 'REGISTER_OAUTH',
            entity: 'USER',
            userId: user.id,
            familyId: newFamily.id,
            metadata: {
              email: user.email,
              provider: 'google',
              note: 'Novo workspace criado automaticamente via Google OAuth',
            },
          },
        })
      } catch (err) {
        console.error('[AUTH] Erro ao provisionar família:', err)
      }
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
}

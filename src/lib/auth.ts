import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

// Contas de demonstração (sem senha real necessária)
const DEMO_ACCOUNTS: Record<string, { role: Role; name: string }> = {
  'tiago@financascasa.com': { role: Role.USER, name: 'Tiago (Demo)' },
  'admin@financascasa.com': { role: Role.ADMIN, name: 'Administrador (Demo)' },
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
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
        isDemo: { label: 'Demo', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null

        const email = credentials.email.toLowerCase().trim()
        const isDemo = credentials.isDemo === 'true'
        const demoConfig = DEMO_ACCOUNTS[email]

        // ── Fluxo de demonstração ─────────────────────────────────────────────
        if (isDemo && demoConfig) {
          // Garantir família padrão para demos
          let family = await prisma.family.findFirst()
          if (!family) {
            family = await prisma.family.create({
              data: { name: 'Família Principal (Casa)' }
            })
          }

          // Buscar ou criar usuário demo
          let user = await prisma.user.findUnique({ where: { email } })
          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: demoConfig.name,
                role: demoConfig.role,
                familyId: family.id,
              },
            })
          } else if (demoConfig.role === Role.ADMIN && user.role !== Role.ADMIN) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { role: Role.ADMIN },
            })
          }

          await prisma.activityLog.create({
            data: {
              action: 'LOGIN_DEMO',
              entity: 'AUTH',
              userId: user.id,
              familyId: user.familyId,
              metadata: { email, role: user.role, provider: 'demo' },
            },
          }).catch(() => {})

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            familyId: user.familyId,
          } as any
        }

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
        } as any
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || Role.USER
        token.familyId = (user as any).familyId || null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role || Role.USER
        ;(session.user as any).familyId = token.familyId || null
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

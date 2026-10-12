import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

/**
 * Middleware de autenticação e controle de acesso.
 * 
 * Rotas protegidas (requerem sessão ativa):
 *   / · /lancamentos · /membros · /relatorios · /configuracoes · /renda-variavel · /admin/*
 *
 * Rotas públicas (sem autenticação necessária):
 *   /login · /register · /api/auth/* · /_next/* · /favicon.ico · /uploads/*
 *
 * Redirecionamentos:
 *   - Não autenticado acessando rota protegida → /login
 *   - Autenticado acessando /login ou /register → / (ou /admin se ADMIN)
 *   - Autenticado sem role ADMIN acessando /admin/* → /login?error=ForbiddenAdminOnly
 */

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Usuário autenticado tentando acessar páginas de auth → redirecionar
    if (pathname === '/login' || pathname === '/register') {
      if (token) {
        const redirectTo = token.role === 'ADMIN' ? '/admin' : '/'
        return NextResponse.redirect(new URL(redirectTo, req.url))
      }
      return NextResponse.next()
    }

    // Proteger /admin/* exigindo role ADMIN
    if (pathname.startsWith('/admin')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(
          new URL('/login?error=ForbiddenAdminOnly', req.url)
        )
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Permitir acesso às rotas de autenticação sem token
        if (
          pathname === '/login' ||
          pathname === '/register' ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/uploads') ||
          pathname === '/favicon.ico'
        ) {
          return true
        }

        // Todas as outras rotas exigem token
        return !!token
      },
    },
    pages: {
      signIn: '/login',
      error: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Protege tudo exceto:
     * - _next/static, _next/image (assets)
     * - favicon.ico, uploads
     * - api/auth (NextAuth internamente gerencia)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}

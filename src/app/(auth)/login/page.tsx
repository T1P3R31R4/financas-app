'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Lock, ArrowRight, Sparkles, Loader2, Mail, Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Redirect se já autenticado
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role
      router.replace(role === 'ADMIN' ? '/admin' : '/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (errorParam === 'CredentialsSignin') {
      setErrorMsg('E-mail ou senha incorretos. Verifique e tente novamente.')
    } else if (errorParam === 'ForbiddenAdminOnly') {
      setErrorMsg('Acesso restrito. Necessário perfil de Administrador.')
    }
  }, [errorParam])

  async function handleDemoLogin(demoEmail: string, role: 'ADMIN' | 'USER', redirectPath: string) {
    setLoading(role)
    setErrorMsg('')
    try {
      const res = await signIn('credentials', {
        email: demoEmail,
        password: 'demo',
        isDemo: 'true',
        redirect: false,
      })
      if (res?.error) {
        setErrorMsg('Erro ao autenticar. Tente novamente.')
      } else {
        router.push(redirectPath)
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading('email')
    setErrorMsg('')
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        setErrorMsg('E-mail ou senha incorretos. Verifique e tente novamente.')
      } else if (res?.ok) {
        // Buscar role para redirecionar corretamente
        router.push(callbackUrl === '/login' || callbackUrl === '/' ? '/' : callbackUrl)
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="border-border/80 shadow-2xl backdrop-blur-sm bg-card/90">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold">Acesse sua Conta</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Entre com seu e-mail e senha ou use o Google.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {errorMsg && (
          <div className="p-3 text-xs bg-red-500/15 border border-red-500/30 text-red-400 rounded-md flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full h-11 border-border/80 hover:bg-accent text-sm font-medium gap-2.5 justify-center"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continuar com Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground font-medium">ou continue com e-mail</span>
          </div>
        </div>

        {/* Login com E-mail + Senha */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-email" className="text-xs font-medium">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-10 pl-9 text-sm"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password" className="text-xs font-medium">Senha</Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-10 pl-9 pr-10 text-sm"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={!email || !password || !!loading}
            className="w-full h-10 gap-1.5 text-sm font-semibold"
          >
            {loading === 'email' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Entrando...</>
            ) : (
              <>Entrar na Conta <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>
        </form>

        {/* Demo rápido */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-3 text-muted-foreground/70">Acesso de demonstração</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!!loading}
            onClick={() => handleDemoLogin('tiago@financascasa.com', 'USER', '/')}
            className="h-auto py-2 px-3 flex flex-col items-start gap-0.5 border border-border/60 hover:border-primary/40 text-left text-xs"
          >
            <span className="font-semibold text-foreground">👨‍👩‍👧 Família</span>
            <span className="text-muted-foreground text-[10px] leading-tight">Portal financeiro</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!!loading}
            onClick={() => handleDemoLogin('admin@financascasa.com', 'ADMIN', '/admin')}
            className="h-auto py-2 px-3 flex flex-col items-start gap-0.5 border border-indigo-500/30 hover:border-indigo-500/50 text-left text-xs bg-indigo-500/5"
          >
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span className="font-semibold text-indigo-400">Admin</span>
            </div>
            <span className="text-muted-foreground text-[10px] leading-tight">Painel global</span>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-5 flex flex-col items-center gap-3 border-t border-border/50 mt-2">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-3">
          <Lock className="w-3 h-3 text-emerald-400" />
          Criptografia de ponta a ponta · LGPD / RGPD
        </div>
        <p className="text-xs text-muted-foreground">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-primary hover:underline font-semibold">
            Cadastre-se gratuitamente
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glows de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-7 relative z-10">
        {/* Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            FinancasCasa · SaaS Multi-Tenant
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-indigo-400 to-primary bg-clip-text text-transparent leading-tight">
            FinancasCasa
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Gestão financeira familiar inteligente com relatórios, lançamentos por voz e controle por membro.
          </p>
        </div>

        <Suspense fallback={
          <div className="p-12 flex justify-center items-center bg-card rounded-xl border border-border shadow-2xl">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, ArrowRight, Sparkles, Loader2, Mail, User, Home, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

function RegisterForm() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [familyName, setFamilyName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect se já autenticado
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role
      router.replace(role === 'ADMIN' ? '/admin' : '/')
    }
  }, [status, session, router])

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordTooShort = password.length > 0 && password.length < 8

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim()) return setErrorMsg('Por favor, informe seu nome.')
    if (!email.trim()) return setErrorMsg('Por favor, informe seu e-mail.')
    if (password.length < 8) return setErrorMsg('A senha deve ter no mínimo 8 caracteres.')
    if (password !== confirmPassword) return setErrorMsg('As senhas não coincidem. Verifique e tente novamente.')
    if (!familyName.trim()) return setErrorMsg('Por favor, informe o nome da sua família ou workspace.')

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, familyName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || 'Erro ao criar conta. Tente novamente.')
        return
      }

      setSuccess(true)

      // Login automático após cadastro
      const signInRes = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (signInRes?.ok) {
        router.push('/')
        router.refresh()
      } else {
        // Mesmo sem auto-login, mostrar sucesso e redirecionar para login
        setTimeout(() => router.push('/login'), 2000)
      }
    } catch {
      setErrorMsg('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="p-12 flex justify-center items-center">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  if (success) {
    return (
      <Card className="border-border/80 shadow-2xl bg-card/90">
        <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Conta criada com sucesso!</h2>
          <p className="text-sm text-muted-foreground">Entrando no FinancasCasa automaticamente…</p>
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/80 shadow-2xl backdrop-blur-sm bg-card/90">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold">Criar sua Conta</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Preencha os campos abaixo para criar seu workspace familiar.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-500/15 border border-red-500/30 text-red-400 rounded-md flex items-start gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-name" className="text-xs font-medium">Seu Nome</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reg-name"
                type="text"
                placeholder="João Silva"
                value={name}
                onChange={e => setName(e.target.value)}
                className="h-10 pl-9 text-sm"
                required
                autoComplete="name"
              />
            </div>
          </div>

          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-xs font-medium">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reg-email"
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

          {/* Nome da Família */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-family" className="text-xs font-medium">Nome da Família / Workspace</Label>
            <div className="relative">
              <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reg-family"
                type="text"
                placeholder="Família Silva, Casa Principal..."
                value={familyName}
                onChange={e => setFamilyName(e.target.value)}
                className="h-10 pl-9 text-sm"
                required
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-xs font-medium">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`h-10 pl-9 pr-10 text-sm ${passwordTooShort ? 'border-red-500/60' : ''}`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordTooShort && (
              <p className="text-[11px] text-red-400">Mínimo 8 caracteres</p>
            )}
          </div>

          {/* Confirmar Senha */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm" className="text-xs font-medium">Confirmar Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="reg-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className={`h-10 pl-9 pr-10 text-sm ${confirmPassword && !passwordsMatch ? 'border-red-500/60' : confirmPassword && passwordsMatch ? 'border-emerald-500/60' : ''}`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-[11px] text-red-400">As senhas não coincidem</p>
            )}
            {passwordsMatch && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Senhas coincidem
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !name || !email || !password || !confirmPassword || !familyName || !!passwordTooShort}
            className="w-full h-11 gap-1.5 text-sm font-semibold mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Criando conta...</>
            ) : (
              <>Criar Conta Gratuita <ArrowRight className="w-4 h-4" /></>
            )}
          </Button>

          <p className="text-[11px] text-center text-muted-foreground">
            Ao criar sua conta, você concorda com nossa Política de Privacidade e Termos de Uso compatíveis com a LGPD.
          </p>
        </form>
      </CardContent>

      <CardFooter className="pt-0 pb-5 flex justify-center border-t border-border/50 mt-2">
        <p className="text-xs text-muted-foreground pt-3">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Fazer login
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}

export default function RegisterPage() {
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
            FinancasCasa · Cadastro Gratuito
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-primary via-indigo-400 to-primary bg-clip-text text-transparent leading-tight">
            Crie sua Conta
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Configure seu workspace familiar em segundos e comece a controlar suas finanças hoje.
          </p>
        </div>

        <Suspense fallback={
          <div className="p-12 flex justify-center items-center bg-card rounded-xl border border-border shadow-2xl">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}

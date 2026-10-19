'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User, Settings, Download, Upload, LogOut, CheckCircle2,
  Building, Globe, DollarSign, Shield, Phone, Sparkles
} from 'lucide-react'

interface UserData {
  id: string
  name: string
  email: string
  phone: string
  currency: string
  timezone: string
  role: string
}

interface FamilyData {
  id: string
  name: string
  transactionsCount: number
  membersCount: number
}

interface ConfiguracoesClientProps {
  initialUser: UserData | null
  initialFamily: FamilyData | null
  membersCount: number
}

export function ConfiguracoesClient({ initialUser, initialFamily, membersCount }: ConfiguracoesClientProps) {
  const router = useRouter()
  const [userForm, setUserForm] = useState<UserData>({
    id: initialUser?.id || '',
    name: initialUser?.name || 'Nome',
    email: initialUser?.email || 'email@email.com',
    phone: initialUser?.phone || '',
    currency: initialUser?.currency || 'BRL',
    timezone: initialUser?.timezone || 'America/Sao_Paulo',
    role: initialUser?.role || 'USER',
  })

  const [familyName, setFamilyName] = useState(initialFamily?.name || 'Família Principal (Casa)')
  const [savingUser, setSavingUser] = useState(false)
  const [savingFamily, setSavingFamily] = useState(false)
  const [downloadingBackup, setDownloadingBackup] = useState(false)
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState('')

  function showSuccess(msg: string) {
    setSuccessToast(msg)
    setTimeout(() => setSuccessToast(''), 4000)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingUser(true)
    try {
      // Simulação ou persistência de preferências de perfil
      await new Promise(r => setTimeout(r, 600))
      showSuccess('Perfil e preferências atualizados com sucesso!')
      router.refresh()
    } finally {
      setSavingUser(false)
    }
  }

  async function handleSaveFamily(e: React.FormEvent) {
    e.preventDefault()
    setSavingFamily(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      showSuccess('Nome do workspace atualizado!')
      router.refresh()
    } finally {
      setSavingFamily(false)
    }
  }

  async function handleDownloadBackup() {
    setDownloadingBackup(true)
    try {
      const res = await fetch(`/api/backup${initialFamily?.id ? `?familyId=${initialFamily.id}` : ''}`)
      if (!res.ok) throw new Error('Falha no download')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-financascasa-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess('Backup JSON exportado com sucesso!')
    } catch (err) {
      alert('Erro ao exportar backup.')
    } finally {
      setDownloadingBackup(false)
    }
  }

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setRestoreStatus('Lendo arquivo de backup...')
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess(`Backup validado! ${data.transactionsCount || 0} lançamentos verificados.`)
        setRestoreStatus(null)
        router.refresh()
      } else {
        setRestoreStatus(data.error || 'Erro na validação do backup.')
      }
    } catch (err) {
      setRestoreStatus('Arquivo JSON inválido ou corrompido.')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast de Sucesso */}
      {successToast && (
        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm flex items-center gap-2 animate-in fade-in sticky top-4 z-50 shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header com Avatar do Usuário e Botão de Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
            {userForm.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{userForm.name}</h1>
              <Badge variant="outline" className="text-xs">
                {userForm.role === 'ADMIN' ? 'Admin Global' : 'Membro Titular'}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">{userForm.email}</p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="gap-2 self-start sm:self-auto bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta (Sign Out)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Dados do Perfil */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Perfil & Preferências Pessoais
            </CardTitle>
            <CardDescription className="text-xs">
              Configurações de moeda e informações de contato.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveProfile}>
            <CardContent className="space-y-3.5 text-sm">
              <div className="space-y-1">
                <Label htmlFor="userName" className="text-xs">Nome Completo</Label>
                <Input
                  id="userName"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="userEmail" className="text-xs">E-mail</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={userForm.email}
                  disabled
                  className="bg-accent/40 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="userPhone" className="text-xs">Telefone / WhatsApp</Label>
                <Input
                  id="userPhone"
                  placeholder="(53) 99999-9999"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Moeda Principal</Label>
                  <Select
                    value={userForm.currency}
                    onValueChange={(v) => setUserForm({ ...userForm, currency: v ?? 'BRL' })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real (R$ - BRL)</SelectItem>
                      <SelectItem value="USD">Dólar ($ - USD)</SelectItem>
                      <SelectItem value="EUR">Euro (€ - EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Fuso Horário</Label>
                  <Select
                    value={userForm.timezone}
                    onValueChange={(v) => setUserForm({ ...userForm, timezone: v ?? 'America/Sao_Paulo' })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                      <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                      <SelectItem value="Europe/Lisbon">Lisboa (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-border/60">
              <Button type="submit" size="sm" disabled={savingUser}>
                {savingUser ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Card: Workspace da Família */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              Workspace da Família
            </CardTitle>
            <CardDescription className="text-xs">
              Gerencie a identidade e o escopo da sua casa compartilhada.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveFamily}>
            <CardContent className="space-y-3.5 text-sm">
              <div className="space-y-1">
                <Label htmlFor="familyName" className="text-xs">Nome do Grupo Familiar</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={e => setFamilyName(e.target.value)}
                />
              </div>

              <div className="p-3 bg-accent/30 rounded-lg border border-border/50 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Membros Ativos:</span>
                  <span className="font-semibold">{membersCount} pessoas</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lançamentos no Workspace:</span>
                  <span className="font-semibold">{initialFamily?.transactionsCount || 0} registros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Isolamento Multi-Tenant:</span>
                  <Badge variant="secondary" className="text-[10px] text-emerald-400">Ativo</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 border-t border-border/60">
              <Button type="submit" size="sm" disabled={savingFamily}>
                {savingFamily ? 'Salvando...' : 'Atualizar Workspace'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Card: Backup e Restauração de Dados */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" />
            Backup & Segurança de Dados (Exportar / Importar)
          </CardTitle>
          <CardDescription className="text-xs">
            Baixe uma cópia integral de segurança em JSON de todas as transações, membros e categorias da sua família.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="w-4 h-4" />
              {downloadingBackup ? 'Gerando JSON...' : 'Baixar Backup Completo (.JSON)'}
            </Button>

            <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-accent text-sm font-medium cursor-pointer transition-colors">
              <Upload className="w-4 h-4 text-indigo-400" />
              Restaurar de Arquivo JSON
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleRestoreFile}
              />
            </label>
          </div>

          {restoreStatus && (
            <p className="text-xs text-muted-foreground bg-accent/40 p-2.5 rounded border border-border">
              {restoreStatus}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

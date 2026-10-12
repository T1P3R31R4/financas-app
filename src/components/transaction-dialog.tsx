'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Mic, MicOff, Paperclip, X, Image as ImageIcon, FileText, Sparkles, CheckCircle2 } from 'lucide-react'

interface Member { id: string; name: string }
interface Category { id: string; name: string; type: string }

export interface TransactionFormData {
  id?: string
  description: string
  amount: string
  date: string
  dueDate: string
  type: 'INCOME' | 'EXPENSE'
  isFixed: boolean
  status: 'PENDING' | 'PAID'
  isHouseholdExpense: boolean
  notes: string
  receiptUrl: string
  audioNote: string
  tags: string[]
  memberId: string
  categoryId: string
}

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  members: Member[]
  categories: Category[]
  initialData?: Partial<TransactionFormData>
}

export function TransactionDialog({ open, onOpenChange, members, categories, initialData }: TransactionDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSuccessMsg, setSpeechSuccessMsg] = useState('')
  const [tagInput, setTagInput] = useState('')
  const recognitionRef = useRef<any>(null)

  const [form, setForm] = useState<TransactionFormData>({
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    dueDate: initialData?.dueDate || '',
    type: initialData?.type || 'EXPENSE',
    isFixed: initialData?.isFixed ?? false,
    status: initialData?.status || 'PENDING',
    isHouseholdExpense: initialData?.isHouseholdExpense ?? true,
    notes: initialData?.notes || '',
    receiptUrl: initialData?.receiptUrl || '',
    audioNote: initialData?.audioNote || '',
    tags: initialData?.tags || [],
    memberId: initialData?.memberId || '',
    categoryId: initialData?.categoryId || '',
  })

  const isEditing = !!initialData?.id
  const filteredCategories = categories.filter(c => c.type === form.type)

  function handleChange<K extends keyof TransactionFormData>(field: K, value: TransactionFormData[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Adicionar Tag
  function handleAddTag() {
    const trimmed = tagInput.trim().replace(/^#/, '')
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, trimmed] }))
      setTagInput('')
    }
  }

  function handleRemoveTag(tagToRemove: string) {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }))
  }

  // Upload de Comprovante
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: fd,
      })

      if (res.ok) {
        const data = await res.json()
        handleChange('receiptUrl', data.url)
      } else {
        alert('Erro ao enviar o comprovante.')
      }
    } catch (err) {
      alert('Falha ao comunicar com o servidor de upload.')
    } finally {
      setUploadingReceipt(false)
    }
  }

  // Speech-to-Text com Web Speech API
  function toggleSpeechRecognition() {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz nativo (Web Speech API). Experimente o Google Chrome ou Microsoft Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'pt-BR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      setSpeechSuccessMsg('')
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase()
      parseSpeechCommand(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // Parser Inteligente de Voz
  function parseSpeechCommand(transcript: string) {
    let detectedType: 'INCOME' | 'EXPENSE' = 'EXPENSE'
    if (
      transcript.includes('recebi') ||
      transcript.includes('ganhei') ||
      transcript.includes('entrada') ||
      transcript.includes('receita') ||
      transcript.includes('salário') ||
      transcript.includes('vendi')
    ) {
      detectedType = 'INCOME'
    }

    // Extrair valor numérico
    const amountMatch = transcript.match(/(\d+([.,]\d+)?)/)
    const detectedAmount = amountMatch ? amountMatch[1].replace(',', '.') : ''

    // Tentar associar categoria
    const targetCats = categories.filter(c => c.type === detectedType)
    const matchedCategory = targetCats.find(c =>
      transcript.includes(c.name.toLowerCase().split(' ')[0])
    ) || targetCats[0]

    // Formatar descrição
    let cleanDesc = transcript
      .replace(/gastei|comprei|paguei|recebi|ganhei|de|em|no|na|reais|real/gi, '')
      .replace(/\d+([.,]\d+)?/g, '')
      .trim()

    if (!cleanDesc) cleanDesc = transcript

    setForm(prev => ({
      ...prev,
      type: detectedType,
      amount: detectedAmount || prev.amount,
      description: cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1),
      categoryId: matchedCategory ? matchedCategory.id : prev.categoryId,
      audioNote: transcript,
    }))

    setSpeechSuccessMsg(`Comando reconhecido: "${transcript}"`)
    setTimeout(() => setSpeechSuccessMsg(''), 5000)
  }

  async function handleSubmit() {
    if (!form.description || !form.amount || !form.memberId || !form.categoryId) return
    setLoading(true)
    try {
      const url = isEditing ? `/api/transactions/${initialData?.id}` : '/api/transactions'
      const method = isEditing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        onOpenChange(false)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] w-[95vw] bg-card border-border max-h-[92vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/60">
          <DialogTitle>{isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}</DialogTitle>
          {/* Botão de Gravação de Voz Inteligente */}
          <Button
            type="button"
            size="sm"
            variant={isListening ? 'destructive' : 'outline'}
            onClick={toggleSpeechRecognition}
            className={`gap-1.5 text-xs h-8 ${isListening ? 'animate-pulse' : 'hover:border-primary/50'}`}
            title="Diga ex: 'gastei 50 reais no mercado'"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-primary" />}
            {isListening ? 'Ouvindo...' : 'Comando por Voz'}
          </Button>
        </DialogHeader>

        {speechSuccessMsg && (
          <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary text-xs rounded-md flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="truncate">{speechSuccessMsg}</span>
          </div>
        )}

        <div className="grid gap-3.5 py-2">
          {/* Tipo: Entrada / Saída */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Tipo de Lançamento *</Label>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => { handleChange('type', 'INCOME'); handleChange('categoryId', '') }}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                  form.type === 'INCOME'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-semibold'
                    : 'border-border hover:border-emerald-500/50'
                }`}
              >
                ↑ Entrada (Receita)
              </button>
              <button
                type="button"
                onClick={() => { handleChange('type', 'EXPENSE'); handleChange('categoryId', '') }}
                className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-colors ${
                  form.type === 'EXPENSE'
                    ? 'bg-red-600 text-white border-red-600 font-semibold'
                    : 'border-border hover:border-red-500/50'
                }`}
              >
                ↓ Saída (Despesa)
              </button>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="description" className="text-xs">Descrição *</Label>
            <Input
              id="description"
              placeholder="Ex: Aluguel, Mercado, Cliente Maria..."
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="amount" className="text-xs">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={form.amount}
                onChange={e => handleChange('amount', e.target.value)}
                className="font-semibold"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="date" className="text-xs">Data *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={e => handleChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Membro Responsável *</Label>
              <Select value={form.memberId} onValueChange={v => handleChange('memberId', v ?? '')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecionar...">
                    {(val) => members.find(m => m.id === val)?.name ?? "Selecionar..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {members.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Categoria *</Label>
              <Select value={form.categoryId} onValueChange={v => handleChange('categoryId', v ?? '')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecionar...">
                    {(val) => filteredCategories.find(c => c.id === val)?.name ?? "Selecionar..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label className="text-xs">Frequência</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('isFixed', true)}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    form.isFixed ? 'bg-indigo-600 text-white border-indigo-600' : 'border-border'
                  }`}
                >Fixo</button>
                <button
                  type="button"
                  onClick={() => handleChange('isFixed', false)}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    !form.isFixed ? 'bg-amber-600 text-white border-amber-600' : 'border-border'
                  }`}
                >Variável</button>
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs">Status</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('status', 'PAID')}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    form.status === 'PAID' ? 'bg-emerald-600 text-white border-emerald-600' : 'border-border'
                  }`}
                >
                  {form.type === 'INCOME' ? 'Recebido' : 'Pago'}
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('status', 'PENDING')}
                  className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium transition-colors ${
                    form.status === 'PENDING' ? 'bg-amber-600 text-white border-amber-600' : 'border-border'
                  }`}
                >
                  {form.type === 'INCOME' ? 'A Receber' : 'Pendente'}
                </button>
              </div>
            </div>
          </div>

          {/* Anexo de Comprovante (Upload) */}
          <div className="grid gap-1.5 border border-border/60 rounded-md p-3 bg-accent/20">
            <Label className="text-xs flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              Comprovante / Recibo (Foto ou PDF)
            </Label>
            {form.receiptUrl ? (
              <div className="flex items-center justify-between p-2 rounded bg-background border border-border text-xs">
                <div className="flex items-center gap-2 truncate">
                  <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <a
                    href={form.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    Ver comprovante anexado
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange('receiptUrl', '')}
                  className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded border border-dashed border-border hover:border-primary/60 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <Paperclip className="w-3.5 h-3.5" />
                  {uploadingReceipt ? 'Enviando arquivo...' : 'Anexar Comprovante (Imagem / PDF)'}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingReceipt}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="grid gap-1.5">
            <Label className="text-xs">Tags / Etiquetas</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: viagem, mercado, salão..."
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                className="h-8 text-xs"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddTag} className="h-8 text-xs">
                Adicionar
              </Button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {form.tags.map(t => (
                  <Badge key={t} variant="secondary" className="text-[10px] gap-1 py-0.5">
                    #{t}
                    <button type="button" onClick={() => handleRemoveTag(t)}>
                      <X className="w-2.5 h-2.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Áudio Transcrito (se houver) */}
          {form.audioNote && (
            <div className="p-2 bg-accent/30 rounded border border-border/50 text-[11px] text-muted-foreground">
              <span className="font-semibold text-primary">Transcrição de voz:</span> "{form.audioNote}"
            </div>
          )}

          <div className="flex items-center gap-3 p-2.5 rounded-md border border-border bg-background/50">
            <input
              id="household"
              type="checkbox"
              className="w-4 h-4 accent-primary"
              checked={form.isHouseholdExpense}
              onChange={e => handleChange('isHouseholdExpense', e.target.checked)}
            />
            <Label htmlFor="household" className="cursor-pointer text-xs">
              Esta é uma despesa da casa (compartilhada entre os membros)
            </Label>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-border/60">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !form.description || !form.amount || !form.memberId || !form.categoryId}
            className={form.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
          >
            {loading ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Lançamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

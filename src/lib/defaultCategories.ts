import { PrismaClient, CategoryType } from '@prisma/client'

/**
 * Conjunto de categorias padrão a criar para cada novo tenant (família).
 * Cada utilizador/família recebe uma cópia própria — sem partilha global.
 */
const DEFAULT_CATEGORIES = [
  // ── RECEITAS ─────────────────────────────────────────────────────────────
  { name: 'Salário Fixo',              type: CategoryType.INCOME,  icon: 'Banknote',    color: '#10b981' },
  { name: 'Renda Extra / Freelance',   type: CategoryType.INCOME,  icon: 'Briefcase',   color: '#34d399' },
  { name: 'Serviços Autônomos',        type: CategoryType.INCOME,  icon: 'Scissors',    color: '#ec4899' },
  { name: 'Investimentos & Rendimentos', type: CategoryType.INCOME, icon: 'TrendingUp', color: '#6366f1' },
  { name: 'Aposentadoria / Pensão',    type: CategoryType.INCOME,  icon: 'PiggyBank',   color: '#06b6d4' },
  { name: 'Bonificação / Premiação',   type: CategoryType.INCOME,  icon: 'Award',       color: '#f59e0b' },
  { name: 'Outras Receitas',           type: CategoryType.INCOME,  icon: 'PlusCircle',  color: '#8b5cf6' },

  // ── DESPESAS ─────────────────────────────────────────────────────────────
  { name: 'Alimentação & Supermercado',            type: CategoryType.EXPENSE, icon: 'Utensils',     color: '#f59e0b' },
  { name: 'Moradia (Aluguel / Condomínio)',         type: CategoryType.EXPENSE, icon: 'Home',         color: '#6366f1' },
  { name: 'Contas de Consumo (Luz, Água, Gás, Net)', type: CategoryType.EXPENSE, icon: 'Zap',        color: '#eab308' },
  { name: 'Saúde & Farmácia',                      type: CategoryType.EXPENSE, icon: 'HeartPulse',   color: '#ef4444' },
  { name: 'Transporte & Veículo',                  type: CategoryType.EXPENSE, icon: 'Car',          color: '#3b82f6' },
  { name: 'Educação & Cursos',                     type: CategoryType.EXPENSE, icon: 'GraduationCap',color: '#8b5cf6' },
  { name: 'Lazer & Entretenimento',                type: CategoryType.EXPENSE, icon: 'Gamepad2',     color: '#ec4899' },
  { name: 'Cuidados Pessoais & Beleza',            type: CategoryType.EXPENSE, icon: 'Sparkles',     color: '#d946ef' },
  { name: 'Compras & Vestuário',                   type: CategoryType.EXPENSE, icon: 'ShoppingBag',  color: '#14b8a6' },
  { name: 'Manutenção & Reforma da Casa',          type: CategoryType.EXPENSE, icon: 'Wrench',       color: '#64748b' },
  { name: 'Impostos & Tarifas Bancárias',          type: CategoryType.EXPENSE, icon: 'Receipt',      color: '#dc2626' },
  { name: 'Outras Despesas',                       type: CategoryType.EXPENSE, icon: 'HelpCircle',   color: '#94a3b8' },
] as const

/**
 * Cria o conjunto padrão de categorias (receitas + despesas) para um tenant.
 *
 * @param prisma  - Instância do PrismaClient (permite reutilização em contextos
 *                  de transação ou no cliente singleton normal).
 * @param familyId - ID da família (tenant) à qual as categorias serão associadas.
 * @returns        - Array com as categorias criadas.
 *
 * @example
 * // No registo por credenciais:
 * await createDefaultCategories(prisma, newFamily.id)
 *
 * // No evento createUser (OAuth):
 * await createDefaultCategories(prisma, newFamily.id)
 */
export async function createDefaultCategories(
  prisma: PrismaClient,
  familyId: string
): Promise<void> {
  // Verifica se o tenant já possui categorias (idempotência — evita duplicação)
  const existing = await prisma.category.count({ where: { familyId } })
  if (existing > 0) return

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map(cat => ({
      name:     cat.name,
      type:     cat.type,
      icon:     cat.icon,
      color:    cat.color,
      familyId, // ← Sempre associado ao tenant — NUNCA null
    })),
    skipDuplicates: true,
  })
}

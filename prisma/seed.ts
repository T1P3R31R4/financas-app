import { PrismaClient, CategoryType, TransactionType, StatusType, RelationshipType, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed do banco de dados...')

  // Limpeza de tabelas respeitando constraints
  await prisma.activityLog.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.member.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.family.deleteMany()

  // 1. Família Principal (Workspace Tenant)
  const defaultFamily = await prisma.family.create({
    data: {
      name: 'Família Principal (Casa)',
    },
  })

  // 2. Usuário Administrador
  const adminUser = await prisma.user.create({
    data: {
      name: 'Administrador Tiago',
      email: 'admin@financascasa.com',
      role: Role.ADMIN,
      familyId: defaultFamily.id,
    },
  })

  // 3. Categorias Globais do Sistema (familyId: null)
  const globalCategoriesData = [
    // RECEITAS
    { name: 'Salário Fixo', type: CategoryType.INCOME, icon: 'Banknote', color: '#10b981' },
    { name: 'Renda Extra / Freelance', type: CategoryType.INCOME, icon: 'Briefcase', color: '#34d399' },
    { name: 'Serviços Autônomos', type: CategoryType.INCOME, icon: 'Scissors', color: '#ec4899' },
    { name: 'Investimentos & Rendimentos', type: CategoryType.INCOME, icon: 'TrendingUp', color: '#6366f1' },
    { name: 'Aposentadoria / Pensão', type: CategoryType.INCOME, icon: 'PiggyBank', color: '#06b6d4' },
    { name: 'Bonificação / Premiação', type: CategoryType.INCOME, icon: 'Award', color: '#f59e0b' },
    { name: 'Outras Receitas', type: CategoryType.INCOME, icon: 'PlusCircle', color: '#8b5cf6' },

    // DESPESAS
    { name: 'Alimentação & Supermercado', type: CategoryType.EXPENSE, icon: 'Utensils', color: '#f59e0b' },
    { name: 'Moradia (Aluguel / Condomínio)', type: CategoryType.EXPENSE, icon: 'Home', color: '#6366f1' },
    { name: 'Contas de Consumo (Luz, Água, Gás, Net)', type: CategoryType.EXPENSE, icon: 'Zap', color: '#eab308' },
    { name: 'Saúde & Farmácia', type: CategoryType.EXPENSE, icon: 'HeartPulse', color: '#ef4444' },
    { name: 'Transporte & Veículo', type: CategoryType.EXPENSE, icon: 'Car', color: '#3b82f6' },
    { name: 'Educação & Cursos', type: CategoryType.EXPENSE, icon: 'GraduationCap', color: '#8b5cf6' },
    { name: 'Lazer & Entretenimento', type: CategoryType.EXPENSE, icon: 'Gamepad2', color: '#ec4899' },
    { name: 'Cuidados Pessoais & Beleza', type: CategoryType.EXPENSE, icon: 'Sparkles', color: '#d946ef' },
    { name: 'Compras & Vestuário', type: CategoryType.EXPENSE, icon: 'ShoppingBag', color: '#14b8a6' },
    { name: 'Manutenção & Reforma da Casa', type: CategoryType.EXPENSE, icon: 'Wrench', color: '#64748b' },
    { name: 'Impostos & Tarifas Bancárias', type: CategoryType.EXPENSE, icon: 'Receipt', color: '#dc2626' },
    { name: 'Outras Despesas', type: CategoryType.EXPENSE, icon: 'HelpCircle', color: '#94a3b8' },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of globalCategoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        familyId: null, // Categoria Global
      },
    })
    createdCategories[cat.name] = created.id
  }

  // 4. Membros da Família
  const tiago = await prisma.member.create({
    data: {
      name: 'Tiago',
      color: '#3b82f6',
      relationship: RelationshipType.TITULAR,
      age: 35,
      isFixedIncome: true,
      baseSalary: 6000.0,
      familyId: defaultFamily.id,
    },
  })

  const esposa = await prisma.member.create({
    data: {
      name: 'Esposa',
      color: '#ec4899',
      relationship: RelationshipType.CONJUGE,
      age: 32,
      isFixedIncome: false,
      familyId: defaultFamily.id,
    },
  })

  const pai = await prisma.member.create({
    data: {
      name: 'Pai',
      color: '#10b981',
      relationship: RelationshipType.PAI_MAE,
      age: 68,
      isFixedIncome: true,
      baseSalary: 3500.0,
      familyId: defaultFamily.id,
    },
  })

  // 5. Lançamentos Iniciais de Exemplo
  await prisma.transaction.create({
    data: {
      description: 'Salário Semanal Tiago',
      amount: 1500.0,
      date: new Date(),
      type: TransactionType.INCOME,
      isFixed: true,
      status: StatusType.PAID,
      isHouseholdExpense: false,
      memberId: tiago.id,
      categoryId: createdCategories['Salário Fixo'],
      familyId: defaultFamily.id,
    },
  })

  await prisma.transaction.create({
    data: {
      description: 'Aposentadoria Pai',
      amount: 3500.0,
      date: new Date(),
      type: TransactionType.INCOME,
      isFixed: true,
      status: StatusType.PAID,
      isHouseholdExpense: false,
      memberId: pai.id,
      categoryId: createdCategories['Aposentadoria / Pensão'],
      familyId: defaultFamily.id,
    },
  })

  await prisma.transaction.create({
    data: {
      description: 'Serviço de Beleza / Cabelo',
      amount: 220.0,
      date: new Date(),
      type: TransactionType.INCOME,
      isFixed: false,
      status: StatusType.PAID,
      isHouseholdExpense: false,
      memberId: esposa.id,
      categoryId: createdCategories['Serviços Autônomos'],
      familyId: defaultFamily.id,
    },
  })

  await prisma.transaction.create({
    data: {
      description: 'Aluguel do Mês',
      amount: 2400.0,
      date: new Date(),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      type: TransactionType.EXPENSE,
      isFixed: true,
      status: StatusType.PENDING,
      isHouseholdExpense: true,
      memberId: tiago.id,
      categoryId: createdCategories['Moradia (Aluguel / Condomínio)'],
      familyId: defaultFamily.id,
    },
  })

  await prisma.transaction.create({
    data: {
      description: 'Compras de Mercado Mensal',
      amount: 980.5,
      date: new Date(),
      type: TransactionType.EXPENSE,
      isFixed: false,
      status: StatusType.PAID,
      isHouseholdExpense: true,
      memberId: pai.id,
      categoryId: createdCategories['Alimentação & Supermercado'],
      familyId: defaultFamily.id,
    },
  })

  // 6. Registro Inicial de Auditoria / Telemetria (ActivityLog)
  await prisma.activityLog.create({
    data: {
      action: 'INITIAL_SEED',
      entity: 'SYSTEM',
      userId: adminUser.id,
      familyId: defaultFamily.id,
      metadata: {
        note: 'Carga inicial de dados e categorias globais no ambiente SaaS multi-tenant',
        categoriesCount: globalCategoriesData.length,
        version: '0.3.0',
      },
    },
  })

  console.log('Seed multi-tenant e categorias globais finalizado com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

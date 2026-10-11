# FinancasCasa

Controle Financeiro Familiar projetado para gestão transparente de gastos para residências compartilhadas.

## Tecnologias Utilizadas

- **Next.js 14+** (App Router, Server Actions)
- **Prisma ORM** com suporte nativo ao MySQL (incluindo `Decimal`)
- **Tailwind CSS** e **Shadcn UI**
- **Recharts** para Gráficos Financeiros

## Como Rodar o Projeto

1. **Pré-requisitos**:
   - Node.js versão 18.17 ou superior
   - MySQL instalado e rodando

2. **Configuração do Banco de Dados**:
   - Na raiz do projeto, edite a string de conexão `DATABASE_URL` no `.env` apontando para o seu MySQL local.
   Exemplo: `DATABASE_URL="mysql://root:senha@localhost:3306/financascasa"`

3. **Migrações e Banco de Dados**:
   - Após configurar o banco no `.env`, instale as dependências:
     ```bash
     npm install
     ```
   - Gere o schema do banco de dados (isso criará as tabelas no MySQL):
     ```bash
     npx prisma db push
     ```
     *Se for a primeira vez e você quiser inicializar o histórico de migrações, use: `npx prisma migrate dev --name init`*
   - Rode o script de Seed para popular os membros (Tiago, Esposa, Pai) e as categorias base:
     ```bash
     npx prisma db seed
     ```

4. **Rodando a Aplicação**:
   - Inicialize o servidor de desenvolvimento:
     ```bash
     npm run dev
     ```
   - Acesse `http://localhost:3000` em seu navegador.

## Estrutura de Lançamentos

- Todos os gastos são associados a um Membro (quem pagou) e podem ser `Despesas da Casa` (isHouseholdExpense = true) ou gastos avulsos da pessoa (isHouseholdExpense = false).
- Receitas como `Salário` ou entradas da `Esposa (Autônoma - Salão)` ajudam a formar o Caixa de forma orgânica.

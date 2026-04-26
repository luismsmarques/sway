# Solo-Flow

Motor de reservas mobile-first para profissionais independentes (Surf, Yoga, PT), com foco em velocidade operacional:

- O instrutor "pinta" a agenda com slots manuais.
- O aluno reserva em poucos cliques (nome + telemovel).
- O sistema suporta aulas privadas e de grupo no mesmo fluxo.

## Estado do projeto

Funcionalidades principais implementadas:

- Dashboard do instrutor com feed cronologico.
- Criacao de slots via drawer e botao flutuante.
- Deteccao visual de conflitos de horario.
- Gestao de inscritos por slot (detalhe de aula, remocao, cancelamento de aula).
- Pagina publica de reservas em `/book/[slug]`.
- Tracking de alunos por telemovel (unico por instrutor).
- Persistencia real com Prisma + transacoes.
- Deploy em Vercel.

## Stack tecnica

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL (Supabase)
- Vercel (hosting)
- Lucide React (icones)
- canvas-confetti (feedback visual na reserva)

## Estrutura da app

```txt
src/
  app/
    page.tsx                 # Dashboard do instrutor
    book/[slug]/page.tsx     # Pagina publica de reservas
    templates/new/page.tsx   # UI de criacao de templates
    actions.ts               # Server Actions e transacoes Prisma
  lib/
    prisma.ts                # Prisma singleton client
prisma/
  schema.prisma              # Schema ORM
supabase/
  schema.sql                 # Schema SQL para Supabase
```

## Modelo de dados

Tabelas principais:

- `profiles`: instrutores
- `templates`: moldes de servico (PRIVATE/GROUP)
- `slots`: instancias de agenda (com capacidade atual e maxima)
- `students`: alunos por instrutor (chave unica: `owner_id + phone`)
- `bookings`: reservas por slot

Regras chave:

- `slots.current_capacity <= slots.max_capacity`
- reserva atomica (capacidade + booking na mesma transacao)
- tracking de aluno por telemovel por instrutor

## Fluxos principais

### 1) Instrutor

1. Criar/selecionar template
2. Criar slot no dashboard
3. Ver inscritos no detalhe da aula
4. Remover aluno (liberta vaga)
5. Cancelar aula (marca bookings `CANCELED` e remove slot)

### 2) Aluno

1. Acede a `/book/[slug]`
2. Escolhe slot disponivel
3. Insere nome + telemovel
4. Reserva confirmada
5. Opcao de adicionar ao calendario

## Transacoes e consistencia

Implementadas em `src/app/actions.ts`:

- `createBookingAction`
  - valida lotacao em tempo real
  - resolve/cria aluno por telefone
  - incrementa ocupacao do slot
  - cria booking
  - tudo em `prisma.$transaction`

- `removeBookingFromSlotAction`
  - remove booking
  - decrementa ocupacao do slot
  - transacional

- `cancelClassAction`
  - marca bookings como `CANCELED`
  - remove slot
  - transacional

## Setup local

### 1) Requisitos

- Node.js 20+
- npm 10+
- projeto Supabase criado

### 2) Instalar dependencias

```bash
npm install
```

### 3) Configurar ambiente

```bash
cp .env.example .env.local
```

Preencher:

```env
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

> `DATABASE_URL` e usado pelo Prisma.

### 4) Aplicar schema no Supabase

Executar `supabase/schema.sql` no SQL Editor do Supabase.

### 5) Gerar Prisma Client

```bash
npx prisma generate
```

### 6) Correr em desenvolvimento

```bash
npm run dev
```

## Scripts

- `npm run dev` - desenvolvimento
- `npm run build` - build de producao
- `npm run start` - correr build localmente
- `npm run lint` - validacao de lint

## Deploy (Vercel)

### Via dashboard

1. Importar o repositorio na Vercel
2. Definir variaveis de ambiente:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Deploy

### Via CLI

```bash
vercel login
vercel link
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel --prod
```

## Troubleshooting

### `column "student_id" does not exist`

Acontece quando a tabela `bookings` ja existia antes da migracao.  
Executa uma migracao incremental para adicionar colunas/constraints em vez de recriar tabelas.

### Reserva falha por lotacao

Mensagem esperada:

`Desculpe, esta aula acabou de esgotar!`

Isto protege contra overbooking em concorrencia.

## Roadmap

- Autenticacao completa do instrutor
- CRUD real de templates (sem mocks)
- Integracao SMS (Twilio) para reagendamentos
- Politicas de seguranca (RLS) no Supabase
- Testes automatizados E2E dos fluxos criticos

## Licenca

ISC

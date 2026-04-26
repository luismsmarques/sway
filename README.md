# Solo-Flow

Motor de reservas mobile-first para profissionais independentes (Surf, Yoga, PT), com foco em velocidade operacional:

- O instrutor "pinta" a agenda com slots manuais.
- O aluno reserva em poucos cliques (nome + telemovel).
- O sistema suporta aulas privadas e de grupo no mesmo fluxo.

## Estado do projeto

Funcionalidades principais implementadas:

- Landing page de marketing em `/`.
- Autenticacao com Supabase Auth (login/registo com slug).
- Dashboard protegido em `/dashboard` com isolamento por instrutor.
- Criacao de slots via barra de acoes agrupada (filtros + data + CTA).
- Deteccao visual de conflitos de horario.
- Gestao de inscritos por slot (detalhe de aula, remocao, cancelamento de aula).
- Pagina publica de reservas em `/book/[slug]`.
- Tracking de alunos por telemovel (unico por instrutor).
- Persistencia real com Prisma + transacoes.
- Refatoracao visual premium com Layout Shell unificado + design tokens semanticos.
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
- Shadcn/UI (Card, Button, Dialog, Drawer, Badge, Input, ScrollArea, Separator)

## Estrutura da app

```txt
src/
  app/
    page.tsx                 # Landing page (marketing)
    dashboard/page.tsx       # Dashboard do instrutor (protegido)
    login/page.tsx           # Login (publico)
    register/page.tsx        # Registo (publico)
    auth/login/page.tsx      # Login
    auth/register/page.tsx   # Registo
    book/[slug]/page.tsx     # Pagina publica de reservas
    templates/new/page.tsx   # UI de criacao de templates
    actions.ts               # Server Actions e transacoes Prisma
  components/ui/dashboard/
    dashboard-header.tsx     # Header de navegacao do painel
    dashboard-action-bar.tsx # Barra de acoes agrupada
    agenda-slot-list.tsx     # Feed de agenda em ul/li com divide-y
    student-profile-hero.tsx # Hero premium da pagina publica
    availability-day-list.tsx# Lista de horarios agrupada por dia
    booking-drawer-form.tsx  # Checkout da reserva (drawer)
    ui-tokens.ts             # Tokens visuais (shell + botoes)
    status-tokens.ts         # Tokens semanticos de estado/badges
    types.ts                 # Tipos do dashboard
    public-booking-types.ts  # Tipos da pagina publica
  lib/
    prisma.ts                # Prisma singleton client
prisma/
  schema.prisma              # Schema ORM
supabase/
  schema.sql                 # Schema SQL para Supabase
```

## Design System UI/UX

Base visual atual:

- Layout Shell global em `bg-[#F9FAFB]`.
- Conteudo centralizado em `max-w-4xl` (desktop) e margens fixas no mobile.
- Agrupamento de informacao com cards brancos (`border border-slate-200` + `shadow-none`).
- Hierarquia tipografica consistente:
  - Titulos: `text-2xl font-semibold tracking-tight`
  - Descricoes: `text-sm text-slate-600`
- Acoes primarias com `shadow-sm` e `active:scale-[0.98]`.
- Formularios com `Input` Shadcn para consistencia entre paginas.
- Dashboard com feed estruturado em lista integrada (`ul/li + divide-y`).
- Checkout do aluno com `Drawer` (mobile-first, slide-up).
- Raio global modernizado em `--radius: 1rem` no `globals.css`.
- Tokens visuais centralizados:
  - `ui-tokens.ts`: shell, cards, titulos e botoes
  - `status-tokens.ts`: badges de tipo/capacidade/aviso/info

Pags refatoradas:

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/book/[slug]/page.tsx`
- `src/app/templates/new/page.tsx`
- `src/app/auth/login/page.tsx`
- `src/app/auth/register/page.tsx`

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
- isolamento multi-tenant por `profiles.user_id` + RLS

## Fluxos principais

### 1) Instrutor

1. Criar conta / iniciar sessao
2. Escolher slug no registo (ex: `joao-surf`)
3. Criar/selecionar template
4. Criar slot no dashboard
5. Ver inscritos no detalhe da aula
6. Remover aluno (liberta vaga)
7. Cancelar aula (marca bookings `CANCELED` e remove slot)

### 2) Aluno

1. Acede a `/book/[slug]`
2. Escolhe slot disponivel
3. Insere nome + telemovel
4. Reserva confirmada
5. Opcao de adicionar ao calendario

### 3) Marketing / Aquisição

1. Visita a landing em `/`
2. Entende proposta de valor e beneficios
3. Clica em "Comecar Agora Gratuitamente"
4. Converte via `/register`

## Auth e RLS

Implementado:

- Supabase Auth com paginas dedicadas:
  - `/login`
  - `/register`
- Middleware de protecao:
  - `/dashboard/:path*` exige sessao ativa
  - utilizador autenticado em `/login` ou `/register` e redirecionado para `/dashboard`
- Perfil automatico no primeiro login/registo:
  - cria `profiles` com `user_id`, `name`, `slug` unico
  - usa o slug escolhido no registo; se ja existir, resolve colisao com sufixo
- RLS aplicado em:
  - `profiles`, `templates`, `slots`, `students`, `bookings`

Objetivo: cada instrutor so acede aos seus proprios dados.

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

> Se ja existirem tabelas antigas, aplica migracao incremental (sem recriar).

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

## Quick Demo Links

Usa estes caminhos para testar rapidamente os fluxos principais:

- `/` - Landing page (marketing)
- `/login` - Login de instrutor
- `/register` - Registo com escolha de slug
- `/dashboard` - Painel do instrutor (rota protegida)
- `/book/[slug]` - Pagina publica de reservas (exemplo: `/book/joao-surf`)

## Troubleshooting

### `column "student_id" does not exist`

Acontece quando a tabela `bookings` ja existia antes da migracao.  
Executa uma migracao incremental para adicionar colunas/constraints em vez de recriar tabelas.

### Reserva falha por lotacao

Mensagem esperada:

`Desculpe, esta aula acabou de esgotar!`

Isto protege contra overbooking em concorrencia.

## Roadmap

- CRUD real de templates (sem mocks)
- Integracao SMS (Twilio) para reagendamentos
- Testes automatizados E2E dos fluxos criticos

## Licenca

ISC

# Manual Técnico — SistemaXTelhas

**Versão:** 1.0  
**Público:** Desenvolvedores e administradores de sistema  
**Repositório:** [github.com/gustavolagefaria-sys/SistemaXTelhas](https://github.com/gustavolagefaria-sys/SistemaXTelhas)  
**URL produção:** [sistema-x-telhas.vercel.app](https://sistema-x-telhas.vercel.app)

---

## Sumário

1. [Stack e dependências](#1-stack-e-dependências)
2. [Arquitetura](#2-arquitetura)
3. [Estrutura de diretórios](#3-estrutura-de-diretórios)
4. [Banco de dados](#4-banco-de-dados)
5. [Autenticação e sessões](#5-autenticação-e-sessões)
6. [API Routes](#6-api-routes)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Deploy e infraestrutura](#8-deploy-e-infraestrutura)
9. [Desenvolvimento local](#9-desenvolvimento-local)
10. [Comandos úteis](#10-comandos-úteis)

---

## 1. Stack e dependências

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js | 14.2.3 |
| UI | React | 18.3.1 |
| ORM | Prisma | 5.13.0 |
| Banco de dados | PostgreSQL | — |
| Autenticação | JWT (jose) | 5.10.0 |
| Hash de senhas | bcryptjs | 2.4.3 |
| Runtime | Node.js | ≥ 18 |

**Não há** TypeScript, biblioteca de UI externa, gerenciador de estado global ou framework de testes configurado.

---

## 2. Arquitetura

```
Browser (React)
     │
     │  HTTP / cookies (httpOnly)
     ▼
Next.js Middleware (src/middleware.js)
     │  JWT validation + sliding session renewal
     ▼
Next.js App Router (src/app/)
     │
     ├── Pages (Client Components)
     │     └── chamam API Routes via fetch()
     │
     └── API Routes (src/app/api/)
           │
           ▼
       Prisma ORM (src/lib/prisma.js)
           │
           ▼
       PostgreSQL (Neon — sa-east-1)
```

O sistema é **monolítico**: frontend e backend rodam no mesmo processo Next.js. Não há separação de serviços.

Toda a lógica de negócio fica nas API Routes. Os Client Components apenas renderizam dados e enviam formulários.

---

## 3. Estrutura de diretórios

```
SistemaXTelhas/
├── prisma/
│   ├── schema.prisma       # Definição dos modelos
│   └── seed.js             # Dados iniciais (empresa, admin, tipos)
├── src/
│   ├── app/
│   │   ├── api/            # Endpoints REST
│   │   │   ├── auth/       # login, cadastro, logout, recuperar, redefinir
│   │   │   ├── auditoria/
│   │   │   ├── dashboard/
│   │   │   ├── despesas/
│   │   │   ├── pedidos/
│   │   │   ├── relatorio/
│   │   │   └── tipos-despesa/
│   │   ├── auditoria/      # Página de auditoria
│   │   ├── despesas/       # Página de despesas
│   │   ├── login/          # Página de login
│   │   ├── pedidos/        # Página de pedidos
│   │   ├── recuperar-senha/
│   │   ├── relatorio/      # Página de relatório
│   │   ├── tipos-despesa/  # Página de tipos
│   │   ├── layout.jsx      # Layout raiz (sidebar + nav)
│   │   └── page.jsx        # Dashboard
│   ├── lib/
│   │   ├── auth.js         # Utilitários JWT e sessão
│   │   └── prisma.js       # Singleton do PrismaClient
│   └── middleware.js       # Proteção global de rotas
├── .env                    # Variáveis de ambiente (não commitado)
├── .env.example            # Template de variáveis
├── vercel.json             # Configuração de build Vercel
└── package.json
```

---

## 4. Banco de dados

### Modelos

```
Empresa ──< Usuario ──< Despesa
                  │
                  ├──< Pedido
                  ├──< Sessao
                  ├──< TokenRecuperacao
                  └──< LogAtividade

TipoDespesa ──< Despesa
```

### Descrição dos modelos

**Empresa**
```
id          Int       PK autoincrement
nome        String
cnpj        String?   unique
criadoEm   DateTime  default now()
```

**Usuario**
```
id          Int       PK autoincrement
nome        String
email       String    unique
senhaHash   String
perfil      Enum      ADMIN | USUARIO
ativo       Boolean   default true
empresaId   Int       FK Empresa
ultimoLogin DateTime?
criadoEm   DateTime
```

**Sessao**
```
id          String    PK uuid
usuarioId   Int       FK Usuario
ip          String?
userAgent   String?
criadaEm   DateTime
expiresAt   DateTime
ativa       Boolean   default true
```

**LogAtividade**
```
id          Int       PK autoincrement
usuarioId   Int       FK Usuario
tipoAcao    String    CREATE | UPDATE | DELETE | LOGIN | LOGOUT
entidade    String    despesas | pedidos | usuarios | tipos-despesa
registroId  String?
descricao   String?
dadosAntes  Json?
dadosDepois Json?
ip          String?
criadoEm   DateTime
```

**TipoDespesa**
```
id          Int       PK autoincrement
nome        String
empresaId   Int?      FK Empresa (null = sistema)
isSistema   Boolean   default false
ativo       Boolean   default true
```

**Despesa**
```
id              Int       PK autoincrement
empresaId       Int       FK Empresa
tipoId          Int       FK TipoDespesa
criadoPorId     Int       FK Usuario
descricao       String?
unidadeMedida   String?
quantidade      Decimal?  (12,3)
precoUnitario   Decimal?  (12,2)
valor           Decimal   (12,2)
dataLancamento  Date
mesRef          String    formato: YYYY-MM
criadoEm       DateTime
```

**Pedido**
```
id           Int       PK autoincrement
empresaId    Int       FK Empresa
criadoPorId  Int       FK Usuario
numeroPedido String
valorTotal   Decimal   (12,2)
custoBruto   Decimal?  (12,2)
nfEmitida    Boolean   default false
valorNf      Decimal?  (12,2)
numeroNf     String?
dataEmissao  Date
mesRef       String    formato: YYYY-MM
criadoEm    DateTime
```

### Multi-tenancy

Todos os registros de negócio carregam `empresaId`. Atualmente o sistema opera com empresa única (ID = 1, criada via seed). A estrutura já suporta múltiplas empresas sem alteração de schema.

### Precisão financeira

Valores monetários usam `Decimal(12,2)`. Quantidades de materiais usam `Decimal(12,3)`. Nunca use `Float` para valores financeiros — o Prisma preserva a precisão decimal.

---

## 5. Autenticação e sessões

### Fluxo de login

```
POST /api/auth/login
  → bcrypt.compare(senha, senhaHash)
  → jose.SignJWT({ usuarioId, empresaId, perfil }, secret, 10min)
  → Set-Cookie: xtelhas_session=<jwt>; httpOnly; secure; sameSite=lax
  → Criar registro em Sessao (opcional: para auditoria)
```

### Middleware (sliding session)

Executado em **toda requisição** (exceto rotas públicas):

```
Request chega
  → Lê cookie xtelhas_session
  → jose.jwtVerify(token, secret)
  → Se inválido → redireciona para /login?expirado=1
  → Se válido:
      → Gera novo token (reset dos 10 min)
      → Seta novo cookie
      → Injeta headers: x-usuario-id, x-empresa-id, x-usuario-perfil
      → Passa para o handler
```

### Rotas públicas

```javascript
const PUBLIC = [
  '/login',
  '/recuperar-senha',
  '/api/auth/login',
  '/api/auth/cadastro',
  '/api/auth/recuperar',
  '/api/auth/redefinir',
]
```

### Configuração do cookie

```javascript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 600  // 10 minutos
}
```

### Verificar usuário em API Routes

```javascript
import { getUsuarioSessao } from '@/lib/auth'

export async function GET(request) {
  const usuario = await getUsuarioSessao()
  if (!usuario) return Response.json({ error: 'Não autenticado' }, { status: 401 })

  // usuario.id, usuario.perfil, usuario.empresaId disponíveis
}
```

---

## 6. API Routes

Base URL: `/api`

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/auth/login` | Autenticar usuário |
| POST | `/api/auth/cadastro` | Criar novo usuário |
| POST | `/api/auth/logout` | Encerrar sessão |
| POST | `/api/auth/recuperar` | Solicitar link de recuperação de senha |
| POST | `/api/auth/redefinir` | Redefinir senha com token |

### Despesas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/despesas?empresa_id=&mes_ref=` | Listar despesas do mês |
| POST | `/api/despesas` | Criar despesa |
| PUT | `/api/despesas/:id` | Editar despesa |
| DELETE | `/api/despesas/:id` | Excluir despesa |

**Payload POST/PUT:**
```json
{
  "empresa_id": 1,
  "tipo_id": 1,
  "criado_por_id": 1,
  "valor": 150.00,
  "data_lancamento": "2025-05-01",
  "mes_ref": "2025-05",
  "descricao": "Opcional",
  "unidade_medida": "KG",
  "quantidade": 10.500,
  "preco_unitario": 14.28
}
```

### Pedidos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/pedidos?empresa_id=&mes_ref=` | Listar pedidos do mês |
| POST | `/api/pedidos` | Criar pedido (+ despesa automática se custo informado) |
| PUT | `/api/pedidos/:id` | Editar pedido |
| DELETE | `/api/pedidos/:id` | Excluir pedido |

**Payload POST/PUT:**
```json
{
  "empresa_id": 1,
  "criado_por_id": 1,
  "numero_pedido": "PED-2025-001",
  "valor_total": 5000.00,
  "custo_bruto": 3200.00,
  "nf_emitida": true,
  "valor_nf": 5000.00,
  "numero_nf": "NF-001",
  "data_emissao": "2025-05-01",
  "mes_ref": "2025-05"
}
```

> Na criação (POST), se `custo_bruto` for informado, o sistema cria automaticamente uma `Despesa` do tipo Materiais.

### Dashboard

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/dashboard?empresa_id=` | Resumo financeiro mês atual e ano corrente |

**Response:**
```json
{
  "mes_atual": {
    "faturamento": 10000.00,
    "despesas": 7500.00,
    "lucro": 2500.00
  },
  "ano_corrente": {
    "faturamento": 80000.00,
    "despesas": 60000.00,
    "lucro": 20000.00
  }
}
```

### Relatório

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/relatorio?empresa_id=&modo=mes_atual\|mes_fechado\|periodo&[params]` | Relatório por período |
| GET | `/api/relatorio?...&exportar=csv` | Download CSV |

**Parâmetros por modo:**
- `mes_atual` — sem parâmetros adicionais
- `mes_fechado` — `mes_ref=YYYY-MM`
- `periodo` — `data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD`

### Tipos de Despesa

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/tipos-despesa?empresa_id=` | Listar todos (sistema + customizados) |
| POST | `/api/tipos-despesa` | Criar tipo customizado |
| PUT | `/api/tipos-despesa/:id` | Editar tipo customizado |
| DELETE | `/api/tipos-despesa/:id` | Excluir (bloqueado se houver despesas vinculadas) |

### Auditoria

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/auditoria?pagina=&limite=20&[filtros]` | Logs paginados (somente ADMIN) |
| GET | `/api/auditoria?...&exportar=csv` | Download CSV |

**Filtros disponíveis:** `tipo_acao`, `entidade`, `data_inicio`, `data_fim`

---

## 7. Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | URL PostgreSQL com connection pooler (Neon: adicionar `-pooler` no host e `&pgbouncer=true`) |
| `DIRECT_URL` | Sim | URL PostgreSQL direta, sem pooler (usada pelo Prisma Migrate) |
| `JWT_SECRET` | Sim | Chave secreta para assinar tokens JWT (mín. 32 bytes aleatórios) |

**Gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Formato das URLs para Neon:**
```env
DATABASE_URL="postgresql://USER:PASS@ep-xxx-pooler.sa-east-1.aws.neon.tech/dbname?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASS@ep-xxx.sa-east-1.aws.neon.tech/dbname?sslmode=require"
```

> O arquivo `.env` está no `.gitignore` e nunca deve ser commitado.

---

## 8. Deploy e infraestrutura

### Serviços em produção

| Serviço | Plataforma | Região |
|---|---|---|
| Aplicação | Vercel | Global CDN |
| Banco de dados | Neon (PostgreSQL serverless) | sa-east-1 (São Paulo) |

### Processo de deploy

Qualquer `git push` para a branch `main` dispara automaticamente um novo build na Vercel:

```
git push origin main
  → Vercel detecta mudança
  → npm install
  → prisma generate && next build
  → Deploy global
```

### vercel.json

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

### Variáveis de ambiente na Vercel

Configure em: **Vercel Dashboard → Project → Settings → Environment Variables**

Adicionar: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`

### Aplicar alterações de schema em produção

```bash
# Gera e aplica migrations no banco de produção
npm run db:migrate
```

> Use `db:migrate` (não `db:push`) em produção. O `db:push` força a sincronização sem histórico de migrations.

---

## 9. Desenvolvimento local

### Pré-requisitos

- Node.js ≥ 18
- PostgreSQL local **ou** acesso ao banco Neon

### Setup

```bash
# 1. Clonar repositório
git clone https://github.com/gustavolagefaria-sys/SistemaXTelhas.git
cd SistemaXTelhas

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais do banco

# 4. Criar tabelas
npm run db:push

# 5. Popular banco com dados iniciais
npm run db:seed

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

**Credenciais do seed:**
- Email: `admin@xtelhas.com`
- Senha: `Admin@2025`

### Singleton do Prisma em desenvolvimento

O arquivo `src/lib/prisma.js` usa o padrão de singleton via `globalThis` para evitar múltiplas instâncias do PrismaClient durante hot-reload do Next.js:

```javascript
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ['error'] })
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## 10. Comandos úteis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento (porta 3000) |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia servidor de produção (porta 3000) |
| `npm run db:push` | Sincroniza schema com o banco (sem migrations) |
| `npm run db:migrate` | Aplica migrations pendentes |
| `npm run db:seed` | Popula banco com dados iniciais |
| `npm run db:studio` | Abre Prisma Studio (GUI do banco) |

### Prisma Studio (visualizar banco)

```bash
npm run db:studio
# Abre http://localhost:5555
```

Permite visualizar e editar dados diretamente, útil em desenvolvimento e suporte.

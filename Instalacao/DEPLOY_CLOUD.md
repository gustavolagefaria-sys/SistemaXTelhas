# Deploy Cloud — SistemaXTelhas

Stack: **Vercel** (aplicação) + **Neon** (PostgreSQL serverless)

Tempo estimado: 30–45 minutos na primeira vez.

---

## Pré-requisitos

- Conta no [GitHub](https://github.com) com o repositório do projeto: https://github.com/gustavolagefaria-sys/SistemaXTelhas
- Conta no [Vercel](https://vercel.com) (gratuita): https://vercel.com/gustavolagefaria-sys-projects
- Conta no [Neon](https://neon.tech) (gratuita): 
Connection string: postgresql://neondb_owner:npg_eAKSyc7o5xYj@ep-tiny-smoke-acjb1pz6.sa-east-1.aws.neon.tech/neondb?sslmode=require
- Node.js 18+ instalado localmente

---

## Passo 1 — Criar banco de dados no Neon

1. Acesse [console.neon.tech](https://console.neon.tech) e crie um projeto
2. Nome sugerido: `xtelhas`
3. Região: escolha a mais próxima do Brasil (ex.: `us-east-1` ou `sa-east-1` se disponível)
4. Após criar, vá em **Connection Details**
5. Selecione **Pooled connection** e copie a string de conexão:
   ```
   postgresql://USER:PASS@ep-xxx.region.aws.neon.tech/xtelhas?sslmode=require
   ```
6. Copie também a **Direct connection** (sem `pgbouncer=true`)

---

## Passo 2 — Configurar variáveis de ambiente localmente

Crie o arquivo `.env` na raiz do projeto (use `.env.example` como base):

```env
DATABASE_URL="postgresql://USER:PASS@ep-xxx...neon.tech/xtelhas?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://USER:PASS@ep-xxx...neon.tech/xtelhas?sslmode=require"
JWT_SECRET="gere-uma-chave-com-o-comando-abaixo"
```

Para gerar o JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Passo 3 — Criar as tabelas e popular o banco

```bash
# Instalar dependências
npm install

# Criar as tabelas no Neon
npm run db:push

# Popular com dados iniciais (tipos de despesa + admin)
npm run db:seed
```

Credenciais criadas pelo seed:
- **Login:** `admin@xtelhas.com`
- **Senha:** `Admin@2025`
- Troque a senha imediatamente após o primeiro acesso.

---

## Passo 4 — Subir o código para o GitHub

```bash
git add .
git commit -m "chore: preparar para deploy em nuvem"
git push origin main
```

---

## Passo 5 — Deploy na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new)
2. Clique em **Import Git Repository** e selecione o repositório do projeto
3. Na tela de configuração do projeto:
   - Framework: **Next.js** (detectado automaticamente)
   - Build Command: deixe como está (usa o `vercel.json`)
4. Clique em **Environment Variables** e adicione:

   | Nome | Valor |
   |------|-------|
   | `DATABASE_URL` | URL pooled do Neon (com `&pgbouncer=true`) |
   | `DIRECT_URL` | URL direta do Neon (sem `&pgbouncer=true`) |
   | `JWT_SECRET` | Chave gerada no Passo 2 |

5. Clique em **Deploy**

---

## Passo 6 — Verificar o deploy

Após o build concluir (2–3 minutos), a Vercel fornecerá uma URL como:
```
https://sistema-xtelhas.vercel.app
```

Acesse a URL e faça login com as credenciais do seed.

---

## Domínio personalizado (opcional)

1. No painel da Vercel, vá em **Settings → Domains**
2. Adicione seu domínio (ex.: `sistema.xtelhas.com.br`)
3. Configure o DNS conforme as instruções da Vercel
4. SSL é provisionado automaticamente

---

## Custos estimados

| Serviço | Free Tier | Produção |
|---------|-----------|----------|
| Vercel | 100 GB bandwidth/mês, deploys ilimitados | ~US$ 20/mês (Pro) |
| Neon | 0,5 GB storage, 190 compute hours/mês | ~US$ 19/mês (Launch) |
| **Total** | **R$ 0** | **~R$ 200/mês** |

Para volume pequeno/médio (< 5 usuários simultâneos), o free tier é suficiente.

---

## Atualizações futuras

Qualquer `git push` para a branch `main` dispara um novo deploy automaticamente na Vercel. Não é necessário nenhum comando adicional.

Para mudanças no schema do banco:
```bash
# Aplica as migrations pendentes no banco de produção
npm run db:migrate
```

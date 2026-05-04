# Sistema XTelhas — Financeiro

Sistema interno de controle de faturamento, despesas e lucro líquido.
Roda na rede local (on-premise) — sem necessidade de internet.

---

## Pré-requisitos (instalar no PC servidor)

| Programa  | Download                        |
|-----------|---------------------------------|
| Node.js   | https://nodejs.org (versão LTS) |
| PostgreSQL | https://www.postgresql.org/download/windows/ |
| Git       | https://git-scm.com (opcional)  |

---

## Instalação

### 1. Copiar a pasta do projeto

Copie a pasta `SistemaXTelhas` para onde preferir, ex:
```
C:\Sistemas\SistemaXTelhas
```

### 2. Abrir o terminal na pasta do projeto

No Windows Explorer, navegue até a pasta, clique na barra de endereço,
digite `cmd` e pressione Enter.

### 3. Instalar as dependências

```bash
npm install
```

### 4. Configurar o banco de dados

Edite o arquivo `.env` na raiz do projeto e substitua `SUA_SENHA_AQUI`
pela senha que você definiu na instalação do PostgreSQL:

```
DATABASE_URL="postgresql://postgres:SUA_SENHA_AQUI@localhost:5432/xtelhas"
```

### 5. Criar as tabelas no banco

```bash
npm run db:push
```

### 6. Popular o banco com dados iniciais

```bash
npm run db:seed
```

Isso cria os 16 tipos de despesa, a empresa XTelhas e o usuário admin.

Acesso inicial:
- E-mail: admin@xtelhas.com
- Senha:  admin123
- ⚠️ Troque a senha após o primeiro acesso!

### 7. Iniciar o sistema

```bash
npm start
```

Acesse no navegador: http://localhost:3000

---

## Acesso de outros computadores na rede

1. Descubra o IP do PC servidor:
   - Abra o Prompt de Comando e digite: `ipconfig`
   - Anote o "Endereço IPv4" (ex: 192.168.1.10)

2. Libere a porta 3000 no Firewall do Windows:
   - Painel de Controle → Firewall → Regras de Entrada → Nova Regra
   - Tipo: Porta → TCP → Porta 3000 → Permitir conexão

3. Nos outros PCs e celulares, abra o navegador e acesse:
   ```
   http://192.168.1.10:3000
   ```

---

## Comandos úteis

```bash
npm run dev          # modo desenvolvimento (com hot-reload)
npm start            # modo produção
npm run db:studio    # interface visual do banco de dados
npm run db:push      # atualiza o banco após mudanças no schema
```

---

## Estrutura do projeto

```
SistemaXTelhas/
├── prisma/
│   ├── schema.prisma     # modelo do banco de dados
│   └── seed.js           # dados iniciais
├── src/
│   ├── app/
│   │   ├── layout.jsx    # layout com menu lateral
│   │   ├── globals.css   # estilos globais
│   │   ├── page.jsx      # dashboard (página inicial)
│   │   ├── despesas/     # módulo de despesas
│   │   ├── pedidos/      # módulo de pedidos faturados
│   │   ├── impostos/     # módulo de impostos
│   │   └── relatorio/    # relatório de lucro líquido
│   └── lib/
│       └── prisma.js     # cliente do banco de dados
├── .env                  # ⚠️ configurações sensíveis — não compartilhar!
├── package.json
└── README.md
```

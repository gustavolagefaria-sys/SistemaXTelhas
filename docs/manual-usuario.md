# Manual do Usuário — SistemaXTelhas

**Versão:** 1.0  
**Público:** Usuários finais do sistema  
**URL:** [sistema-x-telhas.vercel.app](https://sistema-x-telhas.vercel.app)

---

## Sumário

1. [Acesso ao sistema](#1-acesso-ao-sistema)
2. [Dashboard](#2-dashboard)
3. [Despesas](#3-despesas)
4. [Pedidos](#4-pedidos)
5. [Relatório](#5-relatório)
6. [Tipos de Despesa](#6-tipos-de-despesa)
7. [Auditoria](#7-auditoria)
8. [Perguntas frequentes](#8-perguntas-frequentes)

---

## 1. Acesso ao sistema

### Login

1. Acesse [sistema-x-telhas.vercel.app](https://sistema-x-telhas.vercel.app)
2. Digite seu **e-mail** e **senha**
3. Clique em **Entrar**

Caso tenha esquecido a senha, clique em **Esqueci minha senha** e siga as instruções enviadas ao seu e-mail.

> **Sessão:** O sistema encerra sua sessão automaticamente após **10 minutos de inatividade**. Ao retornar, você será redirecionado à página de login e voltará ao local onde estava após se autenticar novamente.

### Criar conta

1. Na tela de login, clique na aba **Criar conta**
2. Preencha nome, e-mail e senha
3. A senha deve conter:
   - Mínimo de 8 caracteres
   - Pelo menos uma letra
   - Pelo menos um número
   - Pelo menos um caractere especial (`!@#$%...`)
4. Confirme a senha e clique em **Criar conta**

---

## 2. Dashboard

A tela inicial apresenta um resumo financeiro da empresa.

### O que é exibido

| Seção | Descrição |
|---|---|
| **Mês atual** | Gráfico de barras comparando faturamento e despesas do mês corrente |
| **Lucro do mês** | Faturamento − Despesas do mês atual |
| **Ano corrente** | Gráfico de pizza com a proporção entre faturamento e despesas no ano |
| **Lucro acumulado** | Resultado líquido acumulado do ano (verde = positivo, vermelho = negativo) |

### Atualizar os dados

Clique no botão **Atualizar** no canto superior direito para recarregar as informações em tempo real.

### Atalhos

Os quatro botões na parte inferior levam diretamente aos módulos principais: Despesas, Pedidos, Relatório e Tipos de Despesa.

---

## 3. Despesas

Registre e gerencie todos os gastos da empresa.

### Lançar uma despesa

1. No menu lateral, clique em **Despesas**
2. Selecione o **Tipo de despesa** no topo do formulário
3. Preencha os campos conforme o tipo:

**Para o tipo "Materiais":**
| Campo | Descrição |
|---|---|
| Unidade de medida | KG, UN, LT, MT, etc. |
| Quantidade | Número com até 3 casas decimais |
| Preço unitário | Valor por unidade (R$) |
| Total | Calculado automaticamente |

**Para o tipo "Retiradas":**
| Campo | Descrição |
|---|---|
| Descrição | Nome do sócio ou responsável (obrigatório) |
| Valor | Valor da retirada (R$) |

**Para todos os outros tipos:**
| Campo | Descrição |
|---|---|
| Valor | Valor total da despesa (R$) |
| Descrição | Texto explicativo (opcional) |

4. Informe a **data de lançamento** e o **mês de competência**
5. Clique em **Salvar despesa**

> **Mês de competência:** é o mês ao qual a despesa pertence para fins contábeis, que pode diferir da data do lançamento.

### Editar uma despesa

1. Localize a despesa na tabela
2. Clique em **Editar**
3. Faça as alterações necessárias
4. Clique em **Salvar alterações**

Para cancelar sem salvar, clique em **Cancelar edição**.

### Excluir uma despesa

1. Clique em **Excluir** na linha da despesa
2. Confirme a exclusão na janela de confirmação

> Esta ação é **irreversível**.

### Filtrar por mês

Use o seletor de mês no canto superior direito para visualizar as despesas de um período específico. O total do mês é exibido no rodapé da tabela.

---

## 4. Pedidos

Registre os pedidos emitidos pela empresa e controle faturamento, custo e notas fiscais.

### Registrar um pedido

1. No menu lateral, clique em **Pedidos**
2. Preencha os campos:

| Campo | Descrição |
|---|---|
| Número do pedido | Identificador único (ex.: PED-2025-001) |
| Valor total | Valor cobrado do cliente (R$) |
| Data de emissão | Data em que o pedido foi emitido |
| Mês de competência | Mês contábil do pedido |
| Preço de custo (opcional) | Custo dos itens do pedido (R$) |

3. Se houver nota fiscal, marque **NF emitida** e informe:
   - Valor da NF
   - Número da NF

4. Clique em **Salvar pedido**

> **Preço de custo:** ao salvar um pedido com custo informado, o sistema cria automaticamente uma entrada de despesa do tipo "Materiais" com a descrição "Itens do pedido: {número}", facilitando o controle de margem.

### Margem bruta

Quando o preço de custo é informado, o sistema exibe automaticamente:
- **Valor do pedido**
- **Preço de custo**
- **Margem bruta** = Valor do pedido − Preço de custo

### Editar e excluir pedidos

O procedimento é idêntico ao de despesas. A exclusão de um pedido **não** remove a despesa de materiais gerada automaticamente — esta deve ser excluída separadamente, se necessário.

### Filtrar por mês

Use o seletor de mês no canto superior direito. A tabela exibe o total do período no rodapé, com destaque para os valores com e sem nota fiscal.

---

## 5. Relatório

Gere análises financeiras consolidadas por período.

### Gerar um relatório

1. No menu lateral, clique em **Relatório**
2. Escolha o modo de período:

| Modo | Descrição |
|---|---|
| **Mês atual** | Do dia 1 até hoje |
| **Mês fechado** | Selecione um dos últimos 12 meses |
| **Período personalizado** | Informe data inicial e final |

3. Clique em **Gerar relatório**

### O que o relatório exibe

**Cards de resumo:**
- Faturamento total do período
- Valor com nota fiscal
- Total de despesas
- Margem (%)

**Lucro líquido:**
- Resultado em destaque (verde = lucro, vermelho = prejuízo)
- Fórmula: Faturamento − Despesas

**Análise de faturamento:**
- Proporção entre pedidos com NF e sem NF

**Despesas por categoria:**
- Gráfico de barras horizontais com valor e percentual de cada tipo

**Tabela de pedidos:**
- Lista de todos os pedidos do período com valores de NF e totais

### Imprimir

Clique em **Imprimir** para abrir a janela de impressão do navegador. O layout é otimizado para impressão.

### Exportar CSV

Clique em **Exportar CSV** para baixar os dados do período em formato de planilha. O arquivo é nomeado automaticamente com a data de exportação.

---

## 6. Tipos de Despesa

Gerencie as categorias de despesa disponíveis no sistema.

### Categorias padrão do sistema

O sistema possui 16 categorias pré-definidas que não podem ser editadas ou excluídas:

Materiais · Salário · Alimentação · Aluguel · Energia · Frete · Internet · Marketing · Seguradora · Bancos · Manutenção de máquinas · Manutenção de veículos · Retiradas · Serviços · Rescisão contratual · Outros

### Adicionar uma categoria personalizada

1. No menu lateral, clique em **Tipos de Despesa**
2. Digite o nome da nova categoria no campo de texto
3. Clique em **+ Adicionar**

### Editar uma categoria personalizada

1. Clique em **Editar** na linha da categoria
2. Altere o nome
3. Clique em **Salvar**

### Excluir uma categoria personalizada

1. Clique em **Excluir**
2. Confirme na janela de confirmação

> Categorias que já possuem despesas lançadas **não podem ser excluídas**. Remova ou reclassifique as despesas vinculadas antes de tentar excluir.

---

## 7. Auditoria

> Este módulo é visível apenas para usuários com perfil **Administrador**.

Exibe o histórico completo de ações realizadas no sistema.

### O que é registrado

| Ação | Descrição |
|---|---|
| LOGIN | Acesso ao sistema |
| LOGOUT | Saída do sistema |
| CREATE | Criação de registros |
| UPDATE | Alteração de registros |
| DELETE | Exclusão de registros |

### Filtrar registros

Use os filtros disponíveis:
- **Tipo de ação** — LOGIN, LOGOUT, CREATE, UPDATE, DELETE
- **Entidade** — despesas, pedidos, usuários, tipos-despesa
- **Data início / Data fim** — intervalo de datas

Clique em **Filtrar** para aplicar ou **Limpar** para resetar.

### Exportar CSV

Clique em **Exportar CSV** para baixar o log filtrado. O arquivo é nomeado com a data da exportação.

---

## 8. Perguntas frequentes

**Fui desconectado sem querer. O que aconteceu?**  
O sistema encerra a sessão após 10 minutos sem atividade para proteger seus dados. Faça login novamente — você será redirecionado à página em que estava.

**Excluí uma despesa por engano. Como desfazer?**  
Não é possível desfazer exclusões. Para fins de auditoria, o registro da exclusão fica salvo no módulo de Auditoria (visível para administradores).

**Salvei um pedido com custo e apareceu uma despesa de "Materiais" que não lancei.**  
Esse comportamento é esperado. Ao informar o preço de custo de um pedido, o sistema registra automaticamente a despesa correspondente para facilitar o cálculo de margem.

**Não consigo excluir um tipo de despesa personalizado.**  
Há despesas lançadas vinculadas a essa categoria. Exclua ou edite as despesas para outro tipo antes de tentar novamente.

**Quero adicionar outro usuário. Como faço?**  
Acesse a tela de login e use a aba **Criar conta**. Novos usuários são criados com perfil padrão; apenas administradores têm acesso ao módulo de Auditoria.

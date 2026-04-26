## Módulo 1 — Faturas

### 1.1 — Banco de dados
- Criar tabela `invoices` com RLS
- Criar tabela `invoice_items` com RLS
- Políticas de segurança por user_id

### 1.2 — Páginas de Faturas
- **Lista** (`/financeiro/faturas`): tabela com Nº, Cliente, Projeto, Emissão, Vencimento, Total, Status (badges coloridos), filtros por status/cliente/período
- **Nova/Editar Fatura** (`/financeiro/faturas/nova` e `/financeiro/faturas/:id/editar`): formulário com seleção de cliente/projeto, número auto-incrementado, importação de horas do cronômetro (localStorage `mc_sessoes`), itens editáveis inline, desconto, totais automáticos, ações de status (rascunho/enviada/paga)
- **Visualização/Impressão** (`/financeiro/faturas/:id`): layout limpo para `@media print`, dados do freelancer e cliente, tabela de itens, totais, botão imprimir/PDF

### 1.3 — Navegação
- Adicionar seção "Financeiro" na sidebar com sub-itens: Faturas, Transações

---

## Módulo 2 — Transações Financeiras

### 2.1 — Banco de dados
- Criar tabela `transactions` com RLS

### 2.2 — Página de Transações (`/financeiro/transacoes`)
- Lista com filtros por tipo (receita/despesa), categoria, período, status
- Formulário modal para nova/editar transação
- Resumo com totais de receitas, despesas e saldo

---

## Arquivos a criar/modificar
- 3 migrations (invoices+invoice_items, transactions)
- ~8 novos componentes/páginas
- Atualizar App.tsx (rotas) e AppLayout.tsx (sidebar)

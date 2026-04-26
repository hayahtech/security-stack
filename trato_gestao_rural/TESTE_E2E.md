# 🧪 Guia Rápido: Teste E2E Trato

**Status**: ✅ PRONTO PARA TESTAR

## 📋 O Que Você Vai Testar

1. **Login** — Autenticação com Supabase
2. **Offline** — Criar pesagem offline em localStorage
3. **Sync** — Sincronizar com Supabase (RLS automático)
4. **React** — Validar integração frontend ↔ Supabase

---

## 🚀 Comece Aqui

### 1. Rodas o Projeto Localmente

```bash
npm run dev
# Acessa http://localhost:5173
```

### 2. Faça Login

```
Vá para: http://localhost:5173/login

Opção A - Email + Senha:
  • Crie usuário em Supabase Console → Auth → Users
  • Ou use um email de teste

Opção B - Magic Link:
  • Digite email
  • Clique "Enviar Link"
  • Verifique no Supabase (Auth → Confirmations)
```

**Esperado**: Após login bem-sucedido → Redirecionado para Dashboard

### 3. Acesse a Página de Testes

```
Vá para: http://localhost:5173/test-e2e

Verá:
  ✅ Seu email/ID de usuário (confirma que está logado)
  ▶️ Botão "Executar Testes E2E"
```

### 4. Execute os 5 Testes

Clique em `▶️ Executar Testes E2E`

**Os testes vão executar em sequência:**

```
1. ✅ Auth Status
   → Confirma que você está logado

2. ✅ Offline Queue
   → Cria uma pesagem offline em localStorage
   → Simula o usuário criando dados sem conexão

3. ✅ LocalStorage
   → Verifica que a pesagem foi salva
   → Vê o registro pendente

4. ✅ Sync RLS
   → Sincroniza dados com Supabase
   → RLS garante que apenas você vê seus dados

5. ✅ Supabase RLS
   → Busca dados de trato_weighings
   → Valida que RLS está funcionando
```

**Esperado**: Todos com ✅ verde

---

## 🔍 Ver Logs Detalhados

Abra o **DevTools** (F12) → **Console**

Você verá logs como:

```
[TestE2E] Pesagem offline criada: { id: "offline_1712443...", ... }
[TestE2E] Queue no localStorage: [1] registros
[TestE2E] Sincronização completada: 1
[TestE2E] Amostra de dados: { id: "...", weight_kg: 450.5, user_id: "..." }
```

---

## ✅ Checklist: O Que Esperar

- [ ] Login funciona (você é redirecionado)
- [ ] Teste 1: Status mostra ✅ Usuário autenticado
- [ ] Teste 2: Pesagem é criada offline
- [ ] Teste 3: localStorage tem 1 registro pendente
- [ ] Teste 4: Sincronização com Supabase funciona (≥ 1 synced)
- [ ] Teste 5: trato_weighings retorna dados com RLS aplicado
- [ ] Logs no DevTools mostram sucesso

---

## 🛠️ Troubleshooting

| Erro | Solução |
|------|---------|
| "Missing Supabase env variables" | Verifique `.env` com as credenciais corretas |
| Login page em branco | Componentes UI podem não existir (shadcn/ui) |
| "user not authenticated" em Teste 1 | Refaça login em /login |
| Teste 4 falha com erro RLS | Confirme que `user_id` está sendo enviado |
| localStorage vazio após teste 3 | Pode ter sincronizado (é ok, verifique Teste 5) |

---

## 📊 Arquivos Criados

```
src/
├── pages/
│   ├── Login.tsx          ← Página de login
│   └── TestE2E.tsx        ← Página de testes
├── App.tsx                ← AuthProvider adicionado
└── lib/
    ├── supabase.ts        ← Client (já existia)
    ├── offline-sync.ts    ← Fila (já existia)
    └── supabase-service.ts ← Serviços (já existia)
```

---

## 🎯 Próximas Ações (Após Testes)

- [ ] Testar com 2 usuários diferentes (validar RLS)
- [ ] Testar offline real (DevTools → Network → Offline)
- [ ] Criar pesagem real em /rebanho/pesagens
- [ ] Validar dados no Supabase Console

---

## 📚 Documentação Completa

Veja: `TESTE_E2E.md` no Obsidian ou Claude Chats

---

**Pronto? Acesse http://localhost:5173/login e comece!** 🚀

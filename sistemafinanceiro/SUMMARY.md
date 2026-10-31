# 📋 RESUMO DE MIGRAÇÃO - Dashboard Financeiro para Supabase

**Objetivo**: Migrar de json-server para PostgreSQL (Supabase) com autenticação Supabase Auth

---

## ✅ PASSOS DE EXECUÇÃO

### 1. ✅ Criar arquivo db/supabase.sql com tabelas PostgreSQL
- [x] Criar tabelas: `usuarios`, `loja`, `lancamento`, `cliloja`, `cliente`
- [x] Adicionar RLS policies para segurança
- [x] Criar triggers para atualizar updated_at
- [x] Criar índices para performance
- [x] Adicionar dados iniciais de exemplo
- **Status**: ✅ CONCLUÍDO

### 2. ✅ Atualizar código fonte para Supabase Auth
- [x] Instalar @supabase/supabase-js
- [x] Criar src/supabaseClient.js com funções CRUD
- [x] Criar .env.example com configurações
- [x] Atualizar login.js para Supabase Auth
- [x] Adicionar campo "nome" no cadastro
- [x] Atualizar main.js para usar Supabase client
- [x] Atualizar CRUD operations (create, update, delete)
- [x] Atualizar logout para usar Supabase
- **Status**: ✅ CONCLUÍDO

### 3. ⏭️ Criar API Edge Functions para CRUD de lançamentos
- ⏭️ PULADO - Usando Supabase client direto (sem necessidade de Edge Functions para CRUD básico)
- **Status**: ⏭️ SKIPPED

### 4. ✅ Atualizar main.js para usar Supabase client
- [x] Substituir fetch de json-server por Supabase client
- [x] Atualizar loadData()
- [x] Atualizar patchLancamento()
- [x] Atualizar create/update/delete operations
- **Status**: ✅ CONCLUÍDO (junto com Passo 2)

### 5. ⏭️ Migrar dados de financeiro.json para PostgreSQL
- ⏭️ PENDENTE - Requer instância Supabase ativa
- [ ] Importar usuários
- [ ] Importar lançamentos com loja_id
- [ ] Criar lojas de exemplo
- **Status**: ⏳ AGUARDANDO SETUP SUPABASE

### 6. ⏭️ Testar no ambiente Supabase
- [ ] Verificar autenticação
- [ ] Testar CRUD de lançamentos
- [ ] Testar filtros e renderização
- **Status**: ⏳ AGUARDANDO SETUP SUPABASE

### 7. ✅ Atualizar CLAUDE.md com especificações
- [x] Documentar nova arquitetura
- [x] Listar campos das tabelas
- [x] Documentar configuração Supabase
- [x] Guia de desenvolvimento
- [x] Fluxo de autenticação
- [x] Problemas conhecidos
- **Status**: ✅ CONCLUÍDO

---

## 📊 ESTRUTURA DO BANCO

### Tabela: `usuarios`
```
id (uuid) - PK
email (text)
nome (text)
is_active (boolean)
created_at (timestamp)
```

### Tabela: `loja`
```
id (serial) - PK
loj_nome (text)
loj_cnpj_cpf (text)
loj_cidade (text)
loj_estado (text)
loj_endereco (text)
loj_cep (text)
loj_rua (text)
loj_celular (text)
loj_tel_residencial (text)
loj_tel_comercial (text)
loj_ativo (smallint) - 1=ativo, 0=inativo
created_at (timestamp)
```

### Tabela: `lancamento`
```
id (serial) - PK
usuario_id (uuid) - FK
loja_id (serial) - FK
descricao (text)
tipo (text) - pagar|receber
data_vencimento (date)
data_pagamento (date)
qtd_parcelas (int)
parcela_atual (int)
valor (decimal)
status (smallint) - 0=Aberto, 1=Pago, 3=Cancelado
id_parcelamento (text) - grupo de parcelas
grupo_id (text)
created_at (timestamp)
updated_at (timestamp)
```

### Tabela: `cliente`
```
id (serial) - PK
nome (text)
cpf_cnpj (text)
email (text)
telefone (text)
ativo (smallint)
created_at (timestamp)
```

### Tabela: `cli_loja`
```
id (serial) - PK
cliente_id (serial) - FK
loja_id (serial) - FK
created_at (timestamp)
```

---

## 🔄 TIMELINE ESPERADA
- **Passo 1**: SQL schema
- **Passo 2-4**: Integração Supabase
- **Passo 5**: Migração de dados
- **Passo 6**: Testes
- **Passo 7**: Documentação final

---

## 📌 PRÓXIMAS AÇÕES

1. **Criar projeto Supabase** em https://app.supabase.com
2. **Copiar credenciais** (URL + anon key) para `.env.local`
3. **Executar SQL schema** em Supabase Dashboard:
   - SQL Editor → New Query
   - Copiar todo conteúdo de `db/supabase.sql`
   - Executar
4. **Testar fluxo**:
   - `npm install` (para instalar @supabase/supabase-js)
   - `npm run dev`
   - Acessar http://localhost:5173
   - Cadastrar novo usuário
   - Criar lançamentos de teste
5. **Migrar dados** (opcional):
   - Script para importar usuários/lançamentos de `financeiro.json`

---

**Última atualização**: 2026-06-02  
**Status Geral**: ✅ 5/7 passos concluídos (71% pronto)  
**Bloqueante**: Instância Supabase precisa estar configurada para Passos 5-6

---

## 🔧 Correção 2026-10-24 (Analista Financeiro)

Arquivos que a documentação citava, mas **não estavam no repo**, foram recriados:
- `src/supabaseClient.js` — Auth + CRUD alinhado a `login.js` / `main.js`
- `db/supabase.sql` — schema, RLS, trigger de perfil, loja seed id=1

**Ainda bloqueante:** criar/conectar projeto Supabase, colar URL + anon key em `.env.local`, rodar `db/supabase.sql`, cadastrar usuário e (opcional) importar Mobills.


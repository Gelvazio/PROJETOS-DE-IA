# 📊 Dashboard Financeiro - Documentação Técnica

**Versão**: 2.1 (Supabase PostgreSQL + PWA)  
**Última atualização**: 2026-10-29  
**Stack**: Vanilla JS + Vite + Supabase + PostgreSQL + PWA instalável

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Stack Técnico](#stack-técnico)
3. [Arquitetura](#arquitetura)
4. [Instalação e Setup](#instalação-e-setup)
5. [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)
6. [API e Cliente Supabase](#api-e-cliente-supabase)
7. [Autenticação](#autenticação)
8. [Funcionalidades](#funcionalidades)
9. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
10. [PWA e Uso no Celular](#-pwa-e-uso-no-celular)
11. [Problemas Conhecidos](#problemas-conhecidos)

---

## 🎯 Visão Geral

Dashboard financeiro completo com suporte para múltiplos usuários, lojas e relacionamentos. Sistema de gestão de lançamentos (contas a receber e pagar) com parcelamento, filtros avançados e integração com Supabase para autenticação e persistência de dados.

**Principais Características**:
- ✅ Autenticação segura com Supabase Auth
- ✅ Multi-lojas com relacionamento cliente-loja
- ✅ Lançamentos com parcelamento
- ✅ Filtros por mês, tipo e status
- ✅ Interface responsiva dark-mode
- ✅ PWA instalável (celular, tela cheia, shell offline)
- ✅ RLS (Row Level Security) para privacidade
- ✅ Timestamps automáticos

---

## 🛠️ Stack Técnico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | Vanilla JavaScript (ES Modules) | - |
| Build | Vite | 5.4.0+ |
| PWA | Web App Manifest + Service Worker (gerado no build por `pwa-plugin.js`) | - |
| Banco de Dados | PostgreSQL | 14+ |
| Backend-as-a-Service | Supabase | - |
| Autenticação | Supabase Auth | - |
| Styling | CSS3 + Variáveis CSS | - |
| Template | HTML5 Semântico | - |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Vite)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ login.html   │  │ index.html   │  │  login.html  │  │
│  │ login.js     │  │  main.js     │  │ styles.css   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                             │
                ┌────────────▼────────────┐
                │  supabaseClient.js      │
                │  (SDK + Funções CRUD)   │
                └────────────┬────────────┘
                             │
┌─────────────────────────────▼────────────────────────────┐
│              SUPABASE (Backend as a Service)             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  PostgreSQL Database (db/supabase.sql)            │  │
│  │  ┌────────┐ ┌────────┐ ┌────────────┐           │  │
│  │  │usuarios│ │loja    │ │cliente     │           │  │
│  │  └────────┘ └────────┘ └────────────┘           │  │
│  │  ┌──────────────────┐ ┌──────────────────┐       │  │
│  │  │lancamento        │ │cli_loja          │       │  │
│  │  │(+ RLS Policies)  │ │(relacionamento)  │       │  │
│  │  └──────────────────┘ └──────────────────┘       │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Auth (Gerenciar usuários e sessões)              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Instalação e Setup

### 1. Pré-requisitos
- Node.js 18+
- npm ou pnpm
- Conta Supabase (https://supabase.com)

### 2. Clonar/Preparar Repositório
```bash
cd FINANCEIRO
npm install
```

### 3. Configurar Variáveis de Ambiente
```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 4. Criar Schema PostgreSQL
```bash
# No Supabase Dashboard:
# SQL Editor → Copiar conteúdo de db/supabase.sql → Executar
```

### 5. Rodar Desenvolvimento
```bash
npm run dev
```

Acesso em: `http://localhost:5173`

---

## 📊 Estrutura do Banco de Dados

### Tabela: `usuarios`
Estende `auth.users` do Supabase com dados complementares.

```sql
id (UUID) - Referencia auth.users, PK
email (TEXT) - Único
nome (TEXT)
is_active (SMALLINT) - 1=ativo, 0=inativo
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Tabela: `loja`
Dados das lojas/filiais.

```sql
id (SERIAL) - PK
loj_nome (TEXT) - Nome da loja
loj_cnpj_cpf (TEXT) - CNPJ ou CPF
loj_cidade (TEXT)
loj_estado (TEXT) - Sigla (SP, RJ, etc)
loj_endereco (TEXT)
loj_cep (TEXT)
loj_rua (TEXT)
loj_celular (TEXT)
loj_tel_residencial (TEXT)
loj_tel_comercial (TEXT)
loj_ativo (SMALLINT) - 1=ativo, 0=inativo
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Tabela: `cliente`
Dados dos clientes.

```sql
id (SERIAL) - PK
nome (TEXT)
cpf (TEXT) - Único (somente CPF)
email (TEXT)
telefone (TEXT)
ativo (SMALLINT) - 1=ativo, 0=inativo
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Tabela: `cli_loja`
Relacionamento N:N entre clientes e lojas.

```sql
id (SERIAL) - PK
cliente_id (SERIAL) - FK → cliente.id
loja_id (SERIAL) - FK → loja.id
created_at (TIMESTAMP)
UNIQUE(cliente_id, loja_id)
```

### Tabela: `lancamento` ⭐
Lançamentos financeiros (principal tabela).

```sql
id (SERIAL) - PK
usuario_id (UUID) - FK → usuarios.id (RLS aplica aqui)
loja_id (SERIAL) - FK → loja.id
descricao (TEXT) - Descrição do lançamento
tipo (TEXT) - 'pagar' | 'receber'
data_vencimento (DATE)
data_pagamento (DATE) - NULL se não pago
qtd_parcelas (INT) - Número total de parcelas
parcela_atual (INT) - Qual parcela é esta
valor (DECIMAL 15,2)
status (SMALLINT) - 0=Aberto, 1=Pago, 3=Cancelado
id_parcelamento (TEXT) - Agrupa parcelas relacionadas
grupo_id (TEXT) - Compatibilidade com dados antigos
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

**Índices criados**:
- `usuario_id` - Busca rápida por usuário
- `loja_id` - Relacionamento com lojas
- `data_vencimento` - Filtro por datas
- `status`, `tipo` - Filtros de tabela
- `id_parcelamento` - Agrupar parcelas
- Índice composto: `(usuario_id, data_vencimento)`

**RLS Policies** (Row Level Security):
```sql
-- SELECT: Usuários veem apenas seus lançamentos
SELECT → auth.uid() = usuario_id

-- INSERT: Só podem inserir em sua conta
INSERT → auth.uid() = usuario_id

-- UPDATE: Só podem atualizar seus lançamentos
UPDATE → auth.uid() = usuario_id

-- DELETE: Só podem deletar seus lançamentos
DELETE → auth.uid() = usuario_id
```

---

## 🔐 API e Cliente Supabase

### Arquivo: `src/supabaseClient.js`

Contém instância do cliente e funções CRUD:

#### Autenticação
```javascript
loginWithEmail(email, password)      // Login
signUp(email, password, nome)        // Registro
logout()                             // Logout
getCurrentUser()                     // Usuário autenticado
getSession()                         // Sessão ativa
onAuthStateChange(callback)          // Observer de mudanças
```

#### CRUD Lançamentos
```javascript
getLancamentos()                     // Listar todos (do usuário)
createLancamento(lancamento)         // Criar novo
updateLancamento(id, updates)        // Atualizar
deleteLancamento(id)                 // Deletar um
deleteLancamentos(ids)               // Deletar múltiplos
```

#### Dados Auxiliares
```javascript
getLojas()                           // Listar lojas ativas
subscribeLancamentos(callback)       // Realtime subscription (opcional)
```

---

## 🔐 Autenticação

### Fluxo de Login
1. Usuário acessa `/login.html`
2. Preenche email + senha
3. `src/login.js` → `loginWithEmail()` → Supabase Auth
4. Sessão criada (token JWT)
5. Redireciona para `/` (dashboard)

### Fluxo de Cadastro
1. Clica "Novo Usuário"
2. Preenche: Nome, Email, Senha
3. `src/login.js` → `signUp()`:
   - Cria user no Supabase Auth
   - Insere registro na tabela `usuarios`
4. Login automático após cadastro

### Persistência
- Supabase SDK gerencia tokens automaticamente
- `localStorage` contém tokens (seguro com HttpOnly em produção)
- `getSession()` recupera sessão no reload

### Logout
- Remove sessão Supabase
- Redireciona para `/login.html`
- Tokens são invalidados

---

## ✨ Funcionalidades

### Dashboard Principal (`index.html` + `main.js`)

#### 1. Resumo (Summary Cards)
- **Contas a Receber**: Soma de valores tipo='receber' + status != Cancelado
- **Contas a Pagar**: Soma de valores tipo='pagar' + status != Cancelado
- **Saldo**: Receber - Pagar
- **Pendente**: Soma de valores com status=Aberto

#### 2. Filtros
- **Por Mês**: Seletor de data (YYYY-MM) com navegação < >
- **Por Tipo**: Todos / A Pagar / A Receber
- **Por Status**: Todos / Aberto / Pago / Cancelado

#### 3. Tabela de Lançamentos
Colunas:
- **ID + Descrição** (combinado como `#ID Descrição`)
- **Tipo** (badge colorida)
- **Vencimento** (formato dd/mm/yyyy)
- **Pagamento** (data ou vazio)
- **Parcela** (X/Y formato)
- **Valor** (formatado BRL)
- **Status** (badge com cor)
- **Ações** (Pagar/Receber, Cancelar, Editar, Excluir)

#### 4. Modal de Edição/Inserção
Campos:
- **ID** (desabilitado em edição, apagado visualmente)
- **Descrição** (obrigatório)
- **Tipo** (obrigatório)
- **Data de Vencimento** (obrigatório)
- **Data de Pagamento** (opcional)
- **Qtd. Parcelas** (padrão 1)
- **Parcela Atual** (desabilitado, apagado visualmente)
- **Valor** (obrigatório, > 0)
- **Status** (padrão Aberto)

#### 5. Parcelamento
- Ao criar com qtd_parcelas > 1:
  - Gera N registros (um por parcela)
  - Incrementa `data_vencimento` a cada mês
  - Agrupa por `id_parcelamento`
  - Primeira parcela herda data_pagamento e status
  - Demais ficam com status=Aberto

- Ao editar com múltiplas parcelas:
  - Modal oferece escopo:
    - "Parcela individual" → edita só uma
    - "Essa e futuras" → edita do parcela_atual em diante
    - "Todas" → edita todas do grupo

#### 6. Ações
- **Pagar/Receber**: Muda status → 1, preenche data_pagamento com hoje
- **Cancelar**: Muda status → 3
- **Editar**: Abre modal com dados preenchidos
- **Excluir**: Com escopo (single/future/all) para parceladas

---

## 💻 Guia de Desenvolvimento

### Estrutura de Arquivos
```
FINANCEIRO/
├── db/
│   └── supabase.sql          # Schema PostgreSQL
├── public/                   # Copiado como está para a raiz do build
│   ├── manifest.webmanifest  # Manifesto PWA (nome, cores, ícones, atalhos)
│   └── icons/                # icon-192/512, icon-maskable-512, apple-touch-icon, favicon-32
├── src/
│   ├── main.js               # Lógica principal dashboard
│   ├── login.js              # Autenticação
│   ├── supabaseClient.js     # Cliente Supabase + CRUD
│   ├── pwa.js                # Registro do SW, banners offline/atualização, instalação
│   ├── modal-nav.js          # Botão voltar/Esc fecham modais; rola até o campo focado
│   └── sw.template.js        # Template do service worker (vira /sw.js no build)
├── css/
│   ├── theme.css             # Variáveis e estilos globais
│   ├── styles.css            # Componentes específicos
│   └── mobile.css            # Camada celular/PWA (safe areas, bottom sheet, barra fixa)
├── pwa-plugin.js             # Plugin Vite: gera /sw.js a partir de sw.template.js
├── index.html                # Dashboard
├── login.html                # Tela de login
├── MEMORY.md                 # Contexto do projeto (legado)
├── SUMMARY.md                # Status de migração
├── CLAUDE.md                 # Este arquivo
├── .env.example              # Template de variáveis
├── package.json              # Dependências
└── vite.config.js            # Configuração Vite
```

### Como Adicionar uma Funcionalidade

#### 1. Adicionar campo na tabela
Editar `db/supabase.sql` e executar no Supabase Dashboard.

#### 2. Adicionar função CRUD
Adicionar em `src/supabaseClient.js`:
```javascript
export async function meuFuncao(params) {
  const { data, error } = await supabase
    .from('lancamento')
    .select('*')
    .eq('id', params.id);
  
  if (error) throw error;
  return data;
}
```

#### 3. Usar no main.js
```javascript
import { meuFuncao } from './supabaseClient.js';

// Em uma função/event listener:
const resultado = await meuFuncao(params);
```

### Debugging
- **Console do navegador** (F12): Erros JS
- **Supabase Dashboard** → Logs: Erros de autenticação/banco
- **Network tab**: Requisições para Supabase
- Adicionar `console.log()` antes de operações críticas

---

## 📱 PWA e Uso no Celular

O dashboard é um PWA instalável: abre em tela cheia pela tela inicial do celular, com o "shell" do app (HTML, JS, CSS, ícones) disponível mesmo sem internet. **Os dados financeiros continuam sempre online** (ver estratégia de cache).

### Service Worker (gerado no build)
- `src/sw.template.js` é um **template**, com os marcadores `__VERSION__` e `__PRECACHE_URLS__`.
- `pwa-plugin.js` (plugin Vite, registrado em `vite.config.js`) lê o template no `generateBundle` e injeta:
  - a **lista de arquivos** do build (bundle + conteúdo de `public/` + `/`);
  - a **versão**, um hash SHA-1 (10 caracteres) do conteúdo — qualquer mudança no app troca a versão e o navegador instala o SW novo.
- O resultado é publicado como `/sw.js`. Se algum marcador ficar sem substituir, o build falha (não publica SW quebrado).
- **Só existe em `vite build`** (`apply: 'build'`); em `vite dev` não há service worker, e `src/pwa.js` só registra o SW quando `import.meta.env.PROD`.
- Para testar o PWA localmente:
```bash
npm run build && npm run preview
```

### Estratégia de Cache
| Recurso | Estratégia |
|---------|-----------|
| Shell (HTML, JS/CSS com hash, ícones, manifest) | Pré-cacheado na instalação; cache primeiro |
| Navegação | HTML pré-cacheado abre na hora, mesmo offline (fallback para `/index.html`) |
| Fontes do Google (`fonts.googleapis.com`, `fonts.gstatic.com`) | Stale-while-revalidate (cache `fin-fonts-v1`) |
| **Supabase / qualquer outra origem** | **NUNCA passa pelo cache** — vai direto para a rede |

> 🔒 Dados financeiros e tokens de sessão não ficam no cache do SW **de propósito**. Offline, o app abre, mas não carrega nem salva lançamentos.

Caches antigos (`fin-shell-*` de outras versões) são apagados no `activate`.

### Atualização do App
1. Ao publicar nova versão, o navegador instala o novo SW (`skipWaiting` + `clients.claim`).
2. `src/pwa.js` detecta a troca (`controllerchange`) e mostra o banner **"Nova versão do app disponível"** com o botão **Atualizar**, que recarrega a página. Na primeira instalação o banner não aparece.
3. Ao voltar para o app (`visibilitychange`), `reg.update()` confere se há versão nova — o app instalado pode ficar aberto por dias.

### Instalação
- **Android / Chrome / Edge**: `src/pwa.js` captura o `beforeinstallprompt`; em **⚙️ Configurações** aparece o botão **📲 Instalar aplicativo** (`#btn-install`, dentro de `#cfg-install`).
- **iPhone (Safari)**: não há prompt; Configurações mostra a dica — **Compartilhar > Adicionar à Tela de Início**.
- Se o app já está instalado (`display-mode: standalone`), o bloco de instalação fica oculto.

### Atalhos do Ícone
Definidos em `public/manifest.webmanifest` (pressione e segure o ícone do app):
- `/?novo=pagar` → abre direto o modal de nova conta a pagar
- `/?novo=receber` → abre direto o modal de nova conta a receber

O `main.js` lê o parâmetro `novo` depois do primeiro `loadData()`, limpa a URL (`history.replaceState`) e chama `openModalInsert()`.

### Comportamento no Celular
- **Navbar compacta** de uma linha; "Config" vira só o ícone ⚙️ e "Sair" passa para dentro das Configurações (`#btn-logout-cfg`, "Sair da conta").
- **Barra de ações fixa no rodapé** (Conta a Pagar / Conta a Receber), ao alcance do polegar; respeita as safe areas (notch, barra de gestos).
- **Modais como bottom sheet**; Gravar/Cancelar de formulários longos ficam sempre visíveis.
- **Botão voltar fecha o modal** (`src/modal-nav.js`): usa uma única entrada no histórico enquanto houver modal aberto; Esc também fecha o modal do topo; ao focar um campo, rola até ele por causa do teclado virtual.
- **Banner offline** ("Sem conexão: não dá para salvar agora"), criado por `src/pwa.js`.
- **Atualização de dados**:
  - botão **⟳** (`#btn-refresh`) na navbar → `loadData({ silent: true, notify: true })` (toast "Dados atualizados");
  - ao voltar para o app (`visibilitychange`) depois de mais de 1 minuto sem carregar;
  - ao reconectar (`online`).
- `loadData({ silent, notify })`: `silent` mantém a lista atual na tela se falhar (só avisa por toast); `notify` confirma por toast. Chamadas simultâneas são ignoradas. Se a carga inicial falhar, o erro aparece na tabela e nos cards, com botão "Tentar de novo".
- Estilos em `css/mobile.css` (carregado depois dos estilos inline em `index.html` e `login.html`); `viewport-fit=cover` habilita as safe areas.

### Pressuposto: servido na raiz (`/`)
O app deve ser servido na **raiz do domínio**. `manifest.webmanifest` (`start_url`, `scope`, ícones), `/sw.js` (escopo `/`) e os redirects (`/login.html`) usam **caminhos absolutos**. Em sub-caminho (ex.: `dominio.com/financeiro/`) seria preciso ajustar `base` no Vite e esses caminhos.

### Regenerar os Ícones
Os ícones em `public/icons/` foram gerados com **Pillow (Python)**: uma moeda com gradiente (cores `--h1` → `--h3` → `--h2` do tema) sobre fundo escuro (`#0d0b1f`, o mesmo de `theme_color`). A versão **maskable** (`icon-maskable-512.png`) mantém o conteúdo dentro da **safe zone de 62%**, para o Android recortar sem cortar a moeda. Para trocar a identidade visual, gere de novo os arquivos com os mesmos nomes e tamanhos (`icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`, `favicon-32`); o hash do build atualiza o cache automaticamente.

---

## ⚠️ Problemas Conhecidos

### 1. CORS
**Resolvido**: Supabase é CORS-friendly por padrão.

### 2. Tokens Expirados
Supabase SDK auto-refresh. Se ainda assim expirar:
```javascript
await supabase.auth.refreshSession();
```

### 3. RLS Bloqueando Queries
Se receber erro 403/permission denied:
- Verificar políticas em `db/supabase.sql`
- Confirmar que `usuario_id` matches `auth.uid()`

### 4. Parcela Atual Não Incrementa
**Corrigido em v2.0**: Agora valida e mantém integridade.

---

## 🔄 Migração de Dados (financeiro.json → PostgreSQL)

### Script de Migração (Exemplo)
```javascript
// Após configurar Supabase:
const usuarios = [...]; // De financeiro.json
const lancamentos = [...];

for (const u of usuarios) {
  await supabase.from('usuarios').insert({
    email: u.email,
    is_active: u.is_active
  });
}

for (const l of lancamentos) {
  const userId = // obter ID do usuário
  await createLancamento({
    ...l,
    usuario_id: userId,
    loja_id: 1 // padrão
  });
}
```

---

## 📝 Próximos Passos

- [ ] Testes unitários (Jest)
- [ ] Validação mais robusta de dados
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Gráficos de tendência (Chart.js)
- [ ] Dark mode toggle
- [ ] Multi-idioma (i18n)
- [~] Modo offline com Service Workers (parcial: shell offline pronto; dados ainda online)
- [ ] Notificações em tempo real (Realtime subscription)

---

## 📞 Suporte

Dúvidas ou bugs:
1. Verificar SUMMARY.md para status
2. Consultar logs do Supabase
3. Revisar comentários no código
4. Contatar Gelvazio (gelvazio@gmail.com)

---

**Última atualização**: 2026-10-29 por Claude

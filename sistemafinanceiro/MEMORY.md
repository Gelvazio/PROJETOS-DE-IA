# Memory Index

## Projeto: Dashboard Financeiro

### Stack
- **Vanilla JS + Vite** (sem frameworks)
- **json-server 0.17.4** como banco de dados REST local
- **Tema**: CSS próprio em `./css/` (tema dark roxo/neon — variáveis em `theme.css`)

### Autenticação
- `login.html` + `src/login.js` — tela de login com modal de cadastro
- Usuário default: `admin@email.com` / `123456`
- Sessão em `localStorage` (`fin_user`: `{id, email}`)
- `src/main.js` faz auth guard no topo: redireciona para `/login.html` se não logado
- Navbar do dashboard mostra e-mail e botão **Sair**
- Campos de usuário: `id`, `email`, `senha`, `is_active` (1=ativo, 0=inativo)

### Arquivos criados
- `index.html` — dashboard principal com navbar, seletor de mês, 3 cards resumo, filtros e tabela
- `src/main.js` — toda a lógica JS (fetch, render, filtros, ações)
- `financeiro.json` — banco de dados json-server com 17 lançamentos de exemplo
- `package.json` — scripts: `dev` (vite), `server` (json-server porta 3001)
- `vite.config.js` — proxy `/api` → `localhost:3001` (evita CORS)

### Como rodar
```
# Terminal 1 — banco de dados
npm run server

# Terminal 2 — frontend
npm run dev
```

### Estrutura do banco (`financeiro.json`)
- Coleção: `lancamentos`
- Campos: `id`, `descricao`, `tipo` (pagar|receber), `data_vencimento`, `data_pagamento`, `qtd_parcelas`, `parcela_atual`, `valor`, `status` (0=Aberto, 1=Pago, 3=Cancelado)

### Status e cores
| Status | Valor | Cor de fundo da linha |
|--------|-------|----------------------|
| Aberto | 0 | Vermelho fraco |
| Pago   | 1 | Verde claro |
| Cancelado | 3 | Amarelo fraco |

### Funcionalidades
- Filtro por mês (seletor com navegação < >)
- Filtro por tipo (Todos / A Pagar / A Receber)
- Filtro por status (Todos / Aberto / Pago / Cancelado)
- Cards com totais: Contas a Receber, Contas a Pagar, Saldo
- **Coluna Ação** — 3 botões por linha:
  - "Pagar" / "Receber": muda status para Pago (só habilitado em Aberto)
  - "Cancelar": muda status para Cancelado via PATCH (desabilitado se já Cancelado)
  - "Editar": abre modal com todos os campos preenchidos para edição
- **Barra de inserção** (acima da tabela): "Inserir Conta a Pagar" / "Inserir Conta a Receber"
- **Modal unificado** (Insert & Edit): campos Descrição, Tipo, Status, Vencimento, Pagamento, Parcelas, Valor — botão "Gravar" confirma via POST (insert) ou PATCH (edit)
- Clique no backdrop do modal fecha sem salvar

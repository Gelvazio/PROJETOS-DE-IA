window.DADOS_PROJETOS = {
  "gerado_em": "2026-10-31T16:14:36-03:00",
  "raiz": "C:\\fontes",
  "resumo": {
    "total": 16,
    "com_git": 11,
    "sem_git": 5,
    "ativos": 11,
    "com_graphify": 5,
    "alteracoes_pendentes": 43,
    "tamanho_bytes": 13800322023,
    "alertas": 16
  },
  "projetos": [
    {
      "nome": "ai-memory",
      "caminho": "C:\\fontes\\ai-memory",
      "descricao": "Your coding agent probably has a memory feature already. Claude Code takes its own notes, Cursor remembers some things, and every platform is adding more. They all have the same limits: the notes live on one machine, belong to one agent, and drop out of view when you switch tools or hand the work to a teammate.",
      "fonte_descricao": "README.md",
      "stack": [
        "Rust"
      ],
      "linguagens": [
        "Rust",
        "Markdown",
        "SQL",
        "TypeScript"
      ],
      "tamanho_bytes": 33229162,
      "arquivos": 1257,
      "subpastas": [
        "bin",
        "companions",
        "crates",
        "docker",
        "docs",
        "evals",
        "hooks",
        "nix",
        "packaging",
        "plugins",
        "scripts",
        "tests"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/ai-memory.git",
        "branch": "main",
        "alteracoes": 0,
        "ultimo_commit": {
          "hash": "1bd86637",
          "data": "2026-10-22",
          "assunto": "Merge pull request #1627 from MaxFreedomPollard/fix/importer-cues-after-blank-lines"
        }
      },
      "graphify": null,
      "alertas": []
    },
    {
      "nome": "aulasenai",
      "caminho": "C:\\fontes\\aulasenai",
      "descricao": "As regras ficam divididas por assunto em [`.claude/rules/`](.claude/rules/INDEX.md) (cada arquivo ≤ 5 KB). As regras de **tarefas** que servem para qualquer projeto ficam em",
      "fonte_descricao": "AGENTS.md",
      "stack": [
        "Node.js",
        "Vercel",
        "HTML",
        "Supabase"
      ],
      "linguagens": [
        "Markdown",
        "HTML",
        "JavaScript",
        "SQL"
      ],
      "tamanho_bytes": 1517239349,
      "arquivos": 8822,
      "subpastas": [
        "GERADOR-AULAS",
        "MATERIAIS",
        "MATERIAIS-SEM-HTML",
        "MATERIAL-PADRAO-PROVAS-SENAI",
        "Python",
        "analises",
        "assets",
        "bugs",
        "database",
        "docs",
        "graphify-out",
        "jogos",
        "js",
        "node_modules"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/aulasenai.git",
        "branch": "main",
        "alteracoes": 8,
        "ultimo_commit": {
          "hash": "e0f14d53",
          "data": "2026-10-30",
          "assunto": "chore(quadro): #436.20 bloqueada (conector Supabase sem permissão) por Claude Code (Sonnet 5.5) (local · main)"
        }
      },
      "graphify": {
        "titulo": "Graph Report - aulasenai  (2026-10-30)",
        "nos": 40380,
        "arestas": 43132,
        "comunidades": 3069,
        "nos_centrais": [
          {
            "nome": "aider chat started at 2026-10-24 14:54:28",
            "arestas": 2179
          },
          {
            "nome": "Etapa 404-627c95d8 — Fundamentos de UI/UX completa: aulas, objetivas de 50, discursivas de 20, respostas prováveis, seeds e JEV-AI",
            "arestas": 174
          },
          {
            "nome": "Etapa 405-875934f9 — BANCO-DADOS-TASK: completar o que falta de Banco de Dados (discursivas de 20, respostas prováveis, JEV-AI e auditoria)",
            "arestas": 134
          },
          {
            "nome": "sbGet()",
            "arestas": 129
          },
          {
            "nome": "Atividade: Atividade Individual — Revisão da Apostila (Capítulos 01 a 07) — 100 Questões",
            "arestas": 101
          },
          {
            "nome": "Etapa 358-c5e72df0 — Lógica de Programação: aulas e atividades",
            "arestas": 100
          }
        ],
        "hubs": [
          "Community 0",
          "Community 1",
          "Community 2",
          "Community 3",
          "Community 4",
          "Community 5"
        ],
        "tem_html": false
      },
      "alertas": [
        "8 alteracao(oes) sem commit.",
        "Arquivo .env presente no disco (conteudo nao lido): nunca versionar."
      ]
    },
    {
      "nome": "CONSERTO-ELANTRA-2.0",
      "caminho": "C:\\fontes\\CONSERTO-ELANTRA-2.0",
      "descricao": "Dados extraídos da imagem `peca-faltante.png`:",
      "fonte_descricao": "AGENTS.md",
      "stack": [],
      "linguagens": [
        "Markdown",
        "Python"
      ],
      "tamanho_bytes": 463771,
      "arquivos": 5,
      "subpastas": [],
      "situacao": "sem-git",
      "git": null,
      "graphify": null,
      "alertas": [
        "Sem repositorio Git proprio: o codigo so existe neste disco."
      ]
    },
    {
      "nome": "consumo-ia",
      "caminho": "C:\\fontes\\consumo-ia",
      "descricao": "Painel do uso das contas do Claude Code: sessão de 5 horas, sessão semanal e tokens por conta, com cores por faixa de alerta, sirene acima de 95% e 9 modos gráficos (Quadros, Barras, Colunas, Rosca, Círculo, Velocímetro, Radar, Mapa de calor e 3D). O modo escolhido fica salvo no navegador.",
      "fonte_descricao": "README.md",
      "stack": [
        "HTML"
      ],
      "linguagens": [
        "JavaScript",
        "CSS",
        "Python",
        "Markdown"
      ],
      "tamanho_bytes": 702127,
      "arquivos": 76,
      "subpastas": [
        "api",
        "assets",
        "graphify-out",
        "scripts"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/consumo-ia.git",
        "branch": "main",
        "alteracoes": 5,
        "ultimo_commit": {
          "hash": "cd6f869",
          "data": "2026-10-26",
          "assunto": "chore(dados): consumo atualizado em 26/10/2026 07:36:04"
        }
      },
      "graphify": {
        "titulo": "Graph Report - consumo-ia  (2026-10-24)",
        "nos": 239,
        "arestas": 385,
        "comunidades": 16,
        "nos_centrais": [
          {
            "nome": "$()",
            "arestas": 14
          },
          {
            "nome": "classificarAlerta()",
            "arestas": 10
          },
          {
            "nome": "desenharBarra()",
            "arestas": 9
          },
          {
            "nome": "criarElemento()",
            "arestas": 9
          },
          {
            "nome": "main()",
            "arestas": 8
          },
          {
            "nome": "mudarFiltro()",
            "arestas": 7
          }
        ],
        "hubs": [
          "Community 0",
          "Community 1",
          "Community 2",
          "Community 3",
          "Community 4",
          "Community 5"
        ],
        "tem_html": true
      },
      "alertas": [
        "5 alteracao(oes) sem commit."
      ]
    },
    {
      "nome": "controlemercadoria",
      "caminho": "C:\\fontes\\controlemercadoria",
      "descricao": "Este projeto possui um grafo de conhecimento graphify em graphify-out/.",
      "fonte_descricao": "AGENTS.md",
      "stack": [
        "Node.js",
        "HTML"
      ],
      "linguagens": [
        "Markdown",
        "CSS",
        "JavaScript",
        "HTML"
      ],
      "tamanho_bytes": 29908472,
      "arquivos": 234,
      "subpastas": [
        "appslack",
        "css",
        "db",
        "docs",
        "email",
        "graphify-out",
        "images",
        "js",
        "limpeza-db",
        "planos",
        "relatorio",
        "security",
        "tasks",
        "tests"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://gitlab.com/c3tecnologia/controlemercadoria.git",
        "branch": "main",
        "alteracoes": 0,
        "ultimo_commit": {
          "hash": "7c7e26f",
          "data": "2026-10-27",
          "assunto": "feat(dashboard): filtro por tipo de pedido no topo"
        }
      },
      "graphify": {
        "titulo": "Graph Report - controlemercadoria  (2026-09-04)",
        "nos": 1313,
        "arestas": 1699,
        "comunidades": 93,
        "nos_centrais": [
          {
            "nome": "showNotify()",
            "arestas": 62
          },
          {
            "nome": "enviaMensagemAutomatizadaSlack()",
            "arestas": 24
          },
          {
            "nome": "Plataforma SafetyCred",
            "arestas": 22
          },
          {
            "nome": "showModal()",
            "arestas": 18
          },
          {
            "nome": "getFloatValue()",
            "arestas": 18
          },
          {
            "nome": "📋 Arquivos de CSS",
            "arestas": 17
          }
        ],
        "hubs": [
          "Community 0",
          "Community 1",
          "Community 2",
          "Community 3",
          "Community 4",
          "Community 5"
        ],
        "tem_html": true
      },
      "alertas": []
    },
    {
      "nome": "crm",
      "caminho": "C:\\fontes\\crm",
      "descricao": "Aplicativo de controle de Vendas",
      "fonte_descricao": "README.md",
      "stack": [
        "Node.js",
        "HTML",
        "Vite",
        "Vitest"
      ],
      "linguagens": [
        "JavaScript",
        "Markdown",
        "HTML",
        "CSS"
      ],
      "tamanho_bytes": 5277382,
      "arquivos": 69,
      "subpastas": [
        "Hackaton",
        "dist",
        "node_modules",
        "src"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/crm.git",
        "branch": "main",
        "alteracoes": 4,
        "ultimo_commit": {
          "hash": "cc704de",
          "data": "2026-10-29",
          "assunto": "feat(atividade): abas PRATICA AULA 03 a 06 explicando como cada teste foi aplicado"
        }
      },
      "graphify": null,
      "alertas": [
        "4 alteracao(oes) sem commit."
      ]
    },
    {
      "nome": "dashboard-plataformas-de-ia",
      "caminho": "C:\\fontes\\dashboard-plataformas-de-ia",
      "descricao": "Dashboard de Analise entre Plataformas de IA",
      "fonte_descricao": "README.md",
      "stack": [
        "HTML"
      ],
      "linguagens": [
        "Markdown",
        "JavaScript",
        "HTML",
        "CSS"
      ],
      "tamanho_bytes": 937313,
      "arquivos": 17,
      "subpastas": [
        "assets",
        "docs"
      ],
      "situacao": "sem-git",
      "git": null,
      "graphify": null,
      "alertas": [
        "Sem repositorio Git proprio: o codigo so existe neste disco."
      ]
    },
    {
      "nome": "HACKATON",
      "caminho": "C:\\fontes\\HACKATON",
      "descricao": "Especialista em mobilidade urbana para cidades pequenas (~80 mil habitantes), com foco em soluções viáveis, baratas e demonstráveis em um hackathon.",
      "fonte_descricao": "AGENTS.md",
      "stack": [],
      "linguagens": [
        "Markdown"
      ],
      "tamanho_bytes": 10643,
      "arquivos": 4,
      "subpastas": [],
      "situacao": "sem-git",
      "git": null,
      "graphify": null,
      "alertas": [
        "Sem repositorio Git proprio: o codigo so existe neste disco."
      ]
    },
    {
      "nome": "LOGIC-GAME-BLOCK",
      "caminho": "C:\\fontes\\LOGIC-GAME-BLOCK",
      "descricao": "Jogo de blocos (estilo Scratch) feito com **Google Blockly** para alunos da 8ª série",
      "fonte_descricao": "README.md",
      "stack": [
        "Node.js",
        "HTML",
        "Vite"
      ],
      "linguagens": [
        "JavaScript",
        "HTML",
        "Markdown",
        "CSS"
      ],
      "tamanho_bytes": 835868,
      "arquivos": 17,
      "subpastas": [
        "dist",
        "docs",
        "node_modules",
        "src"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/LOGIC-GAME-BLOCK.git",
        "branch": "main",
        "alteracoes": 0,
        "ultimo_commit": {
          "hash": "64c58ad",
          "data": "2026-10-24",
          "assunto": "feat(cenarios): adiciona 5 novos cenarios (jogo, carro, elevador, parque, mercado)"
        }
      },
      "graphify": null,
      "alertas": []
    },
    {
      "nome": "MATERIAL-AULAS-PROF-MAIRA",
      "caminho": "C:\\fontes\\MATERIAL-AULAS-PROF-MAIRA",
      "descricao": "Sem README, package.json, index.html ou AGENTS.md.",
      "fonte_descricao": "",
      "stack": [],
      "linguagens": [
        "PowerPoint",
        "Markdown"
      ],
      "tamanho_bytes": 106045882,
      "arquivos": 72,
      "subpastas": [
        "MATERIAIS DESENHO TÉCNICO"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/MATERIAL-AULAS-PROF-MAIRA.git",
        "branch": "main",
        "alteracoes": 3,
        "ultimo_commit": {
          "hash": "9e38ff6",
          "data": "2026-10-26",
          "assunto": "Initial commit"
        }
      },
      "graphify": null,
      "alertas": [
        "3 alteracao(oes) sem commit."
      ]
    },
    {
      "nome": "NOVOS-PROJETOS-CLAUDE-CODE",
      "caminho": "C:\\fontes\\NOVOS-PROJETOS-CLAUDE-CODE",
      "descricao": "Você não é meu assistente. Você é meu conselheiro e por acaso é mais inteligente que eu. Siga estas regras em toda resposta:",
      "fonte_descricao": "AGENTS.md",
      "stack": [
        "HTML"
      ],
      "linguagens": [
        "Markdown",
        "HTML",
        "JavaScript",
        "CSS"
      ],
      "tamanho_bytes": 903574,
      "arquivos": 72,
      "subpastas": [
        "7-SISTEMAS-FIM-SEMANA",
        "Dashboards",
        "TABELAS-DE-PRECO"
      ],
      "situacao": "sem-git",
      "git": null,
      "graphify": null,
      "alertas": [
        "Sem repositorio Git proprio: o codigo so existe neste disco."
      ]
    },
    {
      "nome": "PROJETO-CERCA",
      "caminho": "C:\\fontes\\PROJETO-CERCA",
      "descricao": "Cerca em Terreno Úmido — Guia Passo a Passo - Guia visual em 8 etapas para construir uma cerca com mourões de concreto em terreno úmido e mole.",
      "fonte_descricao": "index.html",
      "stack": [
        "HTML"
      ],
      "linguagens": [
        "HTML"
      ],
      "tamanho_bytes": 66149,
      "arquivos": 1,
      "subpastas": [],
      "situacao": "sem-git",
      "git": null,
      "graphify": null,
      "alertas": [
        "Sem repositorio Git proprio: o codigo so existe neste disco."
      ]
    },
    {
      "nome": "PROJETO-IMPRESSAO-3D",
      "caminho": "C:\\fontes\\PROJETO-IMPRESSAO-3D",
      "descricao": "Dashboard (Django) que baixa as pastas do Drive do RENDA3D para `RENDA3D-DOWNLOADS/` e confere o que já está no disco. Regras globais: `rules-local/regras/` (ver aviso no fim deste arquivo).",
      "fonte_descricao": "CLAUDE.md",
      "stack": [],
      "linguagens": [
        "Markdown",
        "JavaScript",
        "Python",
        "CSS"
      ],
      "tamanho_bytes": 9941829820,
      "arquivos": 573,
      "subpastas": [
        "DOWNLOADS-MANUAIS",
        "RENDA3D-DOWNLOADS",
        "configuracao",
        "downloads",
        "fontes-site",
        "rules-local"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/PROJETO-IMPRESSAO-3D.git",
        "branch": "main",
        "alteracoes": 5,
        "ultimo_commit": {
          "hash": "aa59304",
          "data": "2026-10-31",
          "assunto": "feat: analise-site.py baixa as imagens dos cards do site RENDA3D"
        }
      },
      "graphify": null,
      "alertas": [
        "5 alteracao(oes) sem commit.",
        "Pasta muito grande (mais de 2 GB): conferir o .gitignore antes do push."
      ]
    },
    {
      "nome": "REA-APP-CLONES",
      "caminho": "C:\\fontes\\REA-APP-CLONES",
      "descricao": "Este repositório segue o template",
      "fonte_descricao": "README.md",
      "stack": [
        "Node.js",
        "HTML"
      ],
      "linguagens": [
        "Markdown",
        "HTML",
        "Python",
        "TypeScript"
      ],
      "tamanho_bytes": 1914088380,
      "arquivos": 5815,
      "subpastas": [
        "Usersgelva.claude-contaC",
        "apps-cloned",
        "apps-to-be-clone",
        "graphify-out",
        "guia",
        "rules-local",
        "scripts",
        "tasks",
        "tools"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/rea-app-clones.git",
        "branch": "main",
        "alteracoes": 13,
        "ultimo_commit": {
          "hash": "e3152f2",
          "data": "2026-10-26",
          "assunto": "feat(JEV-NAO.1): marca JEV-AI-SUGGESTION: NAO nas etapas por Claude Code (Haiku 5.5) (local · main · JEV-NAO)"
        }
      },
      "graphify": {
        "titulo": "Graph Report - REA-APP-CLONES  (2026-10-22)",
        "nos": 4299,
        "arestas": 7916,
        "comunidades": 226,
        "nos_centrais": [
          {
            "nome": "_()",
            "arestas": 361
          },
          {
            "nome": "$()",
            "arestas": 173
          },
          {
            "nome": "$",
            "arestas": 152
          },
          {
            "nome": "Etapa 005-40073ee0 — CLONE: Clonar o Chaos Code v3 em Node/TypeScript + Electron",
            "arestas": 131
          },
          {
            "nome": "$",
            "arestas": 124
          },
          {
            "nome": "$",
            "arestas": 78
          }
        ],
        "hubs": [
          "Community 0",
          "Community 1",
          "Community 2",
          "Community 3",
          "Community 4",
          "Community 5"
        ],
        "tem_html": true
      },
      "alertas": [
        "13 alteracao(oes) sem commit."
      ]
    },
    {
      "nome": "rules-ai",
      "caminho": "C:\\fontes\\rules-ai",
      "descricao": "Regras de IA **globais**, para todos os projetos de `C:\\fontes` e todas as IAs.",
      "fonte_descricao": "README.md",
      "stack": [
        "HTML"
      ],
      "linguagens": [
        "Markdown",
        "JavaScript",
        "Python",
        "TypeScript"
      ],
      "tamanho_bytes": 246409953,
      "arquivos": 847,
      "subpastas": [
        "MODS-CLAUDE-CODE",
        "api",
        "dashboard",
        "dist",
        "docs",
        "gabaritos",
        "graphify-out",
        "mcp",
        "prompts",
        "regras",
        "scripts",
        "spec",
        "tasks"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/rules-ai.git",
        "branch": "main",
        "alteracoes": 0,
        "ultimo_commit": {
          "hash": "fe9e06c",
          "data": "2026-10-29",
          "assunto": "feat(custos-de-ia): fornecedor Kimi (Moonshot AI) com K2.5, K2.6 e K2.7 Code (valores de fonte secundária, não conferido"
        }
      },
      "graphify": {
        "titulo": "Graph Report - rules-ai  (2026-10-26)",
        "nos": 4205,
        "arestas": 6219,
        "comunidades": 247,
        "nos_centrais": [
          {
            "nome": "Etapa 053-a37505cb — MIGRAR-TAREFAS-API: migrar as tarefas do rules-ai para a API; os demais projetos ficam aguardando",
            "arestas": 86
          },
          {
            "nome": "Etapa 038-bc7a00ec — AI-MEMORY-INTEGRATION: integrar o ai-memory ao rules-local",
            "arestas": 53
          },
          {
            "nome": "Etapa 040-7a3f19c6 — AGENTES-REALTIME: `/api/agentes` e `/api/projetos` por Supabase Realtime",
            "arestas": 42
          },
          {
            "nome": "Etapa 029-9a3f2c80 — JEV-GLOBAL-AI-FINAL: o Jev classifica toda mensagem, em todos os projetos",
            "arestas": 31
          },
          {
            "nome": "Etapa 019-6a76e10c — RULES-LOCAL-GLOBAL: regras globais importadas em `rules-local/` no início de cada sessão",
            "arestas": 29
          },
          {
            "nome": "Etapa 013-1b79ba45 — DASHBOARD-REDE-NEURAL: visualização 3D das camadas de uma rede neural",
            "arestas": 28
          }
        ],
        "hubs": [
          "cena-agentes.js",
          "Web scraping dos links do `CLAUDE.md`",
          "CONFLITOS.md",
          "js/cena.js",
          "sessao.mjs",
          "Tarefa GERENCIADOR-GLOBAL — gerenciador centralizado"
        ],
        "tem_html": true
      },
      "alertas": [
        "Arquivo .env presente no disco (conteudo nao lido): nunca versionar."
      ]
    },
    {
      "nome": "sistemafinanceiro",
      "caminho": "C:\\fontes\\sistemafinanceiro",
      "descricao": "Dashboard de contas a pagar/receber (Vanilla JS + Vite + Supabase).",
      "fonte_descricao": "README.md",
      "stack": [
        "Node.js",
        "HTML",
        "Vite",
        "Supabase"
      ],
      "linguagens": [
        "JavaScript",
        "Markdown",
        "CSS",
        "HTML"
      ],
      "tamanho_bytes": 2374178,
      "arquivos": 179,
      "subpastas": [
        "css",
        "db",
        "dist",
        "docs",
        "node_modules",
        "public",
        "rules-local",
        "src",
        "tasks"
      ],
      "situacao": "ativo",
      "git": {
        "remoto": "https://github.com/Gelvazio/sistemafinanceiro.git",
        "branch": "main",
        "alteracoes": 5,
        "ultimo_commit": {
          "hash": "f2673a9",
          "data": "2026-10-30",
          "assunto": "feat: cards Despesa pendente, Receita pendente e Saldo Mensal"
        }
      },
      "graphify": null,
      "alertas": [
        "5 alteracao(oes) sem commit.",
        "Arquivo .env presente no disco (conteudo nao lido): nunca versionar."
      ]
    }
  ]
};

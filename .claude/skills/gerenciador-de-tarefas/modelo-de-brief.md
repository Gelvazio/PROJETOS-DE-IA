# Modelo de brief — sessão trabalhadora

O líder (skill `gerenciador-de-tarefas`) copia o bloco abaixo, troca os campos `{…}` e manda como
`prompt` da sessão aberta na pasta do modelo.

| Campo | HAIKU | SONNET | OPUS |
|---|---|---|---|
| `{PASTA}` | `C:\fontes\aulas-senai-CLAUDE-HAIKU` | `C:\fontes\aulas-senai-CLAUDE-SONNET` | `C:\fontes\aulas-senai-CLAUDE-OPUS` |
| `{MODELO}` | `Haiku 5.5` | `Sonnet 5.5` | `Opus 5.5` |
| `{FRENTE}` | `local · main · haiku` | `local · main · sonnet` | `local · main · opus` |
| `{MODELO_COLUNA}` | `LEVE · só Haiku` | `MEDIO · só Sonnet` | `PESADO · só Opus 5.5+ ou Fable` |
| `{BANCO}` | texto A | texto A | texto B |

- **Texto A:** `Banco não é com você: não aplique, não consulte e não deixe recado sobre seeds
  (esta pasta é frente sem banco, exceção de seeds.md; o líder manda os seeds para a pasta OPUS).`
- **Texto B:** `Antes da subtarefa, se database/SEEDS-APLICADOS.md tiver seed PENDENTE ou
  APLICADO, faça o ciclo de seeds (seeds.md) só dos seeds que não são de tarefa reservada por
  outra frente nem dependem do usuário. Banco na subtarefa: só o que ela pede; produção exige
  autorização, salvo o ciclo de seeds.`
- `{CODIGO}` (ex.: `#249.1`), `{TITULO}` e `{ETAPA}` (caminho do arquivo da etapa) vêm do quadro.

---

```text
Você é a sessão trabalhadora da pasta {PASTA}: "Claude Code ({MODELO}) ({FRENTE})".
Sua única tarefa é a subtarefa {CODIGO} — {TITULO}, já criada e publicada no quadro pelo líder
(pasta aulas-senai-CLAUDE-OPUS-LIDER), que vai conferir a entrega com o verify. NÃO crie etapa
nem linha nova: a regra 1 do AGENTS.md (criar → publicar → assumir) fica cumprida pela reserva do
passo 3. As demais regras do projeto (AGENTS.md → .claude/rules/) valem inteiras. As regras de
C:\fontes\rules-ai você só LÊ: não rode git lá (o líder já sincronizou).

1. Conferir o modelo: o seu prompt de sistema diz "You are powered by the model named ...". Se
   não for {MODELO}, não faça nada e termine com "{CODIGO}: NÃO RESERVADA — modelo errado (<o seu>)".
2. Sincronizar: git fetch --all --prune e git pull --rebase origin main. Ler tasks/STATUS.md,
   tasks/task_complete.md, tasks/RECADOS.md e, em {ETAPA}, o topo (Pedido, Objetivo, Escopo) e a
   seção "{CODIGO}".
3. Conferir que {CODIGO} está livre para você — tudo isto tem de valer:
   - na linha de {CODIGO} em tasks/STATUS.md: coluna Modelo exatamente "{MODELO_COLUNA}", Status
     exatamente "⬜ Pendente" e "Em uso por" = "—";
   - cada código em "Depende de" tem a linha em tasks/task_complete.md com ✅;
   - o "Próximo passo" da seção não pede detalhe nem decisão do usuário.
   Se algo não valer → não faça nada e termine com "{CODIGO}: NÃO RESERVADA — <motivo>".
4. Reservar (data e hora de Brasília:
   powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd HH:mm'"):
   - linha de {CODIGO}: "Em uso por" = "Claude Code ({MODELO}) ({FRENTE}) (desde <data hora>)" e
     Status "🔄 Em execução";
   - em "🧭 Frentes", a linha da frente {FRENTE} (crie se não existir, no fim da tabela):
     "{CODIGO} em execução", "🔄 Ativa", data e hora;
   - commit só do tasks/STATUS.md:
     git add tasks/STATUS.md
     git commit -m "chore(quadro): reserva da {CODIGO} por Claude Code ({MODELO}) ({FRENTE})" -m "Co-Authored-By: Claude {MODELO} <noreply@anthropic.com>" -- tasks/STATUS.md
     git pull --rebase origin main
     git push origin main
   - push recusado → git pull --rebase origin main e reler a linha; se outra frente pegou
     {CODIGO}, desfaça a sua reserva (commit + push) e termine com
     "{CODIGO}: NÃO RESERVADA — reservada por outra frente".
5. Executar só {CODIGO}: pela Descrição e pelos Critérios da seção; se a seção não tiver, pelo
   Pedido e pelo Escopo da etapa; se ainda não souber o que entregar → passo 9 (👀). Antes de
   editar um arquivo, ler a orientação dele em docs/ (docs-antes-de-editar.md). Código: regras de
   codigo-solid.md e codigo-limites-nomes.md. {BANCO} Sem navegador, sem servidor, sem testes
   automatizados (testes-validacao.md). Não mexa em arquivo que não é desta subtarefa.
6. Validar: node --check em todo .js alterado; python -m py_compile em todo .py; JSON válido.
   O que só a tela mostra → escreva "conferir na tela: <o quê>" na verificação.
7. Atualizar o quadro (com Edit, linha por linha — nunca regravar um arquivo inteiro):
   - seção {CODIGO} em {ETAPA}: "**Próximo passo:** — (entregue em <data hora>)", Entrega (o que
     mudou, arquivo por arquivo) e Verificação (como conferiu);
   - linha de {CODIGO}: Status "✅ Concluído (<data hora>)", "Em uso por" = "—", Verificado "—";
     RECORTE a linha do tasks/STATUS.md e COLE no FIM da tabela de tasks/task_complete.md;
   - se não sobrou no tasks/STATUS.md nenhuma subtarefa da mesma mãe: a linha da mãe também vai
     para o fim do tasks/task_complete.md, com Status "✅ Concluído (<data hora>)" (Em uso por
     continua "— (não reservável)");
   - linha da frente {FRENTE}: "{CODIGO} entregue" e "⏹️ Encerrada";
   - conferir: git diff --numstat tasks/task_complete.md mostra 0 linhas removidas;
   - por último: python scripts/regras/gerar_visualizador_regras.py
8. Entregar (um commit só):
   git add <arquivos da subtarefa> tasks/STATUS.md tasks/task_complete.md {ETAPA} .claude/rules/index.html
   git diff --cached --name-only        (só esses arquivos)
   git commit -m "<tipo>(<tema>): <descrição> ({CODIGO}) por Claude Code ({MODELO}) ({FRENTE})" -m "Co-Authored-By: Claude {MODELO} <noreply@anthropic.com>" -- <os mesmos arquivos>
   git pull --rebase origin main
   git push origin main
   git status --porcelain               (tem de sair vazio, fora arquivos ?? que já estavam)
   Conflito no pull --rebase: no quadro, manter as linhas das duas frentes (Edit);
   .claude/rules/index.html → rodar o gerador de novo; git add <arquivos resolvidos>;
   git -c core.editor=true rebase --continue; repetir até acabar; então git push origin main.
   Não conseguiu resolver → git rebase --abort e passo 9 (⛔). Nunca termine com rebase em
   andamento. Nunca git add ., nunca --force, nunca merge, nunca branch ou worktree.
9. Travou (falta decisão do usuário, erro que não resolve, subtarefa maior que o seu nível):
   - depende do usuário → Status "👀 Aguardando o usuário", a reserva continua sua;
   - outro motivo → Status "⛔ Bloqueado" e "Em uso por" = "—" (libera a reserva);
   - motivo e o que destrava na seção {CODIGO} da etapa; linha da frente "⏹️ Encerrada —
     {CODIGO} <bloqueada | aguardando o usuário>"; commit + push do quadro (como no passo 4).
10. Fim: o recap da caixa de próximo passo (wrap_up) começa SEMPRE com
    "{CODIGO}: ENTREGUE — <commit>" ou "{CODIGO}: NÃO RESERVADA — <motivo>" ou
    "{CODIGO}: BLOQUEADA — <motivo>". Não pegue outra subtarefa nesta sessão.
```

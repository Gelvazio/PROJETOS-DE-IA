## Etapa 002-b1069931 — GHIDRA: Motor de análise (Ghidra) para o REA

**Tarefa:** GHIDRA · **Pedido em:** 2026-10-14 08:20 · **Criada por:** Claude Code (Opus 5.5) (local · main)
**Pedido:** "vc consegue fazer isso? Criar a variável de ambiente GHIDRA_INSTALL_DIR apontando para a
pasta extraída." · "adicionei as ferramentas pra versionar tb, pra eu ter elas sempre na mão"
**Objetivo:** deixar o Ghidra disponível para o REA descompilar binários nativos (ex.: o
`chaos-code-v3-client.exe`), com as ferramentas guardadas no repositório.

> Etapa migrada do `STATUS.md` antigo da raiz (itens 2.1 a 2.6) na TEMPLATE.4. Os itens 2.3 e 2.6
> viraram a GHIDRA.3.

### GHIDRA.1 — Extrair o Ghidra 12.1.4 em `tools/ghidra`

**Próximo passo:** nenhum — concluída.

- **Descrição:** feito pelo usuário.
- **Entrega:** pasta `tools/ghidra` · **Verificação:** `application.version=12.1.4` em
- **JEV-AI-SUGGESTION:** NAO
  `tools/ghidra/Ghidra/application.properties`.

### GHIDRA.2 — Criar a variável de usuário `GHIDRA_INSTALL_DIR`

**Próximo passo:** nenhum — concluída.

- **Descrição:** `setx GHIDRA_INSTALL_DIR "C:\fontes\REA-APP-CLONES\tools\ghidra"` (nível usuário).
- **Entrega:** commit `Configura GHIDRA_INSTALL_DIR e ignora pasta tools/` (hoje `cc70960`) ·
- **JEV-AI-SUGGESTION:** NAO
  **Verificação:** saída "o valor especificado foi salvo" do `setx`.

### GHIDRA.3 — Decidir se `tools/` vai para o Git (decisão: fica fora, por enquanto)

**Próximo passo:** nenhum — concluída.

- **Descrição:** primeiro `tools/` foi ignorado; o usuário pediu para versionar e a pasta entrou num
- **JEV-AI-SUGGESTION:** NAO
  commit local com Git LFS (12 arquivos acima de 50 MB). Antes do push, o usuário voltou a ignorar
  `tools/` ("removi o tools pelo ignore por enquanto") e escolheu **desfazer** esse commit local
  (`git reset --mixed`), para o push não levar ~1 GB. Os arquivos continuam no disco.
- **Entrega:** `.gitignore` com `tools/` (commit `docs(TEMPLATE.4)`) · **Verificação:**
  `git ls-files tools | wc -l` = 0 e `ls tools` = `ghidra jdk-21`.

### GHIDRA.4 — Instalar o JDK 21 pelo instalador em `tools/jdk-21/`

**Próximo passo:** nenhum — concluída.

- **Nível:** LEVE — ação manual do usuário (instalador pede administrador; a IA não roda instaladores)
- **Critérios de Aceitação:** `java -version` mostra 21.x.
- **Entrega:** instalação feita pelo usuário · **Verificação:** `java -version` → `21.0.12` (2026-10-14 09:48, Claude Code (Opus 5.5) (local · main))
- **JEV-AI-SUGGESTION:** NAO

### GHIDRA.5 — Reiniciar o Claude Code e confirmar o Ghidra disponível no REA

**Próximo passo:** nenhum — concluída.

- **Critérios de Aceitação:** o provedor `ghidra` aparece como disponível no `binary_session`.
- **Anotação (2026-10-14 09:52, Claude Code (Opus 5.5) (local · main)):** o `binary_session` mostra
- **JEV-AI-SUGGESTION:** NAO
  `ghidra` = `unavailable / not_configured` ("Set GHIDRA_INSTALL_DIR…"). O Java já é reconhecido
  (`21.0.12`) e a variável de usuário existe (`C:\fontes\REA-APP-CLONES\tools\ghidra`), mas o
  processo do Claude foi aberto antes dela e não a herdou (`$GHIDRA_INSTALL_DIR` vazio na sessão).
  Plano B, se continuar falhando: pôr `"env": {"GHIDRA_INSTALL_DIR": …}` no servidor `rea` do
  `~/.claude.json` (só com pedido do usuário).
- **Anotação (2026-10-14 09:54, Claude Code (Opus 5.5) (local · main)):** nova conferência, ainda
  `unavailable / not_configured`. Os processos `claude` foram iniciados às 06:56, antes do `setx`
  (~08:20): o app **não foi fechado por completo**. A variável de usuário continua certa.
- **Entrega:** reinício do app pelo usuário · **Verificação:** `binary_session` (2026-10-15,
  Claude Code (Opus 5.5) (local · main)) mostra `ghidra` = `available`, versão `12.1.4`, Java
  `21.0.12`, `analyzeHeadless.bat` e `decompile.exe` encontrados; todas as checagens `ok`.

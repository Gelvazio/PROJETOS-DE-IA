# 🚫 Nunca fazer backup — o Git é o backup

Decidido em 2026-11-02 (pedido do usuário: "nunca faça backup, o GitHub já serve como backup pelo
histórico dos commits"). Vale para **todas as IAs e todos os projetos**, em qualquer ferramenta,
script ou comando. A regra do projeto só pode **acrescentar**, não contradizer.

## A regra

- ⛔ **Nenhuma IA cria backup.** Nada de cópia de segurança de arquivo, pasta, banco ou
  configuração: sem `.bak`, `.old`, `.orig`, `.backup`, `~`, `copia-de-…`, `-antigo`, pasta
  `backup/` ou `bkp/`, nem cópia do arquivo "antes de editar".
- ✅ **O Git é o backup.** O histórico de commits do GitHub guarda todas as versões. Para voltar,
  usar `git log`, `git diff`, `git show <commit>:<arquivo>` ou `git revert`.
- ✅ Antes de uma mudança grande, o que protege é o **commit anterior** (feito e enviado), não uma
  cópia.
- ⛔ Vale também para **scripts e ferramentas** que a IA escrever ou rodar: não podem gravar
  `.bak` nem copiar o arquivo original antes de sobrescrever. Se um script do projeto fizer isso,
  a IA **remove essa cópia do script** (sem apagar nada que o usuário já tenha).
- ✅ **Única exceção:** o usuário pede **explicitamente**, na conversa, um backup de algo
  específico ("faça um backup de X"). O pedido vale só para aquele item.

## Quando o arquivo ainda não está no Git

- Se o arquivo que vai ser alterado **não está versionado** (ex.: configuração global fora de um
  repositório), a IA **não cria cópia**: avisa o usuário antes e só altera com a confirmação dele.
- ⛔ Não apagar arquivos de backup que o usuário criou. Backup criado **por engano pela IA** só é
  apagado com a confirmação do usuário.

## Como conferir

```
☐ Nenhum arquivo .bak, .old, .orig, ~ ou pasta de backup foi criado nesta tarefa?
☐ Nenhum script que rodei copia o original antes de sobrescrever?
☐ A mudança está num commit (o Git guarda o estado anterior)?
```

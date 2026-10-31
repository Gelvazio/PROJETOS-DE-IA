<!-- Bloco-modelo: copiar para dentro da etapa (tasks/etapas/ETAPA-*.md) da tarefa PESADA,
     antes de executar a primeira subtarefa. Fonte da regra: regras/espec.md (C34). -->

### Requisitos

> Formato **EARS**. Proibido adjetivo sem número ou comportamento observável
> ("rápido", "amigável", "adequado", "tratar erros").

| ID | Requisito (EARS) | Cobre | Verificação |
|----|------------------|-------|-------------|
| R1.1 | QUANDO <gatilho>, O SISTEMA DEVE <resposta observável> | ESPEC-GLOBAL.1 | <comando ou leitura> |
| R1.2 | SE <condição de erro>, ENTÃO O SISTEMA DEVE <resposta> | ESPEC-GLOBAL.1 | <comando ou leitura> |
| R2.1 | O SISTEMA DEVE <regra sempre verdadeira> | ESPEC-GLOBAL.2 | <comando ou leitura> |

**Formas aceitas (só estas 5):**

- `QUANDO <gatilho>, O SISTEMA DEVE <resposta>`
- `SE <condição>, ENTÃO O SISTEMA DEVE <resposta>`
- `ENQUANTO <estado>, O SISTEMA DEVE <resposta>`
- `ONDE <feature>, O SISTEMA DEVE <resposta>`
- `O SISTEMA DEVE <regra incondicional>`

**Fora do escopo (não-objetivos):**

- <o que a tarefa não faz — é isto que impede a tarefa de virar projeto>

// CLI do Jev no rules-ai: classificar | mensagem | guardrail | avaliar | custo.
//   node scripts/jev.mjs classificar [--id ID] [--limite N] [--quadro tasks/STATUS.md] [--json]
//   node scripts/jev.mjs mensagem [--texto "..."] [--projeto nome] [--dry-run] [--json]
//   node scripts/jev.mjs guardrail <escopo|aceite|segredo|pasta|comando|aprovacao> [opções]
//   node scripts/jev.mjs avaliar [opções do benchmark: --variante --golden …]
//   node scripts/jev.mjs custo [--desde AAAA-MM-DD] [--json]
// O Jev só aconselha: nada aqui escreve no quadro, reserva tarefa ou aprova no lugar do usuário.
// Códigos: 0 ok · 1 erro (inclui chave ausente, R1.2) · 2 JEV_MODO=off · 3 revisar · 4 bloquear ·
// 5 Jev indisponível (sugestão sem nível). Variáveis: TYPESAFE_API_KEY, JEV_MODO (ativo|off).
import { ErroJev } from './jev/config.mjs';
import { lerArgumentos } from './jev/cli/argumentos.mjs';
import { executarAvaliar } from './jev/cli/comando-avaliar.mjs';
import { executarClassificar } from './jev/cli/comando-classificar.mjs';
import { executarCusto } from './jev/cli/comando-custo.mjs';
import { executarGuardrail } from './jev/cli/comando-guardrail.mjs';
import { executarMensagem } from './jev/cli/comando-mensagem.mjs';
import { CODIGOS_SAIDA } from './jev/cli/saida.mjs';

const COMANDOS = Object.freeze({
  classificar: executarClassificar,
  mensagem: executarMensagem,
  guardrail: executarGuardrail,
  avaliar: executarAvaliar,
  custo: executarCusto,
});
const AJUDA = `jev.mjs — Jev (TypeSafe) no rules-ai
  classificar [--id ID] [--limite N] [--todas] [--quadro arquivo] [--dry-run] [--json]
      [--gravar [--reclassificar]]  grava Nível/Modelo/Effort (C47); --dry-run só mostra
      sugere nível, effort e modelos elegíveis (somente leitura; exige TYPESAFE_API_KEY)
  mensagem [--texto "..."] [--projeto nome] [--dry-run] [--json]
      classifica a mensagem do usuário (texto pela entrada padrão se faltar --texto); sai com 0
      mesmo se o Jev falhar (aí vale só a skill); --dry-run mostra o state mascarado
  guardrail <escopo|aceite|segredo|pasta|comando|aprovacao> [--entrada json|@arquivo] [--json]
      atalhos: --texto --comando --mensagem --pergunta-pendente --caminhos a,b --descricao
      --arquivos-previstos a,b --criterios "a;b"
  avaliar [--variante cego|revisor] [--golden arquivo] [--limite N]
  custo [--desde AAAA-MM-DD] [--json]
Códigos de saída: 0 ok · 1 erro · 2 JEV_MODO=off · 3 revisar · 4 bloquear · 5 Jev indisponível`;

/**
 * Converte um erro em mensagem clara e código de saída 1 (a chave nunca aparece).
 * @param {Error} erro Erro lançado por um subcomando.
 * @returns {number} Código de saída.
 */
function tratarErro(erro) {
  const prefixo = erro instanceof ErroJev ? `Erro [${erro.codigo}]` : 'Erro';
  console.error(`${prefixo}: ${erro.message}`);
  return CODIGOS_SAIDA.ERRO;
}

/**
 * Programa principal: escolhe o subcomando e executa.
 * @param {string[]} argv Argumentos sem `node` e sem o script.
 * @returns {Promise<number>} Código de saída.
 */
async function principal(argv) {
  const argumentos = lerArgumentos(argv);
  const comando = COMANDOS[argumentos.subcomando ?? ''];
  if (!comando || argumentos.opcoes.ajuda) {
    console.log(AJUDA);
    return comando ? CODIGOS_SAIDA.OK : CODIGOS_SAIDA.ERRO;
  }
  const argvOriginal = argv.slice(1);
  try {
    return await comando({ ...argumentos, argvOriginal });
  } catch (erro) {
    return tratarErro(erro);
  }
}

process.exitCode = await principal(process.argv.slice(2));

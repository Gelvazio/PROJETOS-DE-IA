// Teste de invariante INV-1 (R1.3): o `state` enviado ao Jev não contém rótulo de nível, modelo
// ou effort — para TODA subtarefa do quadro (STATUS.md e task_complete.md) e para textos
// adversariais. O detector abaixo é independente do sanitizador de estado.mjs.
// Uso: node scripts/jev/testes/invariantes.mjs
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { RAIZ_RULES_AI } from '../config.mjs';
import {
  carregarStateCego, ehSubtarefa, lerQuadro, montarStateCego,
} from '../estado.mjs';

const QUADROS = ['STATUS.md', 'task_complete.md'].map((nome) => join(RAIZ_RULES_AI, 'tasks', nome));
const DETECTORES_ROTULO = [
  ['nivel_atual', /nivel_atual/i],
  ['nível em maiúsculas', /\b(?:LEVE|MEDIO|MÉDIO|PESADO)\b/],
  ['effort low/medium/high', /effort\s*[:=]?\s*(?:low|medium|high)\b/i],
  ['linha Nível/Modelo/Effort', /(?:^|\n)\s*(?:[-*]\s+|\*\*)(?:Nível|Nivel|Modelo|Effort)\**\s*:/i],
  ['modelo Claude', /\b(?:Haiku|Sonnet|Opus|Fable)\b/i],
  ['modelo Gemini', /\bGemini(?:\s+CLI)?\s+(?:Flash|Pro)\b/i],
  ['modelo DeepSeek', /deepseek-(?:flash|v4-pro)/i],
  ['modelo DeepSeek (nome)', /DeepSeek\s+(?:V\d+(?:\.\d+)?\s+)?(?:Flash|Pro)\b/i],
  ['executor-<nível>', /executor-(?:leve|medio|pesado)\b/i],
  ['flag --leve/--medio/--pesado', /--(?:leve|medio|pesado)\b/i],
  [
    'linha Entrega/Verificação com parênteses',
    /(?:^|\n)\s*(?:[-*]\s+)?\*\*(?:Entrega|Verifica[çc][ãa]o)\s*\(/i,
  ],
];
const TEXTOS_ADVERSARIAIS = [
  '- **Nível:** PESADO — banco\n- **Modelo:** só Opus 5.5+ ou Fable\n- **Effort:** high\nFazer X.',
  'Título · `MEDIO · effort medium` · só Sonnet',
  'nivel_atual: MEDIO  descrição normal sobre scripts',
  'Executor: Claude Code (Haiku 5.5), DeepSeek (raciocínio), Gemini Pro, deepseek-v4-pro.',
  '- **Entrega (Claude Code · executor-leve; líder Opus 5.5):** commit abc\nTexto normal.',
  '- **Verificação (líder):** node --check ok\nA tarefa usa o executor-pesado e o executor-medio.',
  'Rodar o gerenciador com --leve ou --pesado e depois --medio.',
];
let totalSubtarefas = 0;

/**
 * Procura rótulos proibidos no state inteiro (chaves e valores).
 * @param {object} state State a conferir.
 * @returns {string[]} Descrição de cada rótulo encontrado.
 */
function procurarRotulos(state) {
  const texto = JSON.stringify(state, null, 1).replace(/\\n/g, '\n');
  return DETECTORES_ROTULO.filter(([, padrao]) => padrao.test(texto)).map(([nome]) => nome);
}

/** Todas as subtarefas dos dois quadros geram state sem rótulo. */
function conferirQuadrosReais() {
  for (const arquivoQuadro of QUADROS) {
    for (const item of lerQuadro(arquivoQuadro).filter(ehSubtarefa)) {
      const state = carregarStateCego(item, arquivoQuadro);
      const achados = procurarRotulos(state);
      assert.deepEqual(achados, [], `${item.id}: rótulo no state (${achados.join(', ')})`);
      assert.equal(Object.hasOwn(state, 'nivel_atual'), false);
      totalSubtarefas += 1;
    }
  }
  assert.ok(totalSubtarefas > 0, 'nenhuma subtarefa lida do quadro');
  console.log(`ok  INV-1 ${totalSubtarefas} subtarefas reais sem rótulo no state`);
}

/** Textos adversariais (rótulos em todo canto) também saem limpos. */
function conferirTextosAdversariais() {
  for (const texto of TEXTOS_ADVERSARIAIS) {
    const item = { id: 'ADV.1', titulo: texto, prioridade: '🟡', etapa: null };
    const state = montarStateCego(item, `### ADV.1 — ${texto}\n${texto}\n- **Arquivos:** \`a.js\``);
    assert.deepEqual(procurarRotulos(state), [], `adversarial: ${JSON.stringify(texto)}`);
  }
  console.log(`ok  INV-1 ${TEXTOS_ADVERSARIAIS.length} textos adversariais sem rótulo`);
}

/** Bordas: subtarefa sem etapa/seção gera state mínimo; segredos saem mascarados. */
function conferirBordasDoEstado() {
  const itemSemEtapa = { id: 'S.1', titulo: 'Sem etapa', prioridade: '🟡', etapa: null };
  const semEtapa = montarStateCego(itemSemEtapa, '');
  assert.equal(semEtapa.descricao, '');
  assert.deepEqual(semEtapa.arquivos, []);

  const chave = 'tsk_abcdefghijklmnop1234567890';
  const comSegredo = montarStateCego({ id: 'S.2', titulo: 'Chave', prioridade: '🟡', etapa: null },
    `### S.2 — Chave\nUsar ${chave} e joao@exemplo.com, CPF 123.456.789-09.`);
  const texto = JSON.stringify(comSegredo);
  for (const proibido of [chave, 'joao@exemplo.com', '123.456.789-09']) {
    assert.equal(texto.includes(proibido), false, `segredo vazou: ${proibido.slice(0, 4)}…`);
  }
  console.log('ok  bordas: sem etapa -> state mínimo; chave/e-mail/CPF mascarados');
}

conferirQuadrosReais();
conferirTextosAdversariais();
conferirBordasDoEstado();
console.log('\ninvariantes: INV-1 aprovada.');

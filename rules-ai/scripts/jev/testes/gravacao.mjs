// Teste de invariante da gravação (C47, INV-1 a INV-3; exceção C34 em tarefa PESADO). Sem rede e
// sem chave. Uso: node scripts/jev/testes/gravacao.mjs
import assert from 'node:assert/strict';
import { agregarRespostas } from '../decidir.mjs';
import { aplicarNaSecao, aplicarNoQuadro, decidirGravacao } from '../gravacao.mjs';
import { ORDEM_NIVEIS } from '../modelos.mjs';

const CONFIANCAS = [0, 0.5, 0.79, 0.8, 0.81, 0.95, 1];
const SINAIS = [0.05, 0.49, 0.5, 0.9];
const LIMIAR = 0.8;
const SINAL_LIMIAR = 0.5;
let total = 0;

/**
 * Monta a sugestão do Jev para um caso.
 * @param {{nivel: string|null, confianca: number, sinal: number}} caso Caso do produto cartesiano.
 * @returns {object} Sugestão agregada.
 */
function sugerir(caso) {
  const respostas = {
    nivel: { choice: caso.nivel, confidence: caso.confianca },
    effort: { choice: 'medium' },
    risco: { score: 0.4 },
    banco: { noul: caso.sinal }, segredo: { noul: 0.05 }, massa: { noul: 0.05 },
    mais_de_3_arquivos: { noul: 0.05 },
  };
  return agregarRespostas({ subtarefa: 'T.1', respostas });
}

/** INV-1 e INV-2 sobre o produto cartesiano nível × confiança × sinal, com e sem falha. */
function conferirDecisao() {
  for (const nivel of [...ORDEM_NIVEIS, null]) {
    for (const confianca of CONFIANCAS) {
      for (const sinal of SINAIS) {
        const sugestao = sugerir({ nivel, confianca, sinal });
        const decisao = decidirGravacao(sugestao);
        const jevPodia = nivel !== null && confianca >= LIMIAR && sinal < SINAL_LIMIAR;
        assert.equal(decisao.jevDecidiu, jevPodia, `INV-1 ${nivel}/${confianca}/${sinal}`);
        if (jevPodia) assert.equal(decisao.nivel, nivel);
        if (!jevPodia && sinal >= SINAL_LIMIAR) assert.equal(decisao.nivel, 'PESADO');
        if (!jevPodia && nivel) {
          const rank = (n) => ORDEM_NIVEIS.indexOf(n);
          assert.ok(rank(decisao.nivel) >= rank(nivel), `INV-2 ${nivel}/${confianca}/${sinal}`);
        }
        total += 1;
      }
    }
  }
  const falha = decidirGravacao({ erro_codigo: 'REDE', sinais: {}, nivel_sugerido: null });
  assert.equal(falha.nivel, 'PESADO');
  assert.equal(falha.jevDecidiu, false);
  assert.equal(falha.fonte, 'sinais (jev indisponivel)');
  console.log(`ok  INV-1/INV-2 em ${total} casos e falha do Jev -> PESADO`);
}

/** INV-3: a gravação só mexe nas linhas dos 5 campos e na coluna Modelo. */
function conferirEscritaLimitada() {
  const etapa = ['### T.1 — Titulo', '', '**Próximo passo:** x', '', '- **Descrição:** d',
    '- **Entrega:** —', '', '### T.2 — Outra', '', '- **Nível:** LEVE'].join('\n');
  const decisao = decidirGravacao(sugerir({ nivel: 'MEDIO', confianca: 0.9, sinal: 0.05 }));
  const novo = aplicarNaSecao(etapa, 'T.1', decisao).split('\n');
  const antigo = etapa.split('\n');
  const sobras = antigo.filter((linha) => !novo.includes(linha));
  assert.deepEqual(sobras, [], 'nenhuma linha antiga some');
  const acrescentadas = novo.filter((linha) => !antigo.includes(linha));
  assert.equal(acrescentadas.length, 5);
  assert.ok(novo.includes('- **JEV-AI-SUGGESTION:** SIM'));
  assert.ok(novo.includes('### T.2 — Outra') && novo.includes('- **Nível:** LEVE'));
  const quadro = '| Tarefa | Título | Modelo | Status |\n|---|---|---|---|\n| T.1 | a | x | ⬜ |';
  const novoQuadro = aplicarNoQuadro(quadro, 'T.1', 'MEDIO · só Sonnet · effort medium');
  assert.equal(novoQuadro, quadro.replace('| x |', '| MEDIO · só Sonnet · effort medium |'));
  assert.equal(aplicarNoQuadro(quadro, 'Z.9', 'm'), null);
  console.log('ok  INV-3 só os 5 campos e a coluna Modelo mudam');
}

conferirDecisao();
conferirEscritaLimitada();
console.log(`gravacao: tudo certo (${total} casos)`);

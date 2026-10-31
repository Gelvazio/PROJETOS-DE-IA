// Pacote do rules-local (RULES-LOCAL-JEV.2): baixa, confere e grava os scripts do próprio
// `rules-local/` e os arquivos do Jev (`rules-local/jev/`) listados na VERSAO.md. Assim o
// `rules-local/` se atualiza sozinho (scripts) e o gancho de prompt do projeto tem o Jev.
// Nunca usa Git. A chave do Jev nunca entra aqui: o Jev do projeto lê só a variável de ambiente.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { baixarTexto } from './baixar.mjs';
import { calcularCodigo } from './conferir.mjs';

const PREFIXO_JEV = 'jev/';
const FONTE_JEV = 'scripts/jev/';
const FONTE_SCRIPTS = 'scripts/rules-local/';
const ARQUIVO_GITIGNORE = '.gitignore';
/** Fora do Git dentro de `rules-local/`: a trava da sessão e os logs/auditoria do Jev. */
const LINHAS_GITIGNORE = ['.trava', 'jev/saidas/'];

/**
 * Caminho do arquivo no `rules-ai` (nuvem) para um caminho do pacote.
 * @param {string} caminho Caminho relativo a `rules-local/` (`jev/…` ou `<nome>.mjs`).
 * @returns {string} Caminho no repositório `rules-ai`.
 */
function caminhoNaFonte(caminho) {
  if (caminho.startsWith(PREFIXO_JEV)) return FONTE_JEV + caminho.slice(PREFIXO_JEV.length);
  return FONTE_SCRIPTS + caminho;
}

/**
 * Resolve um caminho do pacote dentro da pasta, recusando qualquer saída dela.
 * @param {string} pasta Pasta `rules-local`.
 * @param {string} caminho Caminho relativo da tabela.
 * @returns {string} Caminho absoluto.
 * @throws {Error} Se o caminho sair da pasta.
 */
function caminhoSeguro(pasta, caminho) {
  const base = resolve(pasta);
  const alvo = resolve(base, caminho);
  if (!alvo.startsWith(base + sep)) throw new Error(`caminho fora do rules-local: ${caminho}`);
  return alvo;
}

/**
 * Baixa o pacote e confere o código de cada arquivo (cache do `raw` não passa).
 * @param {Map<string, string>} pacote caminho → código da VERSAO.md da nuvem.
 * @param {{urlBase: string}} opcoes Opções de download.
 * @returns {Promise<{ok: true, textos: Map<string, string>}
 *   | {ok: false, semAcesso: boolean, motivo: string}>} `semAcesso` falso = nuvem inconsistente.
 */
export async function baixarPacoteConferido(pacote, opcoes) {
  const caminhos = [...pacote.keys()];
  const resultados = await Promise.all(
    caminhos.map((caminho) => baixarTexto(caminhoNaFonte(caminho), opcoes)),
  );
  const textos = new Map();
  for (const [indice, resultado] of resultados.entries()) {
    const caminho = caminhos[indice];
    if (!resultado.ok) {
      return { ok: false, semAcesso: true, motivo: `${resultado.motivo} em ${caminho}` };
    }
    if (calcularCodigo(resultado.texto) !== pacote.get(caminho)) {
      const motivo = `código de ${caminho} não bate com a VERSAO.md`;
      return { ok: false, semAcesso: false, motivo };
    }
    textos.set(caminho, resultado.texto);
  }
  return { ok: true, textos };
}

/**
 * Garante as linhas do `.gitignore` de `rules-local/` (sem apagar as que já existem).
 * @param {string} pasta Pasta `rules-local`.
 * @returns {void}
 */
function garantirGitignore(pasta) {
  const arquivo = join(pasta, ARQUIVO_GITIGNORE);
  const atual = existsSync(arquivo) ? readFileSync(arquivo, 'utf8') : '';
  const existentes = new Set(atual.split(/\r?\n/).map((linha) => linha.trim()));
  const faltando = LINHAS_GITIGNORE.filter((linha) => !existentes.has(linha));
  if (faltando.length === 0) return;
  const separador = atual === '' || atual.endsWith('\n') ? '' : '\n';
  writeFileSync(arquivo, `${atual}${separador}${faltando.join('\n')}\n`, 'utf8');
}

/**
 * Grava o pacote e confere o que ficou no disco. Os arquivos do Jev que saíram do pacote ficam
 * (sobra inofensiva; o gancho só importa os listados).
 * @param {string} pasta Pasta `rules-local`.
 * @param {Map<string, string>} textos caminho → texto baixado.
 * @param {Map<string, string>} pacote caminho → código esperado.
 * @returns {void}
 * @throws {Error} Se algum arquivo gravado não bater com o código da tabela.
 */
export function gravarPacote(pasta, textos, pacote) {
  garantirGitignore(pasta);
  for (const [caminho, texto] of textos) {
    const alvo = caminhoSeguro(pasta, caminho);
    mkdirSync(dirname(alvo), { recursive: true });
    writeFileSync(alvo, texto, 'utf8');
  }
  for (const [caminho, codigo] of pacote) {
    const gravado = readFileSync(caminhoSeguro(pasta, caminho), 'utf8');
    if (calcularCodigo(gravado) !== codigo) {
      throw new Error(`${caminho} não confere depois de gravado`);
    }
  }
}

// Constantes da página Agentes ao vivo (sem lógica).

/** Atraso padrão da animação dos agentes, em segundos (o seletor da tela guarda a escolha). */
export const ATRASO_PADRAO_SEGUNDOS = 30;

/** Intervalo da leitura do GitHub raw (fallback) enquanto o canal está fora, em segundos. */
export const INTERVALO_FALLBACK_SEGUNDOS = 30;

/**
 * Canal de Broadcast do Supabase (MIGRAR-AGENTES-BROADCAST.3).
 * Este arquivo vai para o navegador: só entra o que é público.
 * - url: pública (projeto AULAS SENAI); não é segredo.
 * - chavePublicavel (sb_publishable_…): pública por desenho; o usuário a preenche na subtarefa
 *   AGENTES-REALTIME.12. Vazia = só o estado inicial, sem canal ao vivo.
 * ⛔ A chave SECRETA (sb_secret_…) nunca entra aqui: ela vive só no secret SUPABASE_SECRET_KEY
 * do GitHub e é usada pelo publicador no workflow.
 */
export const CANAL = Object.freeze({
  url: 'https://hxlvonriearllcmfqeri.supabase.co',
  chavePublicavel: '',
  projeto: 'rules-ai',
  evento: 'estado',
  versaoContrato: 1,
  urlQuadro: 'https://raw.githubusercontent.com/Gelvazio/rules-ai/main/tasks/STATUS.md',
  // Em ambiente local (HOSTS_LOCAIS) o quadro vem do arquivo do disco, se a pasta rules-ai for servida.
  urlQuadroLocal: '../tasks/STATUS.md',
  urlCliente: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/+esm',
});

/** Hosts em que a página lê o quadro do arquivo local, em vez do GitHub raw. */
export const HOSTS_LOCAIS = Object.freeze(['localhost', '127.0.0.1', '[::1]']);

/** Câmera e luzes da cena. */
export const CENA = Object.freeze({
  corFundo: 0x0b1020,
  campoVisao: 45,
  distanciaInicial: 3,
  velocidadeGiro: 1.2,
});

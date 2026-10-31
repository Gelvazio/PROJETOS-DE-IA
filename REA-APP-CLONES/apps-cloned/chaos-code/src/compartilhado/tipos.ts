/**
 * Tipos trocados entre o processo principal, o preload e a interface.
 */

/** Dados básicos do aplicativo mostrados na interface. */
export interface InformacoesAplicativo {
  nome: string;
  versao: string;
  urlServidor: string;
  plataforma: string;
}

/** API que o preload expõe para a interface em `window.chaosCode`. */
export interface ApiChaosCode {
  obterInformacoes: () => Promise<InformacoesAplicativo>;
}

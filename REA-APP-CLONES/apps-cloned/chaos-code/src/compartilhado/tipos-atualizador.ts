/**
 * Tipos do arquivo `latest.json` publicado no servidor do atualizador (formato padrão do Tauri).
 * As chaves do JSON (`version`, `pub_date`, `platforms`…) ficam com o nome original porque
 * precisam bater com o arquivo publicado.
 */

/** Dados de uma plataforma (ex.: `windows-x86_64`) dentro do `latest.json`. */
export interface PlataformaAtualizacao {
  /** Assinatura minisign do executável, conferida antes de instalar. */
  signature: string;
  /** Endereço de onde o instalador é baixado. */
  url: string;
}

/** Conteúdo completo do `latest.json`. */
export interface LatestJson {
  /** Versão publicada, no formato semver (ex.: `0.2.0`). */
  version: string;
  /** Texto de novidades da versão (opcional). */
  notes?: string;
  /** Data de publicação no formato RFC 3339. */
  pub_date: string;
  /** Dados de instalação indexados pelo nome da plataforma. */
  platforms: Record<string, PlataformaAtualizacao>;
}

/** Resultado de uma consulta ao `latest.json` feita pelo app. */
export interface ResultadoVerificacaoAtualizacao {
  /** true se a versão publicada é mais nova que a instalada. */
  haAtualizacao: boolean;
  versaoInstalada: string;
  versaoDisponivel: string;
  notas: string;
  /** Endereço do instalador da plataforma atual; vazio se não houver atualização. */
  urlInstalador: string;
  /** Assinatura minisign do instalador; vazia se não houver atualização. */
  assinatura: string;
}

import type { ApiChaosCode } from '../compartilhado/tipos';
import type { ApiAtualizador } from '../compartilhado/tipos-ipc-atualizador';
import type { ApiImagem } from '../compartilhado/tipos-ipc-imagem';
import type { ApiProjetos } from '../compartilhado/tipos-ipc-projetos';
import type { ApiLogin } from '../main/login/login.canais';

// Cada módulo novo soma aqui o seu `Api<Modulo>` (e no `preload.ts`).
declare global {
  interface Window {
    chaosCode: ApiChaosCode & ApiProjetos & ApiImagem & ApiAtualizador & ApiLogin;
  }
}

export {};

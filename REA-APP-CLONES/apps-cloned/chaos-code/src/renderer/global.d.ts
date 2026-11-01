import type { ApiChaosCode } from '../compartilhado/tipos';
import type { ApiAtualizador } from '../compartilhado/tipos-ipc-atualizador';
import type { ApiImagem } from '../compartilhado/tipos-ipc-imagem';
import type { ApiProjetos } from '../compartilhado/tipos-ipc-projetos';
import type { ApiPlataformaIpc } from '../main/api/api.canais';
import type { ApiLogin } from '../main/login/login.canais';
import type { ApiVetores } from '../compartilhado/tipos-ipc-vetores';
import type { ApiGrafo } from '../compartilhado/tipos-ipc-grafo';
import type { ApiMcp } from '../compartilhado/tipos-ipc-mcp';

// Cada módulo novo soma aqui o seu `Api<Modulo>` (e no `preload.ts`).
declare global {
  interface Window {
    chaosCode: ApiChaosCode & ApiProjetos & ApiImagem & ApiAtualizador & ApiLogin &
      ApiPlataformaIpc & ApiVetores & ApiGrafo & ApiMcp;
  }
}

export {};

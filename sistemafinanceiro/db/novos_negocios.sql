-- ============================================================================
-- novos_negocios: regras de análise e prompt de cada ideia (página Gestão de
-- Novos Negócios). Uma linha por usuário e por projeto (ideia).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.novos_negocios (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id           UUID        NOT NULL DEFAULT auth.uid()
                         REFERENCES public.usuarios(id) ON DELETE CASCADE,
  projeto_id           TEXT        NOT NULL,            -- código da ideia, ex.: 'IDEIA 01'
  nome                 TEXT        NOT NULL,            -- nome da ideia
  horas_semana_max     NUMERIC(5,1),                    -- horas por semana disponíveis
  investimento_max     NUMERIC(15,2),                   -- investimento inicial máximo (R$)
  retorno_max_meses    INTEGER,                         -- retorno aceitável (meses)
  regras_analise       TEXT        NOT NULL DEFAULT '', -- "Regras de análise iniciais" (editáveis)
  prompt_analise       TEXT,                            -- último prompt usado/gerado para o CFO
  prompt_atualizado_em TIMESTAMPTZ,
  analisado_em         TIMESTAMPTZ,                     -- quando a IA gravou a análise
  analise_arquivo      TEXT,                            -- ex.: docs/analises/ANALISE-FINANCEIRA-IDEIA 01.md
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT novos_negocios_usuario_projeto_uq UNIQUE (usuario_id, projeto_id)
);

CREATE INDEX IF NOT EXISTS idx_novos_negocios_usuario ON public.novos_negocios (usuario_id);

DROP TRIGGER IF EXISTS trg_novos_negocios_updated ON public.novos_negocios;
CREATE TRIGGER trg_novos_negocios_updated
  BEFORE UPDATE ON public.novos_negocios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.novos_negocios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS novos_negocios_select_own ON public.novos_negocios;
CREATE POLICY novos_negocios_select_own ON public.novos_negocios
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS novos_negocios_insert_own ON public.novos_negocios;
CREATE POLICY novos_negocios_insert_own ON public.novos_negocios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS novos_negocios_update_own ON public.novos_negocios;
CREATE POLICY novos_negocios_update_own ON public.novos_negocios
  FOR UPDATE TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS novos_negocios_delete_own ON public.novos_negocios;
CREATE POLICY novos_negocios_delete_own ON public.novos_negocios
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.novos_negocios TO authenticated;

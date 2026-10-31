-- Despesas e receitas fixas (tarefa FIXAS.1). Migração aditiva: não altera dados existentes.
-- Fixa não grava registro por mês: as ocorrências são calculadas no front e só viram
-- `lancamento` quando efetivadas (pagas/recebidas), ligadas por recorrencia_id + competencia.

-- ── recorrencia ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.recorrencia (
  id SERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id INTEGER NOT NULL REFERENCES public.loja(id),
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  valor NUMERIC(15, 2) NOT NULL CHECK (valor > 0),
  dia_vencimento SMALLINT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  data_inicio DATE NOT NULL,
  data_fim DATE,
  ativo SMALLINT NOT NULL DEFAULT 1, -- 1=ativo, 0=inativo
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (data_fim IS NULL OR data_fim >= data_inicio)
);

CREATE INDEX IF NOT EXISTS idx_recorrencia_usuario ON public.recorrencia (usuario_id);

DROP TRIGGER IF EXISTS trg_recorrencia_updated ON public.recorrencia;
CREATE TRIGGER trg_recorrencia_updated
  BEFORE UPDATE ON public.recorrencia
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── lancamento: vínculo com a recorrência efetivada ──────────────────
ALTER TABLE public.lancamento
  ADD COLUMN IF NOT EXISTS recorrencia_id INTEGER REFERENCES public.recorrencia(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS competencia TEXT;

ALTER TABLE public.lancamento DROP CONSTRAINT IF EXISTS lancamento_competencia_formato;
ALTER TABLE public.lancamento ADD CONSTRAINT lancamento_competencia_formato
  CHECK (competencia IS NULL OR competencia ~ '^[0-9]{4}-(0[1-9]|1[0-2])$');

-- Um único lançamento efetivado por recorrência e mês
CREATE UNIQUE INDEX IF NOT EXISTS uq_lancamento_recorrencia_competencia
  ON public.lancamento (recorrencia_id, competencia)
  WHERE recorrencia_id IS NOT NULL;

-- ── RLS: só do próprio usuário (igual à lancamento) ──────────────────
ALTER TABLE public.recorrencia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recorrencia_select_own ON public.recorrencia;
CREATE POLICY recorrencia_select_own ON public.recorrencia
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS recorrencia_insert_own ON public.recorrencia;
CREATE POLICY recorrencia_insert_own ON public.recorrencia
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS recorrencia_update_own ON public.recorrencia;
CREATE POLICY recorrencia_update_own ON public.recorrencia
  FOR UPDATE TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS recorrencia_delete_own ON public.recorrencia;
CREATE POLICY recorrencia_delete_own ON public.recorrencia
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

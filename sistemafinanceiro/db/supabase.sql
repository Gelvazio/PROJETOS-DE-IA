-- ============================================================================
-- SISTEMA FINANCEIRO — Schema PostgreSQL (Supabase)
-- Execute no SQL Editor do Supabase Dashboard (projeto novo).
-- ============================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── usuarios (espelha auth.users) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  is_active SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── loja ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.loja (
  id SERIAL PRIMARY KEY,
  loj_nome TEXT NOT NULL,
  loj_cnpj_cpf TEXT,
  loj_cidade TEXT,
  loj_estado TEXT,
  loj_endereco TEXT,
  loj_cep TEXT,
  loj_rua TEXT,
  loj_celular TEXT,
  loj_tel_residencial TEXT,
  loj_tel_comercial TEXT,
  loj_ativo SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── cliente ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cliente (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  email TEXT,
  telefone TEXT,
  ativo SMALLINT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── cli_loja (N:N) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cli_loja (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES public.cliente(id) ON DELETE CASCADE,
  loja_id INTEGER NOT NULL REFERENCES public.loja(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, loja_id)
);

-- ── lancamento ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lancamento (
  id SERIAL PRIMARY KEY,
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  loja_id INTEGER NOT NULL REFERENCES public.loja(id),
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('pagar', 'receber')),
  data_vencimento DATE NOT NULL,
  data_pagamento DATE,
  qtd_parcelas INTEGER NOT NULL DEFAULT 1,
  parcela_atual INTEGER NOT NULL DEFAULT 1,
  valor NUMERIC(15, 2) NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0, -- 0=Aberto, 1=Pago, 3=Cancelado
  id_parcelamento TEXT,
  grupo_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lancamento_usuario ON public.lancamento (usuario_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_loja ON public.lancamento (loja_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_vencimento ON public.lancamento (data_vencimento);
CREATE INDEX IF NOT EXISTS idx_lancamento_status ON public.lancamento (status);
CREATE INDEX IF NOT EXISTS idx_lancamento_tipo ON public.lancamento (tipo);
CREATE INDEX IF NOT EXISTS idx_lancamento_parcelamento ON public.lancamento (id_parcelamento);
CREATE INDEX IF NOT EXISTS idx_lancamento_usuario_venc ON public.lancamento (usuario_id, data_vencimento);

-- ── updated_at trigger ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_usuarios_updated ON public.usuarios;
CREATE TRIGGER trg_usuarios_updated
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_loja_updated ON public.loja;
CREATE TRIGGER trg_loja_updated
  BEFORE UPDATE ON public.loja
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_lancamento_updated ON public.lancamento;
CREATE TRIGGER trg_lancamento_updated
  BEFORE UPDATE ON public.lancamento
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Auto-criar perfil em usuarios após signup ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', ''),
    1
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        nome = COALESCE(EXCLUDED.nome, public.usuarios.nome);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Seed: loja padrão ─────────────────────────────────────────────────
INSERT INTO public.loja (id, loj_nome, loj_cidade, loj_estado, loj_ativo)
VALUES (1, 'Pessoal', 'Blumenau', 'SC', 1)
ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('public.loja', 'id'), GREATEST((SELECT MAX(id) FROM public.loja), 1));

-- ── RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cli_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamento ENABLE ROW LEVEL SECURITY;

-- usuarios: cada um vê/edita o próprio perfil
DROP POLICY IF EXISTS usuarios_select_own ON public.usuarios;
CREATE POLICY usuarios_select_own ON public.usuarios
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS usuarios_insert_own ON public.usuarios;
CREATE POLICY usuarios_insert_own ON public.usuarios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS usuarios_update_own ON public.usuarios;
CREATE POLICY usuarios_update_own ON public.usuarios
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- loja: autenticados leem lojas ativas (app multi-loja simples)
DROP POLICY IF EXISTS loja_select_auth ON public.loja;
CREATE POLICY loja_select_auth ON public.loja
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS loja_insert_auth ON public.loja;
CREATE POLICY loja_insert_auth ON public.loja
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS loja_update_auth ON public.loja;
CREATE POLICY loja_update_auth ON public.loja
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- cliente / cli_loja: autenticados
DROP POLICY IF EXISTS cliente_all_auth ON public.cliente;
CREATE POLICY cliente_all_auth ON public.cliente
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS cli_loja_all_auth ON public.cli_loja;
CREATE POLICY cli_loja_all_auth ON public.cli_loja
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- lancamento: só do próprio usuário
DROP POLICY IF EXISTS lancamento_select_own ON public.lancamento;
CREATE POLICY lancamento_select_own ON public.lancamento
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS lancamento_insert_own ON public.lancamento;
CREATE POLICY lancamento_insert_own ON public.lancamento
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS lancamento_update_own ON public.lancamento;
CREATE POLICY lancamento_update_own ON public.lancamento
  FOR UPDATE TO authenticated USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS lancamento_delete_own ON public.lancamento;
CREATE POLICY lancamento_delete_own ON public.lancamento
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);

-- Compatibilidade com INSERT_RELATORIO_TRANSACOES_MOBILLS.sql (schema fin)
CREATE SCHEMA IF NOT EXISTS fin;
CREATE OR REPLACE VIEW fin.lancamento
  WITH (security_invoker = true)
  AS SELECT * FROM public.lancamento;
GRANT SELECT, INSERT, UPDATE, DELETE ON fin.lancamento TO authenticated;
GRANT USAGE ON SCHEMA fin TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

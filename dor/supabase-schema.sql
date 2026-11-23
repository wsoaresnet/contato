-- ============================================================
-- DIÁRIO DA ENXAQUECA - SCHEMA BASE (rode ANTES de supabase-medical-tables.sql)
-- Supabase > SQL Editor > New query > Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  username   TEXT PRIMARY KEY,
  password   TEXT NOT NULL,
  role       TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crises (
  id           TEXT PRIMARY KEY,
  username     TEXT NOT NULL REFERENCES public.users(username) ON DELETE CASCADE,
  date         DATE,
  time         TIME,
  duration     TEXT,
  intensity    INTEGER,
  type         TEXT,
  location     TEXT,
  symptoms     JSONB,
  triggers     JSONB,
  medication   TEXT,
  relief       TEXT,
  notes        TEXT,
  sleep_hours  NUMERIC,   -- usado pelo app (faltava no schema antigo)
  stress_level INTEGER,   -- usado pelo app (faltava no schema antigo)
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crises_username      ON public.crises(username);
CREATE INDEX IF NOT EXISTS idx_crises_username_date ON public.crises(username, date);

-- O app usa a chave publishable (anon) direto do navegador e faz o próprio
-- login na tabela users. Por isso o acesso anon precisa estar liberado.
-- (Melhoria futura: migrar para Supabase Auth + RLS por usuário.)
ALTER TABLE public.users    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crises   DISABLE ROW LEVEL SECURITY;

INSERT INTO public.users (username, password, role)
VALUES ('willian', 'TROQUE_ESTA_SENHA', 'admin')
ON CONFLICT (username) DO NOTHING;

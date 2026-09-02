-- Categorias de cabo
CREATE TABLE public.categorias_cabo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_cabo TO anon, authenticated;
GRANT ALL ON public.categorias_cabo TO service_role;
ALTER TABLE public.categorias_cabo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico categorias" ON public.categorias_cabo FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Patch panels
CREATE TABLE public.patch_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificacao text NOT NULL UNIQUE,
  numero text,
  numero_portas integer NOT NULL DEFAULT 24 CHECK (numero_portas > 0 AND numero_portas <= 96),
  localizacao text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patch_panels TO anon, authenticated;
GRANT ALL ON public.patch_panels TO service_role;
ALTER TABLE public.patch_panels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico patch panels" ON public.patch_panels FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Switches
CREATE TABLE public.switches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificacao text NOT NULL UNIQUE,
  modelo text,
  numero text,
  numero_portas integer NOT NULL DEFAULT 24 CHECK (numero_portas > 0 AND numero_portas <= 96),
  localizacao text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.switches TO anon, authenticated;
GRANT ALL ON public.switches TO service_role;
ALTER TABLE public.switches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico switches" ON public.switches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Pontos de rede
CREATE TABLE public.pontos_rede (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificacao text NOT NULL UNIQUE,
  localizacao text,
  patch_panel_id uuid REFERENCES public.patch_panels(id) ON DELETE SET NULL,
  porta_patch_panel integer CHECK (porta_patch_panel > 0),
  switch_id uuid REFERENCES public.switches(id) ON DELETE SET NULL,
  porta_switch integer CHECK (porta_switch > 0),
  categoria_cabo text NOT NULL DEFAULT 'Cat6',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pontos_rede_pp_porta_uniq ON public.pontos_rede (patch_panel_id, porta_patch_panel) WHERE patch_panel_id IS NOT NULL AND porta_patch_panel IS NOT NULL;
CREATE UNIQUE INDEX pontos_rede_sw_porta_uniq ON public.pontos_rede (switch_id, porta_switch) WHERE switch_id IS NOT NULL AND porta_switch IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pontos_rede TO anon, authenticated;
GRANT ALL ON public.pontos_rede TO service_role;
ALTER TABLE public.pontos_rede ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico pontos" ON public.pontos_rede FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Limites da norma
CREATE TABLE public.limites_norma (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_cabo text NOT NULL,
  parametro text NOT NULL,
  valor_minimo numeric,
  valor_maximo numeric,
  unidade text,
  norma text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (categoria_cabo, parametro)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.limites_norma TO anon, authenticated;
GRANT ALL ON public.limites_norma TO service_role;
ALTER TABLE public.limites_norma ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico limites" ON public.limites_norma FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Testes de certificacao
CREATE TABLE public.testes_certificacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ponto_rede_id uuid NOT NULL REFERENCES public.pontos_rede(id) ON DELETE CASCADE,
  categoria_cabo text NOT NULL,
  data_teste date NOT NULL DEFAULT current_date,
  comprimento numeric,
  wire_map boolean NOT NULL DEFAULT true,
  resistencia numeric,
  next numeric,
  return_loss numeric,
  perda_insercao numeric,
  resultado text NOT NULL CHECK (resultado IN ('PASS','FAIL')),
  falhas jsonb NOT NULL DEFAULT '[]'::jsonb,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testes_certificacao TO anon, authenticated;
GRANT ALL ON public.testes_certificacao TO service_role;
ALTER TABLE public.testes_certificacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico testes" ON public.testes_certificacao FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Configuracoes (nomenclatura)
CREATE TABLE public.configuracoes (
  chave text PRIMARY KEY,
  valor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes TO anon, authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico config" ON public.configuracoes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== Dados de demonstracao =====
INSERT INTO public.categorias_cabo (nome) VALUES ('Cat5e'), ('Cat6'), ('Cat6A');

INSERT INTO public.configuracoes (chave, valor) VALUES
  ('nomenclatura_prefixo', 'P-'),
  ('nomenclatura_digitos', '3');

INSERT INTO public.patch_panels (identificacao, numero, numero_portas, localizacao, observacoes) VALUES
  ('PP01', '01', 24, 'Rack A — Sala de Rede', 'Dados de exemplo'),
  ('PP02', '02', 24, 'Rack A — Sala de Rede', 'Dados de exemplo');

INSERT INTO public.switches (identificacao, modelo, numero, numero_portas, localizacao, observacoes) VALUES
  ('SW01', 'Cisco SG350-28', '01', 28, 'Rack A — Sala de Rede', 'Dados de exemplo'),
  ('SW02', 'TP-Link TL-SG1024', '02', 24, 'Rack A — Sala de Rede', 'Dados de exemplo');

INSERT INTO public.pontos_rede (identificacao, localizacao, patch_panel_id, porta_patch_panel, switch_id, porta_switch, categoria_cabo, observacoes)
SELECT v.ident, v.loc, pp.id, v.pporta, sw.id, v.sporta, v.cat, 'Dados de exemplo'
FROM (VALUES
  ('P-001','Laboratório 1 — Bancada 1','PP01',1,'SW01',12,'Cat6'),
  ('P-002','Laboratório 1 — Bancada 2','PP01',2,'SW01',13,'Cat6'),
  ('P-003','Laboratório 1 — Bancada 3','PP01',3,'SW01',14,'Cat6A'),
  ('P-004','Secretaria','PP02',1,'SW02',5,'Cat6'),
  ('P-005','Biblioteca','PP02',2,'SW02',6,'Cat5e')
) AS v(ident, loc, ppid, pporta, swid, sporta, cat)
JOIN public.patch_panels pp ON pp.identificacao = v.ppid
JOIN public.switches sw ON sw.identificacao = v.swid;

-- Limites de exemplo (a equipe deve substituir pelos valores da norma adotada)
INSERT INTO public.limites_norma (categoria_cabo, parametro, valor_minimo, valor_maximo, unidade, norma) VALUES
  ('Cat5e','comprimento',    NULL, 100,  'm',  'Valor de exemplo — configurar'),
  ('Cat5e','resistencia',    NULL, 25,   'Ω',  'Valor de exemplo — configurar'),
  ('Cat5e','next',           27.1, NULL, 'dB', 'Valor de exemplo — configurar'),
  ('Cat5e','return_loss',    10.0, NULL, 'dB', 'Valor de exemplo — configurar'),
  ('Cat5e','perda_insercao', NULL, 24.0, 'dB', 'Valor de exemplo — configurar'),
  ('Cat6','comprimento',     NULL, 100,  'm',  'Valor de exemplo — configurar'),
  ('Cat6','resistencia',     NULL, 25,   'Ω',  'Valor de exemplo — configurar'),
  ('Cat6','next',            30.1, NULL, 'dB', 'Valor de exemplo — configurar'),
  ('Cat6','return_loss',     12.0, NULL, 'dB', 'Valor de exemplo — configurar'),
  ('Cat6','perda_insercao',  NULL, 21.3, 'dB', 'Valor de exemplo — configurar'),
  ('Cat6A','comprimento',    NULL, 100,  'm',  'Valor de exemplo — configurar'),
  ('Cat6A','resistencia',    NULL, 25,   'Ω',  'Valor de exemplo — configurar'),
  ('Cat6A','next',           33.1, NULL, 'dB', 'Valor de exemplo — configurar'),
  ('Cat6A','return_loss',    14.0, NULL, 'dB', 'Valor de exemplo — configurar'),
  ('Cat6A','perda_insercao', NULL, 20.9, 'dB', 'Valor de exemplo — configurar');

INSERT INTO public.testes_certificacao (ponto_rede_id, categoria_cabo, data_teste, comprimento, wire_map, resistencia, next, return_loss, perda_insercao, resultado, falhas, observacoes)
SELECT p.id, v.cat, v.dt::date, v.comp, v.wm, v.res, v.nx, v.rl, v.pi, v.resultado, v.falhas::jsonb, 'Teste de exemplo'
FROM (VALUES
  ('P-001','Cat6', '2026-08-25', 42.5, true, 8.4, 38.2, 18.6, 12.4, 'PASS', '[]'),
  ('P-002','Cat6', '2026-08-25', 51.0, true, 9.1, 34.7, 16.2, 15.8, 'PASS', '[]'),
  ('P-003','Cat6A','2026-08-26', 63.0, true, 10.2, 31.4, 15.1, 24.7, 'FAIL', '["perda_insercao"]'),
  ('P-004','Cat6', '2026-08-27', 28.0, false, 7.9, 35.0, 17.0, 9.8, 'FAIL', '["wire_map"]'),
  ('P-005','Cat5e','2026-08-28', 77.5, true, 12.0, 29.8, 12.4, 20.1, 'PASS', '[]')
) AS v(ident, cat, dt, comp, wm, res, nx, rl, pi, resultado, falhas)
JOIN public.pontos_rede p ON p.identificacao = v.ident;
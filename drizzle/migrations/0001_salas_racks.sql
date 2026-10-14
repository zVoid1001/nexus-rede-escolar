CREATE TABLE public.salas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  andar text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.racks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identificacao text NOT NULL UNIQUE,
  sala_id uuid REFERENCES public.salas(id) ON DELETE SET NULL,
  altura_u integer NOT NULL DEFAULT 42,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.racks TO anon, authenticated;
GRANT ALL ON public.salas TO service_role;
GRANT ALL ON public.racks TO service_role;
ALTER TABLE public.salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acesso publico salas" ON public.salas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "acesso publico racks" ON public.racks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.patch_panels ADD COLUMN rack_id uuid REFERENCES public.racks(id) ON DELETE SET NULL;
ALTER TABLE public.switches ADD COLUMN rack_id uuid REFERENCES public.racks(id) ON DELETE SET NULL;
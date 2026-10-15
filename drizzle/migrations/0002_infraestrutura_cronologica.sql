ALTER TABLE public.salas ADD COLUMN IF NOT EXISTS codigo text;
CREATE UNIQUE INDEX IF NOT EXISTS salas_codigo_uniq ON public.salas (lower(codigo)) WHERE codigo IS NOT NULL;
ALTER TABLE public.racks ADD COLUMN IF NOT EXISTS localizacao text;
ALTER TABLE public.switches ADD COLUMN IF NOT EXISTS fabricante text;
ALTER TABLE public.patch_panels ADD COLUMN IF NOT EXISTS categoria_cabo text;
ALTER TABLE public.pontos_rede ADD COLUMN IF NOT EXISTS sala_id uuid REFERENCES public.salas(id);
ALTER TABLE public.pontos_rede ADD COLUMN IF NOT EXISTS nome text;
ALTER TABLE public.pontos_rede ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ativo';
ALTER TABLE public.pontos_rede ADD CONSTRAINT pontos_rede_status_chk CHECK (status IN ('ativo','inativo','manutencao'));
CREATE INDEX IF NOT EXISTS pontos_rede_sala_idx ON public.pontos_rede (sala_id);

CREATE OR REPLACE FUNCTION public.validar_rack() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sala_id IS NULL AND (TG_OP = 'INSERT' OR OLD.sala_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Cadastre uma sala antes de criar o rack.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validar_rack ON public.racks;
CREATE TRIGGER trg_validar_rack BEFORE INSERT OR UPDATE ON public.racks FOR EACH ROW EXECUTE FUNCTION public.validar_rack();

CREATE OR REPLACE FUNCTION public.validar_equipamento() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.rack_id IS NULL AND (TG_OP = 'INSERT' OR OLD.rack_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Crie um rack antes de cadastrar switches ou patch panels.';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validar_switch ON public.switches;
CREATE TRIGGER trg_validar_switch BEFORE INSERT OR UPDATE ON public.switches FOR EACH ROW EXECUTE FUNCTION public.validar_equipamento();
DROP TRIGGER IF EXISTS trg_validar_pp ON public.patch_panels;
CREATE TRIGGER trg_validar_pp BEFORE INSERT OR UPDATE ON public.patch_panels FOR EACH ROW EXECUTE FUNCTION public.validar_equipamento();

CREATE OR REPLACE FUNCTION public.validar_ponto_rede() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE pp_rack uuid; pp_portas int; sw_rack uuid; sw_portas int; r_sala uuid;
BEGIN
  IF NEW.sala_id IS NULL AND (TG_OP = 'INSERT' OR OLD.sala_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Cadastre uma sala antes de criar pontos de rede.';
  END IF;
  IF NEW.patch_panel_id IS NOT NULL THEN
    SELECT rack_id, numero_portas INTO pp_rack, pp_portas FROM patch_panels WHERE id = NEW.patch_panel_id;
    IF NEW.porta_patch_panel IS NULL OR NEW.porta_patch_panel < 1 OR NEW.porta_patch_panel > pp_portas THEN
      RAISE EXCEPTION 'A porta do patch panel não existe (1 a %).', pp_portas;
    END IF;
  END IF;
  IF NEW.switch_id IS NOT NULL THEN
    SELECT rack_id, numero_portas INTO sw_rack, sw_portas FROM switches WHERE id = NEW.switch_id;
    IF NEW.porta_switch IS NULL OR NEW.porta_switch < 1 OR NEW.porta_switch > sw_portas THEN
      RAISE EXCEPTION 'A porta do switch não existe (1 a %).', sw_portas;
    END IF;
  END IF;
  IF pp_rack IS NOT NULL AND sw_rack IS NOT NULL AND pp_rack <> sw_rack THEN
    RAISE EXCEPTION 'O patch panel e o switch precisam estar no mesmo rack.';
  END IF;
  IF NEW.sala_id IS NOT NULL THEN
    SELECT sala_id INTO r_sala FROM racks WHERE id = coalesce(pp_rack, sw_rack);
    IF r_sala IS NOT NULL AND r_sala <> NEW.sala_id THEN
      RAISE EXCEPTION 'O ponto e os equipamentos pertencem a salas diferentes.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validar_ponto ON public.pontos_rede;
CREATE TRIGGER trg_validar_ponto BEFORE INSERT OR UPDATE ON public.pontos_rede FOR EACH ROW EXECUTE FUNCTION public.validar_ponto_rede();
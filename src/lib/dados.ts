import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  CategoriaCabo,
  Configuracao,
  LimiteNorma,
  PatchPanel,
  PontoRede,
  Switch,
  TesteCertificacao,
} from "./tipos";

async function selecionar<T>(tabela: string, ordem: string, asc = true): Promise<T[]> {
  const { data, error } = await (supabase as any)
    .from(tabela)
    .select("*")
    .order(ordem, { ascending: asc });
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

export const chaves = {
  pontos: ["pontos_rede"] as const,
  patchPanels: ["patch_panels"] as const,
  switches: ["switches"] as const,
  categorias: ["categorias_cabo"] as const,
  limites: ["limites_norma"] as const,
  testes: ["testes_certificacao"] as const,
  config: ["configuracoes"] as const,
};

export const usePontos = () =>
  useQuery({
    queryKey: chaves.pontos,
    queryFn: () => selecionar<PontoRede>("pontos_rede", "identificacao"),
  });

export const usePatchPanels = () =>
  useQuery({
    queryKey: chaves.patchPanels,
    queryFn: () => selecionar<PatchPanel>("patch_panels", "identificacao"),
  });

export const useSwitches = () =>
  useQuery({
    queryKey: chaves.switches,
    queryFn: () => selecionar<Switch>("switches", "identificacao"),
  });

export const useCategorias = () =>
  useQuery({
    queryKey: chaves.categorias,
    queryFn: () => selecionar<CategoriaCabo>("categorias_cabo", "nome"),
  });

export const useLimites = () =>
  useQuery({
    queryKey: chaves.limites,
    queryFn: () => selecionar<LimiteNorma>("limites_norma", "categoria_cabo"),
  });

export const useTestes = () =>
  useQuery({
    queryKey: chaves.testes,
    queryFn: () => selecionar<TesteCertificacao>("testes_certificacao", "created_at", false),
  });

export const useConfiguracoes = () =>
  useQuery({
    queryKey: chaves.config,
    queryFn: async () => {
      const linhas = await selecionar<Configuracao>("configuracoes", "chave");
      const mapa: Record<string, string> = {};
      for (const l of linhas) mapa[l.chave] = l.valor;
      return {
        prefixo: mapa["nomenclatura_prefixo"] ?? "P-",
        digitos: Number(mapa["nomenclatura_digitos"] ?? "3"),
      };
    },
  });

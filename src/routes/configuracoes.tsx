import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chaves, useCategorias, useConfiguracoes, useLimites, usePontos } from "@/lib/dados";
import {
  PARAMETROS_NUMERICOS,
  ROTULOS_PARAMETRO,
  proximaIdentificacao,
} from "@/lib/certificacao";
import type { LimiteNorma } from "@/lib/tipos";
import {
  AvisoDemo,
  Campo,
  PageHeader,
  Painel,
  PainelTitulo,
  Selecao,
  Vazio,
} from "@/components/ui-sistema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — NEXUS" },
      {
        name: "description",
        content:
          "Defina a nomenclatura dos pontos, as categorias de cabo e os limites da norma usados na validação automática dos testes.",
      },
      { property: "og:title", content: "Configurações — NEXUS" },
      {
        property: "og:description",
        content: "Limites por categoria e parâmetro, com mínimo, máximo, unidade e norma.",
      },
    ],
  }),
  component: Configuracoes,
});

const n = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function Configuracoes() {
  const qc = useQueryClient();
  const { data: config } = useConfiguracoes();
  const { data: categorias = [] } = useCategorias();
  const { data: limites = [] } = useLimites();
  const { data: pontos = [] } = usePontos();

  const [prefixo, setPrefixo] = useState("P-");
  const [digitos, setDigitos] = useState("3");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novo, setNovo] = useState({
    categoria_cabo: "",
    parametro: "",
    valor_minimo: "",
    valor_maximo: "",
    unidade: "",
    norma: "",
  });

  useEffect(() => {
    if (config) {
      setPrefixo(config.prefixo);
      setDigitos(String(config.digitos));
    }
  }, [config]);

  const salvarConfig = useMutation({
    mutationFn: async () => {
      if (!prefixo.trim()) throw new Error("Informe o prefixo da nomenclatura.");
      const d = Number(digitos);
      if (!Number.isInteger(d) || d < 1 || d > 6)
        throw new Error("A quantidade de dígitos deve ser um número inteiro entre 1 e 6.");
      const { error } = await supabase.from("configuracoes").upsert(
        [
          { chave: "nomenclatura_prefixo", valor: prefixo.trim() },
          { chave: "nomenclatura_digitos", valor: String(d) },
        ],
        { onConflict: "chave" },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.config });
      toast.success("Nomenclatura salva.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criarCategoria = useMutation({
    mutationFn: async () => {
      const nome = novaCategoria.trim();
      if (!nome) throw new Error("Informe o nome da categoria.");
      if (categorias.some((c) => c.nome.toLowerCase() === nome.toLowerCase()))
        throw new Error("Já existe uma categoria com este nome.");
      const { error } = await supabase.from("categorias_cabo").insert({ nome });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.categorias });
      setNovaCategoria("");
      toast.success("Categoria adicionada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirCategoria = useMutation({
    mutationFn: async (c: { id: string; nome: string }) => {
      if (pontos.some((p) => p.categoria_cabo === c.nome))
        throw new Error("Existem pontos usando esta categoria.");
      const { error } = await supabase.from("categorias_cabo").delete().eq("id", c.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.categorias });
      toast.success("Categoria removida.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criarLimite = useMutation({
    mutationFn: async () => {
      if (!novo.categoria_cabo || !novo.parametro)
        throw new Error("Escolha a categoria e o parâmetro.");
      if (novo.valor_minimo.trim() === "" && novo.valor_maximo.trim() === "")
        throw new Error("Informe ao menos um valor: mínimo ou máximo.");
      for (const v of [novo.valor_minimo, novo.valor_maximo])
        if (v.trim() !== "" && Number.isNaN(Number(v))) throw new Error("Valor numérico inválido.");
      if (
        limites.some(
          (l) => l.categoria_cabo === novo.categoria_cabo && l.parametro === novo.parametro,
        )
      )
        throw new Error("Já existe um limite para esta categoria e parâmetro.");
      const { error } = await supabase.from("limites_norma").insert({
        categoria_cabo: novo.categoria_cabo,
        parametro: novo.parametro,
        valor_minimo: n(novo.valor_minimo),
        valor_maximo: n(novo.valor_maximo),
        unidade: novo.unidade.trim() || null,
        norma: novo.norma.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.limites });
      setNovo({
        categoria_cabo: "",
        parametro: "",
        valor_minimo: "",
        valor_maximo: "",
        unidade: "",
        norma: "",
      });
      toast.success("Limite cadastrado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const atualizarLimite = useMutation({
    mutationFn: async (l: LimiteNorma) => {
      const { error } = await supabase
        .from("limites_norma")
        .update({
          valor_minimo: l.valor_minimo,
          valor_maximo: l.valor_maximo,
          unidade: l.unidade,
          norma: l.norma,
        })
        .eq("id", l.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.limites });
      toast.success("Limite atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const excluirLimite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("limites_norma").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.limites });
      toast.success("Limite removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exemplo = proximaIdentificacao(
    pontos.map((p) => p.identificacao),
    prefixo || "P-",
    Number(digitos) || 3,
  );

  return (
    <>
      <PageHeader
        eyebrow="Ajustes"
        titulo="Configurações"
        descricao="Nomenclatura dos pontos, categorias de cabo e limites da norma usados na validação automática."
      />
      <AvisoDemo />

      <div className="grid gap-8 lg:grid-cols-2">
        <Painel>
          <PainelTitulo titulo="Nomenclatura dos pontos" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Campo rotulo="Prefixo">
              <Input value={prefixo} onChange={(e) => setPrefixo(e.target.value)} maxLength={10} />
            </Campo>
            <Campo rotulo="Quantidade de dígitos">
              <Input
                type="number"
                min={1}
                max={6}
                value={digitos}
                onChange={(e) => setDigitos(e.target.value)}
              />
            </Campo>
            <p className="text-xs text-mist sm:col-span-2">
              Próxima identificação sugerida:{" "}
              <span className="font-mono text-gold">{exemplo}</span>
            </p>
            <div className="sm:col-span-2">
              <Button onClick={() => salvarConfig.mutate()} disabled={salvarConfig.isPending}>
                Salvar nomenclatura
              </Button>
            </div>
          </div>
        </Painel>

        <Painel>
          <PainelTitulo titulo="Categorias de cabo" />
          <div className="flex gap-2 border-b border-line px-5 py-4">
            <Input
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              placeholder="Ex.: Cat6A"
              aria-label="Nova categoria"
            />
            <Button
              variant="secondary"
              onClick={() => criarCategoria.mutate()}
              disabled={criarCategoria.isPending}
            >
              <Plus className="size-4" /> Adicionar
            </Button>
          </div>
          {categorias.length === 0 ? (
            <Vazio mensagem="Nenhuma categoria cadastrada." />
          ) : (
            <ul className="divide-y divide-line/60">
              {categorias.map((c) => (
                <li key={c.id} className="flex items-center justify-between px-5 py-3">
                  <span className="font-mono text-sm text-foreground">{c.nome}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remover a categoria ${c.nome}?`)) excluirCategoria.mutate(c);
                    }}
                  >
                    <Trash2 className="size-4 text-fail" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <Painel className="overflow-hidden">
        <PainelTitulo titulo="Limites da norma" />
        <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-3 xl:grid-cols-7">
          <Selecao
            valor={novo.categoria_cabo}
            aoMudar={(v) => setNovo({ ...novo, categoria_cabo: v })}
            opcoes={categorias.map((c) => ({ valor: c.nome, rotulo: c.nome }))}
            placeholder="Categoria"
          />
          <Selecao
            valor={novo.parametro}
            aoMudar={(v) => setNovo({ ...novo, parametro: v })}
            opcoes={PARAMETROS_NUMERICOS.map((p) => ({ valor: p, rotulo: ROTULOS_PARAMETRO[p] }))}
            placeholder="Parâmetro"
          />
          <Input
            value={novo.valor_minimo}
            onChange={(e) => setNovo({ ...novo, valor_minimo: e.target.value })}
            placeholder="Mínimo"
            aria-label="Valor mínimo"
          />
          <Input
            value={novo.valor_maximo}
            onChange={(e) => setNovo({ ...novo, valor_maximo: e.target.value })}
            placeholder="Máximo"
            aria-label="Valor máximo"
          />
          <Input
            value={novo.unidade}
            onChange={(e) => setNovo({ ...novo, unidade: e.target.value })}
            placeholder="Unidade"
            aria-label="Unidade"
          />
          <Input
            value={novo.norma}
            onChange={(e) => setNovo({ ...novo, norma: e.target.value })}
            placeholder="Norma"
            aria-label="Norma"
          />
          <Button onClick={() => criarLimite.mutate()} disabled={criarLimite.isPending}>
            <Plus className="size-4" /> Incluir
          </Button>
        </div>
        {limites.length === 0 ? (
          <Vazio mensagem="Nenhum limite cadastrado — sem limites o sistema não consegue validar os testes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Parâmetro</th>
                  <th className="px-5 py-3 font-medium">Mínimo</th>
                  <th className="px-5 py-3 font-medium">Máximo</th>
                  <th className="px-5 py-3 font-medium">Unidade</th>
                  <th className="px-5 py-3 font-medium">Norma</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {limites.map((l) => (
                  <LinhaLimite
                    key={l.id}
                    limite={l}
                    salvando={atualizarLimite.isPending}
                    aoSalvar={(v) => atualizarLimite.mutate(v)}
                    aoExcluir={() => {
                      if (confirm("Remover este limite?")) excluirLimite.mutate(l.id);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

    </>
  );
}

function LinhaLimite({
  limite,
  salvando,
  aoSalvar,
  aoExcluir,
}: {
  limite: LimiteNorma;
  salvando: boolean;
  aoSalvar: (l: LimiteNorma) => void;
  aoExcluir: () => void;
}) {
  const [min, setMin] = useState(limite.valor_minimo?.toString() ?? "");
  const [max, setMax] = useState(limite.valor_maximo?.toString() ?? "");
  const [unidade, setUnidade] = useState(limite.unidade ?? "");
  const [norma, setNorma] = useState(limite.norma ?? "");

  const alterado =
    min !== (limite.valor_minimo?.toString() ?? "") ||
    max !== (limite.valor_maximo?.toString() ?? "") ||
    unidade !== (limite.unidade ?? "") ||
    norma !== (limite.norma ?? "");

  return (
    <tr className="border-b border-line/60">
      <td className="px-5 py-2.5 font-mono text-gold">{limite.categoria_cabo}</td>
      <td className="px-5 py-2.5 text-foreground/85">
        {ROTULOS_PARAMETRO[limite.parametro as keyof typeof ROTULOS_PARAMETRO] ?? limite.parametro}
      </td>
      <td className="px-5 py-2.5">
        <Input value={min} onChange={(e) => setMin(e.target.value)} className="h-8 w-24" />
      </td>
      <td className="px-5 py-2.5">
        <Input value={max} onChange={(e) => setMax(e.target.value)} className="h-8 w-24" />
      </td>
      <td className="px-5 py-2.5">
        <Input value={unidade} onChange={(e) => setUnidade(e.target.value)} className="h-8 w-20" />
      </td>
      <td className="px-5 py-2.5">
        <Input value={norma} onChange={(e) => setNorma(e.target.value)} className="h-8 w-44" />
      </td>
      <td className="px-5 py-2.5 text-right">
        <Button
          variant="ghost"
          size="sm"
          disabled={!alterado || salvando}
          onClick={() =>
            aoSalvar({
              ...limite,
              valor_minimo: n(min),
              valor_maximo: n(max),
              unidade: unidade.trim() || null,
              norma: norma.trim() || null,
            })
          }
        >
          Salvar
        </Button>
        <Button variant="ghost" size="sm" onClick={aoExcluir}>
          <Trash2 className="size-4 text-fail" />
        </Button>
      </td>
    </tr>
  );
}

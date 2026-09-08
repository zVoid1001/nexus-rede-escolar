import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  chaves,
  useCategorias,
  usePatchPanels,
  usePontos,
  useSwitches,
  useConfiguracoes,
  useTestes,
} from "@/lib/dados";
import { proximaIdentificacao } from "@/lib/certificacao";
import type { PontoRede } from "@/lib/tipos";
import { Campo, PageHeader, Painel, Selecao, StatusBadge, Vazio } from "@/components/ui-sistema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventário de pontos de rede — NEXUS" },
      {
        name: "description",
        content:
          "Cadastre, edite e exclua pontos de rede relacionando patch panel, porta, switch, porta do switch e categoria do cabo.",
      },
      { property: "og:title", content: "Inventário de pontos de rede — NEXUS" },
      {
        property: "og:description",
        content: "Relacionamento ponto → patch panel/porta → switch/porta → categoria do cabo.",
      },
    ],
  }),
  component: Inventario,
});

type Formulario = {
  identificacao: string;
  localizacao: string;
  patch_panel_id: string;
  porta_patch_panel: string;
  switch_id: string;
  porta_switch: string;
  categoria_cabo: string;
  observacoes: string;
};

const VAZIO: Formulario = {
  identificacao: "",
  localizacao: "",
  patch_panel_id: "",
  porta_patch_panel: "",
  switch_id: "",
  porta_switch: "",
  categoria_cabo: "",
  observacoes: "",
};

function Inventario() {
  const qc = useQueryClient();
  const { data: pontos = [], isLoading } = usePontos();
  const { data: patchPanels = [] } = usePatchPanels();
  const { data: switches = [] } = useSwitches();
  const { data: categorias = [] } = useCategorias();
  const { data: config } = useConfiguracoes();
  const { data: testes = [] } = useTestes();

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<PontoRede | null>(null);
  const [form, setForm] = useState<Formulario>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [excluir, setExcluir] = useState<PontoRede | null>(null);

  const nomePP = (id: string | null) =>
    patchPanels.find((p) => p.id === id)?.identificacao ?? "—";
  const nomeSW = (id: string | null) => switches.find((s) => s.id === id)?.identificacao ?? "—";
  const ultimoTeste = (id: string) => testes.find((t) => t.ponto_rede_id === id);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return pontos.filter((p) => {
      if (filtroCategoria && p.categoria_cabo !== filtroCategoria) return false;
      if (!termo) return true;
      return [
        p.identificacao,
        p.localizacao ?? "",
        nomePP(p.patch_panel_id),
        nomeSW(p.switch_id),
        p.categoria_cabo,
      ]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pontos, busca, filtroCategoria, patchPanels, switches]);

  function abrirNovo() {
    setEditando(null);
    setErros({});
    setForm({
      ...VAZIO,
      identificacao: proximaIdentificacao(
        pontos.map((p) => p.identificacao),
        config?.prefixo ?? "P-",
        config?.digitos ?? 3,
      ),
      categoria_cabo: categorias[0]?.nome ?? "Cat6",
    });
    setAberto(true);
  }

  function abrirEdicao(p: PontoRede) {
    setEditando(p);
    setErros({});
    setForm({
      identificacao: p.identificacao,
      localizacao: p.localizacao ?? "",
      patch_panel_id: p.patch_panel_id ?? "",
      porta_patch_panel: p.porta_patch_panel?.toString() ?? "",
      switch_id: p.switch_id ?? "",
      porta_switch: p.porta_switch?.toString() ?? "",
      categoria_cabo: p.categoria_cabo,
      observacoes: p.observacoes ?? "",
    });
    setAberto(true);
  }

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!form.identificacao.trim()) e["identificacao"] = "Informe a identificação do ponto.";
    if (
      pontos.some(
        (p) =>
          p.identificacao.toLowerCase() === form.identificacao.trim().toLowerCase() &&
          p.id !== editando?.id,
      )
    )
      e["identificacao"] = "Já existe um ponto com esta identificação.";
    if (!form.categoria_cabo) e["categoria_cabo"] = "Selecione a categoria do cabo.";

    const pp = patchPanels.find((x) => x.id === form.patch_panel_id);
    if (form.porta_patch_panel) {
      const n = Number(form.porta_patch_panel);
      if (!Number.isInteger(n) || n < 1) e["porta_patch_panel"] = "Porta inválida.";
      else if (pp && n > pp.numero_portas)
        e["porta_patch_panel"] = `O patch panel ${pp.identificacao} tem apenas ${pp.numero_portas} portas.`;
      else if (
        pontos.some(
          (p) =>
            p.patch_panel_id === form.patch_panel_id &&
            p.porta_patch_panel === n &&
            p.id !== editando?.id,
        )
      )
        e["porta_patch_panel"] = "Esta porta do patch panel já está em uso.";
    }
    if (form.porta_patch_panel && !form.patch_panel_id)
      e["patch_panel_id"] = "Selecione o patch panel da porta informada.";

    const sw = switches.find((x) => x.id === form.switch_id);
    if (form.porta_switch) {
      const n = Number(form.porta_switch);
      if (!Number.isInteger(n) || n < 1) e["porta_switch"] = "Porta inválida.";
      else if (sw && n > sw.numero_portas)
        e["porta_switch"] = `O switch ${sw.identificacao} tem apenas ${sw.numero_portas} portas.`;
      else if (
        pontos.some(
          (p) => p.switch_id === form.switch_id && p.porta_switch === n && p.id !== editando?.id,
        )
      )
        e["porta_switch"] = "Esta porta do switch já está em uso.";
    }
    if (form.porta_switch && !form.switch_id)
      e["switch_id"] = "Selecione o switch da porta informada.";

    setErros(e);
    return Object.keys(e).length === 0;
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        identificacao: form.identificacao.trim(),
        localizacao: form.localizacao.trim() || null,
        patch_panel_id: form.patch_panel_id || null,
        porta_patch_panel: form.porta_patch_panel ? Number(form.porta_patch_panel) : null,
        switch_id: form.switch_id || null,
        porta_switch: form.porta_switch ? Number(form.porta_switch) : null,
        categoria_cabo: form.categoria_cabo,
        observacoes: form.observacoes.trim() || null,
      };
      if (editando) {
        const { error } = await supabase
          .from("pontos_rede")
          .update(payload)
          .eq("id", editando.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("pontos_rede").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.pontos });
      toast.success(editando ? "Ponto atualizado." : "Ponto cadastrado.");
      setAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pontos_rede").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.pontos });
      qc.invalidateQueries({ queryKey: chaves.testes });
      toast.success("Ponto excluído.");
      setExcluir(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Inventário"
        titulo="Pontos de rede"
        descricao="Ponto → patch panel/porta → switch/porta → categoria do cabo."
        acoes={
          <Button onClick={abrirNovo} className="rounded-full">
            + Novo ponto
          </Button>
        }
      />

      <Painel className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar por ponto, localização, patch panel, switch ou categoria…"
              className="pl-9"
              aria-label="Pesquisar pontos de rede"
            />
          </div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            aria-label="Filtrar por categoria do cabo"
            className="h-9 rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground"
          >
            <option value="">Todas as categorias</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Vazio mensagem="Carregando…" />
        ) : filtrados.length === 0 ? (
          <Vazio mensagem="Nenhum ponto de rede encontrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                  <th className="px-5 py-3 font-medium">Ponto</th>
                  <th className="px-5 py-3 font-medium">Localização</th>
                  <th className="px-5 py-3 font-medium">Patch panel / porta</th>
                  <th className="px-5 py-3 font-medium">Switch / porta</th>
                  <th className="px-5 py-3 font-medium">Cabo</th>
                  <th className="px-5 py-3 font-medium">Último teste</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {filtrados.map((p) => {
                  const teste = ultimoTeste(p.id);
                  return (
                    <tr key={p.id} className="border-b border-line/60 hover:bg-foreground/[0.02]">
                      <td className="px-5 py-3.5 text-gold">{p.identificacao}</td>
                      <td className="px-5 py-3.5 font-sans text-foreground/80">
                        {p.localizacao ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/80">
                        {nomePP(p.patch_panel_id)} / {p.porta_patch_panel ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/80">
                        {nomeSW(p.switch_id)} / {p.porta_switch ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/80">{p.categoria_cabo}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={teste ? teste.resultado : "PENDENTE"} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${p.identificacao}`}
                            onClick={() => abrirEdicao(p)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Excluir ${p.identificacao}`}
                            onClick={() => setExcluir(p)}
                          >
                            <Trash2 className="size-4 text-fail" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editando ? "Editar ponto de rede" : "Novo ponto de rede"}
            </DialogTitle>
            <DialogDescription>
              A identificação é gerada automaticamente conforme a nomenclatura definida em
              Configurações.
            </DialogDescription>
          </DialogHeader>

          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (validar()) salvar.mutate();
            }}
          >
            <Campo rotulo="Identificação *" erro={erros["identificacao"]}>
              <Input
                value={form.identificacao}
                onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
                maxLength={30}
              />
            </Campo>
            <Campo rotulo="Localização">
              <Input
                value={form.localizacao}
                onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                maxLength={120}
              />
            </Campo>

            <Campo rotulo="Patch panel" erro={erros["patch_panel_id"]}>
              <Selecao
                valor={form.patch_panel_id}
                aoMudar={(v) => setForm({ ...form, patch_panel_id: v })}
                opcoes={patchPanels.map((p) => ({ valor: p.id, rotulo: p.identificacao }))}
                placeholder="Nenhum"
              />
            </Campo>
            <Campo rotulo="Porta do patch panel" erro={erros["porta_patch_panel"]}>
              <Input
                type="number"
                min={1}
                value={form.porta_patch_panel}
                onChange={(e) => setForm({ ...form, porta_patch_panel: e.target.value })}
              />
            </Campo>

            <Campo rotulo="Switch" erro={erros["switch_id"]}>
              <Selecao
                valor={form.switch_id}
                aoMudar={(v) => setForm({ ...form, switch_id: v })}
                opcoes={switches.map((s) => ({ valor: s.id, rotulo: s.identificacao }))}
                placeholder="Nenhum"
              />
            </Campo>
            <Campo rotulo="Porta do switch" erro={erros["porta_switch"]}>
              <Input
                type="number"
                min={1}
                value={form.porta_switch}
                onChange={(e) => setForm({ ...form, porta_switch: e.target.value })}
              />
            </Campo>

            <Campo rotulo="Categoria do cabo *" erro={erros["categoria_cabo"]}>
              <Selecao
                valor={form.categoria_cabo}
                aoMudar={(v) => setForm({ ...form, categoria_cabo: v })}
                opcoes={categorias.map((c) => ({ valor: c.nome, rotulo: c.nome }))}
                placeholder="Selecione"
              />
            </Campo>

            <div className="sm:col-span-2">
              <Campo rotulo="Observações">
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  maxLength={500}
                  rows={3}
                />
              </Campo>
            </div>

            <DialogFooter className="sm:col-span-2">
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {excluir?.identificacao}?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os testes de certificação registrados para este ponto também serão excluídos.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => excluir && remover.mutate(excluir.id)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


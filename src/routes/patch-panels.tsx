import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chaves, usePatchPanels, usePontos } from "@/lib/dados";
import type { PatchPanel } from "@/lib/tipos";
import { Campo, PageHeader, Painel, Vazio } from "@/components/ui-sistema";
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
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/patch-panels")({
  head: () => ({
    meta: [
      { title: "Patch panels — NEXUS" },
      {
        name: "description",
        content:
          "Cadastro de patch panels com identificação, número, quantidade de portas, localização e ocupação das portas.",
      },
      { property: "og:title", content: "Patch panels — NEXUS" },
      {
        property: "og:description",
        content: "Cadastre patch panels e acompanhe a ocupação de cada porta.",
      },
    ],
  }),
  component: PatchPanels,
});

type Form = {
  identificacao: string;
  numero: string;
  numero_portas: string;
  localizacao: string;
  observacoes: string;
};

const VAZIO: Form = {
  identificacao: "",
  numero: "",
  numero_portas: "24",
  localizacao: "",
  observacoes: "",
};

function PatchPanels() {
  const qc = useQueryClient();
  const { data: paineis = [], isLoading } = usePatchPanels();
  const { data: pontos = [] } = usePontos();

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<PatchPanel | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [excluir, setExcluir] = useState<PatchPanel | null>(null);
  const [detalhe, setDetalhe] = useState<PatchPanel | null>(null);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return paineis;
    return paineis.filter((p) =>
      [p.identificacao, p.numero ?? "", p.localizacao ?? ""].join(" ").toLowerCase().includes(t),
    );
  }, [paineis, busca]);

  const ocupadas = (id: string) => pontos.filter((p) => p.patch_panel_id === id).length;

  function abrirNovo() {
    setEditando(null);
    setErros({});
    setForm(VAZIO);
    setAberto(true);
  }

  function abrirEdicao(p: PatchPanel) {
    setEditando(p);
    setErros({});
    setForm({
      identificacao: p.identificacao,
      numero: p.numero ?? "",
      numero_portas: String(p.numero_portas),
      localizacao: p.localizacao ?? "",
      observacoes: p.observacoes ?? "",
    });
    setAberto(true);
  }

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!form.identificacao.trim()) e["identificacao"] = "Informe a identificação.";
    else if (
      paineis.some(
        (p) =>
          p.identificacao.toLowerCase() === form.identificacao.trim().toLowerCase() &&
          p.id !== editando?.id,
      )
    )
      e["identificacao"] = "Já existe um patch panel com esta identificação.";

    const n = Number(form.numero_portas);
    if (!Number.isInteger(n) || n < 1 || n > 96)
      e["numero_portas"] = "Informe um número de portas entre 1 e 96.";
    else if (editando) {
      const maior = Math.max(
        0,
        ...pontos
          .filter((p) => p.patch_panel_id === editando.id)
          .map((p) => p.porta_patch_panel ?? 0),
      );
      if (n < maior) e["numero_portas"] = `Há um ponto usando a porta ${maior}.`;
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const payload = {
        identificacao: form.identificacao.trim(),
        numero: form.numero.trim() || null,
        numero_portas: Number(form.numero_portas),
        localizacao: form.localizacao.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };
      const { error } = editando
        ? await supabase.from("patch_panels").update(payload).eq("id", editando.id)
        : await supabase.from("patch_panels").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.patchPanels });
      toast.success(editando ? "Patch panel atualizado." : "Patch panel cadastrado.");
      setAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("patch_panels").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.patchPanels });
      qc.invalidateQueries({ queryKey: chaves.pontos });
      toast.success("Patch panel excluído.");
      setExcluir(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Infraestrutura"
        titulo="Patch panels"
        descricao="Cadastre os patch panels e acompanhe a ocupação das portas."
        acoes={
          <Button onClick={abrirNovo} className="rounded-full">
            + Novo patch panel
          </Button>
        }
      />

      <Painel className="overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar patch panel…"
              className="pl-9"
              aria-label="Pesquisar patch panels"
            />
          </div>
        </div>

        {isLoading ? (
          <Vazio mensagem="Carregando…" />
        ) : filtrados.length === 0 ? (
          <Vazio mensagem="Nenhum patch panel cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                  <th className="px-5 py-3 font-medium">Identificação</th>
                  <th className="px-5 py-3 font-medium">Número</th>
                  <th className="px-5 py-3 font-medium">Portas</th>
                  <th className="px-5 py-3 font-medium">Ocupação</th>
                  <th className="px-5 py-3 font-medium">Localização</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-b border-line/60 hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3.5 text-gold">{p.identificacao}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{p.numero ?? "—"}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{p.numero_portas}</td>
                    <td className="px-5 py-3.5 text-foreground/80">
                      {ocupadas(p.id)} / {p.numero_portas}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-foreground/80">
                      {p.localizacao ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetalhe(p)}>
                          Portas
                        </Button>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {editando ? "Editar patch panel" : "Novo patch panel"}
            </DialogTitle>
            <DialogDescription>Dados do patch panel instalado no rack.</DialogDescription>
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
            <Campo rotulo="Número">
              <Input
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                maxLength={20}
              />
            </Campo>
            <Campo rotulo="Quantidade de portas *" erro={erros["numero_portas"]}>
              <Input
                type="number"
                min={1}
                max={96}
                value={form.numero_portas}
                onChange={(e) => setForm({ ...form, numero_portas: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Localização">
              <Input
                value={form.localizacao}
                onChange={(e) => setForm({ ...form, localizacao: e.target.value })}
                maxLength={120}
              />
            </Campo>
            <div className="sm:col-span-2">
              <Campo rotulo="Observações">
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  rows={3}
                  maxLength={500}
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

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Portas de {detalhe?.identificacao}
            </DialogTitle>
            <DialogDescription>
              Portas ocupadas mostram o ponto de rede relacionado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: detalhe?.numero_portas ?? 0 }, (_, i) => i + 1).map((porta) => {
              const ponto = pontos.find(
                (p) => p.patch_panel_id === detalhe?.id && p.porta_patch_panel === porta,
              );
              return (
                <div
                  key={porta}
                  className={
                    ponto
                      ? "rounded-md border border-gold/30 bg-gold/10 p-2 text-center"
                      : "rounded-md border border-line bg-panel-2/40 p-2 text-center"
                  }
                >
                  <p className="font-mono text-xs text-mist">{String(porta).padStart(2, "0")}</p>
                  <p className="mt-1 truncate font-mono text-[11px] text-foreground">
                    {ponto?.identificacao ?? "livre"}
                  </p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {excluir?.identificacao}?</AlertDialogTitle>
            <AlertDialogDescription>
              Os pontos de rede ligados a este patch panel ficarão sem patch panel. Esta ação não
              pode ser desfeita.
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

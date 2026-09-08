import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chaves, usePontos, useSwitches } from "@/lib/dados";
import type { Switch } from "@/lib/tipos";
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

export const Route = createFileRoute("/switches")({
  head: () => ({
    meta: [
      { title: "Switches — NEXUS" },
      {
        name: "description",
        content:
          "Cadastro de switches com identificação, modelo, número, quantidade de portas e ocupação por ponto de rede.",
      },
      { property: "og:title", content: "Switches — NEXUS" },
      {
        property: "og:description",
        content: "Cadastre switches e veja quais pontos ocupam cada porta.",
      },
    ],
  }),
  component: Switches,
});

type Form = {
  identificacao: string;
  modelo: string;
  numero: string;
  numero_portas: string;
  localizacao: string;
  observacoes: string;
};

const VAZIO: Form = {
  identificacao: "",
  modelo: "",
  numero: "",
  numero_portas: "24",
  localizacao: "",
  observacoes: "",
};

function Switches() {
  const qc = useQueryClient();
  const { data: switches = [], isLoading } = useSwitches();
  const { data: pontos = [] } = usePontos();

  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [editando, setEditando] = useState<Switch | null>(null);
  const [form, setForm] = useState<Form>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [excluir, setExcluir] = useState<Switch | null>(null);
  const [detalhe, setDetalhe] = useState<Switch | null>(null);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return switches;
    return switches.filter((s) =>
      [s.identificacao, s.modelo ?? "", s.numero ?? "", s.localizacao ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(t),
    );
  }, [switches, busca]);

  const ocupadas = (id: string) => pontos.filter((p) => p.switch_id === id).length;

  function abrirNovo() {
    setEditando(null);
    setErros({});
    setForm(VAZIO);
    setAberto(true);
  }

  function abrirEdicao(s: Switch) {
    setEditando(s);
    setErros({});
    setForm({
      identificacao: s.identificacao,
      modelo: s.modelo ?? "",
      numero: s.numero ?? "",
      numero_portas: String(s.numero_portas),
      localizacao: s.localizacao ?? "",
      observacoes: s.observacoes ?? "",
    });
    setAberto(true);
  }

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!form.identificacao.trim()) e["identificacao"] = "Informe a identificação.";
    else if (
      switches.some(
        (s) =>
          s.identificacao.toLowerCase() === form.identificacao.trim().toLowerCase() &&
          s.id !== editando?.id,
      )
    )
      e["identificacao"] = "Já existe um switch com esta identificação.";

    const n = Number(form.numero_portas);
    if (!Number.isInteger(n) || n < 1 || n > 96)
      e["numero_portas"] = "Informe um número de portas entre 1 e 96.";
    else if (editando) {
      const maior = Math.max(
        0,
        ...pontos.filter((p) => p.switch_id === editando.id).map((p) => p.porta_switch ?? 0),
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
        modelo: form.modelo.trim() || null,
        numero: form.numero.trim() || null,
        numero_portas: Number(form.numero_portas),
        localizacao: form.localizacao.trim() || null,
        observacoes: form.observacoes.trim() || null,
      };
      const { error } = editando
        ? await supabase.from("switches").update(payload).eq("id", editando.id)
        : await supabase.from("switches").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.switches });
      toast.success(editando ? "Switch atualizado." : "Switch cadastrado.");
      setAberto(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("switches").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.switches });
      qc.invalidateQueries({ queryKey: chaves.pontos });
      toast.success("Switch excluído.");
      setExcluir(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        eyebrow="Infraestrutura"
        titulo="Switches"
        descricao="Cadastre os switches e relacione cada ponto a uma porta específica."
        acoes={
          <Button onClick={abrirNovo} className="rounded-full">
            + Novo switch
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
              placeholder="Pesquisar switch…"
              className="pl-9"
              aria-label="Pesquisar switches"
            />
          </div>
        </div>

        {isLoading ? (
          <Vazio mensagem="Carregando…" />
        ) : filtrados.length === 0 ? (
          <Vazio mensagem="Nenhum switch cadastrado." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                  <th className="px-5 py-3 font-medium">Identificação</th>
                  <th className="px-5 py-3 font-medium">Modelo</th>
                  <th className="px-5 py-3 font-medium">Número</th>
                  <th className="px-5 py-3 font-medium">Portas</th>
                  <th className="px-5 py-3 font-medium">Ocupação</th>
                  <th className="px-5 py-3 font-medium">Localização</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {filtrados.map((s) => (
                  <tr key={s.id} className="border-b border-line/60 hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3.5 text-gold">{s.identificacao}</td>
                    <td className="px-5 py-3.5 font-sans text-foreground/80">{s.modelo ?? "—"}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{s.numero ?? "—"}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{s.numero_portas}</td>
                    <td className="px-5 py-3.5 text-foreground/80">
                      {ocupadas(s.id)} / {s.numero_portas}
                    </td>
                    <td className="px-5 py-3.5 font-sans text-foreground/80">
                      {s.localizacao ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setDetalhe(s)}>
                          Portas
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Editar ${s.identificacao}`}
                          onClick={() => abrirEdicao(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Excluir ${s.identificacao}`}
                          onClick={() => setExcluir(s)}
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
              {editando ? "Editar switch" : "Novo switch"}
            </DialogTitle>
            <DialogDescription>Dados do switch instalado no rack.</DialogDescription>
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
            <Campo rotulo="Modelo">
              <Input
                value={form.modelo}
                onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                maxLength={60}
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
            <DialogDescription>Portas ocupadas mostram o ponto de rede ligado.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {Array.from({ length: detalhe?.numero_portas ?? 0 }, (_, i) => i + 1).map((porta) => {
              const ponto = pontos.find(
                (p) => p.switch_id === detalhe?.id && p.porta_switch === porta,
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
              Os pontos de rede ligados a este switch ficarão sem switch. Esta ação não pode ser
              desfeita.
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

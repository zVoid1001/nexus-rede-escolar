import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { chaves, useLimites, usePontos, useTestes } from "@/lib/dados";
import { avaliarTeste, formatarData, type Avaliacao, type MedicoesTeste } from "@/lib/certificacao";
import {
  Campo,
  PageHeader,
  Painel,
  PainelTitulo,
  Selecao,
  StatusBadge,
  Vazio,
} from "@/components/ui-sistema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/certificacao")({
  head: () => ({
    meta: [
      { title: "Certificação de cabos — NEXUS" },
      {
        name: "description",
        content:
          "Registre testes de certificação e obtenha PASS ou FAIL calculado automaticamente a partir dos limites da norma cadastrados.",
      },
      { property: "og:title", content: "Certificação de cabos — NEXUS" },
      {
        property: "og:description",
        content: "Wire Map, NEXT, Return Loss, perda de inserção e resistência validados automaticamente.",
      },
    ],
  }),
  component: Certificacao,
});

type Form = {
  ponto_rede_id: string;
  data_teste: string;
  comprimento: string;
  wire_map: boolean;
  resistencia: string;
  next: string;
  return_loss: string;
  perda_insercao: string;
  observacoes: string;
};

const hoje = () => new Date().toISOString().slice(0, 10);

const VAZIO: Form = {
  ponto_rede_id: "",
  data_teste: hoje(),
  comprimento: "",
  wire_map: true,
  resistencia: "",
  next: "",
  return_loss: "",
  perda_insercao: "",
  observacoes: "",
};

const num = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function Certificacao() {
  const qc = useQueryClient();
  const { data: pontos = [] } = usePontos();
  const { data: limites = [] } = useLimites();
  const { data: testes = [] } = useTestes();

  const [form, setForm] = useState<Form>(VAZIO);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{ avaliacao: Avaliacao; ponto: string; categoria: string; data: string } | null>(null);

  const ponto = pontos.find((p) => p.id === form.ponto_rede_id);
  const categoria = ponto?.categoria_cabo ?? "";
  const limitesCategoria = useMemo(
    () => limites.filter((l) => l.categoria_cabo === categoria),
    [limites, categoria],
  );
  const normas = Array.from(new Set(limitesCategoria.map((l) => l.norma).filter(Boolean)));

  const medicoes = (): MedicoesTeste => ({
    wire_map: form.wire_map,
    comprimento: num(form.comprimento),
    resistencia: num(form.resistencia),
    next: num(form.next),
    return_loss: num(form.return_loss),
    perda_insercao: num(form.perda_insercao),
  });

  const previa = form.ponto_rede_id ? avaliarTeste(medicoes(), limitesCategoria) : null;

  function validar(): boolean {
    const e: Record<string, string> = {};
    if (!form.ponto_rede_id) e["ponto_rede_id"] = "Selecione o ponto de rede.";
    if (!form.data_teste) e["data_teste"] = "Informe a data do teste.";
    for (const campo of ["comprimento", "resistencia", "next", "return_loss", "perda_insercao"] as const) {
      const v = form[campo];
      if (v.trim() !== "" && Number.isNaN(Number(v))) e[campo] = "Valor numérico inválido.";
      else if (campo === "comprimento" && v.trim() !== "" && Number(v) <= 0)
        e[campo] = "O comprimento deve ser maior que zero.";
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const avaliacao = avaliarTeste(medicoes(), limitesCategoria);
      const { error } = await supabase.from("testes_certificacao").insert({
        ponto_rede_id: form.ponto_rede_id,
        categoria_cabo: categoria,
        data_teste: form.data_teste,
        comprimento: num(form.comprimento),
        wire_map: form.wire_map,
        resistencia: num(form.resistencia),
        next: num(form.next),
        return_loss: num(form.return_loss),
        perda_insercao: num(form.perda_insercao),
        resultado: avaliacao.resultado,
        falhas: avaliacao.falhas,
        observacoes: form.observacoes.trim() || null,
      });
      if (error) throw new Error(error.message);
      return avaliacao;
    },
    onSuccess: (avaliacao) => {
      qc.invalidateQueries({ queryKey: chaves.testes });
      setResultado({
        avaliacao,
        ponto: ponto?.identificacao ?? "",
        categoria,
        data: form.data_teste,
      });
      toast.success(`Teste registrado: ${avaliacao.resultado}.`);
      setForm({ ...VAZIO, data_teste: form.data_teste });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const recentes = testes.slice(0, 5);

  return (
    <>
      <PageHeader
        eyebrow="Ensaios"
        titulo="Certificação"
        descricao="O sistema compara cada medição com os limites cadastrados e calcula PASS ou FAIL automaticamente."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Painel>
          <PainelTitulo titulo="Novo teste" />
          <form
            className="grid gap-4 p-5 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (validar()) salvar.mutate();
            }}
          >
            <Campo rotulo="Ponto de rede *" erro={erros["ponto_rede_id"]}>
              <Selecao
                valor={form.ponto_rede_id}
                aoMudar={(v) => setForm({ ...form, ponto_rede_id: v })}
                opcoes={pontos.map((p) => ({
                  valor: p.id,
                  rotulo: `${p.identificacao} — ${p.categoria_cabo}`,
                }))}
                placeholder="Selecione o ponto"
              />
            </Campo>
            <Campo rotulo="Categoria do cabo">
              <Input value={categoria || "—"} readOnly className="text-mist" />
            </Campo>
            <Campo rotulo="Data do teste *" erro={erros["data_teste"]}>
              <Input
                type="date"
                value={form.data_teste}
                onChange={(e) => setForm({ ...form, data_teste: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Comprimento do cabo (m)" erro={erros["comprimento"]}>
              <Input
                type="number"
                step="0.1"
                value={form.comprimento}
                onChange={(e) => setForm({ ...form, comprimento: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Wire Map">
              <label className="flex h-9 items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.wire_map}
                  onChange={(e) => setForm({ ...form, wire_map: e.target.checked })}
                  className="size-4 accent-[var(--color-gold)]"
                />
                {form.wire_map ? "OK" : "Falha no mapeamento"}
              </label>
            </Campo>
            <Campo rotulo="Resistência (Ω)" erro={erros["resistencia"]}>
              <Input
                type="number"
                step="0.01"
                value={form.resistencia}
                onChange={(e) => setForm({ ...form, resistencia: e.target.value })}
              />
            </Campo>
            <Campo rotulo="NEXT (dB)" erro={erros["next"]}>
              <Input
                type="number"
                step="0.1"
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Return Loss (dB)" erro={erros["return_loss"]}>
              <Input
                type="number"
                step="0.1"
                value={form.return_loss}
                onChange={(e) => setForm({ ...form, return_loss: e.target.value })}
              />
            </Campo>
            <Campo rotulo="Perda de inserção (dB)" erro={erros["perda_insercao"]}>
              <Input
                type="number"
                step="0.1"
                value={form.perda_insercao}
                onChange={(e) => setForm({ ...form, perda_insercao: e.target.value })}
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
            <div className="flex items-center justify-between gap-3 sm:col-span-2">
              <p className="text-xs text-mist">
                Norma utilizada:{" "}
                <span className="font-mono text-foreground">
                  {normas.length ? normas.join(" · ") : "nenhum limite cadastrado"}
                </span>
              </p>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending ? "Validando…" : "Registrar e validar"}
              </Button>
            </div>
          </form>
        </Painel>

        <div className="space-y-8">
          <Painel>
            <PainelTitulo
              titulo={resultado ? "Resultado do teste" : "Prévia da validação"}
              extra={
                (resultado?.avaliacao ?? previa) ? (
                  <StatusBadge status={(resultado?.avaliacao ?? previa)!.resultado} />
                ) : null
              }
            />
            {!resultado && !previa ? (
              <Vazio mensagem="Selecione um ponto de rede para ver a validação automática." />
            ) : (
              <div className="p-5">
                <p className="text-xs text-mist">
                  Ponto{" "}
                  <span className="font-mono text-foreground">
                    {resultado?.ponto ?? ponto?.identificacao ?? "—"}
                  </span>{" "}
                  · Cabo{" "}
                  <span className="font-mono text-foreground">
                    {resultado?.categoria ?? categoria ?? "—"}
                  </span>{" "}
                  · Data{" "}
                  <span className="font-mono text-foreground">
                    {formatarData(resultado?.data ?? form.data_teste)}
                  </span>
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                        <th className="py-2 font-medium">Parâmetro</th>
                        <th className="py-2 font-medium">Medido</th>
                        <th className="py-2 font-medium">Limite</th>
                        <th className="py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-[13px]">
                      {(resultado?.avaliacao ?? previa)!.linhas.map((l) => (
                        <tr
                          key={l.parametro}
                          className={
                            l.status === "FAIL"
                              ? "border-b border-line/60 bg-fail/5"
                              : "border-b border-line/60"
                          }
                        >
                          <td className="py-2.5 font-sans text-foreground/85">{l.rotulo}</td>
                          <td className="py-2.5 text-foreground/80">{l.medido}</td>
                          <td className="py-2.5 text-foreground/80">{l.limite}</td>
                          <td className="py-2.5 text-right">
                            {l.status === "SEM_LIMITE" ? (
                              <span className="text-[11px] text-mist">sem limite</span>
                            ) : (
                              <StatusBadge status={l.status} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-xs text-mist">
                  O resultado é calculado pelo sistema — não é possível escolher PASS ou FAIL
                  manualmente.
                </p>
              </div>
            )}
          </Painel>

          <Painel className="overflow-hidden">
            <PainelTitulo titulo="Últimos testes" />
            {recentes.length === 0 ? (
              <Vazio mensagem="Nenhum teste registrado." />
            ) : (
              <ul className="divide-y divide-line/60">
                {recentes.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <span className="font-mono text-sm text-gold">
                      {pontos.find((p) => p.id === t.ponto_rede_id)?.identificacao ?? "—"}
                    </span>
                    <span className="text-xs text-mist">{formatarData(t.data_teste)}</span>
                    <StatusBadge status={t.resultado} />
                  </li>
                ))}
              </ul>
            )}
          </Painel>
        </div>
      </div>
    </>
  );
}

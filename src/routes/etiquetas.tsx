import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Printer, Tag } from "lucide-react";
import { usePatchPanels, usePontos, useSwitches } from "@/lib/dados";
import type { PontoRede } from "@/lib/tipos";
import { PageHeader, Painel, PainelTitulo, Vazio } from "@/components/ui-sistema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/etiquetas")({
  head: () => ({
    meta: [
      { title: "Gerador de etiquetas — NEXUS" },
      {
        name: "description",
        content:
          "Gere e imprima etiquetas de identificação dos pontos de rede com patch panel, porta, switch e categoria do cabo.",
      },
      { property: "og:title", content: "Gerador de etiquetas — NEXUS" },
      {
        property: "og:description",
        content: "Selecione pontos cadastrados e imprima etiquetas prontas para o rack.",
      },
    ],
  }),
  component: Etiquetas,
});

function Etiquetas() {
  const { data: pontos = [], isLoading } = usePontos();
  const { data: patchPanels = [] } = usePatchPanels();
  const { data: switches = [] } = useSwitches();

  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [geradas, setGeradas] = useState<PontoRede[]>([]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return pontos;
    return pontos.filter((p) =>
      [p.identificacao, p.localizacao ?? "", p.categoria_cabo].join(" ").toLowerCase().includes(t),
    );
  }, [pontos, busca]);

  const nomePP = (id: string | null) =>
    patchPanels.find((p) => p.id === id)?.identificacao ?? "—";
  const nomeSW = (id: string | null) => switches.find((s) => s.id === id)?.identificacao ?? "—";

  function alternar(id: string) {
    setSelecionados((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  return (
    <>
      <div className="no-print space-y-8">
        <PageHeader
          eyebrow="Identificação"
          titulo="Gerador de etiquetas"
          descricao="Selecione um ou vários pontos e gere as etiquetas para impressão."
          acoes={
            <>
              <Button
                className="rounded-full"
                onClick={() => setGeradas(pontos.filter((p) => selecionados.includes(p.id)))}
                disabled={selecionados.length === 0}
              >
                <Tag className="mr-2 size-4" /> Gerar etiqueta
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => window.print()}
                disabled={geradas.length === 0}
              >
                <Printer className="mr-2 size-4" /> Imprimir
              </Button>
            </>
          }
        />

        <Painel className="overflow-hidden">
          <PainelTitulo
            titulo="Pontos de rede"
            extra={
              <div className="flex items-center gap-3">
                <span className="text-xs text-mist">{selecionados.length} selecionado(s)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setSelecionados(
                      selecionados.length === filtrados.length ? [] : filtrados.map((p) => p.id),
                    )
                  }
                >
                  {selecionados.length === filtrados.length ? "Limpar" : "Selecionar todos"}
                </Button>
              </div>
            }
          />
          <div className="border-b border-line px-5 py-4">
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar ponto…"
              aria-label="Pesquisar pontos"
            />
          </div>
          {isLoading ? (
            <Vazio mensagem="Carregando…" />
          ) : filtrados.length === 0 ? (
            <Vazio mensagem="Nenhum ponto de rede encontrado." />
          ) : (
            <ul className="divide-y divide-line/60">
              {filtrados.map((p) => (
                <li key={p.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-foreground/[0.02]">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(p.id)}
                      onChange={() => alternar(p.id)}
                      className="size-4 accent-[var(--color-gold)]"
                    />
                    <span className="font-mono text-sm text-gold">{p.identificacao}</span>
                    <span className="truncate text-xs text-mist">
                      {nomePP(p.patch_panel_id)}/{p.porta_patch_panel ?? "—"} ·{" "}
                      {nomeSW(p.switch_id)}/{p.porta_switch ?? "—"} · {p.categoria_cabo}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      {geradas.length > 0 ? (
        <section className="print-area mt-8 space-y-4">
          <h2 className="no-print font-serif text-xl text-foreground">
            Etiquetas geradas ({geradas.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {geradas.map((p) => (
              <article
                key={p.id}
                className="etiqueta rounded-lg border border-line bg-panel p-4 font-mono"
              >
                <p className="text-[9px] uppercase tracking-[0.22em] text-mist">
                  Identificação do ponto
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-wider text-foreground">
                  {p.identificacao}
                </p>
                <dl className="mt-3 space-y-2 border-t border-line pt-3 text-[11px]">
                  <div>
                    <dt className="uppercase tracking-[0.18em] text-mist">Patch panel</dt>
                    <dd className="text-foreground">
                      {nomePP(p.patch_panel_id)} / Porta{" "}
                      {p.porta_patch_panel ? String(p.porta_patch_panel).padStart(2, "0") : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-[0.18em] text-mist">Switch</dt>
                    <dd className="text-foreground">
                      {nomeSW(p.switch_id)} / Porta{" "}
                      {p.porta_switch ? String(p.porta_switch).padStart(2, "0") : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-[0.18em] text-mist">Cabo</dt>
                    <dd className="text-foreground">{p.categoria_cabo.toUpperCase()}</dd>
                  </div>
                  {p.localizacao ? (
                    <div>
                      <dt className="uppercase tracking-[0.18em] text-mist">Local</dt>
                      <dd className="text-foreground">{p.localizacao}</dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCategorias, useLimites, usePontos, useTestes } from "@/lib/dados";
import {
  ROTULOS_PARAMETRO,
  avaliarTeste,
  formatarData,
  type ParametroChave,
} from "@/lib/certificacao";
import type { TesteCertificacao } from "@/lib/tipos";
import {
  PageHeader,
  Painel,
  PainelTitulo,
  Selecao,
  StatusBadge,
  Vazio,
} from "@/components/ui-sistema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de testes — NEXUS" },
      {
        name: "description",
        content:
          "Consulte todos os testes de certificação realizados com filtros por resultado, categoria, ponto e data.",
      },
      { property: "og:title", content: "Histórico de testes — NEXUS" },
      {
        property: "og:description",
        content: "Todos os ensaios registrados, com o parâmetro que causou a falha quando houver.",
      },
    ],
  }),
  component: Historico,
});

function listaFalhas(t: TesteCertificacao): string[] {
  const f = t.falhas as unknown;
  if (!Array.isArray(f)) return [];
  return f.map((x) => ROTULOS_PARAMETRO[x as ParametroChave] ?? String(x));
}

function Historico() {
  const { data: testes = [], isLoading } = useTestes();
  const { data: pontos = [] } = usePontos();
  const { data: categorias = [] } = useCategorias();
  const { data: limites = [] } = useLimites();

  const [busca, setBusca] = useState("");
  const [resultado, setResultado] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ponto, setPonto] = useState("");
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [detalhe, setDetalhe] = useState<TesteCertificacao | null>(null);

  const nomePonto = (id: string) => pontos.find((p) => p.id === id)?.identificacao ?? "—";

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return testes.filter((t) => {
      if (resultado && t.resultado !== resultado) return false;
      if (categoria && t.categoria_cabo !== categoria) return false;
      if (ponto && t.ponto_rede_id !== ponto) return false;
      const data = t.data_teste.slice(0, 10);
      if (de && data < de) return false;
      if (ate && data > ate) return false;
      if (!termo) return true;
      return [nomePonto(t.ponto_rede_id), t.categoria_cabo, t.resultado, ...listaFalhas(t)]
        .join(" ")
        .toLowerCase()
        .includes(termo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testes, pontos, busca, resultado, categoria, ponto, de, ate]);

  const avaliacaoDetalhe = detalhe
    ? avaliarTeste(
        {
          wire_map: detalhe.wire_map,
          comprimento: detalhe.comprimento,
          resistencia: detalhe.resistencia,
          next: detalhe.next,
          return_loss: detalhe.return_loss,
          perda_insercao: detalhe.perda_insercao,
        },
        limites.filter((l) => l.categoria_cabo === detalhe.categoria_cabo),
      )
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Registros"
        titulo="Histórico de testes"
        descricao="Todos os ensaios registrados, com filtros e pesquisa."
      />

      <Painel className="overflow-hidden">
        <PainelTitulo
          titulo={`${filtrados.length} teste(s)`}
          extra={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBusca("");
                setResultado("");
                setCategoria("");
                setPonto("");
                setDe("");
                setAte("");
              }}
            >
              Limpar filtros
            </Button>
          }
        />
        <div className="grid gap-3 border-b border-line px-5 py-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="relative md:col-span-3 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar…"
              className="pl-9"
              aria-label="Pesquisar testes"
            />
          </div>
          <Selecao
            valor={resultado}
            aoMudar={setResultado}
            opcoes={[
              { valor: "PASS", rotulo: "PASS" },
              { valor: "FAIL", rotulo: "FAIL" },
            ]}
            placeholder="Todos os resultados"
          />
          <Selecao
            valor={categoria}
            aoMudar={setCategoria}
            opcoes={categorias.map((c) => ({ valor: c.nome, rotulo: c.nome }))}
            placeholder="Todas as categorias"
          />
          <Selecao
            valor={ponto}
            aoMudar={setPonto}
            opcoes={pontos.map((p) => ({ valor: p.id, rotulo: p.identificacao }))}
            placeholder="Todos os pontos"
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={de}
              onChange={(e) => setDe(e.target.value)}
              aria-label="Data inicial"
            />
            <Input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              aria-label="Data final"
            />
          </div>
        </div>

        {isLoading ? (
          <Vazio mensagem="Carregando…" />
        ) : filtrados.length === 0 ? (
          <Vazio mensagem="Nenhum teste encontrado com estes filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Ponto</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Falhas</th>
                  <th className="px-5 py-3 font-medium">Resultado</th>
                  <th className="px-5 py-3 text-right font-medium">Detalhes</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {filtrados.map((t) => (
                  <tr key={t.id} className="border-b border-line/60 hover:bg-foreground/[0.02]">
                    <td className="px-5 py-3.5 text-mist">{t.id.slice(0, 8)}</td>
                    <td className="px-5 py-3.5 text-gold">{nomePonto(t.ponto_rede_id)}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{t.categoria_cabo}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{formatarData(t.data_teste)}</td>
                    <td className="px-5 py-3.5 font-sans text-xs text-fail">
                      {listaFalhas(t).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.resultado} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetalhe(t)}>
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              Teste de {detalhe ? nomePonto(detalhe.ponto_rede_id) : ""}
            </DialogTitle>
            <DialogDescription>
              {detalhe
                ? `Cabo ${detalhe.categoria_cabo} · ${formatarData(detalhe.data_teste)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {avaliacaoDetalhe ? (
            <>
              <div className="overflow-x-auto">
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
                    {avaliacaoDetalhe.linhas.map((l) => (
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
              <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel-2/40 px-4 py-3">
                <span className="text-xs text-mist">Resultado registrado</span>
                <StatusBadge status={detalhe!.resultado} />
              </div>
              {detalhe?.observacoes ? (
                <p className="text-xs text-mist">Observações: {detalhe.observacoes}</p>
              ) : null}
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

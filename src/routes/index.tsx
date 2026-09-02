import { createFileRoute, Link } from "@tanstack/react-router";
import {
  KpiCard,
  Painel,
  PainelTitulo,
  PageHeader,
  StatusBadge,
  AvisoDemo,
  Vazio,
} from "@/components/ui-sistema";
import { usePontos, usePatchPanels, useSwitches, useTestes } from "@/lib/dados";
import { formatarData } from "@/lib/certificacao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NEXUS Inventário e Certificação de Rede" },
      {
        name: "description",
        content:
          "Visão geral do inventário de rede: pontos, patch panels, switches e resultados dos testes de certificação PASS/FAIL.",
      },
      { property: "og:title", content: "Dashboard — NEXUS Inventário de Rede" },
      {
        property: "og:description",
        content: "Resumo do inventário de pontos de rede e da certificação de cabos.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: pontos = [] } = usePontos();
  const { data: patchPanels = [] } = usePatchPanels();
  const { data: switches = [] } = useSwitches();
  const { data: testes = [] } = useTestes();

  const totalPass = testes.filter((t) => t.resultado === "PASS").length;
  const totalFail = testes.filter((t) => t.resultado === "FAIL").length;
  const pctPass = testes.length ? (totalPass / testes.length) * 100 : 0;

  const ultimoTeste = (pontoId: string) =>
    testes.find((t) => t.ponto_rede_id === pontoId);

  const nomePP = (id: string | null) =>
    patchPanels.find((p) => p.id === id)?.identificacao ?? "—";
  const nomeSW = (id: string | null) => switches.find((s) => s.id === id)?.identificacao ?? "—";

  const recentes = [...pontos]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        titulo="Infraestrutura de rede"
        descricao="Resumo do inventário e da certificação dos cabos."
        acoes={
          <Link
            to="/inventario"
            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold/90"
          >
            + Novo ponto
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard rotulo="Pontos de rede" valor={pontos.length} />
        <KpiCard
          rotulo="Patch panels"
          valor={patchPanels.length}
          nota={`${patchPanels.reduce((s, p) => s + p.numero_portas, 0)} portas`}
        />
        <KpiCard
          rotulo="Switches"
          valor={switches.length}
          nota={`${switches.reduce((s, p) => s + p.numero_portas, 0)} portas`}
        />
        <KpiCard rotulo="Testes realizados" valor={testes.length} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard rotulo="Testes PASS" valor={totalPass} tom="pass" />
        <KpiCard rotulo="Testes FAIL" valor={totalFail} tom="fail" />
        <Painel className="col-span-2 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.18em] text-mist">
              Status dos testes
            </p>
            <span className="font-mono text-[11px] text-mist">
              {pctPass.toFixed(1).replace(".", ",")}% de aprovação
            </span>
          </div>
          <div className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-line">
            <div className="h-full bg-pass" style={{ width: `${pctPass}%` }} />
            <div className="h-full bg-fail" style={{ width: `${100 - pctPass}%` }} />
          </div>
          <div className="mt-3 flex gap-5 text-xs">
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2 rounded-full bg-pass" />
              PASS {totalPass}
            </span>
            <span className="flex items-center gap-2 text-foreground">
              <span className="size-2 rounded-full bg-fail" />
              FAIL {totalFail}
            </span>
          </div>
        </Painel>
      </div>

      <Painel className="overflow-hidden">
        <PainelTitulo
          titulo="Pontos de rede recentes"
          extra={
            <Link to="/inventario" className="text-xs text-gold hover:underline">
              Ver inventário →
            </Link>
          }
        />
        {recentes.length === 0 ? (
          <Vazio mensagem="Nenhum ponto de rede cadastrado ainda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-[0.16em] text-mist">
                  <th className="px-5 py-3 font-medium">Identificação</th>
                  <th className="px-5 py-3 font-medium">Patch panel</th>
                  <th className="px-5 py-3 font-medium">Porta</th>
                  <th className="px-5 py-3 font-medium">Switch</th>
                  <th className="px-5 py-3 font-medium">Porta switch</th>
                  <th className="px-5 py-3 font-medium">Cabo</th>
                  <th className="px-5 py-3 font-medium">Último teste</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[13px]">
                {recentes.map((p) => {
                  const teste = ultimoTeste(p.id);
                  return (
                    <tr key={p.id} className="border-b border-line/60 hover:bg-foreground/[0.02]">
                      <td className="px-5 py-3.5 text-gold">{p.identificacao}</td>
                      <td className="px-5 py-3.5 text-foreground/80">
                        {nomePP(p.patch_panel_id)}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/80">
                        {p.porta_patch_panel ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-foreground/80">{nomeSW(p.switch_id)}</td>
                      <td className="px-5 py-3.5 text-foreground/80">{p.porta_switch ?? "—"}</td>
                      <td className="px-5 py-3.5 text-foreground/80">{p.categoria_cabo}</td>
                      <td className="px-5 py-3.5">
                        {teste ? (
                          <span className="flex items-center gap-2">
                            <StatusBadge status={teste.resultado} />
                            <span className="text-mist">{formatarData(teste.data_teste)}</span>
                          </span>
                        ) : (
                          <StatusBadge status="PENDENTE" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Painel>

      <AvisoDemo />
    </>
  );
}

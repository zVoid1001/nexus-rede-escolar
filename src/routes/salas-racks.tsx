import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePatchPanels, useSwitches, chaves } from "@/lib/dados";
import { PageHeader, Painel, PainelTitulo, Campo, Selecao, Vazio } from "@/components/ui-sistema";

type Sala = { id: string; nome: string; andar: string | null; observacoes: string | null };
type Rack = { id: string; identificacao: string; sala_id: string | null; altura_u: number; observacoes: string | null };

const db = supabase as any;

export const Route = createFileRoute("/salas-racks")({
  head: () => ({
    meta: [
      { title: "Salas e Racks — NEXUS" },
      { name: "description", content: "Cadastro de salas técnicas e racks da infraestrutura de rede." },
      { property: "og:title", content: "Salas e Racks — NEXUS" },
      { property: "og:description", content: "Cadastro de salas técnicas e racks da infraestrutura de rede." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SalasRacks,
});

const input = "h-9 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground";
const botao = "h-9 rounded-md bg-gold px-4 text-sm font-semibold text-background hover:opacity-90";

function SalasRacks() {
  const qc = useQueryClient();
  const salas = useQuery({
    queryKey: ["salas"],
    queryFn: async () => {
      const { data, error } = await db.from("salas").select("*").order("nome");
      if (error) throw new Error(error.message);
      return data as Sala[];
    },
  });
  const racks = useQuery({
    queryKey: ["racks"],
    queryFn: async () => {
      const { data, error } = await db.from("racks").select("*").order("identificacao");
      if (error) throw new Error(error.message);
      return data as Rack[];
    },
  });
  const { data: pps } = usePatchPanels();
  const { data: sws } = useSwitches();

  const [sala, setSala] = useState({ nome: "", andar: "" });
  const [rack, setRack] = useState({ identificacao: "", sala_id: "", altura_u: "42" });
  const [equip, setEquip] = useState({ item: "", rack_id: "" });

  const atualizar = () => {
    qc.invalidateQueries({ queryKey: ["salas"] });
    qc.invalidateQueries({ queryKey: ["racks"] });
    qc.invalidateQueries({ queryKey: chaves.patchPanels });
    qc.invalidateQueries({ queryKey: chaves.switches });
  };

  async function salvarSala() {
    const nome = sala.nome.trim();
    if (!nome) { toast.error("Informe o nome da sala."); return; }
    if (salas.data?.some((s) => s.nome.toLowerCase() === nome.toLowerCase()))
      { toast.error("Já existe uma sala com esse nome."); return; }
    const { error } = await db.from("salas").insert({ nome, andar: sala.andar.trim() || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Sala cadastrada.");
    setSala({ nome: "", andar: "" });
    atualizar();
  }

  async function salvarRack() {
    const identificacao = rack.identificacao.trim();
    const u = Number(rack.altura_u);
    if (!identificacao) { toast.error("Informe a identificação do rack."); return; }
    if (!Number.isInteger(u) || u < 1 || u > 60) { toast.error("Altura deve ser entre 1 e 60U."); return; }
    if (racks.data?.some((r) => r.identificacao.toLowerCase() === identificacao.toLowerCase()))
      { toast.error("Já existe um rack com essa identificação."); return; }
    const { error } = await db
      .from("racks")
      .insert({ identificacao, sala_id: rack.sala_id || null, altura_u: u });
    if (error) { toast.error(error.message); return; }
    toast.success("Rack cadastrado.");
    setRack({ identificacao: "", sala_id: "", altura_u: "42" });
    atualizar();
  }

  async function vincular() {
    if (!equip.item) { toast.error("Escolha um equipamento."); return; }
    const [tipo, id] = equip.item.split(":");
    const tabela = tipo === "pp" ? "patch_panels" : "switches";
    const { error } = await db.from(tabela).update({ rack_id: equip.rack_id || null }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(equip.rack_id ? "Equipamento instalado no rack." : "Equipamento removido do rack.");
    setEquip({ item: "", rack_id: "" });
    atualizar();
  }

  async function excluir(tabela: "salas" | "racks", id: string, nome: string) {
    if (!confirm(`Excluir "${nome}"? Os itens vinculados ficarão sem ${tabela === "salas" ? "sala" : "rack"}.`)) return;
    const { error } = await db.from(tabela).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Excluído.");
    atualizar();
  }

  const nomeSala = (id: string | null) => salas.data?.find((s) => s.id === id)?.nome ?? "—";
  const equipamentos = [
    ...(pps ?? []).map((p: any) => ({ valor: `pp:${p.id}`, rotulo: `Patch panel ${p.identificacao}`, rack_id: p.rack_id, nome: p.identificacao })),
    ...(sws ?? []).map((s: any) => ({ valor: `sw:${s.id}`, rotulo: `Switch ${s.identificacao}`, rack_id: s.rack_id, nome: s.identificacao })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Ambiente" titulo="Salas & Racks" descricao="Onde cada patch panel e switch está instalado." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Painel>
          <PainelTitulo titulo="Salas" />
          <div className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Campo rotulo="Nome da sala *">
              <input className={input} value={sala.nome} onChange={(e) => setSala({ ...sala, nome: e.target.value })} placeholder="Sala técnica 1" />
            </Campo>
            <Campo rotulo="Andar / bloco">
              <input className={input} value={sala.andar} onChange={(e) => setSala({ ...sala, andar: e.target.value })} placeholder="Térreo" />
            </Campo>
            <button className={botao} onClick={salvarSala}>Adicionar</button>
          </div>
          {salas.data?.length ? (
            <ul className="divide-y divide-line border-t border-line">
              {salas.data.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    {s.nome} <span className="text-mist">{s.andar ? `· ${s.andar}` : ""}</span>
                    <span className="ml-2 text-xs text-mist">{racks.data?.filter((r) => r.sala_id === s.id).length ?? 0} rack(s)</span>
                  </span>
                  <button aria-label="Excluir sala" onClick={() => excluir("salas", s.id, s.nome)} className="text-mist hover:text-fail">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio mensagem="Nenhuma sala cadastrada." />
          )}
        </Painel>

        <Painel>
          <PainelTitulo titulo="Racks" />
          <div className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_80px_auto] sm:items-end">
            <Campo rotulo="Identificação *">
              <input className={input} value={rack.identificacao} onChange={(e) => setRack({ ...rack, identificacao: e.target.value })} placeholder="RK01" />
            </Campo>
            <Campo rotulo="Sala">
              <Selecao valor={rack.sala_id} aoMudar={(v) => setRack({ ...rack, sala_id: v })} placeholder="Sem sala" opcoes={(salas.data ?? []).map((s) => ({ valor: s.id, rotulo: s.nome }))} />
            </Campo>
            <Campo rotulo="Altura (U)">
              <input className={input} inputMode="numeric" value={rack.altura_u} onChange={(e) => setRack({ ...rack, altura_u: e.target.value })} />
            </Campo>
            <button className={botao} onClick={salvarRack}>Adicionar</button>
          </div>
          {racks.data?.length ? (
            <ul className="divide-y divide-line border-t border-line">
              {racks.data.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    <span className="font-mono">{r.identificacao}</span>
                    <span className="text-mist"> · {nomeSala(r.sala_id)} · {r.altura_u}U</span>
                  </span>
                  <button aria-label="Excluir rack" onClick={() => excluir("racks", r.id, r.identificacao)} className="text-mist hover:text-fail">
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio mensagem="Nenhum rack cadastrado." />
          )}
        </Painel>
      </div>

      <Painel>
        <PainelTitulo titulo="Equipamentos nos racks" />
        <div className="grid gap-3 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Campo rotulo="Equipamento">
            <Selecao valor={equip.item} aoMudar={(v) => setEquip({ ...equip, item: v })} placeholder="Escolha patch panel ou switch" opcoes={equipamentos} />
          </Campo>
          <Campo rotulo="Rack">
            <Selecao valor={equip.rack_id} aoMudar={(v) => setEquip({ ...equip, rack_id: v })} placeholder="Nenhum (remover do rack)" opcoes={(racks.data ?? []).map((r) => ({ valor: r.id, rotulo: `${r.identificacao} — ${nomeSala(r.sala_id)}` }))} />
          </Campo>
          <button className={botao} onClick={vincular}>Salvar</button>
        </div>
        {racks.data?.length ? (
          <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 xl:grid-cols-3">
            {racks.data.map((r) => {
              const itens = equipamentos.filter((e) => e.rack_id === r.id);
              return (
                <div key={r.id} className="rounded-lg border border-line bg-panel-2/50 p-4">
                  <p className="font-mono text-sm text-gold">{r.identificacao}</p>
                  <p className="text-xs text-mist">{nomeSala(r.sala_id)}</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {itens.length ? itens.map((i) => <li key={i.valor}>{i.rotulo}</li>) : <li className="text-mist">Vazio</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : null}
      </Painel>
    </div>
  );
}

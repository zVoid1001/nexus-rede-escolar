import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ChevronRight, Pencil, Trash2, Unplug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Painel, PainelTitulo, Campo, Selecao, Vazio } from "@/components/ui-sistema";
import { cn } from "@/lib/utils";

const db = supabase as any;

type Sala = { id: string; nome: string; codigo: string | null; observacoes: string | null };
type Rack = { id: string; identificacao: string; sala_id: string | null; localizacao: string | null; observacoes: string | null };
type Equip = { id: string; identificacao: string; rack_id: string | null; numero_portas: number; modelo?: string | null; fabricante?: string | null; categoria_cabo?: string | null; observacoes: string | null };
type Ponto = {
  id: string; identificacao: string; nome: string | null; sala_id: string | null; localizacao: string | null;
  observacoes: string | null; status: string; categoria_cabo: string;
  patch_panel_id: string | null; porta_patch_panel: number | null; switch_id: string | null; porta_switch: number | null;
};

export const Route = createFileRoute("/infraestrutura")({
  head: () => ({
    meta: [
      { title: "Infraestrutura por etapas — NEXUS" },
      { name: "description", content: "Cadastro cronológico: salas, pontos, racks, equipamentos e conexões físicas." },
      { property: "og:title", content: "Infraestrutura por etapas — NEXUS" },
      { property: "og:description", content: "Cadastro cronológico: salas, pontos, racks, equipamentos e conexões físicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Infraestrutura,
});

const input = "h-9 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground";
const botao = "h-9 rounded-md bg-gold px-4 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-40";
const STATUS: Record<string, string> = { ativo: "Ativo", inativo: "Inativo", manutencao: "Em manutenção" };

function lista<T>(tabela: string, ordem: string) {
  return {
    queryKey: [tabela],
    queryFn: async () => {
      const { data, error } = await db.from(tabela).select("*").order(ordem);
      if (error) throw new Error(error.message);
      return data as T[];
    },
  };
}

function Infraestrutura() {
  const qc = useQueryClient();
  const salas = useQuery(lista<Sala>("salas", "nome")).data ?? [];
  const racks = useQuery(lista<Rack>("racks", "identificacao")).data ?? [];
  const sws = useQuery(lista<Equip>("switches", "identificacao")).data ?? [];
  const pps = useQuery(lista<Equip>("patch_panels", "identificacao")).data ?? [];
  const pontos = useQuery(lista<Ponto>("pontos_rede", "identificacao")).data ?? [];
  const categorias = useQuery(lista<{ nome: string }>("categorias_cabo", "nome")).data ?? [];

  const [salaId, setSalaId] = useState("");
  const [rackId, setRackId] = useState("");
  const sala = salas.find((s) => s.id === salaId);
  const racksSala = racks.filter((r) => r.sala_id === salaId);
  const pontosSala = pontos.filter((p) => p.sala_id === salaId);
  const rack = racksSala.find((r) => r.id === rackId);

  const atualizar = () => ["salas", "racks", "switches", "patch_panels", "pontos_rede"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  async function executar(p: PromiseLike<{ error: any }>, ok: string) {
    const { error } = await p;
    if (error) {
      const msg = String(error.message ?? "");
      toast.error(error.code === "23505" ? "Registro duplicado: código ou porta já em uso." : error.code === "23503" ? "Não é possível excluir: há registros dependentes." : msg);
      return false;
    }
    toast.success(ok);
    atualizar();
    return true;
  }

  // Etapas
  const racksIds = new Set(racks.map((r) => r.id));
  const equipEmRack = [...sws, ...pps].filter((e) => e.rack_id && racksIds.has(e.rack_id));
  const pontosComSala = pontos.filter((p) => p.sala_id);
  const conectados = pontosComSala.filter((p) => p.patch_panel_id && p.switch_id);
  const etapas = [
    { nome: "Salas", st: salas.length ? 2 : 0 },
    { nome: "Pontos de Rede e Racks", st: pontosComSala.length && racks.length ? 2 : pontosComSala.length || racks.length ? 1 : 0 },
    { nome: "Switches e Patch Panels", st: sws.some((s) => s.rack_id) && pps.some((p) => p.rack_id) ? 2 : equipEmRack.length ? 1 : 0 },
    { nome: "Conexões Físicas", st: !conectados.length ? 0 : conectados.length === pontosComSala.length ? 2 : 1 },
  ];
  const rotSt = ["Não iniciada", "Em andamento", "Concluída"];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastro por etapas" titulo="Infraestrutura" descricao="Sala → Pontos e Racks → Equipamentos → Conexões físicas." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {etapas.map((e, i) => (
          <div key={e.nome} className={cn("rounded-lg border p-4", e.st === 2 ? "border-pass/40 bg-pass/5" : e.st === 1 ? "border-gold/40 bg-gold/5" : "border-line bg-panel/40")}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-mist">Etapa {i + 1}</p>
            <p className="mt-1 text-sm font-medium text-foreground">{e.nome}</p>
            <p className={cn("mt-2 text-xs", e.st === 2 ? "text-pass" : e.st === 1 ? "text-gold" : "text-mist")}>{rotSt[e.st]}</p>
          </div>
        ))}
      </div>

      <EtapaSalas salas={salas} racks={racks} pontos={pontos} salaId={salaId} setSalaId={(id) => { setSalaId(id); setRackId(""); }} executar={executar} />

      {!sala ? (
        <Painel><Vazio mensagem={salas.length ? "Selecione uma sala acima para continuar nas próximas etapas." : "Cadastre uma sala primeiro para liberar pontos de rede e racks."} /></Painel>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <EtapaPontos sala={sala} pontos={pontosSala} categorias={categorias.map((c) => c.nome)} executar={executar} />
            <EtapaRacks sala={sala} racks={racksSala} sws={sws} pps={pps} rackId={rackId} setRackId={setRackId} executar={executar} />
          </div>
          <EtapaEquipamentos rack={rack} racks={racksSala} setRackId={setRackId} sws={sws} pps={pps} pontos={pontos} categorias={categorias.map((c) => c.nome)} executar={executar} />
          <EtapaConexoes sala={sala} pontos={pontosSala} racks={racksSala} sws={sws} pps={pps} todos={pontos} executar={executar} />
        </>
      )}
    </div>
  );
}

type Exec = (p: PromiseLike<{ error: any }>, ok: string) => Promise<boolean>;

function EtapaSalas({ salas, racks, pontos, salaId, setSalaId, executar }: { salas: Sala[]; racks: Rack[]; pontos: Ponto[]; salaId: string; setSalaId: (id: string) => void; executar: Exec }) {
  const vazio = { id: "", nome: "", codigo: "", descricao: "" };
  const [f, setF] = useState(vazio);
  async function salvar() {
    const nome = f.nome.trim(), codigo = f.codigo.trim().toUpperCase();
    if (!nome || !codigo) { toast.error("Informe nome e identificação da sala."); return; }
    if (salas.some((s) => s.id !== f.id && s.codigo?.toLowerCase() === codigo.toLowerCase())) { toast.error("Já existe uma sala com essa identificação."); return; }
    const payload = { nome, codigo, observacoes: f.descricao.trim() || null };
    const ok = await executar(f.id ? db.from("salas").update(payload).eq("id", f.id) : db.from("salas").insert(payload), f.id ? "Sala atualizada." : "Sala cadastrada.");
    if (ok) setF(vazio);
  }
  async function excluir(s: Sala) {
    const nr = racks.filter((r) => r.sala_id === s.id).length, np = pontos.filter((p) => p.sala_id === s.id).length;
    if (nr || np) { toast.error(`A sala possui ${np} ponto(s) e ${nr} rack(s). Remova-os antes de excluir.`); return; }
    if (!confirm(`Excluir a sala ${s.codigo ?? s.nome}?`)) return;
    if (await executar(db.from("salas").delete().eq("id", s.id), "Sala excluída.") && salaId === s.id) setSalaId("");
  }
  return (
    <Painel>
      <PainelTitulo titulo="1 · Salas" />
      <div className="grid gap-3 p-5 md:grid-cols-4">
        <Campo rotulo="Nome da sala *"><input className={input} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Laboratório 1" /></Campo>
        <Campo rotulo="Identificação *"><input className={input} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} placeholder="LAB01" /></Campo>
        <Campo rotulo="Descrição"><input className={input} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></Campo>
        <div className="flex items-end gap-2">
          <button className={botao} onClick={salvar}>{f.id ? "Salvar sala" : "Cadastrar sala"}</button>
          {f.id && <button className="h-9 px-3 text-sm text-mist" onClick={() => setF(vazio)}>Cancelar</button>}
        </div>
      </div>
      {salas.length === 0 ? <Vazio mensagem="Nenhuma sala ainda. Comece cadastrando uma sala." /> : (
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {salas.map((s) => (
            <div key={s.id} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-sm", s.id === salaId ? "border-gold bg-gold/10" : "border-line")}>
              <button onClick={() => setSalaId(s.id)} className="text-left">
                <span className="font-mono text-gold">{s.codigo ?? "—"}</span> <span className="text-foreground">{s.nome}</span>
              </button>
              <button aria-label="Editar sala" onClick={() => setF({ id: s.id, nome: s.nome, codigo: s.codigo ?? "", descricao: s.observacoes ?? "" })} className="text-mist hover:text-foreground"><Pencil className="size-3.5" /></button>
              <button aria-label="Excluir sala" onClick={() => excluir(s)} className="text-mist hover:text-fail"><Trash2 className="size-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </Painel>
  );
}

function EtapaPontos({ sala, pontos, categorias, executar }: { sala: Sala; pontos: Ponto[]; categorias: string[]; executar: Exec }) {
  const vazio = { id: "", codigo: "", nome: "", localizacao: "", status: "ativo", categoria: categorias[0] ?? "Cat6", obs: "" };
  const [f, setF] = useState(vazio);
  async function salvar() {
    const codigo = f.codigo.trim().toUpperCase();
    if (!codigo) { toast.error("Informe o código do ponto (ex.: LAB01-P01)."); return; }
    const payload = { identificacao: codigo, nome: f.nome.trim() || null, sala_id: sala.id, localizacao: f.localizacao.trim() || null, status: f.status, categoria_cabo: f.categoria || "Cat6", observacoes: f.obs.trim() || null };
    if (await executar(f.id ? db.from("pontos_rede").update(payload).eq("id", f.id) : db.from("pontos_rede").insert(payload), f.id ? "Ponto atualizado." : "Ponto de rede adicionado.")) setF(vazio);
  }
  async function excluir(p: Ponto) {
    const { count } = await db.from("testes_certificacao").select("id", { count: "exact", head: true }).eq("ponto_rede_id", p.id);
    if (count) { toast.error(`O ponto tem ${count} teste(s) de certificação registrados e não pode ser excluído.`); return; }
    if (!confirm(`Excluir o ponto ${p.identificacao}? A conexão física dele também será removida.`)) return;
    await executar(db.from("pontos_rede").delete().eq("id", p.id), "Ponto excluído.");
  }
  return (
    <Painel>
      <PainelTitulo titulo={`2A · Pontos de rede — ${sala.codigo ?? sala.nome}`} />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <Campo rotulo="Código *"><input className={input} value={f.codigo} onChange={(e) => setF({ ...f, codigo: e.target.value })} placeholder={`${sala.codigo ?? "SALA"}-P01`} /></Campo>
        <Campo rotulo="Nome"><input className={input} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Campo>
        <Campo rotulo="Localização física"><input className={input} value={f.localizacao} onChange={(e) => setF({ ...f, localizacao: e.target.value })} /></Campo>
        <Campo rotulo="Status"><Selecao valor={f.status} aoMudar={(v) => setF({ ...f, status: v || "ativo" })} placeholder="Status" opcoes={Object.entries(STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))} /></Campo>
        <Campo rotulo="Categoria do cabo"><Selecao valor={f.categoria} aoMudar={(v) => setF({ ...f, categoria: v })} placeholder="Categoria" opcoes={categorias.map((c) => ({ valor: c, rotulo: c }))} /></Campo>
        <Campo rotulo="Observações"><input className={input} value={f.obs} onChange={(e) => setF({ ...f, obs: e.target.value })} /></Campo>
        <div className="flex gap-2"><button className={botao} onClick={salvar}>{f.id ? "Salvar ponto" : "Adicionar ponto de rede"}</button>{f.id && <button className="text-sm text-mist" onClick={() => setF(vazio)}>Cancelar</button>}</div>
      </div>
      {pontos.length === 0 ? <Vazio mensagem="Nenhum ponto nesta sala." /> : (
        <ul className="divide-y divide-line border-t border-line text-sm">
          {pontos.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
              <span className="font-mono text-gold">{p.identificacao}</span>
              <span className="text-xs text-mist">{STATUS[p.status] ?? p.status}</span>
              <span className={cn("ml-auto text-xs", p.patch_panel_id && p.switch_id ? "text-pass" : "text-mist")}>{p.patch_panel_id && p.switch_id ? "Conectado" : "Conexão pendente"}</span>
              <button aria-label="Editar ponto" onClick={() => setF({ id: p.id, codigo: p.identificacao, nome: p.nome ?? "", localizacao: p.localizacao ?? "", status: p.status, categoria: p.categoria_cabo, obs: p.observacoes ?? "" })} className="text-mist hover:text-foreground"><Pencil className="size-3.5" /></button>
              <button aria-label="Excluir ponto" onClick={() => excluir(p)} className="text-mist hover:text-fail"><Trash2 className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

function EtapaRacks({ sala, racks, sws, pps, rackId, setRackId, executar }: { sala: Sala; racks: Rack[]; sws: Equip[]; pps: Equip[]; rackId: string; setRackId: (id: string) => void; executar: Exec }) {
  const vazio = { id: "", nome: "", localizacao: "", descricao: "" };
  const [f, setF] = useState(vazio);
  async function salvar() {
    const identificacao = f.nome.trim().toUpperCase();
    if (!identificacao) { toast.error("Informe a identificação do rack (ex.: RACK01)."); return; }
    const payload = { identificacao, sala_id: sala.id, localizacao: f.localizacao.trim() || null, observacoes: f.descricao.trim() || null };
    if (await executar(f.id ? db.from("racks").update(payload).eq("id", f.id) : db.from("racks").insert(payload), f.id ? "Rack atualizado." : "Rack criado.")) setF(vazio);
  }
  async function excluir(r: Rack) {
    const n = sws.filter((s) => s.rack_id === r.id).length + pps.filter((p) => p.rack_id === r.id).length;
    if (n) { toast.error(`O rack possui ${n} equipamento(s). Remova-os antes de excluir.`); return; }
    if (!confirm(`Excluir o rack ${r.identificacao}?`)) return;
    if (await executar(db.from("racks").delete().eq("id", r.id), "Rack excluído.") && rackId === r.id) setRackId("");
  }
  return (
    <Painel>
      <PainelTitulo titulo={`2B · Racks — ${sala.codigo ?? sala.nome}`} />
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <Campo rotulo="Identificação *"><input className={input} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="RACK01" /></Campo>
        <Campo rotulo="Localização física"><input className={input} value={f.localizacao} onChange={(e) => setF({ ...f, localizacao: e.target.value })} /></Campo>
        <Campo rotulo="Descrição"><input className={input} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></Campo>
        <div className="flex items-end gap-2"><button className={botao} onClick={salvar}>{f.id ? "Salvar rack" : "Criar rack"}</button>{f.id && <button className="text-sm text-mist" onClick={() => setF(vazio)}>Cancelar</button>}</div>
      </div>
      {racks.length === 0 ? <Vazio mensagem="Nenhum rack nesta sala." /> : (
        <ul className="divide-y divide-line border-t border-line text-sm">
          {racks.map((r) => (
            <li key={r.id} className={cn("flex items-center gap-3 px-5 py-2.5", r.id === rackId && "bg-gold/5")}>
              <button onClick={() => setRackId(r.id)} className="flex items-center gap-2 font-mono text-gold"><ChevronRight className="size-3.5" />{r.identificacao}</button>
              <span className="text-xs text-mist">{sws.filter((s) => s.rack_id === r.id).length} switch · {pps.filter((p) => p.rack_id === r.id).length} patch panel</span>
              <button aria-label="Editar rack" onClick={() => setF({ id: r.id, nome: r.identificacao, localizacao: r.localizacao ?? "", descricao: r.observacoes ?? "" })} className="ml-auto text-mist hover:text-foreground"><Pencil className="size-3.5" /></button>
              <button aria-label="Excluir rack" onClick={() => excluir(r)} className="text-mist hover:text-fail"><Trash2 className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

function Portas({ equip, tipo, pontos }: { equip: Equip; tipo: "sw" | "pp"; pontos: Ponto[] }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-12">
      {Array.from({ length: equip.numero_portas }, (_, i) => i + 1).map((n) => {
        const p = pontos.find((x) => (tipo === "sw" ? x.switch_id === equip.id && x.porta_switch === n : x.patch_panel_id === equip.id && x.porta_patch_panel === n));
        return (
          <div key={n} title={p ? `Porta ${n} → ${p.identificacao}` : `Porta ${n} livre`} className={cn("rounded border px-1 py-1 text-center font-mono text-[10px]", p ? "border-gold/50 bg-gold/10 text-gold" : "border-line text-mist")}>
            {String(n).padStart(2, "0")}
            {p && <div className="truncate text-[9px]">{p.identificacao}</div>}
          </div>
        );
      })}
    </div>
  );
}

function EtapaEquipamentos({ rack, racks, setRackId, sws, pps, pontos, categorias, executar }: { rack: Rack | undefined; racks: Rack[]; setRackId: (id: string) => void; sws: Equip[]; pps: Equip[]; pontos: Ponto[]; categorias: string[]; executar: Exec }) {
  const [sw, setSw] = useState({ nome: "", fabricante: "", modelo: "", portas: "24", descricao: "" });
  const [pp, setPp] = useState({ nome: "", portas: "24", categoria: "", descricao: "" });
  const [aberto, setAberto] = useState("");
  const portasOk = (v: string) => { const n = Number(v); return Number.isInteger(n) && n >= 1 && n <= 96 ? n : null; };
  const exigirRack = () => { if (!rack) { toast.error("Crie e selecione um rack antes de adicionar equipamentos."); return false; } return true; };

  async function addSw() {
    if (!exigirRack()) return;
    const n = portasOk(sw.portas);
    if (!sw.nome.trim()) { toast.error("Informe a identificação do switch."); return; }
    if (!n) { toast.error("Quantidade de portas deve ser entre 1 e 96."); return; }
    if (await executar(db.from("switches").insert({ identificacao: sw.nome.trim().toUpperCase(), rack_id: rack!.id, fabricante: sw.fabricante.trim() || null, modelo: sw.modelo.trim() || null, numero_portas: n, observacoes: sw.descricao.trim() || null }), "Switch adicionado."))
      setSw({ nome: "", fabricante: "", modelo: "", portas: "24", descricao: "" });
  }
  async function addPp() {
    if (!exigirRack()) return;
    const n = portasOk(pp.portas);
    if (!pp.nome.trim()) { toast.error("Informe a identificação do patch panel."); return; }
    if (!n) { toast.error("Quantidade de portas deve ser entre 1 e 96."); return; }
    if (await executar(db.from("patch_panels").insert({ identificacao: pp.nome.trim().toUpperCase(), rack_id: rack!.id, numero_portas: n, categoria_cabo: pp.categoria || null, observacoes: pp.descricao.trim() || null }), "Patch panel adicionado."))
      setPp({ nome: "", portas: "24", categoria: "", descricao: "" });
  }
  async function excluir(tabela: "switches" | "patch_panels", e: Equip) {
    const campo = tabela === "switches" ? "switch_id" : "patch_panel_id";
    const n = pontos.filter((p) => p[campo] === e.id).length;
    if (!confirm(n ? `${e.identificacao} tem ${n} conexão(ões). Elas ficarão pendentes. Continuar?` : `Excluir ${e.identificacao}?`)) return;
    if (n) {
      const limpar = tabela === "switches" ? { switch_id: null, porta_switch: null } : { patch_panel_id: null, porta_patch_panel: null };
      const { error } = await db.from("pontos_rede").update(limpar).eq(campo, e.id);
      if (error) { toast.error(error.message); return; }
    }
    await executar(db.from(tabela).delete().eq("id", e.id), "Equipamento excluído.");
  }

  const swsRack = rack ? sws.filter((s) => s.rack_id === rack.id) : [];
  const ppsRack = rack ? pps.filter((p) => p.rack_id === rack.id) : [];

  return (
    <Painel>
      <PainelTitulo titulo="3 · Switches e Patch Panels" />
      <div className="p-5 space-y-4">
        <div className="max-w-xs">
          <Campo rotulo="Rack"><Selecao valor={rack?.id ?? ""} aoMudar={setRackId} placeholder={racks.length ? "Selecione o rack" : "Crie um rack primeiro"} opcoes={racks.map((r) => ({ valor: r.id, rotulo: r.identificacao }))} /></Campo>
        </div>
        {!rack ? <p className="text-sm text-mist">{racks.length ? "Selecione um rack para adicionar equipamentos." : "Não há racks nesta sala. Crie um rack na etapa 2B antes de adicionar switches e patch panels."}</p> : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-line p-4">
              <p className="text-sm font-medium">Novo switch em {rack.identificacao}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Identificação *"><input className={input} value={sw.nome} onChange={(e) => setSw({ ...sw, nome: e.target.value })} placeholder="SWITCH01" /></Campo>
                <Campo rotulo="Fabricante"><input className={input} value={sw.fabricante} onChange={(e) => setSw({ ...sw, fabricante: e.target.value })} /></Campo>
                <Campo rotulo="Modelo"><input className={input} value={sw.modelo} onChange={(e) => setSw({ ...sw, modelo: e.target.value })} /></Campo>
                <Campo rotulo="Portas *"><input className={input} inputMode="numeric" value={sw.portas} onChange={(e) => setSw({ ...sw, portas: e.target.value })} /></Campo>
                <Campo rotulo="Descrição"><input className={input} value={sw.descricao} onChange={(e) => setSw({ ...sw, descricao: e.target.value })} /></Campo>
              </div>
              <button className={botao} onClick={addSw}>Adicionar switch</button>
            </div>
            <div className="space-y-3 rounded-lg border border-line p-4">
              <p className="text-sm font-medium">Novo patch panel em {rack.identificacao}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo rotulo="Identificação *"><input className={input} value={pp.nome} onChange={(e) => setPp({ ...pp, nome: e.target.value })} placeholder="PP01" /></Campo>
                <Campo rotulo="Portas *"><input className={input} inputMode="numeric" value={pp.portas} onChange={(e) => setPp({ ...pp, portas: e.target.value })} /></Campo>
                <Campo rotulo="Categoria"><Selecao valor={pp.categoria} aoMudar={(v) => setPp({ ...pp, categoria: v })} placeholder="Não informada" opcoes={categorias.map((c) => ({ valor: c, rotulo: c }))} /></Campo>
                <Campo rotulo="Descrição"><input className={input} value={pp.descricao} onChange={(e) => setPp({ ...pp, descricao: e.target.value })} /></Campo>
              </div>
              <button className={botao} onClick={addPp}>Adicionar patch panel</button>
            </div>
          </div>
        )}
        {rack && (
          <div className="space-y-2">
            <p className="label-eyebrow">Conteúdo de {rack.identificacao}</p>
            {swsRack.length + ppsRack.length === 0 && <p className="text-sm text-mist">Nenhum equipamento neste rack.</p>}
            {[...swsRack.map((e) => ({ e, t: "sw" as const })), ...ppsRack.map((e) => ({ e, t: "pp" as const }))].map(({ e, t }) => (
              <div key={e.id} className="rounded-md border border-line">
                <div className="flex items-center gap-3 px-4 py-2 text-sm">
                  <button onClick={() => setAberto(aberto === e.id ? "" : e.id)} className="flex items-center gap-2">
                    <ChevronRight className={cn("size-3.5 transition-transform", aberto === e.id && "rotate-90")} />
                    <span className="text-xs text-mist">{t === "sw" ? "Switch" : "Patch panel"}</span>
                    <span className="font-mono text-gold">{e.identificacao}</span>
                  </button>
                  <span className="text-xs text-mist">{e.numero_portas} portas{t === "sw" && e.modelo ? ` · ${[e.fabricante, e.modelo].filter(Boolean).join(" ")}` : ""}{t === "pp" && e.categoria_cabo ? ` · ${e.categoria_cabo}` : ""}</span>
                  <button aria-label="Excluir equipamento" onClick={() => excluir(t === "sw" ? "switches" : "patch_panels", e)} className="ml-auto text-mist hover:text-fail"><Trash2 className="size-3.5" /></button>
                </div>
                {aberto === e.id && <div className="border-t border-line p-3"><Portas equip={e} tipo={t} pontos={pontos} /></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </Painel>
  );
}

function EtapaConexoes({ sala, pontos, racks, sws, pps, todos, executar }: { sala: Sala; pontos: Ponto[]; racks: Rack[]; sws: Equip[]; pps: Equip[]; todos: Ponto[]; executar: Exec }) {
  const [f, setF] = useState({ ponto: "", rack: "", pp: "", portaPp: "", sw: "", portaSw: "" });
  const ppsRack = pps.filter((p) => p.rack_id === f.rack);
  const swsRack = sws.filter((s) => s.rack_id === f.rack);
  const ppSel = ppsRack.find((p) => p.id === f.pp);
  const swSel = swsRack.find((s) => s.id === f.sw);
  const livres = useMemo(() => {
    const ocupPp = new Set(todos.filter((p) => p.patch_panel_id === f.pp && p.id !== f.ponto).map((p) => p.porta_patch_panel));
    const ocupSw = new Set(todos.filter((p) => p.switch_id === f.sw && p.id !== f.ponto).map((p) => p.porta_switch));
    return {
      pp: ppSel ? Array.from({ length: ppSel.numero_portas }, (_, i) => i + 1).filter((n) => !ocupPp.has(n)) : [],
      sw: swSel ? Array.from({ length: swSel.numero_portas }, (_, i) => i + 1).filter((n) => !ocupSw.has(n)) : [],
    };
  }, [todos, f.pp, f.sw, f.ponto, ppSel, swSel]);

  const temEquip = racks.some((r) => pps.some((p) => p.rack_id === r.id) && sws.some((s) => s.rack_id === r.id));
  const conectados = pontos.filter((p) => p.patch_panel_id && p.switch_id);

  async function registrar() {
    if (!f.ponto || !f.rack || !f.pp || !f.portaPp || !f.sw || !f.portaSw) { toast.error("Selecione ponto, rack, patch panel, porta, switch e porta."); return; }
    const rk = racks.find((r) => r.id === f.rack);
    if (!rk || rk.sala_id !== sala.id) { toast.error("O rack precisa pertencer à mesma sala do ponto."); return; }
    if (await executar(db.from("pontos_rede").update({ patch_panel_id: f.pp, porta_patch_panel: Number(f.portaPp), switch_id: f.sw, porta_switch: Number(f.portaSw) }).eq("id", f.ponto), "Conexão registrada."))
      setF({ ponto: "", rack: f.rack, pp: "", portaPp: "", sw: "", portaSw: "" });
  }
  async function desconectar(p: Ponto) {
    if (!confirm(`Remover a conexão física de ${p.identificacao}? O ponto ficará pendente.`)) return;
    await executar(db.from("pontos_rede").update({ patch_panel_id: null, porta_patch_panel: null, switch_id: null, porta_switch: null }).eq("id", p.id), "Conexão removida.");
  }
  const nome = (l: Equip[], id: string | null) => l.find((e) => e.id === id)?.identificacao ?? "—";

  return (
    <Painel>
      <PainelTitulo titulo={`4 · Conexões físicas — ${sala.codigo ?? sala.nome}`} />
      {!pontos.length || !temEquip ? (
        <p className="p-5 text-sm text-mist">Para registrar conexões, a sala precisa ter pelo menos um ponto de rede e um rack com switch e patch panel.</p>
      ) : (
        <div className="grid gap-3 p-5 md:grid-cols-3 lg:grid-cols-6">
          <Campo rotulo="Ponto de rede"><Selecao valor={f.ponto} aoMudar={(v) => setF({ ...f, ponto: v })} placeholder="Selecione" opcoes={pontos.map((p) => ({ valor: p.id, rotulo: p.identificacao + (p.patch_panel_id ? " (conectado)" : "") }))} /></Campo>
          <Campo rotulo="Rack"><Selecao valor={f.rack} aoMudar={(v) => setF({ ...f, rack: v, pp: "", portaPp: "", sw: "", portaSw: "" })} placeholder="Selecione" opcoes={racks.map((r) => ({ valor: r.id, rotulo: r.identificacao }))} /></Campo>
          <Campo rotulo="Patch panel"><Selecao valor={f.pp} aoMudar={(v) => setF({ ...f, pp: v, portaPp: "" })} placeholder="Selecione" opcoes={ppsRack.map((p) => ({ valor: p.id, rotulo: p.identificacao }))} /></Campo>
          <Campo rotulo="Porta do patch"><Selecao valor={f.portaPp} aoMudar={(v) => setF({ ...f, portaPp: v })} placeholder="Porta" opcoes={livres.pp.map((n) => ({ valor: String(n), rotulo: `Porta ${String(n).padStart(2, "0")}` }))} /></Campo>
          <Campo rotulo="Switch"><Selecao valor={f.sw} aoMudar={(v) => setF({ ...f, sw: v, portaSw: "" })} placeholder="Selecione" opcoes={swsRack.map((s) => ({ valor: s.id, rotulo: s.identificacao }))} /></Campo>
          <Campo rotulo="Porta do switch"><Selecao valor={f.portaSw} aoMudar={(v) => setF({ ...f, portaSw: v })} placeholder="Porta" opcoes={livres.sw.map((n) => ({ valor: String(n), rotulo: `Porta ${String(n).padStart(2, "0")}` }))} /></Campo>
          <div className="md:col-span-3 lg:col-span-6"><button className={botao} onClick={registrar}>Registrar conexão</button></div>
        </div>
      )}
      {conectados.length > 0 && (
        <ul className="divide-y divide-line border-t border-line text-sm">
          {conectados.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 px-5 py-2.5 font-mono text-xs">
              <Check className="size-3.5 text-pass" />
              <span className="text-gold">{p.identificacao}</span> → <span>{nome(pps, p.patch_panel_id)} / {String(p.porta_patch_panel).padStart(2, "0")}</span> → <span>{nome(sws, p.switch_id)} / {String(p.porta_switch).padStart(2, "0")}</span>
              <button aria-label="Remover conexão" onClick={() => desconectar(p)} className="ml-auto text-mist hover:text-fail"><Unplug className="size-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

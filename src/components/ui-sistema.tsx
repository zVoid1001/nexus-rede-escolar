import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  titulo,
  descricao,
  acoes,
}: {
  eyebrow: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl leading-none text-foreground">{titulo}</h1>
        {descricao ? <p className="mt-2 text-sm text-mist">{descricao}</p> : null}
      </div>
      {acoes ? <div className="flex flex-wrap items-center gap-3">{acoes}</div> : null}
    </header>
  );
}

export function Painel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-xl border border-line bg-panel", className)}>{children}</div>
  );
}

export function PainelTitulo({
  titulo,
  extra,
}: {
  titulo: string;
  extra?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <h2 className="font-serif text-xl text-foreground">{titulo}</h2>
      {extra}
    </div>
  );
}

export function KpiCard({
  rotulo,
  valor,
  nota,
  tom = "neutro",
}: {
  rotulo: string;
  valor: ReactNode;
  nota?: string;
  tom?: "neutro" | "pass" | "fail";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        tom === "pass" && "border-pass/30 bg-pass/5",
        tom === "fail" && "border-fail/30 bg-fail/5",
        tom === "neutro" && "border-line bg-panel",
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-mist">{rotulo}</p>
      <p
        className={cn(
          "mt-3 font-serif text-4xl",
          tom === "pass" && "text-pass",
          tom === "fail" && "text-fail",
          tom === "neutro" && "text-foreground",
        )}
      >
        {valor}
      </p>
      {nota ? <p className="mt-1 text-xs text-mist">{nota}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: "PASS" | "FAIL" | "PENDENTE" }) {
  if (status === "PENDENTE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-mist/10 px-2.5 py-1 text-[11px] font-semibold text-mist">
        ○ Pendente
      </span>
    );
  }
  const pass = status === "PASS";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        pass ? "bg-pass/15 text-pass" : "bg-fail/15 text-fail",
      )}
    >
      ● {status}
    </span>
  );
}

export function AvisoDemo() {
  return (
    <div className="rounded-lg border border-gold/20 bg-gold/5 px-5 py-3">
      <p className="text-xs text-mist">
        📌 Este sistema contém dados fictícios de demonstração (pontos, switches e testes de
        exemplo). Os limites da norma cadastrados também são exemplos e devem ser substituídos
        pelos valores da norma adotada no projeto.
      </p>
    </div>
  );
}

export function Vazio({ mensagem }: { mensagem: string }) {
  return <p className="px-5 py-10 text-center text-sm text-mist">{mensagem}</p>;
}

export function Campo({
  rotulo,
  erro,
  children,
}: {
  rotulo: string;
  erro?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs text-mist">{rotulo}</label>
      {children}
      {erro ? <p className="text-xs text-fail">{erro}</p> : null}
    </div>
  );
}

export function Selecao({
  valor,
  aoMudar,
  opcoes,
  placeholder,
}: {
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
  placeholder: string;
}) {
  return (
    <select
      value={valor}
      onChange={(e) => aoMudar(e.target.value)}
      className="h-9 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground"
    >
      <option value="">{placeholder}</option>
      {opcoes.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.rotulo}
        </option>
      ))}
    </select>
  );
}

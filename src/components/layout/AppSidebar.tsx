import { Link, useNavigate } from "@tanstack/react-router";
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  Cable,
  LayoutGrid,
  Network,
  Tag,
  FlaskConical,
  ClipboardList,
  Settings,
  Menu,
  Server,
} from "lucide-react";
import { useState } from "react";
import { useLimites } from "@/lib/dados";
import { useSessao, nomeExibicao, sair } from "@/lib/auth";
import { cn } from "@/lib/utils";

const ITENS = [
  { to: "/", rotulo: "Dashboard", Icone: LayoutDashboard },
  { to: "/inventario", rotulo: "Inventário", Icone: Cable },
  { to: "/infraestrutura", rotulo: "Infraestrutura", Icone: Server },
  { to: "/salas-racks", rotulo: "Salas & Racks", Icone: Server },
  { to: "/patch-panels", rotulo: "Patch Panels", Icone: LayoutGrid },
  { to: "/switches", rotulo: "Switches", Icone: Network },
  { to: "/etiquetas", rotulo: "Etiquetas", Icone: Tag },
  { to: "/certificacao", rotulo: "Certificação", Icone: FlaskConical },
  { to: "/historico", rotulo: "Histórico", Icone: ClipboardList },
  { to: "/configuracoes", rotulo: "Configurações", Icone: Settings },
] as const;

function Conteudo({ aoNavegar }: { aoNavegar?: () => void }) {
  const navigate = useNavigate();
  const { usuario } = useSessao();
  const { data: limites } = useLimites();
  const normas = Array.from(
    new Set((limites ?? []).map((l) => l.norma).filter(Boolean) as string[]),
  );

  return (
    <>
      <div className="px-3">
        <p className="font-serif text-2xl tracking-wide text-foreground">NEXUS</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-gold">
          Inventário &amp; Certificação
        </p>
      </div>
      <nav className="mt-9 space-y-1 text-sm">
        {ITENS.map(({ to, rotulo, Icone }) => (
          <Link
            key={to}
            to={to}
            onClick={aoNavegar}
            activeOptions={{ exact: to === "/" }}
            activeProps={{
              className: "bg-gold/10 text-gold border border-gold/25 font-medium",
            }}
            inactiveProps={{
              className: "text-mist border border-transparent hover:text-foreground hover:bg-foreground/5",
            }}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors"
          >
            <Icone className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{rotulo}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-lg border border-line bg-panel-2/50 p-4">
          {usuario ? (
            <>
              <p className="text-[10px] uppercase tracking-[0.2em] text-mist">Conectado</p>
              <p className="mt-1 truncate text-xs text-foreground">{nomeExibicao(usuario)}</p>
              <button
                type="button"
                onClick={async () => {
                  await sair();
                  aoNavegar?.();
                  navigate({ to: "/auth", replace: true });
                }}
                className="mt-3 inline-flex items-center gap-2 text-xs text-mist hover:text-foreground"
              >
                <LogOut className="size-3.5" aria-hidden /> Sair
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              onClick={aoNavegar}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gold hover:underline"
            >
              <LogIn className="size-3.5" aria-hidden /> Entrar
            </Link>
          )}
        </div>
      <div className="rounded-lg border border-line bg-panel-2/50 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-mist">Norma ativa</p>
        <p className="mt-1 font-mono text-xs text-foreground">
          {normas.length ? normas.join(" · ") : "Nenhuma norma cadastrada"}
        </p>
        <p className="mt-2 text-[10px] leading-relaxed text-mist/70">
          Limites configuráveis em Configurações.
        </p>
      </div>
      </div>
    </>
  );
}

export function AppSidebar() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <aside className="hidden md:flex w-[248px] shrink-0 flex-col border-r border-line bg-panel/40 min-h-screen sticky top-0 h-screen overflow-y-auto px-4 py-7">
        <Conteudo />
      </aside>

      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-panel px-4 py-3">
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={() => setAberto((v) => !v)}
          className="rounded-md border border-line p-2 text-mist hover:text-foreground"
        >
          <Menu className="size-4" aria-hidden />
        </button>
        <span className="font-serif text-lg">NEXUS</span>
      </div>

      <div
        className={cn(
          "md:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm",
          aberto ? "block" : "hidden",
        )}
        onClick={() => setAberto(false)}
      >
        <aside
          className="flex h-full w-[260px] flex-col overflow-y-auto border-r border-line bg-panel px-4 py-7"
          onClick={(e) => e.stopPropagation()}
        >
          <Conteudo aoNavegar={() => setAberto(false)} />
        </aside>
      </div>
    </>
  );
}

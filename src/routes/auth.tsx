import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSessao } from "@/lib/auth";
import { Campo } from "@/components/ui-sistema";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — NEXUS Inventário e Certificação de Rede" },
      {
        name: "description",
        content:
          "Acesse o NEXUS para gerenciar o inventário de pontos de rede, etiquetas e testes de certificação.",
      },
      { property: "og:title", content: "Entrar — NEXUS" },
      {
        property: "og:description",
        content: "Acesso ao sistema de inventário e certificação de rede.",
      },
    ],
  }),
  component: Autenticacao,
});

function Autenticacao() {
  const navigate = useNavigate();
  const { sessao, carregando } = useSessao();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!carregando && sessao) navigate({ to: "/", replace: true });
  }, [carregando, sessao, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || senha.length < 6) {
      setAviso("Informe um e-mail válido e uma senha com pelo menos 6 caracteres.");
      return;
    }
    setAviso("");
    setEnviando(true);
    try {
      if (modo === "criar") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: nome.trim() },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Conta criada. Confirme o e-mail para entrar.");
          setAviso("Enviamos um link de confirmação para o seu e-mail.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta.");
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : "Não foi possível concluir.";
      setAviso(
        msg.includes("Invalid login credentials")
          ? "E-mail ou senha incorretos."
          : msg.includes("already registered")
            ? "Este e-mail já possui conta. Faça login."
            : msg,
      );
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComGoogle() {
    setAviso("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setAviso("Não foi possível entrar com a conta Google.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Acesso</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground">NEXUS</h1>
        <p className="mt-2 text-sm text-mist">
          {modo === "entrar"
            ? "Entre para gerenciar o inventário e a certificação."
            : "Crie sua conta de acesso ao sistema."}
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-line bg-panel p-6">
        <button
          type="button"
          onClick={entrarComGoogle}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-line bg-panel-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-panel-2/70"
        >
          Continuar com Google
        </button>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-mist">ou</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={enviar} className="space-y-4">
          {modo === "criar" ? (
            <Campo rotulo="Nome">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                className="h-9 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground"
              />
            </Campo>
          ) : null}
          <Campo rotulo="E-mail">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="voce@exemplo.com"
              className="h-9 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground"
            />
          </Campo>
          <Campo rotulo="Senha">
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete={modo === "criar" ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="h-9 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground"
            />
          </Campo>

          {aviso ? <p className="text-xs text-fail">{aviso}</p> : null}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold/90 disabled:opacity-60"
          >
            {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-mist">
          {modo === "entrar" ? "Ainda não tem conta?" : "Já possui conta?"}{" "}
          <button
            type="button"
            onClick={() => {
              setModo(modo === "entrar" ? "criar" : "entrar");
              setAviso("");
            }}
            className="font-semibold text-gold hover:underline"
          >
            {modo === "entrar" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-mist">
        <Link to="/" className="hover:text-foreground">
          Ver o dashboard sem entrar
        </Link>
      </p>
    </div>
  );
}

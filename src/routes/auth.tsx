import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useSessao, salvarToken, sair } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { statusAcesso, entrarComCodigo } from "@/lib/totp.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — NEXUS Inventário e Certificação de Rede" },
      { name: "description", content: "Acesse o NEXUS com o código do Google Authenticator." },
      { property: "og:title", content: "Entrar — NEXUS" },
      { property: "og:description", content: "Acesso ao sistema de inventário e certificação de rede." },
    ],
  }),
  component: Autenticacao,
});

function Autenticacao() {
  const { etapa, carregando } = useSessao();
  if (carregando) return <p className="text-sm text-mist">Carregando…</p>;
  return etapa === "login" ? <LoginEmail /> : <Verificacao />;
}

function LoginEmail() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email || senha.length < 6) { setAviso("Informe o e-mail e uma senha com pelo menos 6 caracteres."); return; }
    setAviso(""); setEnviando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) setAviso(error.message.includes("confirm") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos.");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password: senha,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { nome } },
        });
        if (error) setAviso(error.message);
        else if (!data.session) { toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail."); setModo("entrar"); }
      }
    } finally { setEnviando(false); }
  }

  const campo = "h-11 w-full rounded-md border border-line bg-panel-2 px-3 text-sm text-foreground";
  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Etapa 1 de 2 · Login</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground">NEXUS</h1>
        <p className="mt-2 text-sm text-mist">{modo === "entrar" ? "Entre com seu e-mail e senha." : "Crie sua conta."}</p>
      </div>
      <form onSubmit={enviar} className="mt-8 space-y-4 rounded-xl border border-line bg-panel p-6">
        {modo === "criar" ? (
          <div><label htmlFor="nome" className="label-eyebrow block">Nome</label>
            <input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className={campo} /></div>
        ) : null}
        <div><label htmlFor="email" className="label-eyebrow block">E-mail</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={campo} /></div>
        <div><label htmlFor="senha" className="label-eyebrow block">Senha</label>
          <input id="senha" type="password" autoComplete={modo === "entrar" ? "current-password" : "new-password"} value={senha} onChange={(e) => setSenha(e.target.value)} className={campo} /></div>
        {aviso ? <p className="text-xs text-fail">{aviso}</p> : null}
        <button type="submit" disabled={enviando} className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold/90 disabled:opacity-60">
          {enviando ? "Aguarde…" : modo === "entrar" ? "Continuar" : "Criar conta"}
        </button>
        <button type="button" onClick={() => { setModo(modo === "entrar" ? "criar" : "entrar"); setAviso(""); }} className="w-full text-center text-xs text-mist hover:text-foreground">
          {modo === "entrar" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </form>
    </div>
  );
}

function Verificacao() {
  const navigate = useNavigate();
  const { sessao, carregando } = useSessao();
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [segredo, setSegredo] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [restante, setRestante] = useState(30);

  useEffect(() => {
    if (!carregando && sessao) navigate({ to: "/", replace: true });
  }, [carregando, sessao, navigate]);

  useEffect(() => {
    statusAcesso().then(async (s) => {
      if (!s.configurado && s.segredo) {
        setSegredo(s.segredo);
        const url = `otpauth://totp/NEXUS:Rede?secret=${s.segredo}&issuer=NEXUS&period=30&digits=6`;
        setQr(await QRCode.toDataURL(url, { margin: 1, width: 220 }));
      }
    });
    const t = setInterval(() => setRestante(30 - (Math.floor(Date.now() / 1000) % 30)), 500);
    return () => clearInterval(t);
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) { setAviso("Digite os 6 números do aplicativo."); return; }
    setAviso(""); setEnviando(true);
    try {
      const r = await entrarComCodigo({ data: { codigo } });
      if (!r.ok || !r.token) { setAviso("Código incorreto ou expirado. Use o código atual do aplicativo."); return; }
      salvarToken(r.token);
      toast.success("Acesso liberado.");
    } catch {
      setAviso("Não foi possível validar o código.");
    } finally { setEnviando(false); setCodigo(""); }
  }

  return (
    <div className="mx-auto w-full max-w-md py-6">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Etapa 2 de 2 · Verificação</p>
        <h1 className="mt-2 font-serif text-4xl text-foreground">NEXUS</h1>
        <p className="mt-2 text-sm text-mist">Digite o código de 6 números do Google Authenticator.</p>
        <button type="button" onClick={() => sair()} className="mt-2 text-xs text-mist underline hover:text-foreground">Usar outra conta</button>
      </div>

      <div className="mt-8 rounded-xl border border-line bg-panel p-6">
        {segredo ? (
          <div className="mb-6 space-y-3 text-center">
            <p className="text-xs text-mist">
              Primeira configuração: abra o Google Authenticator, toque em “+” e escaneie o QR code.
              Ele aparece só uma vez: depois do primeiro acesso, some para sempre.
            </p>
            {qr ? <img src={qr} alt="QR code para o Google Authenticator" className="mx-auto rounded-md bg-foreground p-2" /> : null}
            <p className="break-all font-mono text-[11px] text-mist">Chave manual: {segredo}</p>
          </div>
        ) : null}

        <form onSubmit={enviar} className="space-y-4">
          <label htmlFor="codigo" className="label-eyebrow block">Código de acesso</label>
          <input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="h-12 w-full rounded-md border border-line bg-panel-2 px-3 text-center font-mono text-2xl tracking-[0.5em] text-foreground"
          />
          <div className="h-1 w-full overflow-hidden rounded bg-panel-2">
            <div className="h-full bg-gold transition-all" style={{ width: `${(restante / 30) * 100}%` }} />
          </div>
          <p className="text-center text-[11px] text-mist">Nova chave em {restante}s</p>
          {aviso ? <p className="text-xs text-fail">{aviso}</p> : null}
          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-gold-foreground transition-colors hover:bg-gold/90 disabled:opacity-60"
          >
            {enviando ? "Validando…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

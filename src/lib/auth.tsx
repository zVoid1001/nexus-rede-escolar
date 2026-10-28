import { useEffect, useState } from "react";
import { validarSessao } from "@/lib/totp.functions";
import { supabase } from "@/integrations/supabase/client";

const KEY = "nexus-acesso";
const EVENTO = "nexus-acesso-mudou";

export function salvarToken(token: string) {
  localStorage.setItem(KEY, token);
  window.dispatchEvent(new Event(EVENTO));
}

export function lerToken() {
  return localStorage.getItem(KEY);
}

export type Etapa = "login" | "verificacao" | "ok";

export function useSessao() {
  const [usuario, setUsuario] = useState<{ nome: string; email: string } | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("login");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function checar() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      let totpOk = false;
      const token = localStorage.getItem(KEY);
      if (user && token) {
        try { totpOk = (await validarSessao({ data: { token } })).valido; } catch { totpOk = false; }
        if (!totpOk) localStorage.removeItem(KEY);
      }
      if (!ativo) return;
      const e: Etapa = !user ? "login" : totpOk ? "ok" : "verificacao";
      setEtapa(e);
      setUsuario(e === "ok" && user ? { nome: (user.user_metadata?.nome as string) || user.email || "Usuário", email: user.email ?? "" } : null);
      setCarregando(false);
    }
    checar();
    window.addEventListener(EVENTO, checar);
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "USER_UPDATED") checar();
    });
    return () => { ativo = false; window.removeEventListener(EVENTO, checar); sub.subscription.unsubscribe(); };
  }, []);

  return { sessao: usuario, usuario, etapa, carregando };
}

export function nomeExibicao(usuario: { nome: string } | null) {
  return usuario?.nome ?? "";
}

export async function sair() {
  localStorage.removeItem(KEY);
  await supabase.auth.signOut();
  window.dispatchEvent(new Event(EVENTO));
}

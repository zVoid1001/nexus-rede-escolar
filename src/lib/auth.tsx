import { useEffect, useState } from "react";
import { validarSessao } from "@/lib/totp.functions";

const KEY = "nexus-acesso";
const EVENTO = "nexus-acesso-mudou";

export function salvarToken(token: string) {
  localStorage.setItem(KEY, token);
  window.dispatchEvent(new Event(EVENTO));
}

export function lerToken() {
  return localStorage.getItem(KEY);
}

export function useSessao() {
  const [usuario, setUsuario] = useState<{ nome: string } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    async function checar() {
      const token = localStorage.getItem(KEY);
      let ok = false;
      if (token) {
        try { ok = (await validarSessao({ data: { token } })).valido; } catch { ok = false; }
        if (!ok) localStorage.removeItem(KEY);
      }
      if (ativo) { setUsuario(ok ? { nome: "Acesso autorizado" } : null); setCarregando(false); }
    }
    checar();
    window.addEventListener(EVENTO, checar);
    return () => { ativo = false; window.removeEventListener(EVENTO, checar); };
  }, []);

  return { sessao: usuario, usuario, carregando };
}

export function nomeExibicao(usuario: { nome: string } | null) {
  return usuario?.nome ?? "";
}

export async function sair() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENTO));
}

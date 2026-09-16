import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSessao(s);
      setCarregando(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const usuario: User | null = sessao?.user ?? null;
  return { sessao, usuario, carregando };
}

export function nomeExibicao(usuario: User | null) {
  if (!usuario) return "";
  const meta = usuario.user_metadata ?? {};
  return (meta["nome"] as string) || (meta["full_name"] as string) || usuario.email || "Usuário";
}

export async function sair() {
  await supabase.auth.signOut();
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CHAVE = "totp_configurado";

async function configurado() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("configuracoes").select("valor").eq("chave", CHAVE).maybeSingle();
  return data?.valor === "sim";
}

export const statusAcesso = createServerFn({ method: "GET" }).handler(async () => {
  const { segredoBase32 } = await import("./totp.server");
  if (await configurado()) return { configurado: true as const, segredo: null };
  const segredo = await segredoBase32();
  return { configurado: false as const, segredo };
});

export const entrarComCodigo = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ codigo: z.string().regex(/^\d{6}$/) }).parse(d))
  .handler(async ({ data }) => {
    const { verificarCodigo, criarToken } = await import("./totp.server");
    if (!(await verificarCodigo(data.codigo))) return { ok: false as const, token: null };
    if (!(await configurado())) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as any).from("configuracoes").upsert({ chave: CHAVE, valor: "sim" }, { onConflict: "chave" });
    }
    return { ok: true as const, token: await criarToken() };
  });

export const validarSessao = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: z.string().max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const { tokenValido } = await import("./totp.server");
    return { valido: await tokenValido(data.token) };
  });


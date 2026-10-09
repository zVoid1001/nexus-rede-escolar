import { useState } from "react";
import { toast } from "sonner";
import { Painel, PainelTitulo } from "@/components/ui-sistema";
import { Button } from "@/components/ui/button";
import { lerToken } from "@/lib/auth";
import { revelarAcesso } from "@/lib/totp.functions";

export function PainelAcesso() {
  const [segredo, setSegredo] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [gerando, setGerando] = useState(false);

  async function mostrar() {
    setGerando(true);
    try {
      const r = await revelarAcesso({ data: { token: lerToken() ?? "" } });
      if (!r.ok || !r.segredo) {
        toast.error("Sua sessão expirou. Entre novamente para ver o QR code.");
        return;
      }
      setSegredo(r.segredo);
      const QRCode = (await import("qrcode")).default;
      setQr(
        await QRCode.toDataURL(
          `otpauth://totp/NEXUS:Rede?secret=${r.segredo}&issuer=NEXUS&period=30&digits=6`,
          { margin: 1, width: 220 },
        ),
      );
    } catch {
      toast.error("Não foi possível mostrar o QR code.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <Painel>
      <PainelTitulo
        titulo="Acesso (Google Authenticator)"
        extra={
          <Button variant="secondary" onClick={mostrar} disabled={gerando}>
            {gerando ? "Gerando…" : segredo ? "Mostrar de novo" : "Mostrar QR code"}
          </Button>
        }
      />
      <div className="space-y-4 px-5 py-5">
        <p className="text-sm text-mist">
          O QR code aparece na tela de entrada só uma vez, no primeiro acesso. Para colocar o
          NEXUS em outro celular, toque em “Mostrar QR code” e escaneie com o Google Authenticator.
        </p>
        {segredo ? (
          <div className="space-y-3 text-center">
            {qr ? (
              <img
                src={qr}
                alt="QR code para o Google Authenticator"
                className="mx-auto rounded-md bg-foreground p-2"
              />
            ) : null}
            <p className="break-all font-mono text-[11px] text-mist">Chave manual: {segredo}</p>
          </div>
        ) : null}
      </div>
    </Painel>
  );
}

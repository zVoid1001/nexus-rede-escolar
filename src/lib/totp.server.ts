const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const enc = new TextEncoder();

function base32(bytes: Uint8Array) {
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

async function hmac(alg: "SHA-1" | "SHA-256", key: Uint8Array, data: Uint8Array) {
  const k = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: alg }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, data));
}

function chaveServidor() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET ausente");
  return enc.encode(s);
}

async function segredoTotp() {
  return (await hmac("SHA-256", chaveServidor(), enc.encode("nexus-totp-v1"))).slice(0, 20);
}

export async function segredoBase32() {
  return base32(await segredoTotp());
}

async function codigoEm(contador: number) {
  const buf = new Uint8Array(8);
  let c = contador;
  for (let i = 7; i >= 0; i--) { buf[i] = c & 0xff; c = Math.floor(c / 256); }
  const h = await hmac("SHA-1", await segredoTotp(), buf);
  const o = h[19] & 0xf;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, "0");
}

export async function verificarCodigo(codigo: string) {
  const t = Math.floor(Date.now() / 30000);
  for (const d of [-1, 0, 1]) if ((await codigoEm(t + d)) === codigo) return true;
  return false;
}

const b64 = (s: string) => btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

export async function criarToken(horas = 12) {
  const corpo = b64(JSON.stringify({ exp: Date.now() + horas * 3600_000 }));
  const sig = b64(String.fromCharCode(...(await hmac("SHA-256", chaveServidor(), enc.encode(corpo)))));
  return `${corpo}.${sig}`;
}

export async function tokenValido(token: string) {
  const [corpo, sig] = token.split(".");
  if (!corpo || !sig) return false;
  const esperado = b64(String.fromCharCode(...(await hmac("SHA-256", chaveServidor(), enc.encode(corpo)))));
  if (esperado !== sig) return false;
  try {
    const { exp } = JSON.parse(atob(corpo.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp > Date.now();
  } catch { return false; }
}

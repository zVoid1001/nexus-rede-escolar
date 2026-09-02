import type { LimiteNorma } from "./tipos";

export type ParametroChave =
  | "wire_map"
  | "comprimento"
  | "resistencia"
  | "next"
  | "return_loss"
  | "perda_insercao";

export const ROTULOS_PARAMETRO: Record<ParametroChave, string> = {
  wire_map: "Wire Map",
  comprimento: "Comprimento do cabo",
  resistencia: "Resistência",
  next: "NEXT",
  return_loss: "Return Loss",
  perda_insercao: "Perda de inserção",
};

/** Parâmetros numéricos que são comparados com os limites cadastrados. */
export const PARAMETROS_NUMERICOS: ParametroChave[] = [
  "comprimento",
  "resistencia",
  "next",
  "return_loss",
  "perda_insercao",
];

export type MedicoesTeste = {
  wire_map: boolean;
  comprimento: number | null;
  resistencia: number | null;
  next: number | null;
  return_loss: number | null;
  perda_insercao: number | null;
};

export type LinhaAvaliacao = {
  parametro: ParametroChave;
  rotulo: string;
  medido: string;
  limite: string;
  norma: string | null;
  status: "PASS" | "FAIL" | "SEM_LIMITE";
};

export type Avaliacao = {
  resultado: "PASS" | "FAIL";
  falhas: ParametroChave[];
  linhas: LinhaAvaliacao[];
};

export function descreverLimite(limite: LimiteNorma | undefined): string {
  if (!limite) return "não configurado";
  const u = limite.unidade ? ` ${limite.unidade}` : "";
  const min = limite.valor_minimo;
  const max = limite.valor_maximo;
  if (min !== null && max !== null) return `${min}${u} a ${max}${u}`;
  if (min !== null) return `≥ ${min}${u}`;
  if (max !== null) return `≤ ${max}${u}`;
  return "não configurado";
}

/**
 * Compara automaticamente cada medição com os limites cadastrados da norma.
 * O usuário nunca escolhe PASS/FAIL manualmente — o resultado é calculado aqui.
 */
export function avaliarTeste(
  medicoes: MedicoesTeste,
  limites: LimiteNorma[],
): Avaliacao {
  const linhas: LinhaAvaliacao[] = [];
  const falhas: ParametroChave[] = [];

  // Wire Map: precisa estar OK.
  linhas.push({
    parametro: "wire_map",
    rotulo: ROTULOS_PARAMETRO.wire_map,
    medido: medicoes.wire_map ? "OK" : "FALHA",
    limite: "OK",
    norma: null,
    status: medicoes.wire_map ? "PASS" : "FAIL",
  });
  if (!medicoes.wire_map) falhas.push("wire_map");

  for (const parametro of PARAMETROS_NUMERICOS) {
    const valor = medicoes[parametro];
    const limite = limites.find((l) => l.parametro === parametro);
    const unidade = limite?.unidade ? ` ${limite.unidade}` : "";
    const medido = valor === null || Number.isNaN(valor) ? "—" : `${valor}${unidade}`;

    if (!limite || (limite.valor_minimo === null && limite.valor_maximo === null)) {
      linhas.push({
        parametro,
        rotulo: ROTULOS_PARAMETRO[parametro],
        medido,
        limite: "não configurado",
        norma: limite?.norma ?? null,
        status: "SEM_LIMITE",
      });
      continue;
    }

    let status: "PASS" | "FAIL" = "PASS";
    if (valor === null || Number.isNaN(valor)) {
      status = "FAIL";
    } else {
      if (limite.valor_minimo !== null && valor < limite.valor_minimo) status = "FAIL";
      if (limite.valor_maximo !== null && valor > limite.valor_maximo) status = "FAIL";
    }
    if (status === "FAIL") falhas.push(parametro);

    linhas.push({
      parametro,
      rotulo: ROTULOS_PARAMETRO[parametro],
      medido,
      limite: descreverLimite(limite),
      norma: limite.norma,
      status,
    });
  }

  return { resultado: falhas.length === 0 ? "PASS" : "FAIL", falhas, linhas };
}

export function proximaIdentificacao(
  existentes: string[],
  prefixo: string,
  digitos: number,
): string {
  const escapado = prefixo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${escapado}(\\d+)$`);
  let maior = 0;
  for (const ident of existentes) {
    const m = re.exec(ident);
    if (m) maior = Math.max(maior, parseInt(m[1]!, 10));
  }
  return `${prefixo}${String(maior + 1).padStart(digitos, "0")}`;
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

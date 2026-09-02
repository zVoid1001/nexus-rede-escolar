export type PatchPanel = {
  id: string;
  identificacao: string;
  numero: string | null;
  numero_portas: number;
  localizacao: string | null;
  observacoes: string | null;
  created_at: string;
};

export type Switch = {
  id: string;
  identificacao: string;
  modelo: string | null;
  numero: string | null;
  numero_portas: number;
  localizacao: string | null;
  observacoes: string | null;
  created_at: string;
};

export type PontoRede = {
  id: string;
  identificacao: string;
  localizacao: string | null;
  patch_panel_id: string | null;
  porta_patch_panel: number | null;
  switch_id: string | null;
  porta_switch: number | null;
  categoria_cabo: string;
  observacoes: string | null;
  created_at: string;
};

export type CategoriaCabo = {
  id: string;
  nome: string;
  created_at: string;
};

export type LimiteNorma = {
  id: string;
  categoria_cabo: string;
  parametro: string;
  valor_minimo: number | null;
  valor_maximo: number | null;
  unidade: string | null;
  norma: string | null;
  created_at: string;
};

export type TesteCertificacao = {
  id: string;
  ponto_rede_id: string;
  categoria_cabo: string;
  data_teste: string;
  comprimento: number | null;
  wire_map: boolean;
  resistencia: number | null;
  next: number | null;
  return_loss: number | null;
  perda_insercao: number | null;
  resultado: "PASS" | "FAIL";
  falhas: string[];
  observacoes: string | null;
  created_at: string;
};

export type Configuracao = {
  chave: string;
  valor: string;
};

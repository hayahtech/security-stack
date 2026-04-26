// Praças, capitais e cidades agrícolas do Brasil com coordenadas
// Fonte de referência de praças: CEPEA/ESALQ-USP

export interface Praca {
  id: string;
  nome: string;
  uf: string;
  lat: number;
  lon: number;
  cepea: boolean; // praça oficialmente monitorada pelo CEPEA
}

export interface Estado {
  uf: string;
  nome: string;
  regiao: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
  capital: { nome: string; lat: number; lon: number };
  pracas: Praca[];
}

export const ESTADOS: Estado[] = [
  {
    uf: "AC", nome: "Acre", regiao: "Norte",
    capital: { nome: "Rio Branco", lat: -9.9754, lon: -67.8249 },
    pracas: [
      { id: "ac-rb", nome: "Rio Branco/AC", uf: "AC", lat: -9.9754, lon: -67.8249, cepea: false },
    ],
  },
  {
    uf: "AL", nome: "Alagoas", regiao: "Nordeste",
    capital: { nome: "Maceió", lat: -9.6658, lon: -35.7350 },
    pracas: [
      { id: "al-mc", nome: "Maceió/AL", uf: "AL", lat: -9.6658, lon: -35.7350, cepea: false },
    ],
  },
  {
    uf: "AM", nome: "Amazonas", regiao: "Norte",
    capital: { nome: "Manaus", lat: -3.1190, lon: -60.0217 },
    pracas: [
      { id: "am-mn", nome: "Manaus/AM", uf: "AM", lat: -3.1190, lon: -60.0217, cepea: false },
    ],
  },
  {
    uf: "AP", nome: "Amapá", regiao: "Norte",
    capital: { nome: "Macapá", lat: 0.0349, lon: -51.0694 },
    pracas: [
      { id: "ap-mc", nome: "Macapá/AP", uf: "AP", lat: 0.0349, lon: -51.0694, cepea: false },
    ],
  },
  {
    uf: "BA", nome: "Bahia", regiao: "Nordeste",
    capital: { nome: "Salvador", lat: -12.9714, lon: -38.5014 },
    pracas: [
      { id: "ba-br", nome: "Barreiras/BA", uf: "BA", lat: -12.1522, lon: -44.9897, cepea: true },
      { id: "ba-fs", nome: "Feira de Santana/BA", uf: "BA", lat: -12.2664, lon: -38.9663, cepea: false },
      { id: "ba-vi", nome: "Vitória da Conquista/BA", uf: "BA", lat: -14.8661, lon: -40.8444, cepea: false },
    ],
  },
  {
    uf: "CE", nome: "Ceará", regiao: "Nordeste",
    capital: { nome: "Fortaleza", lat: -3.7172, lon: -38.5433 },
    pracas: [
      { id: "ce-ft", nome: "Fortaleza/CE", uf: "CE", lat: -3.7172, lon: -38.5433, cepea: false },
      { id: "ce-sq", nome: "Sobral/CE", uf: "CE", lat: -3.6861, lon: -40.3491, cepea: false },
    ],
  },
  {
    uf: "DF", nome: "Distrito Federal", regiao: "Centro-Oeste",
    capital: { nome: "Brasília", lat: -15.7942, lon: -47.8822 },
    pracas: [
      { id: "df-bs", nome: "Brasília/DF", uf: "DF", lat: -15.7942, lon: -47.8822, cepea: false },
    ],
  },
  {
    uf: "ES", nome: "Espírito Santo", regiao: "Sudeste",
    capital: { nome: "Vitória", lat: -20.3155, lon: -40.3128 },
    pracas: [
      { id: "es-ca", nome: "Cachoeiro de Itapemirim/ES", uf: "ES", lat: -20.8490, lon: -41.1136, cepea: false },
    ],
  },
  {
    uf: "GO", nome: "Goiás", regiao: "Centro-Oeste",
    capital: { nome: "Goiânia", lat: -16.6869, lon: -49.2648 },
    pracas: [
      { id: "go-gn", nome: "Goiânia/GO", uf: "GO", lat: -16.6869, lon: -49.2648, cepea: true },
      { id: "go-rv", nome: "Rio Verde/GO", uf: "GO", lat: -17.7992, lon: -50.9278, cepea: true },
      { id: "go-ng", nome: "Norte de Goiás/GO", uf: "GO", lat: -13.5180, lon: -49.0590, cepea: true },
    ],
  },
  {
    uf: "MA", nome: "Maranhão", regiao: "Nordeste",
    capital: { nome: "São Luís", lat: -2.5297, lon: -44.3028 },
    pracas: [
      { id: "ma-im", nome: "Imperatriz/MA", uf: "MA", lat: -5.5248, lon: -47.4927, cepea: false },
      { id: "ma-ba", nome: "Balsas/MA", uf: "MA", lat: -7.5322, lon: -46.0354, cepea: false },
      { id: "ma-ac", nome: "Açailândia/MA", uf: "MA", lat: -4.9474, lon: -47.5003, cepea: false },
      { id: "ma-sl", nome: "São Luís/MA", uf: "MA", lat: -2.5297, lon: -44.3028, cepea: false },
    ],
  },
  {
    uf: "MG", nome: "Minas Gerais", regiao: "Sudeste",
    capital: { nome: "Belo Horizonte", lat: -19.9167, lon: -43.9345 },
    pracas: [
      { id: "mg-ub", nome: "Uberaba/MG", uf: "MG", lat: -19.7472, lon: -47.9318, cepea: true },
      { id: "mg-ul", nome: "Uberlândia/MG", uf: "MG", lat: -18.9186, lon: -48.2772, cepea: false },
      { id: "mg-jf", nome: "Juiz de Fora/MG", uf: "MG", lat: -21.7642, lon: -43.3503, cepea: false },
    ],
  },
  {
    uf: "MS", nome: "Mato Grosso do Sul", regiao: "Centro-Oeste",
    capital: { nome: "Campo Grande", lat: -20.4697, lon: -54.6201 },
    pracas: [
      { id: "ms-cg", nome: "Campo Grande/MS", uf: "MS", lat: -20.4697, lon: -54.6201, cepea: true },
      { id: "ms-tr", nome: "Três Lagoas/MS", uf: "MS", lat: -20.7849, lon: -51.7003, cepea: false },
    ],
  },
  {
    uf: "MT", nome: "Mato Grosso", regiao: "Centro-Oeste",
    capital: { nome: "Cuiabá", lat: -15.6014, lon: -56.0979 },
    pracas: [
      { id: "mt-bg", nome: "Barra do Garças/MT", uf: "MT", lat: -15.8897, lon: -52.2566, cepea: true },
      { id: "mt-cb", nome: "Cuiabá/MT", uf: "MT", lat: -15.6014, lon: -56.0979, cepea: true },
      { id: "mt-af", nome: "Alta Floresta/MT", uf: "MT", lat: -9.8756, lon: -56.0861, cepea: false },
      { id: "mt-sn", nome: "Sinop/MT", uf: "MT", lat: -11.8642, lon: -55.5069, cepea: false },
    ],
  },
  {
    uf: "PA", nome: "Pará", regiao: "Norte",
    capital: { nome: "Belém", lat: -1.4558, lon: -48.5044 },
    pracas: [
      { id: "pa-re", nome: "Redenção/PA", uf: "PA", lat: -8.0264, lon: -49.9732, cepea: true },
      { id: "pa-mb", nome: "Marabá/PA", uf: "PA", lat: -5.3686, lon: -49.1178, cepea: true },
      { id: "pa-pg", nome: "Paragominas/PA", uf: "PA", lat: -2.9936, lon: -47.3488, cepea: true },
      { id: "pa-bl", nome: "Belém/PA", uf: "PA", lat: -1.4558, lon: -48.5044, cepea: false },
      { id: "pa-st", nome: "Santarém/PA", uf: "PA", lat: -2.4490, lon: -54.7081, cepea: false },
    ],
  },
  {
    uf: "PB", nome: "Paraíba", regiao: "Nordeste",
    capital: { nome: "João Pessoa", lat: -7.1195, lon: -34.8450 },
    pracas: [
      { id: "pb-jp", nome: "João Pessoa/PB", uf: "PB", lat: -7.1195, lon: -34.8450, cepea: false },
    ],
  },
  {
    uf: "PE", nome: "Pernambuco", regiao: "Nordeste",
    capital: { nome: "Recife", lat: -8.0476, lon: -34.8770 },
    pracas: [
      { id: "pe-rc", nome: "Recife/PE", uf: "PE", lat: -8.0476, lon: -34.8770, cepea: false },
      { id: "pe-pt", nome: "Petrolina/PE", uf: "PE", lat: -9.3876, lon: -40.5026, cepea: false },
    ],
  },
  {
    uf: "PI", nome: "Piauí", regiao: "Nordeste",
    capital: { nome: "Teresina", lat: -5.0892, lon: -42.8019 },
    pracas: [
      { id: "pi-tr", nome: "Teresina/PI", uf: "PI", lat: -5.0892, lon: -42.8019, cepea: false },
      { id: "pi-pn", nome: "Picos/PI", uf: "PI", lat: -7.0769, lon: -41.4677, cepea: false },
    ],
  },
  {
    uf: "PR", nome: "Paraná", regiao: "Sul",
    capital: { nome: "Curitiba", lat: -25.4284, lon: -49.2733 },
    pracas: [
      { id: "pr-cs", nome: "Cascavel/PR", uf: "PR", lat: -24.9556, lon: -53.4553, cepea: true },
      { id: "pr-ld", nome: "Londrina/PR", uf: "PR", lat: -23.3045, lon: -51.1696, cepea: false },
    ],
  },
  {
    uf: "RJ", nome: "Rio de Janeiro", regiao: "Sudeste",
    capital: { nome: "Rio de Janeiro", lat: -22.9068, lon: -43.1729 },
    pracas: [
      { id: "rj-cj", nome: "Campos dos Goytacazes/RJ", uf: "RJ", lat: -21.7545, lon: -41.3244, cepea: false },
    ],
  },
  {
    uf: "RN", nome: "Rio Grande do Norte", regiao: "Nordeste",
    capital: { nome: "Natal", lat: -5.7945, lon: -35.2110 },
    pracas: [
      { id: "rn-nt", nome: "Natal/RN", uf: "RN", lat: -5.7945, lon: -35.2110, cepea: false },
    ],
  },
  {
    uf: "RO", nome: "Rondônia", regiao: "Norte",
    capital: { nome: "Porto Velho", lat: -8.7612, lon: -63.9004 },
    pracas: [
      { id: "ro-pv", nome: "Porto Velho/RO", uf: "RO", lat: -8.7612, lon: -63.9004, cepea: true },
      { id: "ro-jp", nome: "Ji-Paraná/RO", uf: "RO", lat: -10.8780, lon: -61.9463, cepea: false },
      { id: "ro-vg", nome: "Vilhena/RO", uf: "RO", lat: -12.7406, lon: -60.1461, cepea: false },
    ],
  },
  {
    uf: "RR", nome: "Roraima", regiao: "Norte",
    capital: { nome: "Boa Vista", lat: 2.8235, lon: -60.6758 },
    pracas: [
      { id: "rr-bv", nome: "Boa Vista/RR", uf: "RR", lat: 2.8235, lon: -60.6758, cepea: false },
    ],
  },
  {
    uf: "RS", nome: "Rio Grande do Sul", regiao: "Sul",
    capital: { nome: "Porto Alegre", lat: -30.0346, lon: -51.2177 },
    pracas: [
      { id: "rs-pa", nome: "Porto Alegre/RS", uf: "RS", lat: -30.0346, lon: -51.2177, cepea: true },
      { id: "rs-sm", nome: "Santa Maria/RS", uf: "RS", lat: -29.6842, lon: -53.8069, cepea: false },
      { id: "rs-ca", nome: "Cruz Alta/RS", uf: "RS", lat: -28.6386, lon: -53.6063, cepea: false },
    ],
  },
  {
    uf: "SC", nome: "Santa Catarina", regiao: "Sul",
    capital: { nome: "Florianópolis", lat: -27.5954, lon: -48.5480 },
    pracas: [
      { id: "sc-cp", nome: "Chapecó/SC", uf: "SC", lat: -27.1005, lon: -52.6156, cepea: false },
      { id: "sc-lj", nome: "Lages/SC", uf: "SC", lat: -27.8159, lon: -50.3258, cepea: false },
    ],
  },
  {
    uf: "SE", nome: "Sergipe", regiao: "Nordeste",
    capital: { nome: "Aracaju", lat: -10.9472, lon: -37.0731 },
    pracas: [
      { id: "se-aj", nome: "Aracaju/SE", uf: "SE", lat: -10.9472, lon: -37.0731, cepea: false },
    ],
  },
  {
    uf: "SP", nome: "São Paulo", regiao: "Sudeste",
    capital: { nome: "São Paulo", lat: -23.5505, lon: -46.6333 },
    pracas: [
      { id: "sp-ac", nome: "Araçatuba/SP", uf: "SP", lat: -21.2090, lon: -50.4329, cepea: true },
      { id: "sp-rp", nome: "Ribeirão Preto/SP", uf: "SP", lat: -21.1775, lon: -47.8103, cepea: true },
      { id: "sp-bt", nome: "Barretos/SP", uf: "SP", lat: -20.5573, lon: -48.5670, cepea: true },
      { id: "sp-pp", nome: "Presidente Prudente/SP", uf: "SP", lat: -22.1208, lon: -51.3883, cepea: true },
      { id: "sp-sr", nome: "São José do Rio Preto/SP", uf: "SP", lat: -20.8118, lon: -49.3758, cepea: true },
    ],
  },
  {
    uf: "TO", nome: "Tocantins", regiao: "Norte",
    capital: { nome: "Palmas", lat: -10.2491, lon: -48.3243 },
    pracas: [
      { id: "to-ag", nome: "Araguaína/TO", uf: "TO", lat: -7.1908, lon: -48.2040, cepea: true },
      { id: "to-gp", nome: "Gurupi/TO", uf: "TO", lat: -11.7297, lon: -49.0707, cepea: false },
      { id: "to-pl", nome: "Palmas/TO", uf: "TO", lat: -10.2491, lon: -48.3243, cepea: false },
    ],
  },
];

export const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"] as const;

export function getEstadoByUF(uf: string): Estado | undefined {
  return ESTADOS.find((e) => e.uf === uf);
}

export function getPracasByUF(uf: string): Praca[] {
  return getEstadoByUF(uf)?.pracas ?? [];
}

export function getPracaById(id: string): Praca | undefined {
  return ESTADOS.flatMap((e) => e.pracas).find((p) => p.id === id);
}

export function getEstadosByRegiao(regiao: string): Estado[] {
  return ESTADOS.filter((e) => e.regiao === regiao);
}

// Praças prioritárias para PA, MA, TO (foco comercial inicial)
export const PRACAS_PRIORITARIAS = ["pa-re", "pa-mb", "pa-pg", "ma-im", "ma-ba", "to-ag", "to-pl"];

// Praça especial: Indicador Nacional CEPEA/ESALQ (dados reais importados)
export const PRACA_INDICADOR_NACIONAL: Praca = {
  id: "nacional-cepea",
  nome: "Indicador Nacional CEPEA/ESALQ",
  uf: "BR",
  lat: -15.7942,
  lon: -47.8822,
  cepea: true,
};

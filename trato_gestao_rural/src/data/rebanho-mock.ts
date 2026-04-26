export type Especie = "bovino" | "equino" | "caprino" | "suino" | "avicola" | "outro";
export type Sexo = "M" | "F";
export type AnimalStatus = "ativo" | "vendido" | "morto" | "abatido" | "descartado";
export type OriginType = "nascido" | "comprado" | "trocado" | "doado";

export const originLabel: Record<OriginType, string> = {
  nascido: "Nascido na fazenda", comprado: "Comprado", trocado: "Trocado", doado: "Doado",
};

export const originBadge: Record<OriginType, { color: string; icon: string }> = {
  nascido: { color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300", icon: "🏠" },
  comprado: { color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300", icon: "🛒" },
  trocado: { color: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300", icon: "🔄" },
  doado: { color: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300", icon: "🎁" },
};

// ── Animal Category ──
export type AnimalCategory =
  | "bezerra" | "novilha" | "novilha_reposicao" | "vaca" | "vaca_prenha" | "vaca_leiteira"
  | "bezerro" | "novilho" | "boi" | "boi_gordo" | "garrote" | "touro"
  | "egua" | "potro" | "potra" | "garanhao" | "cabrito" | "cabra" | "bode"
  | "leitao" | "porca" | "cachaço" | "ave_macho" | "ave_femea" | "outro_animal";

export const categoryLabel: Record<AnimalCategory, string> = {
  bezerra: "Bezerra", novilha: "Novilha", novilha_reposicao: "Novilha de Reposição",
  vaca: "Vaca", vaca_prenha: "Vaca Prenha", vaca_leiteira: "Vaca Leiteira",
  bezerro: "Bezerro", novilho: "Novilho", boi: "Boi", boi_gordo: "Boi Gordo",
  garrote: "Garrote", touro: "Touro",
  egua: "Égua", potro: "Potro", potra: "Potra", garanhao: "Garanhão",
  cabrito: "Cabrito", cabra: "Cabra", bode: "Bode",
  leitao: "Leitão", porca: "Porca", cachaço: "Cachaço",
  ave_macho: "Ave (M)", ave_femea: "Ave (F)", outro_animal: "Outro",
};

export const categoryColor: Record<AnimalCategory, string> = {
  bezerra: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300",
  bezerro: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300",
  novilha: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300",
  novilha_reposicao: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300",
  novilho: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300",
  vaca: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
  vaca_prenha: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 border-pink-300",
  vaca_leiteira: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300",
  touro: "bg-red-200 text-red-900 dark:bg-red-900/40 dark:text-red-300 border-red-400",
  boi: "bg-amber-200 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300 border-amber-400",
  boi_gordo: "bg-orange-200 text-orange-900 dark:bg-orange-900/40 dark:text-orange-300 border-orange-400",
  garrote: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
  egua: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300",
  potro: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300",
  potra: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300",
  garanhao: "bg-violet-200 text-violet-900 dark:bg-violet-900/40 dark:text-violet-300 border-violet-400",
  cabrito: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300 border-lime-300",
  cabra: "bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300 border-lime-300",
  bode: "bg-lime-200 text-lime-900 dark:bg-lime-900/40 dark:text-lime-300 border-lime-400",
  leitao: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300",
  porca: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300",
  cachaço: "bg-rose-200 text-rose-900 dark:bg-rose-900/40 dark:text-rose-300 border-rose-400",
  ave_macho: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300",
  ave_femea: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300",
  outro_animal: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300",
};

/** Calculate animal category based on species, sex, age, and flags */
export function calcAnimalCategory(animal: Animal): AnimalCategory {
  const now = new Date();
  const birth = new Date(animal.birth_date);
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  const weightArroba = animal.current_weight / 30;

  if (animal.species === "bovino") {
    if (animal.sex === "F") {
      if (months <= 12) return "bezerra";
      if (animal.first_calving_date) {
        // Has calved — she's a cow. Check subtypes.
        return "vaca"; // simplified; vaca_prenha/leiteira need repro/milk data
      }
      if (months > 24 && animal.is_breeder) return "novilha_reposicao";
      if (months <= 24) return "novilha";
      return "vaca";
    } else {
      if (months <= 12) return "bezerro";
      if (animal.is_castrated) {
        if (months > 24 && weightArroba >= 16) return "boi_gordo";
        return "boi";
      }
      if (months > 24 && animal.is_breeder) return "touro";
      if (months <= 24) return "garrote";
      return "novilho";
    }
  }

  if (animal.species === "equino") {
    if (months <= 12) return animal.sex === "M" ? "potro" : "potra";
    if (animal.sex === "M") return animal.is_breeder ? "garanhao" : "potro";
    return "egua";
  }

  if (animal.species === "caprino") {
    if (months <= 6) return "cabrito";
    return animal.sex === "M" ? "bode" : "cabra";
  }

  if (animal.species === "suino") {
    if (months <= 4) return "leitao";
    return animal.sex === "M" ? "cachaço" : "porca";
  }

  if (animal.species === "avicola") {
    return animal.sex === "M" ? "ave_macho" : "ave_femea";
  }

  return "outro_animal";
}

export type EidType = "fdx-b" | "hdx" | "uhf" | "ble";

export const eidTypeLabels: Record<EidType, string> = {
  "fdx-b": "FDX-B", hdx: "HDX", uhf: "UHF", ble: "Bluetooth LE",
};

export interface Animal {
  id: string;
  ear_tag: string;
  eid: string | null;
  eid_type: EidType | null;
  name: string;
  species: Especie;
  breed: string;
  sex: Sexo;
  birth_date: string;
  purchase_date: string | null;
  origin_type: OriginType;
  origin_notes: string;
  dam_id: string | null;
  dam_ear_tag: string;
  sire_id: string | null;
  sire_ear_tag: string;
  current_status: AnimalStatus;
  is_breeder: boolean;
  is_castrated: boolean;
  first_calving_date: string | null;
  paddock: string;
  current_weight: number;
  notes: string;
}

export const paddocks = [
  "Pasto Norte", "Pasto Sul", "Pasto Leste", "Curral 1", "Curral 2",
  "Piquete Maternidade", "Pasto Grande", "Confinamento",
];

export const breeds: Record<Especie, string[]> = {
  bovino: ["Nelore", "Angus", "Brahman", "Gir", "Girolando", "Holandês", "Senepol", "Tabapuã"],
  equino: ["Mangalarga", "Quarto de Milha", "Crioulo", "Árabe"],
  caprino: ["Saanen", "Boer", "Anglo-Nubiana", "Alpina"],
  suino: ["Landrace", "Large White", "Duroc", "Pietrain"],
  avicola: ["Caipira", "Poedeira", "Corte"],
  outro: ["Mestiço", "SRD"],
};

export const speciesLabels: Record<Especie, string> = {
  bovino: "Bovino", equino: "Equino", caprino: "Caprino",
  suino: "Suíno", avicola: "Avícola", outro: "Outro",
};

export const statusLabels: Record<AnimalStatus, string> = {
  ativo: "Ativo", vendido: "Vendido", morto: "Morto",
  abatido: "Abatido", descartado: "Descartado",
};

export const statusColors: Record<AnimalStatus, string> = {
  ativo: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  vendido: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  morto: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  abatido: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  descartado: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
};

function age(birth: string): string {
  const d = new Date(birth);
  const now = new Date();
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (months < 12) return `${months}m`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m > 0 ? `${y}a ${m}m` : `${y}a`;
}
export { age };

export const mockAnimals: Animal[] = [
  {
    id: "an-1", ear_tag: "BR001", eid: "982000123456789", eid_type: "fdx-b", name: "Estrela", species: "bovino", breed: "Nelore",
    sex: "F", birth_date: "2021-06-15", purchase_date: null, origin_type: "nascido", origin_notes: "",
    dam_id: null, dam_ear_tag: "BR-EXT-100", sire_id: null, sire_ear_tag: "BR-EXT-200",
    current_status: "ativo", is_breeder: true, is_castrated: false,
    first_calving_date: "2024-03-10", paddock: "Pasto Norte", current_weight: 480, notes: "Excelente produtora",
  },
  {
    id: "an-2", ear_tag: "BR002", eid: "982000123456790", eid_type: "fdx-b", name: "Trovão", species: "bovino", breed: "Angus",
    sex: "M", birth_date: "2020-02-20", purchase_date: "2020-05-10", origin_type: "comprado", origin_notes: "Leilão Agropec 2020",
    dam_id: null, dam_ear_tag: "", sire_id: null, sire_ear_tag: "",
    current_status: "ativo", is_breeder: true, is_castrated: false,
    first_calving_date: null, paddock: "Pasto Sul", current_weight: 720, notes: "Touro reprodutor principal",
  },
  {
    id: "an-3", ear_tag: "BR003", eid: null, eid_type: null, name: "Mimosa", species: "bovino", breed: "Girolando",
    sex: "F", birth_date: "2022-09-08", purchase_date: null, origin_type: "nascido", origin_notes: "",
    dam_id: "an-1", dam_ear_tag: "BR001", sire_id: "an-2", sire_ear_tag: "BR002",
    current_status: "ativo", is_breeder: false, is_castrated: false,
    first_calving_date: null, paddock: "Piquete Maternidade", current_weight: 350, notes: "",
  },
  {
    id: "an-4", ear_tag: "BR004", eid: null, eid_type: null, name: "Relâmpago", species: "equino", breed: "Quarto de Milha",
    sex: "M", birth_date: "2019-01-12", purchase_date: "2019-06-20", origin_type: "comprado", origin_notes: "Haras São José",
    dam_id: null, dam_ear_tag: "", sire_id: null, sire_ear_tag: "",
    current_status: "ativo", is_breeder: false, is_castrated: true,
    first_calving_date: null, paddock: "Curral 1", current_weight: 450, notes: "Cavalo de trabalho",
  },
  {
    id: "an-5", ear_tag: "BR005", eid: "E20034120512345678", eid_type: "uhf", name: "Branca", species: "caprino", breed: "Saanen",
    sex: "F", birth_date: "2023-04-02", purchase_date: null, origin_type: "doado", origin_notes: "Vizinho Sr. João",
    dam_id: null, dam_ear_tag: "", sire_id: null, sire_ear_tag: "",
    current_status: "ativo", is_breeder: false, is_castrated: false,
    first_calving_date: null, paddock: "Curral 2", current_weight: 55, notes: "",
  },
  {
    id: "an-6", ear_tag: "BR006", eid: "982000123456792", eid_type: "hdx", name: "Pintado", species: "bovino", breed: "Brahman",
    sex: "M", birth_date: "2023-11-20", purchase_date: null, origin_type: "nascido", origin_notes: "",
    dam_id: "an-1", dam_ear_tag: "BR001", sire_id: "an-2", sire_ear_tag: "BR002",
    current_status: "ativo", is_breeder: false, is_castrated: false,
    first_calving_date: null, paddock: "Pasto Norte", current_weight: 180, notes: "Bezerro",
  },
  {
    id: "an-7", ear_tag: "BR007", eid: null, eid_type: null, name: "Valente", species: "bovino", breed: "Nelore",
    sex: "M", birth_date: "2018-07-30", purchase_date: "2019-01-15", origin_type: "comprado", origin_notes: "Fazenda Boa Vista",
    dam_id: null, dam_ear_tag: "", sire_id: null, sire_ear_tag: "",
    current_status: "vendido", is_breeder: false, is_castrated: true,
    first_calving_date: null, paddock: "", current_weight: 680, notes: "Vendido em Jan/2026",
  },
  {
    id: "an-8", ear_tag: "BR008", eid: null, eid_type: null, name: "Rosinha", species: "suino", breed: "Landrace",
    sex: "F", birth_date: "2024-01-15", purchase_date: null, origin_type: "nascido", origin_notes: "",
    dam_id: null, dam_ear_tag: "", sire_id: null, sire_ear_tag: "",
    current_status: "ativo", is_breeder: false, is_castrated: false,
    first_calving_date: null, paddock: "Curral 2", current_weight: 95, notes: "",
  },
  {
    id: "an-9", ear_tag: "BR009", eid: null, eid_type: null, name: "Ligeiro", species: "bovino", breed: "Senepol",
    sex: "M", birth_date: "2022-03-10", purchase_date: "2022-04-25", origin_type: "comprado", origin_notes: "Leilão Virtual",
    dam_id: null, dam_ear_tag: "", sire_id: null, sire_ear_tag: "",
    current_status: "ativo", is_breeder: true, is_castrated: false,
    first_calving_date: null, paddock: "Pasto Grande", current_weight: 610, notes: "",
  },
  {
    id: "an-10", ear_tag: "BR010", eid: "982000123456795", eid_type: "fdx-b", name: "Boneca", species: "bovino", breed: "Gir",
    sex: "F", birth_date: "2020-12-05", purchase_date: null, origin_type: "nascido", origin_notes: "",
    dam_id: null, dam_ear_tag: "BR-EXT-300", sire_id: null, sire_ear_tag: "",
    current_status: "ativo", is_breeder: true, is_castrated: false,
    first_calving_date: "2023-11-15", paddock: "Pasto Leste", current_weight: 510, notes: "Boa leiteira",
  },
];

export interface CategoryItem {
  id: string;
  name: string;
  emoji: string;
  color: string;
  domain: "pessoal" | "empresarial" | "ambos";
  keywords: string[];
  active: boolean;
  subcategories: SubcategoryItem[];
  order: number;
  transactionCount: number;
}

export interface SubcategoryItem {
  id: string;
  name: string;
  keywords: string[];
  active: boolean;
  order: number;
  transactionCount: number;
}

export const CATEGORY_COLORS = [
  "#1A6B3C", "#2563EB", "#DC2626", "#F59E0B", "#8B5CF6", "#EC4899",
  "#14B8A6", "#F97316", "#6366F1", "#84CC16", "#06B6D4", "#A855F7",
];

export const CATEGORY_EMOJIS = [
  "🏠", "🛒", "🚗", "💊", "📚", "🎬", "👕", "🐾", "💇", "🎁",
  "💰", "📦", "👤", "🏢", "📊", "⚖️", "🔧", "🚚", "📋", "💳",
  "🏭", "📱", "🍽️", "✈️", "⛽", "🏋️", "🎮", "💻", "🏥", "🎓",
];

export const defaultPersonalCategories: CategoryItem[] = [
  {
    id: "cp1", name: "Moradia", emoji: "🏠", color: "#2563EB", domain: "pessoal",
    keywords: ["aluguel", "condomínio", "iptu", "casa"], active: true, order: 1, transactionCount: 45,
    subcategories: [
      { id: "sp1", name: "Aluguel", keywords: ["aluguel", "locação"], active: true, order: 1, transactionCount: 12 },
      { id: "sp2", name: "Condomínio", keywords: ["condomínio", "condo"], active: true, order: 2, transactionCount: 12 },
      { id: "sp3", name: "IPTU", keywords: ["iptu", "imposto predial"], active: true, order: 3, transactionCount: 3 },
      { id: "sp4", name: "Água", keywords: ["água", "saneamento", "sabesp", "copasa"], active: true, order: 4, transactionCount: 6 },
      { id: "sp5", name: "Luz", keywords: ["luz", "energia", "cemig", "enel", "cpfl"], active: true, order: 5, transactionCount: 6 },
      { id: "sp6", name: "Gás", keywords: ["gás", "comgas", "ultragaz"], active: true, order: 6, transactionCount: 3 },
      { id: "sp7", name: "Internet", keywords: ["internet", "fibra", "vivo", "claro", "tim"], active: true, order: 7, transactionCount: 3 },
    ],
  },
  {
    id: "cp2", name: "Alimentação", emoji: "🛒", color: "#14B8A6", domain: "pessoal",
    keywords: ["mercado", "supermercado", "alimentação"], active: true, order: 2, transactionCount: 78,
    subcategories: [
      { id: "sp8", name: "Mercado", keywords: ["mercado", "supermercado", "hortifruti"], active: true, order: 1, transactionCount: 30 },
      { id: "sp9", name: "Restaurante", keywords: ["restaurante", "almoço", "jantar"], active: true, order: 2, transactionCount: 22 },
      { id: "sp10", name: "Delivery", keywords: ["ifood", "rappi", "delivery", "uber eats"], active: true, order: 3, transactionCount: 18 },
      { id: "sp11", name: "Padaria", keywords: ["padaria", "pão", "confeitaria"], active: true, order: 4, transactionCount: 5 },
      { id: "sp12", name: "Feira", keywords: ["feira", "sacolão", "orgânico"], active: true, order: 5, transactionCount: 3 },
    ],
  },
  {
    id: "cp3", name: "Transporte", emoji: "🚗", color: "#F59E0B", domain: "pessoal",
    keywords: ["transporte", "combustível", "uber"], active: true, order: 3, transactionCount: 42,
    subcategories: [
      { id: "sp13", name: "Combustível", keywords: ["combustível", "gasolina", "etanol", "diesel", "posto"], active: true, order: 1, transactionCount: 15 },
      { id: "sp14", name: "Uber/99", keywords: ["uber", "99", "cabify", "corrida"], active: true, order: 2, transactionCount: 12 },
      { id: "sp15", name: "Estacionamento", keywords: ["estacionamento", "parking", "zona azul"], active: true, order: 3, transactionCount: 5 },
      { id: "sp16", name: "Pedágio", keywords: ["pedágio", "sem parar", "conectcar"], active: true, order: 4, transactionCount: 4 },
      { id: "sp17", name: "Manutenção Veículo", keywords: ["oficina", "revisão", "pneu", "óleo"], active: true, order: 5, transactionCount: 3 },
      { id: "sp18", name: "IPVA/Seguro", keywords: ["ipva", "seguro auto", "dpvat"], active: true, order: 6, transactionCount: 3 },
    ],
  },
  {
    id: "cp4", name: "Saúde", emoji: "💊", color: "#DC2626", domain: "pessoal",
    keywords: ["saúde", "médico", "farmácia"], active: true, order: 4, transactionCount: 25,
    subcategories: [
      { id: "sp19", name: "Médico", keywords: ["médico", "consulta", "clínica"], active: true, order: 1, transactionCount: 5 },
      { id: "sp20", name: "Dentista", keywords: ["dentista", "odonto"], active: true, order: 2, transactionCount: 3 },
      { id: "sp21", name: "Farmácia", keywords: ["farmácia", "drogaria", "remédio", "medicamento"], active: true, order: 3, transactionCount: 10 },
      { id: "sp22", name: "Exames", keywords: ["exame", "laboratório", "hemograma"], active: true, order: 4, transactionCount: 4 },
      { id: "sp23", name: "Plano de Saúde", keywords: ["plano de saúde", "unimed", "amil", "bradesco saúde"], active: true, order: 5, transactionCount: 3 },
    ],
  },
  {
    id: "cp5", name: "Educação", emoji: "📚", color: "#8B5CF6", domain: "pessoal",
    keywords: ["educação", "escola", "faculdade"], active: true, order: 5, transactionCount: 15,
    subcategories: [
      { id: "sp24", name: "Escola", keywords: ["escola", "colégio", "mensalidade escolar"], active: true, order: 1, transactionCount: 6 },
      { id: "sp25", name: "Faculdade", keywords: ["faculdade", "universidade", "graduação"], active: true, order: 2, transactionCount: 0 },
      { id: "sp26", name: "Cursos", keywords: ["curso", "workshop", "treinamento"], active: true, order: 3, transactionCount: 5 },
      { id: "sp27", name: "Material", keywords: ["material escolar", "livro", "apostila"], active: true, order: 4, transactionCount: 4 },
    ],
  },
  {
    id: "cp6", name: "Lazer", emoji: "🎬", color: "#EC4899", domain: "pessoal",
    keywords: ["lazer", "entretenimento", "diversão"], active: true, order: 6, transactionCount: 30,
    subcategories: [
      { id: "sp28", name: "Cinema", keywords: ["cinema", "ingresso", "filme"], active: true, order: 1, transactionCount: 4 },
      { id: "sp29", name: "Viagem", keywords: ["viagem", "hotel", "passagem", "airbnb"], active: true, order: 2, transactionCount: 5 },
      { id: "sp30", name: "Academia", keywords: ["academia", "smartfit", "musculação"], active: true, order: 3, transactionCount: 6 },
      { id: "sp31", name: "Streaming", keywords: ["netflix", "spotify", "disney", "hbo", "prime"], active: true, order: 4, transactionCount: 12 },
      { id: "sp32", name: "Jogos", keywords: ["jogo", "game", "steam", "playstation", "xbox"], active: true, order: 5, transactionCount: 3 },
    ],
  },
  {
    id: "cp7", name: "Vestuário", emoji: "👕", color: "#F97316", domain: "pessoal",
    keywords: ["roupa", "vestuário", "calçado"], active: true, order: 7, transactionCount: 12,
    subcategories: [
      { id: "sp33", name: "Roupas", keywords: ["roupa", "camiseta", "calça", "vestido"], active: true, order: 1, transactionCount: 6 },
      { id: "sp34", name: "Calçados", keywords: ["calçado", "sapato", "tênis", "bota"], active: true, order: 2, transactionCount: 3 },
      { id: "sp35", name: "Acessórios", keywords: ["acessório", "bolsa", "relógio", "óculos"], active: true, order: 3, transactionCount: 3 },
    ],
  },
  {
    id: "cp8", name: "Pets", emoji: "🐾", color: "#84CC16", domain: "pessoal",
    keywords: ["pet", "animal", "cachorro", "gato"], active: true, order: 8, transactionCount: 8,
    subcategories: [
      { id: "sp36", name: "Ração", keywords: ["ração", "petisco", "pet food"], active: true, order: 1, transactionCount: 4 },
      { id: "sp37", name: "Veterinário", keywords: ["veterinário", "vet", "vacina pet"], active: true, order: 2, transactionCount: 2 },
      { id: "sp38", name: "Banho/Tosa", keywords: ["banho", "tosa", "petshop"], active: true, order: 3, transactionCount: 2 },
    ],
  },
  {
    id: "cp9", name: "Beleza", emoji: "💇", color: "#A855F7", domain: "pessoal",
    keywords: ["beleza", "estética"], active: true, order: 9, transactionCount: 6,
    subcategories: [
      { id: "sp39", name: "Salão", keywords: ["salão", "cabeleireiro", "corte"], active: true, order: 1, transactionCount: 3 },
      { id: "sp40", name: "Barbearia", keywords: ["barbearia", "barba"], active: true, order: 2, transactionCount: 2 },
      { id: "sp41", name: "Cosméticos", keywords: ["cosmético", "maquiagem", "perfume", "skincare"], active: true, order: 3, transactionCount: 1 },
    ],
  },
  {
    id: "cp10", name: "Presentes & Doações", emoji: "🎁", color: "#06B6D4", domain: "pessoal",
    keywords: ["presente", "doação", "dízimo"], active: true, order: 10, transactionCount: 10,
    subcategories: [
      { id: "sp42", name: "Presentes", keywords: ["presente", "gift"], active: true, order: 1, transactionCount: 5 },
      { id: "sp43", name: "Doações", keywords: ["doação", "caridade", "ong"], active: true, order: 2, transactionCount: 3 },
      { id: "sp44", name: "Dízimo/Oferta", keywords: ["dízimo", "oferta", "igreja", "templo"], active: true, order: 3, transactionCount: 2 },
    ],
  },
  {
    id: "cp11", name: "Finanças", emoji: "💰", color: "#1A6B3C", domain: "pessoal",
    keywords: ["investimento", "poupança", "banco"], active: true, order: 11, transactionCount: 20,
    subcategories: [
      { id: "sp45", name: "Investimentos", keywords: ["investimento", "aplicação", "cdb", "tesouro"], active: true, order: 1, transactionCount: 8 },
      { id: "sp46", name: "Poupança", keywords: ["poupança"], active: true, order: 2, transactionCount: 4 },
      { id: "sp47", name: "Tarifas Bancárias", keywords: ["tarifa", "taxa", "anuidade"], active: true, order: 3, transactionCount: 5 },
      { id: "sp48", name: "Juros", keywords: ["juros", "mora"], active: true, order: 4, transactionCount: 2 },
      { id: "sp49", name: "IOF", keywords: ["iof"], active: true, order: 5, transactionCount: 1 },
    ],
  },
  {
    id: "cp12", name: "Outros", emoji: "📋", color: "#6366F1", domain: "pessoal",
    keywords: [], active: true, order: 12, transactionCount: 5,
    subcategories: [],
  },
];

export const defaultBusinessCategories: CategoryItem[] = [
  {
    id: "ce1", name: "Operacional", emoji: "🏭", color: "#1A6B3C", domain: "empresarial",
    keywords: ["matéria-prima", "insumo", "produção"], active: true, order: 1, transactionCount: 55,
    subcategories: [
      { id: "se1", name: "Matéria-Prima", keywords: ["matéria-prima", "insumo agrícola"], active: true, order: 1, transactionCount: 20 },
      { id: "se2", name: "Insumos", keywords: ["insumo", "adubo", "fertilizante", "semente"], active: true, order: 2, transactionCount: 20 },
      { id: "se3", name: "Embalagens", keywords: ["embalagem", "sacaria", "recipiente"], active: true, order: 3, transactionCount: 15 },
    ],
  },
  {
    id: "ce2", name: "Pessoal", emoji: "👤", color: "#2563EB", domain: "empresarial",
    keywords: ["salário", "folha", "encargo"], active: true, order: 2, transactionCount: 40,
    subcategories: [
      { id: "se4", name: "Salários", keywords: ["salário", "folha", "pagamento"], active: true, order: 1, transactionCount: 12 },
      { id: "se5", name: "Pró-labore", keywords: ["pró-labore", "retirada"], active: true, order: 2, transactionCount: 6 },
      { id: "se6", name: "Encargos", keywords: ["inss", "fgts", "encargo"], active: true, order: 3, transactionCount: 12 },
      { id: "se7", name: "Benefícios", keywords: ["vale", "benefício", "cesta básica"], active: true, order: 4, transactionCount: 10 },
    ],
  },
  {
    id: "ce3", name: "Administrativo", emoji: "🏢", color: "#F59E0B", domain: "empresarial",
    keywords: ["administrativo", "escritório"], active: true, order: 3, transactionCount: 30,
    subcategories: [
      { id: "se8", name: "Aluguel", keywords: ["aluguel", "locação"], active: true, order: 1, transactionCount: 6 },
      { id: "se9", name: "Energia", keywords: ["energia", "luz"], active: true, order: 2, transactionCount: 6 },
      { id: "se10", name: "Água", keywords: ["água"], active: true, order: 3, transactionCount: 6 },
      { id: "se11", name: "Internet/Telefone", keywords: ["internet", "telefone", "celular"], active: true, order: 4, transactionCount: 6 },
      { id: "se12", name: "Material de Escritório", keywords: ["material", "escritório", "papelaria"], active: true, order: 5, transactionCount: 6 },
    ],
  },
  {
    id: "ce4", name: "Comercial", emoji: "📊", color: "#EC4899", domain: "empresarial",
    keywords: ["marketing", "publicidade", "venda"], active: true, order: 4, transactionCount: 15,
    subcategories: [
      { id: "se13", name: "Marketing", keywords: ["marketing", "propaganda"], active: true, order: 1, transactionCount: 5 },
      { id: "se14", name: "Publicidade", keywords: ["publicidade", "anúncio", "google ads", "facebook ads"], active: true, order: 2, transactionCount: 5 },
      { id: "se15", name: "Comissões", keywords: ["comissão", "representante"], active: true, order: 3, transactionCount: 5 },
    ],
  },
  {
    id: "ce5", name: "Financeiro", emoji: "💳", color: "#DC2626", domain: "empresarial",
    keywords: ["juros", "tarifa", "financeiro"], active: true, order: 5, transactionCount: 18,
    subcategories: [
      { id: "se16", name: "Juros", keywords: ["juros", "mora"], active: true, order: 1, transactionCount: 5 },
      { id: "se17", name: "Tarifas", keywords: ["tarifa", "taxa bancária"], active: true, order: 2, transactionCount: 5 },
      { id: "se18", name: "IOF", keywords: ["iof"], active: true, order: 3, transactionCount: 3 },
      { id: "se19", name: "Seguros", keywords: ["seguro"], active: true, order: 4, transactionCount: 5 },
    ],
  },
  {
    id: "ce6", name: "Fiscal", emoji: "⚖️", color: "#8B5CF6", domain: "empresarial",
    keywords: ["imposto", "fiscal", "contabilidade"], active: true, order: 6, transactionCount: 20,
    subcategories: [
      { id: "se20", name: "Impostos", keywords: ["imposto", "icms", "pis", "cofins", "irpj", "csll"], active: true, order: 1, transactionCount: 10 },
      { id: "se21", name: "Contabilidade", keywords: ["contabilidade", "contador", "honorário"], active: true, order: 2, transactionCount: 6 },
      { id: "se22", name: "Taxas", keywords: ["taxa", "licença", "alvará"], active: true, order: 3, transactionCount: 4 },
    ],
  },
  {
    id: "ce7", name: "Manutenção", emoji: "🔧", color: "#F97316", domain: "empresarial",
    keywords: ["manutenção", "reparo", "conserto"], active: true, order: 7, transactionCount: 12,
    subcategories: [
      { id: "se23", name: "Máquinas", keywords: ["máquina", "trator", "colheitadeira"], active: true, order: 1, transactionCount: 5 },
      { id: "se24", name: "Veículos", keywords: ["veículo", "caminhão", "camionete"], active: true, order: 2, transactionCount: 4 },
      { id: "se25", name: "Instalações", keywords: ["instalação", "curral", "cerca", "galpão"], active: true, order: 3, transactionCount: 3 },
    ],
  },
  {
    id: "ce8", name: "Logística", emoji: "🚚", color: "#14B8A6", domain: "empresarial",
    keywords: ["frete", "transporte", "logística"], active: true, order: 8, transactionCount: 22,
    subcategories: [
      { id: "se26", name: "Frete", keywords: ["frete", "transporte"], active: true, order: 1, transactionCount: 10 },
      { id: "se27", name: "Combustível", keywords: ["combustível", "diesel", "gasolina"], active: true, order: 2, transactionCount: 8 },
      { id: "se28", name: "Pedágio", keywords: ["pedágio", "sem parar"], active: true, order: 3, transactionCount: 4 },
    ],
  },
  {
    id: "ce9", name: "Outros", emoji: "📋", color: "#6366F1", domain: "empresarial",
    keywords: [], active: true, order: 9, transactionCount: 3,
    subcategories: [],
  },
];

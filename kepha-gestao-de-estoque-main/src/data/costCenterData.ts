import { CostEntity, AllocationRule, CostEntry, ConsolidationRow } from '@/types';
import { subDays } from 'date-fns';

// ===== ENTITY HIERARCHY =====
export const costEntities: CostEntity[] = [
  // Group
  { id: 'GRP001', name: 'Grupo Econômico', type: 'GROUP', icon: '🏢', revenue: 12_500_000, directCosts: 7_800_000, allocatedCosts: 0, result: 4_700_000, margin: 37.6 },
  // Companies
  { id: 'EMP001', name: 'Atacadão SP', type: 'COMPANY', parentId: 'GRP001', icon: '🏭', revenue: 7_200_000, directCosts: 4_500_000, allocatedCosts: 320_000, result: 2_380_000, margin: 33.1 },
  { id: 'EMP002', name: 'Fort Atacadista PR', type: 'COMPANY', parentId: 'GRP001', icon: '🏭', revenue: 4_100_000, directCosts: 2_600_000, allocatedCosts: 210_000, result: 1_290_000, margin: 31.5 },
  { id: 'EMP003', name: 'Finanças Pessoais', type: 'COMPANY', parentId: 'GRP001', icon: '👤', revenue: 1_200_000, directCosts: 700_000, allocatedCosts: 0, result: 500_000, margin: 41.7 },
  // Units
  { id: 'UNI001', name: 'CD Guarulhos', type: 'UNIT', parentId: 'EMP001', icon: '📦', revenue: 4_500_000, directCosts: 2_800_000, allocatedCosts: 200_000, result: 1_500_000, margin: 33.3, area: 12000, headcount: 85 },
  { id: 'UNI002', name: 'CD Campinas', type: 'UNIT', parentId: 'EMP001', icon: '📦', revenue: 2_700_000, directCosts: 1_700_000, allocatedCosts: 120_000, result: 880_000, margin: 32.6, area: 8000, headcount: 52 },
  { id: 'UNI003', name: 'CD Curitiba', type: 'UNIT', parentId: 'EMP002', icon: '📦', revenue: 4_100_000, directCosts: 2_600_000, allocatedCosts: 210_000, result: 1_290_000, margin: 31.5, area: 10000, headcount: 68 },
  { id: 'UNI004', name: 'Loja Centro SP', type: 'UNIT', parentId: 'EMP001', icon: '🏪', revenue: 0, directCosts: 0, allocatedCosts: 0, result: 0, margin: 0, area: 2000, headcount: 30 },
  { id: 'UNI005', name: 'Escritório Central', type: 'UNIT', parentId: 'EMP001', icon: '🏢', revenue: 0, directCosts: 0, allocatedCosts: 0, result: 0, margin: 0, area: 500, headcount: 15 },
  // Cost Centers
  { id: 'CC001', name: 'Operações', type: 'COST_CENTER', parentId: 'UNI001', icon: '💼', revenue: 3_200_000, directCosts: 2_100_000, allocatedCosts: 120_000, result: 980_000, margin: 30.6 },
  { id: 'CC002', name: 'Comercial', type: 'COST_CENTER', parentId: 'UNI001', icon: '💼', revenue: 900_000, directCosts: 480_000, allocatedCosts: 50_000, result: 370_000, margin: 41.1 },
  { id: 'CC003', name: 'Administrativo', type: 'COST_CENTER', parentId: 'UNI001', icon: '💼', revenue: 400_000, directCosts: 220_000, allocatedCosts: 30_000, result: 150_000, margin: 37.5 },
  { id: 'CC004', name: 'Operações', type: 'COST_CENTER', parentId: 'UNI002', icon: '💼', revenue: 1_800_000, directCosts: 1_100_000, allocatedCosts: 70_000, result: 630_000, margin: 35.0 },
  { id: 'CC005', name: 'Comercial', type: 'COST_CENTER', parentId: 'UNI002', icon: '💼', revenue: 600_000, directCosts: 400_000, allocatedCosts: 30_000, result: 170_000, margin: 28.3 },
  { id: 'CC006', name: 'Logística', type: 'COST_CENTER', parentId: 'UNI002', icon: '💼', revenue: 300_000, directCosts: 200_000, allocatedCosts: 20_000, result: 80_000, margin: 26.7 },
  { id: 'CC007', name: 'Operações', type: 'COST_CENTER', parentId: 'UNI003', icon: '💼', revenue: 2_800_000, directCosts: 1_800_000, allocatedCosts: 130_000, result: 870_000, margin: 31.1 },
  { id: 'CC008', name: 'Comercial', type: 'COST_CENTER', parentId: 'UNI003', icon: '💼', revenue: 800_000, directCosts: 500_000, allocatedCosts: 50_000, result: 250_000, margin: 31.3 },
  { id: 'CC009', name: 'Manutenção', type: 'COST_CENTER', parentId: 'UNI003', icon: '💼', revenue: 500_000, directCosts: 300_000, allocatedCosts: 30_000, result: 170_000, margin: 34.0 },
  { id: 'CC010', name: 'Marketing', type: 'COST_CENTER', parentId: 'UNI004', icon: '💼', revenue: 0, directCosts: 150_000, allocatedCosts: 0, result: -150_000, margin: 0 },
  { id: 'CC011', name: 'RH', type: 'COST_CENTER', parentId: 'UNI005', icon: '💼', revenue: 0, directCosts: 180_000, allocatedCosts: 0, result: -180_000, margin: 0 },
  { id: 'CC012', name: 'TI', type: 'COST_CENTER', parentId: 'UNI005', icon: '💼', revenue: 0, directCosts: 220_000, allocatedCosts: 0, result: -220_000, margin: 0 },
];

// ===== ALLOCATION RULES =====
export const allocationRules: AllocationRule[] = [
  {
    id: 'AR001', name: 'Energia Elétrica CD', accountOrigin: 'Custos Gerais - Energia',
    method: 'PROPORCIONAL_AREA',
    destinations: [
      { entityId: 'CC001', entityName: 'Operações GRU', percent: 45 },
      { entityId: 'CC002', entityName: 'Comercial GRU', percent: 30 },
      { entityId: 'CC003', entityName: 'Administrativo GRU', percent: 25 },
    ],
    periodicity: 'MENSAL', active: true, monthlyValue: 85_000,
  },
  {
    id: 'AR002', name: 'Aluguel Predial', accountOrigin: 'Custos Fixos - Aluguel',
    method: 'PROPORCIONAL_AREA',
    destinations: [
      { entityId: 'CC001', entityName: 'Operações GRU', percent: 50 },
      { entityId: 'CC002', entityName: 'Comercial GRU', percent: 30 },
      { entityId: 'CC003', entityName: 'Administrativo GRU', percent: 20 },
    ],
    periodicity: 'MENSAL', active: true, monthlyValue: 120_000,
  },
  {
    id: 'AR003', name: 'Segurança Patrimonial', accountOrigin: 'Custos Gerais - Segurança',
    method: 'PERCENTUAL_FIXO',
    destinations: [
      { entityId: 'CC004', entityName: 'Operações CPS', percent: 40 },
      { entityId: 'CC005', entityName: 'Comercial CPS', percent: 35 },
      { entityId: 'CC006', entityName: 'Logística CPS', percent: 25 },
    ],
    periodicity: 'MENSAL', active: true, monthlyValue: 45_000,
  },
  {
    id: 'AR004', name: 'TI Corporativo', accountOrigin: 'Custos Fixos - TI',
    method: 'PROPORCIONAL_HEADCOUNT',
    destinations: [
      { entityId: 'CC007', entityName: 'Operações CWB', percent: 55 },
      { entityId: 'CC008', entityName: 'Comercial CWB', percent: 30 },
      { entityId: 'CC009', entityName: 'Manutenção CWB', percent: 15 },
    ],
    periodicity: 'MENSAL', active: true, monthlyValue: 68_000,
  },
  {
    id: 'AR005', name: 'Água e Esgoto', accountOrigin: 'Custos Gerais - Água',
    method: 'PROPORCIONAL_CONSUMO',
    destinations: [
      { entityId: 'CC001', entityName: 'Operações GRU', percent: 60 },
      { entityId: 'CC002', entityName: 'Comercial GRU', percent: 25 },
      { entityId: 'CC003', entityName: 'Administrativo GRU', percent: 15 },
    ],
    periodicity: 'MENSAL', active: false, monthlyValue: 22_000,
  },
];

// ===== COST ENTRIES =====
const entryDescs = [
  'Energia Elétrica', 'Aluguel Predial', 'Segurança', 'Manutenção Empilhadeiras',
  'Material de Embalagem', 'Combustível Frota', 'Manutenção Câmara Fria', 'Serviço de Limpeza',
  'Telecomunicações', 'Software ERP', 'Seguro Carga', 'Frete Interunidades',
  'Consultoria Fiscal', 'Uniformes', 'EPIs', 'Manutenção Predial',
];
const entrySuppliers = ['CPFL Energia', 'Imobiliária Central', 'Prosegur', 'Yale Parts', 'Embalaplast', 'Shell', 'Refrimax', 'ISS Facility', 'Vivo Empresas', 'TOTVS', 'Porto Seguro', 'Jadlog', 'EY Consultoria', 'Uniformes Brasil', 'SafePro', 'Sodexo'];
const ccIds = ['CC001', 'CC002', 'CC003', 'CC004', 'CC005', 'CC006', 'CC007', 'CC008', 'CC009', 'CC010', 'CC011', 'CC012'];
const ccNames = ['Operações GRU', 'Comercial GRU', 'Admin GRU', 'Operações CPS', 'Comercial CPS', 'Logística CPS', 'Operações CWB', 'Comercial CWB', 'Manutenção CWB', 'Marketing', 'RH', 'TI'];

export const costEntries: CostEntry[] = Array.from({ length: 50 }, (_, i) => {
  const mainCC = i % ccIds.length;
  const val = Math.floor(Math.random() * 50000) + 1000;
  const isIntercompany = i === 48 || i === 49;
  const numAllocs = isIntercompany ? 1 : Math.floor(Math.random() * 3) + 1;
  const pcts: number[] = [];
  let rem = 100;
  for (let j = 0; j < numAllocs; j++) {
    const p = j === numAllocs - 1 ? rem : Math.floor(Math.random() * (rem - (numAllocs - j - 1) * 5)) + 5;
    pcts.push(p);
    rem -= p;
  }
  const allocations = pcts.map((p, j) => {
    const idx = (mainCC + j) % ccIds.length;
    return { entityId: ccIds[idx], entityName: ccNames[idx], percent: p, value: Math.round(val * p / 100) };
  });

  return {
    id: `CE${String(i + 1).padStart(4, '0')}`,
    date: subDays(new Date(), Math.floor(Math.random() * 90)),
    description: entryDescs[i % entryDescs.length],
    value: val,
    supplier: entrySuppliers[i % entrySuppliers.length],
    entityId: ccIds[mainCC],
    entityName: ccNames[mainCC],
    allocations,
    isIntercompany,
  };
});

// ===== CONSOLIDATION =====
export const consolidationRows: ConsolidationRow[] = [
  { account: 'Receita Bruta', values: { 'Atacadão SP': 7_200_000, 'Fort PR': 4_100_000, 'Pessoal': 1_200_000 }, eliminations: -350_000, total: 12_150_000 },
  { account: '(-) Deduções', values: { 'Atacadão SP': -720_000, 'Fort PR': -410_000, 'Pessoal': -60_000 }, eliminations: 0, total: -1_190_000 },
  { account: 'Receita Líquida', values: { 'Atacadão SP': 6_480_000, 'Fort PR': 3_690_000, 'Pessoal': 1_140_000 }, eliminations: -350_000, total: 10_960_000 },
  { account: '(-) CMV', values: { 'Atacadão SP': -3_888_000, 'Fort PR': -2_214_000, 'Pessoal': -570_000 }, eliminations: 200_000, total: -6_472_000 },
  { account: 'Lucro Bruto', values: { 'Atacadão SP': 2_592_000, 'Fort PR': 1_476_000, 'Pessoal': 570_000 }, eliminations: -150_000, total: 4_488_000 },
  { account: '(-) Despesas Operacionais', values: { 'Atacadão SP': -612_000, 'Fort PR': -396_000, 'Pessoal': -70_000 }, eliminations: 0, total: -1_078_000 },
  { account: '(-) Custos Rateados', values: { 'Atacadão SP': -320_000, 'Fort PR': -210_000, 'Pessoal': 0 }, eliminations: 0, total: -530_000 },
  { account: 'EBITDA', values: { 'Atacadão SP': 1_660_000, 'Fort PR': 870_000, 'Pessoal': 500_000 }, eliminations: -150_000, total: 2_880_000 },
  { account: 'Transf. Intercompany SP→PR', values: { 'Atacadão SP': -200_000, 'Fort PR': 200_000, 'Pessoal': 0 }, eliminations: 0, total: 0, isIntercompany: true },
  { account: 'Transf. Intercompany PR→SP', values: { 'Atacadão SP': 150_000, 'Fort PR': -150_000, 'Pessoal': 0 }, eliminations: 0, total: 0, isIntercompany: true },
];

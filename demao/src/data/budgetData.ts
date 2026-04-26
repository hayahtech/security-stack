import { RegionalProfile, RoomPackage, ComplexityAddon, ServiceBasePrice } from '../types';

export const INITIAL_SEED_DATA = {
    REGIONAL_PROFILES: [
        { id: 'uberlandia_mg', name: 'Uberlândia/MG', multiplier: 1.00 },
        { id: 'maraba_pa', name: 'Marabá/PA', multiplier: 1.15 },
        { id: 'litoral_sc', name: 'Litoral SC (Balneário/Itapema)', multiplier: 1.25 },
    ] as RegionalProfile[],

    ROOM_PACKAGES: [
        { id: 'quarto_pequeno', name: 'Quarto Pequeno', defaultAreaSqm: 28, icon: 'bed' },
        { id: 'quarto_medio', name: 'Quarto Médio/Suíte', defaultAreaSqm: 38, icon: 'bed-double' },
        { id: 'sala_estar', name: 'Sala de Estar', defaultAreaSqm: 45, icon: 'sofa' },
        { id: 'banheiro', name: 'Banheiro', defaultAreaSqm: 12, icon: 'shower' },
        { id: 'cozinha', name: 'Cozinha', defaultAreaSqm: 15, icon: 'silverware-fork-knife' },
        { id: 'parede_avulsa', name: 'Parede Avulsa', defaultAreaSqm: 10, icon: 'wall' },
    ] as RoomPackage[],

    COMPLEXITY_ADDONS: [
        { id: 'com_mobilia', name: 'Com Mobília', type: 'FIXED', value: 120.00, description: 'Taxa de Proteção' },
        { id: 'com_mofo', name: 'Com Mofo', type: 'PER_SQM', value: 18.00, description: 'Tratamento Químico' },
        { id: 'pe_direito_duplo', name: 'Pé Direito Duplo', type: 'PERCENTAGE', value: 0.35, description: '> 3m (Risco e andaime)' },
        { id: 'papel_parede', name: 'Remoção Papel Parede', type: 'PER_SQM', value: 25.00, description: 'Remoção' },
    ] as ComplexityAddon[],

    SERVICES: [
        { id: 'pintura_simples', name: 'Pintura Simples (2 demãos)', pricePerSqm: 22.00 },
        { id: 'massa_corrida', name: 'Massa Corrida (2 demãos + lixa)', pricePerSqm: 30.00 },
        { id: 'textura', name: 'Textura Rústica/Grafiato', pricePerSqm: 35.00 },
        { id: 'cimento_queimado', name: 'Efeito Cimento Queimado', pricePerSqm: 65.00 },
        { id: 'verniz', name: 'Verniz em Madeira', pricePerSqm: 45.00 },
    ] as ServiceBasePrice[]
};

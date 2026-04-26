export type ProjectStatus = 'ativo' | 'pausado' | 'concluido';

export interface Etapa {
  id: string;
  nome: string;
  descricao: string;
  horas_previstas: number;
  horas_realizadas: number;
  ordem: number;
}

export interface Projeto {
  id: string;
  nome: string;
  contratante: string;
  data_inicio: string;
  previsao_conclusao: string;
  descricao: string;
  status: ProjectStatus;
  criado_em: string;
  etapas: Etapa[];
}

export interface SessaoTempo {
  id: string;
  projeto_id: string;
  hora_inicio: string;
  hora_fim: string | null;
  duracao_segundos: number | null;
  observacoes: string;
}

export type TipoEvento = 'INÍCIO' | 'FIM';

export interface LogEvento {
  id: string;
  projeto_id: string;
  tipo_evento: TipoEvento;
  data_hora: string;
  sessao_id: string;
  duracao_segundos?: number;
}

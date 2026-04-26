// ============================================================================
// TRATO GESTÃO RURAL — Supabase Database Types
// Generated from migration 001_create_trato_tables.sql
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      trato_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string | null;
          email: string | null;
          phone: string | null;
          whatsapp: boolean;
          document: string | null;
          profile_type: 'produtor' | 'pessoal' | 'ambos';
          state: string | null;
          avatar_url: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_profiles']['Insert']>;
      };
      trato_properties: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: 'rural' | 'urbana' | 'mista';
          area_total: number | null;
          area_produtiva: number | null;
          area_preservacao: number | null;
          area_tributavel: number | null;
          municipio: string | null;
          estado: string | null;
          cep: string | null;
          latitude: number | null;
          longitude: number | null;
          proprietario: string | null;
          forma_posse: 'propria' | 'arrendada' | 'parceria' | 'comodato' | 'posse' | null;
          nirf: string | null;
          incra: string | null;
          car: string | null;
          ccir: string | null;
          ie: string | null;
          cie: string | null;
          cnpj: string | null;
          modulo_fiscal: number | null;
          bioma: 'amazonia' | 'cerrado' | 'mata_atlantica' | 'caatinga' | 'pampa' | 'pantanal' | null;
          notes: string | null;
          pastures_count: number;
          animals_count: number;
          main_activity: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_properties']['Row'], 'id' | 'created_at' | 'updated_at' | 'pastures_count' | 'animals_count'> & { id?: string; created_at?: string; updated_at?: string; pastures_count?: number; animals_count?: number };
        Update: Partial<Database['public']['Tables']['trato_properties']['Insert']>;
      };
      trato_property_documents: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          nome: string;
          secao: 'dominio' | 'ambiental' | 'fiscal' | 'infraestrutura' | 'outros' | null;
          tipo: string | null;
          data_documento: string | null;
          data_vencimento: string | null;
          arquivo_url: string | null;
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_property_documents']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_property_documents']['Insert']>;
      };
      trato_improvements: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          nome: string;
          categoria: 'residencial' | 'pecuaria' | 'armazenagem' | 'operacional' | 'hidrico' | 'energia' | 'ambiental' | null;
          tipo: string | null;
          area_capacidade: string | null;
          ano_construcao: number | null;
          conservacao: 'otimo' | 'bom' | 'regular' | 'ruim' | null;
          valor_estimado: number | null;
          observacoes: string | null;
          foto_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_improvements']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_improvements']['Insert']>;
      };
      trato_paddocks: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          name: string;
          area_ha: number | null;
          forage_type: string | null;
          capacity_ua: number | null;
          current_animals: number;
          status: 'ativo' | 'em_descanso' | 'reformado' | 'inativo';
          coordinates: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_paddocks']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_animals'> & { id?: string; created_at?: string; updated_at?: string; current_animals?: number };
        Update: Partial<Database['public']['Tables']['trato_paddocks']['Insert']>;
      };
      trato_animals: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          ear_tag: string | null;
          eid: string | null;
          eid_type: 'fdx-b' | 'hdx' | 'uhf' | 'ble' | null;
          name: string | null;
          species: 'bovino' | 'equino' | 'caprino' | 'suino' | 'avicola' | 'outro';
          breed: string | null;
          sex: 'M' | 'F' | null;
          category: string | null;
          birth_date: string | null;
          purchase_date: string | null;
          origin_type: 'nascido' | 'comprado' | 'trocado' | 'doado' | null;
          origin_notes: string | null;
          dam_id: string | null;
          dam_ear_tag: string | null;
          sire_id: string | null;
          sire_ear_tag: string | null;
          current_status: 'ativo' | 'vendido' | 'morto' | 'abatido' | 'descartado';
          is_breeder: boolean;
          is_castrated: boolean;
          first_calving_date: string | null;
          paddock_id: string | null;
          paddock: string | null;
          current_weight: number | null;
          brinco_sisbov: string | null;
          sisbov_status: 'identificado' | 'pendente' | 'nao_identificado' | 'substituido' | null;
          sisbov_identification_date: string | null;
          sisbov_brinco_tipo: 'convencional' | 'eletronico' | 'botton' | 'tatuagem' | null;
          whatsapp_number: string | null;
          notifications_enabled: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_animals']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_breeder' | 'is_castrated' | 'notifications_enabled'> & { id?: string; created_at?: string; updated_at?: string; is_breeder?: boolean; is_castrated?: boolean; notifications_enabled?: boolean };
        Update: Partial<Database['public']['Tables']['trato_animals']['Insert']>;
      };
      trato_weighings: {
        Row: {
          id: string;
          user_id: string;
          animal_id: string;
          weight_kg: number;
          weight_arroba: number | null;
          weigh_date: string;
          method: 'balanca' | 'fita' | 'visual' | null;
          weighed_by: string | null;
          paddock: string | null;
          batch_id: string | null;
          device_id: string | null;
          gmd: number | null;
          webhook_sent_to_n8n: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_weighings']['Row'], 'id' | 'created_at' | 'updated_at' | 'webhook_sent_to_n8n'> & { id?: string; created_at?: string; updated_at?: string; webhook_sent_to_n8n?: boolean };
        Update: Partial<Database['public']['Tables']['trato_weighings']['Insert']>;
      };
      trato_treatments: {
        Row: {
          id: string;
          user_id: string;
          animal_id: string;
          medication_id: string | null;
          treatment_date: string;
          type: 'vacina' | 'vermifugo' | 'antibiotico' | 'anti-inflamatorio' | 'outro' | null;
          medication_name: string | null;
          dose: string | null;
          route: 'IM' | 'SC' | 'IV' | 'Oral' | 'Pour-on' | null;
          applied_by: string | null;
          withdrawal_days: number;
          withdrawal_end_date: string | null;
          batch_id: string | null;
          symptoms: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_treatments']['Row'], 'id' | 'created_at' | 'updated_at' | 'withdrawal_days'> & { id?: string; created_at?: string; updated_at?: string; withdrawal_days?: number };
        Update: Partial<Database['public']['Tables']['trato_treatments']['Insert']>;
      };
      trato_reproductive_events: {
        Row: {
          id: string;
          user_id: string;
          animal_id: string;
          event_date: string;
          event_type: 'cobertura' | 'iatf' | 'diagnostico_prenhez' | 'parto' | 'aborto' | 'desmame';
          details: string | null;
          partner_id: string | null;
          partner_ear_tag: string | null;
          result: string | null;
          calf_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_reproductive_events']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_reproductive_events']['Insert']>;
      };
      trato_milk_yields: {
        Row: {
          id: string;
          user_id: string;
          animal_id: string;
          production_date: string;
          shift: 'manha' | 'tarde' | null;
          liters: number;
          fat_percent: number | null;
          protein_percent: number | null;
          quality: 'normal' | 'descartado';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_milk_yields']['Row'], 'id' | 'created_at' | 'updated_at' | 'quality'> & { id?: string; created_at?: string; updated_at?: string; quality?: 'normal' | 'descartado' };
        Update: Partial<Database['public']['Tables']['trato_milk_yields']['Insert']>;
      };
      trato_transactions: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          type: 'receita' | 'despesa' | 'transferencia';
          txn_date: string;
          competence_month: string | null;
          description: string;
          merchant: string | null;
          amount: number;
          instrument_id: string | null;
          category_id: string | null;
          subcategory: string | null;
          cost_center_id: string | null;
          tags: string[];
          status: 'confirmado' | 'pendente' | 'cancelado';
          payer_person_id: string | null;
          beneficiary_person_id: string | null;
          payment_method: 'pix' | 'boleto' | 'cartao' | 'dinheiro' | 'transferencia' | null;
          installments: number | null;
          current_installment: number | null;
          parent_id: string | null;
          recurring: boolean;
          recurring_frequency: string | null;
          has_attachment: boolean;
          attachment_url: string | null;
          notes: string | null;
          history: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_transactions']['Row'], 'id' | 'created_at' | 'updated_at' | 'tags' | 'recurring' | 'has_attachment' | 'history'> & { id?: string; created_at?: string; updated_at?: string; tags?: string[]; recurring?: boolean; has_attachment?: boolean; history?: Json };
        Update: Partial<Database['public']['Tables']['trato_transactions']['Insert']>;
      };
      trato_payment_instruments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'conta_corrente' | 'poupanca' | 'cartao_credito' | 'caixa' | 'outro' | null;
          bank: string | null;
          last4: string | null;
          holder_person_id: string | null;
          closing_day: number | null;
          due_day: number | null;
          balance: number;
          credit_limit: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_payment_instruments']['Row'], 'id' | 'created_at' | 'updated_at' | 'balance' | 'active'> & { id?: string; created_at?: string; updated_at?: string; balance?: number; active?: boolean };
        Update: Partial<Database['public']['Tables']['trato_payment_instruments']['Insert']>;
      };
      trato_stock_products: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          name: string;
          category: 'alimentacao' | 'saude_animal' | 'defensivo' | 'combustivel' | 'ferramentas' | 'outros' | null;
          unit: 'kg' | 'litro' | 'saco' | 'caixa' | 'unidade' | 'dose' | null;
          current_qty: number;
          min_qty: number;
          avg_cost: number;
          supplier_id: string | null;
          supplier_name: string | null;
          lot: string | null;
          expiry_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_stock_products']['Row'], 'id' | 'created_at' | 'updated_at' | 'current_qty' | 'min_qty' | 'avg_cost'> & { id?: string; created_at?: string; updated_at?: string; current_qty?: number; min_qty?: number; avg_cost?: number };
        Update: Partial<Database['public']['Tables']['trato_stock_products']['Insert']>;
      };
      trato_equipment: {
        Row: {
          id: string;
          user_id: string;
          property_id: string | null;
          name: string;
          asset_type: 'Trator' | 'Caminhão' | 'Moto' | 'Ordenhadeira' | 'Bomba' | 'Implemento' | 'Outro' | null;
          plate: string | null;
          year: number | null;
          hourmeter: number;
          acquisition_cost: number | null;
          cost_center_id: string | null;
          status: 'Operacional' | 'Em manutenção' | 'Inativo';
          maintenance_interval_hours: number | null;
          last_maintenance_hourmeter: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_equipment']['Row'], 'id' | 'created_at' | 'updated_at' | 'hourmeter'> & { id?: string; created_at?: string; updated_at?: string; hourmeter?: number };
        Update: Partial<Database['public']['Tables']['trato_equipment']['Insert']>;
      };
      trato_employees: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          role: string | null;
          phone: string | null;
          document: string | null;
          ctps: string | null;
          admission_date: string | null;
          salary: number | null;
          status: 'ativo' | 'inativo' | 'ferias';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_employees']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_employees']['Insert']>;
      };
      trato_partners: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'fornecedor' | 'comprador' | 'parceiro' | 'transportadora' | 'veterinario' | 'outro' | null;
          document: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          bank_info: Json | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_partners']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_partners']['Insert']>;
      };
      trato_notifications: {
        Row: {
          id: string;
          user_id: string;
          severity: 'urgente' | 'atencao' | 'informativo' | 'sucesso' | null;
          title: string;
          description: string | null;
          icon: string | null;
          category: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_notifications']['Row'], 'id' | 'created_at' | 'read'> & { id?: string; created_at?: string; read?: boolean };
        Update: Partial<Database['public']['Tables']['trato_notifications']['Insert']>;
      };
      trato_audit_log: {
        Row: {
          id: string;
          user_id: string;
          user_name: string | null;
          action: 'create' | 'update' | 'delete' | 'login' | 'approve' | 'reject' | null;
          module: string | null;
          record: string | null;
          details: Json | null;
          ip: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_audit_log']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['trato_audit_log']['Insert']>;
      };
      trato_sync_queue: {
        Row: {
          id: string;
          user_id: string;
          entity_type: string;
          entity_id: string | null;
          action: 'insert' | 'update' | 'delete' | null;
          payload: Json | null;
          synced: boolean;
          error_message: string | null;
          retry_count: number;
          created_at: string;
          synced_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['trato_sync_queue']['Row'], 'id' | 'created_at' | 'synced' | 'retry_count'> & { id?: string; created_at?: string; synced?: boolean; retry_count?: number };
        Update: Partial<Database['public']['Tables']['trato_sync_queue']['Insert']>;
      };
      trato_devices: {
        Row: {
          id: string;
          user_id: string;
          device_type: 'rfid_reader' | 'scale';
          name: string;
          manufacturer: string | null;
          model: string | null;
          connection_type: 'bluetooth' | 'wifi' | 'usb_serial' | null;
          rfid_standard: 'fdx_b' | 'hdx' | 'uhf' | null;
          location: 'brete' | 'tronco' | 'embarcadouro' | 'manga' | 'balanca' | 'porteira' | 'outro' | null;
          decimal_places: number;
          stabilization_readings: number;
          linked_reader_id: string | null;
          ip_address: string | null;
          port: string | null;
          active: boolean;
          status: 'connected' | 'disconnected' | 'waiting';
          last_reading: string | null;
          last_reading_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_devices']['Row'], 'id' | 'created_at' | 'updated_at' | 'decimal_places' | 'stabilization_readings' | 'active'> & { id?: string; created_at?: string; updated_at?: string; decimal_places?: number; stabilization_readings?: number; active?: boolean };
        Update: Partial<Database['public']['Tables']['trato_devices']['Insert']>;
      };
      trato_gtas: {
        Row: {
          id: string;
          user_id: string;
          numero: string;
          serie: string | null;
          data_emissao: string | null;
          data_validade: string | null;
          orgao_emissor: string | null;
          uf_emissao: string | null;
          origem_propriedade: string | null;
          origem_municipio: string | null;
          origem_uf: string | null;
          origem_proprietario: string | null;
          origem_ie_nirf: string | null;
          destino_propriedade: string | null;
          destino_municipio: string | null;
          destino_uf: string | null;
          destino_proprietario: string | null;
          destino_ie_nirf: string | null;
          finalidade: 'venda' | 'recria' | 'engorda' | 'reproducao' | 'exposicao' | 'abate' | 'retorno' | 'transferencia' | 'outro' | null;
          especie: 'bovino' | 'equino' | 'suino' | 'caprino' | 'ovino' | 'aves' | 'outro' | null;
          quantidade: number | null;
          animais_vinculados: string[] | null;
          sexo_faixa: string | null;
          identificacao: 'eletronico' | 'convencional' | 'tatuagem' | 'sem' | null;
          placa_veiculo: string | null;
          transportadora: string | null;
          motorista: string | null;
          mdfe_vinculado: string | null;
          area_sanitaria: 'livre' | 'controlada' | 'foco' | 'vazio' | null;
          exames_realizados: string[] | null;
          resultado_exames: string | null;
          vacinas_em_dia: boolean | null;
          arquivo_gta_url: string | null;
          arquivo_exames_url: string | null;
          status: 'ativo' | 'utilizado' | 'vencendo' | 'vencido' | 'cancelado';
          vinculo_venda: string | null;
          observacoes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_gtas']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_gtas']['Insert']>;
      };
      trato_financings: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo: string | null;
          perfil: 'pessoal' | 'empresarial' | null;
          instituicao: string | null;
          numero_contrato: string | null;
          instrument_id: string | null;
          valor_financiado: number | null;
          valor_entrada: number | null;
          data_contratacao: string | null;
          data_primeira_parcela: string | null;
          prazo_meses: number | null;
          taxa_juros: number | null;
          taxa_tipo: 'mensal' | 'anual' | null;
          indice_correcao: string | null;
          sistema_amortizacao: 'sac' | 'price' | 'americano' | 'personalizado' | null;
          possui_carencia: boolean;
          carencia_inicio: string | null;
          carencia_fim: string | null;
          carencia_tipo: 'nada' | 'juros' | 'juros_correcao' | null;
          possui_rebate: boolean;
          rebate_percentual: number | null;
          rebate_condicao: string | null;
          possui_seguro: boolean;
          seguro_valor_parcela: number | null;
          seguradora: string | null;
          seguro_vencimento: string | null;
          tipo_garantia: string | null;
          garantia_descricao: string | null;
          protocolo: string | null;
          programa_gov: string | null;
          status: 'ativo' | 'quitado' | 'carencia' | 'inadimplente';
          saldo_devedor: number | null;
          total_pago: number;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_financings']['Row'], 'id' | 'created_at' | 'updated_at' | 'possui_carencia' | 'possui_rebate' | 'possui_seguro' | 'total_pago'> & { id?: string; created_at?: string; updated_at?: string; possui_carencia?: boolean; possui_rebate?: boolean; possui_seguro?: boolean; total_pago?: number };
        Update: Partial<Database['public']['Tables']['trato_financings']['Insert']>;
      };
      trato_push_preferences: {
        Row: {
          id: string;
          user_id: string;
          parto_proximo_7dias: boolean;
          parto_amanha: boolean;
          vacina_vencendo_7dias: boolean;
          animal_carencia_embarcado: boolean;
          animal_sem_pesagem: boolean;
          animal_sem_pesagem_dias: number;
          conta_pagar_hoje: boolean;
          conta_pagar_amanha: boolean;
          conta_em_atraso: boolean;
          meta_atingida: boolean;
          saldo_abaixo_minimo: boolean;
          saldo_minimo_limite: number;
          chuva_intensa: boolean;
          estresse_termico: boolean;
          geada_prevista: boolean;
          estoque_abaixo_minimo: boolean;
          medicamento_vencendo: boolean;
          documento_vencendo: boolean;
          gta_vencendo: boolean;
          seguro_vencendo: boolean;
          atividade_hoje: boolean;
          atividade_atrasada: boolean;
          email_frequency: 'imediata' | 'diario' | 'semanal' | 'desativado';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trato_push_preferences']['Row'], 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['trato_push_preferences']['Insert']>;
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ── Convenience type aliases ──
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

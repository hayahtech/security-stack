-- ============================================================================
-- TRATO GESTÃO RURAL — Migration 002: RLS Policies & Triggers
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. ENABLE RLS ON ALL TABLES
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.trato_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_access_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_land_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_itr_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_paddocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_forage_plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_weighings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_vaccine_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_reproductive_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_milk_yields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_animal_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_sisbov_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_sisbov_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_sisbov_feeding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_gtas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_payment_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_card_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_financial_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_payables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_recurring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_financings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_financing_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_credito_rural_extra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_assets_patrimony ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_consortia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_leasing_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_stock_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_nfe_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_nfe_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_nfe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_producer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_mdfe_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_feedings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_water_quality ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_samplings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_fish_harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_cultivation_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_cultivation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_crop_harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_crop_losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_pending_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_connected_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_imported_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_categorization_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_push_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_animal_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trato_animal_slaughters ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. RLS POLICIES — User owns their data
-- Pattern: auth.uid() = user_id for ALL operations
-- ──────────────────────────────────────────────────────────────────────────────

-- Profiles: special — user can read/update own, insert handled by trigger
CREATE POLICY "Users read own profile" ON public.trato_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.trato_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.trato_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Helper function to generate policies for standard tables
-- We'll create them explicitly for each table

-- Access & Users
CREATE POLICY "Users manage own access_profiles" ON public.trato_access_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own app_users" ON public.trato_app_users FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Properties & Related
CREATE POLICY "Users manage own properties" ON public.trato_properties FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own property_documents" ON public.trato_property_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own improvements" ON public.trato_improvements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own land_leases" ON public.trato_land_leases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own itr_history" ON public.trato_itr_history FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Paddocks
CREATE POLICY "Users manage own paddocks" ON public.trato_paddocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own forage_plantings" ON public.trato_forage_plantings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Animals & Related
CREATE POLICY "Users manage own animals" ON public.trato_animals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own weighings" ON public.trato_weighings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own medications" ON public.trato_medications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own vaccine_protocols" ON public.trato_vaccine_protocols FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own treatments" ON public.trato_treatments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own reproductive_events" ON public.trato_reproductive_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own milk_yields" ON public.trato_milk_yields FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own animal_movements" ON public.trato_animal_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own animal_sales" ON public.trato_animal_sales FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own animal_slaughters" ON public.trato_animal_slaughters FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SISBOV
CREATE POLICY "Users manage own sisbov_config" ON public.trato_sisbov_config FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own sisbov_events" ON public.trato_sisbov_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own sisbov_feeding" ON public.trato_sisbov_feeding FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- GTA
CREATE POLICY "Users manage own gtas" ON public.trato_gtas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Financeiro
CREATE POLICY "Users manage own payment_instruments" ON public.trato_payment_instruments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own card_statements" ON public.trato_card_statements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own financial_categories" ON public.trato_financial_categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own cost_centers" ON public.trato_cost_centers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own persons" ON public.trato_persons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own transactions" ON public.trato_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own payables" ON public.trato_payables FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own installment_plans" ON public.trato_installment_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own recurring_rules" ON public.trato_recurring_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own budgets" ON public.trato_budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own financings" ON public.trato_financings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own financing_installments" ON public.trato_financing_installments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own credito_rural_extra" ON public.trato_credito_rural_extra FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Patrimônio
CREATE POLICY "Users manage own assets_patrimony" ON public.trato_assets_patrimony FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own consortia" ON public.trato_consortia FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own leasing_contracts" ON public.trato_leasing_contracts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Estoque
CREATE POLICY "Users manage own stock_products" ON public.trato_stock_products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own stock_movements" ON public.trato_stock_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Máquinas
CREATE POLICY "Users manage own equipment" ON public.trato_equipment FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own maintenance_records" ON public.trato_maintenance_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own usage_records" ON public.trato_usage_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dispositivos
CREATE POLICY "Users manage own devices" ON public.trato_devices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NF-e & MDF-e
CREATE POLICY "Users manage own nfe_config" ON public.trato_nfe_config FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own nfe_documents" ON public.trato_nfe_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- nfe_items: acesso via nfe_documents (não tem user_id diretamente)
CREATE POLICY "Users manage nfe_items via nfe" ON public.trato_nfe_items FOR ALL
  USING (EXISTS (SELECT 1 FROM public.trato_nfe_documents d WHERE d.id = nfe_id AND d.user_id = auth.uid()));
CREATE POLICY "Users manage own producer_notes" ON public.trato_producer_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own mdfe_documents" ON public.trato_mdfe_documents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Piscicultura
CREATE POLICY "Users manage own fish_tanks" ON public.trato_fish_tanks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own fish_lots" ON public.trato_fish_lots FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own fish_feedings" ON public.trato_fish_feedings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own fish_water_quality" ON public.trato_fish_water_quality FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own fish_samplings" ON public.trato_fish_samplings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own fish_treatments" ON public.trato_fish_treatments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own fish_harvests" ON public.trato_fish_harvests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Agricultura
CREATE POLICY "Users manage own cultivation_areas" ON public.trato_cultivation_areas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own cultivation_cycles" ON public.trato_cultivation_cycles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own crop_harvests" ON public.trato_crop_harvests FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own crop_losses" ON public.trato_crop_losses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Atividades & Funcionários
CREATE POLICY "Users manage own activities" ON public.trato_activities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own employees" ON public.trato_employees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Parceiros
CREATE POLICY "Users manage own partners" ON public.trato_partners FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notificações & Auditoria
CREATE POLICY "Users manage own notifications" ON public.trato_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own audit_log" ON public.trato_audit_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert audit_log" ON public.trato_audit_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Aprovações
CREATE POLICY "Users manage own pending_approvals" ON public.trato_pending_approvals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Open Finance
CREATE POLICY "Users manage own connected_banks" ON public.trato_connected_banks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own imported_transactions" ON public.trato_imported_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own categorization_rules" ON public.trato_categorization_rules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Sincronização
CREATE POLICY "Users manage own sync_queue" ON public.trato_sync_queue FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Push Preferences
CREATE POLICY "Users manage own push_preferences" ON public.trato_push_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ──────────────────────────────────────────────────────────────────────────────
-- 3. TRIGGERS — Auto-update updated_at
-- ──────────────────────────────────────────────────────────────────────────────

-- Tables that have updated_at column
DO $$
DECLARE
  tbl TEXT;
  tables_with_updated_at TEXT[] := ARRAY[
    'trato_profiles', 'trato_access_profiles', 'trato_app_users',
    'trato_properties', 'trato_property_documents', 'trato_improvements',
    'trato_land_leases', 'trato_itr_history', 'trato_paddocks',
    'trato_forage_plantings', 'trato_animals', 'trato_weighings',
    'trato_medications', 'trato_vaccine_protocols', 'trato_treatments',
    'trato_reproductive_events', 'trato_milk_yields', 'trato_animal_movements',
    'trato_sisbov_config', 'trato_sisbov_feeding',
    'trato_gtas', 'trato_payment_instruments', 'trato_card_statements',
    'trato_financial_categories', 'trato_cost_centers', 'trato_persons',
    'trato_transactions', 'trato_payables', 'trato_installment_plans',
    'trato_recurring_rules', 'trato_budgets', 'trato_financings',
    'trato_financing_installments', 'trato_credito_rural_extra',
    'trato_assets_patrimony', 'trato_consortia', 'trato_leasing_contracts',
    'trato_stock_products', 'trato_stock_movements', 'trato_equipment',
    'trato_maintenance_records', 'trato_usage_records', 'trato_devices',
    'trato_nfe_config', 'trato_nfe_documents', 'trato_producer_notes',
    'trato_mdfe_documents', 'trato_fish_tanks', 'trato_fish_lots',
    'trato_cultivation_areas', 'trato_cultivation_cycles',
    'trato_activities', 'trato_employees', 'trato_partners',
    'trato_pending_approvals', 'trato_connected_banks',
    'trato_categorization_rules', 'trato_push_preferences'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables_with_updated_at
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGER — Auto-create profile on auth signup
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

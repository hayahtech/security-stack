export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          archived: boolean
          created_at: string
          id: string
          message: string | null
          notified: boolean
          read: boolean
          reference_id: string | null
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          id?: string
          message?: string | null
          notified?: boolean
          read?: boolean
          reference_id?: string | null
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          id?: string
          message?: string | null
          notified?: boolean
          read?: boolean
          reference_id?: string | null
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          acquisition_date: string | null
          category: string
          created_at: string
          id: string
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          acquisition_date?: string | null
          category: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          acquisition_date?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account: string | null
          active: boolean
          agency: string | null
          balance: number
          bank: string | null
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          account?: string | null
          active?: boolean
          agency?: string | null
          balance?: number
          bank?: string | null
          created_at?: string
          id?: string
          name: string
          type?: string
          user_id: string
        }
        Update: {
          account?: string | null
          active?: boolean
          agency?: string | null
          balance?: number
          bank?: string | null
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      bank_statements: {
        Row: {
          amount: number
          bank_account_id: string
          date: string
          description: string
          id: string
          imported_at: string
          status: string
          transaction_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          date: string
          description: string
          id?: string
          imported_at?: string
          status?: string
          transaction_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          date?: string
          description?: string
          id?: string
          imported_at?: string
          status?: string
          transaction_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_statements_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount: number
          category_id: string | null
          cost_center: string | null
          created_at: string
          description: string
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          parent_bill_id: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"] | null
          recurrence_count: number | null
          recurrence_day: number | null
          recurrence_end_date: string | null
          recurrence_type_text: string | null
          recurrent: boolean
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["bill_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          cost_center?: string | null
          created_at?: string
          description: string
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          parent_bill_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          recurrence_count?: number | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_type_text?: string | null
          recurrent?: boolean
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["bill_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          cost_center?: string | null
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          parent_bill_id?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          recurrence_count?: number | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_type_text?: string | null
          recurrent?: boolean
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["bill_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_parent_bill_id_fkey"
            columns: ["parent_bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          amount: number
          category_id: string | null
          cost_center: string | null
          created_at: string
          id: string
          month: number
          name: string
          notes: string | null
          type: string
          user_id: string
          year: number
        }
        Insert: {
          amount: number
          category_id?: string | null
          cost_center?: string | null
          created_at?: string
          id?: string
          month: number
          name: string
          notes?: string | null
          type: string
          user_id: string
          year: number
        }
        Update: {
          amount?: number
          category_id?: string | null
          cost_center?: string | null
          created_at?: string
          id?: string
          month?: number
          name?: string
          notes?: string | null
          type?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_movements: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string | null
          session_id: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          session_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          session_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          actual_balance: number | null
          closed_at: string | null
          created_at: string
          difference: number | null
          employee_id: string | null
          expected_balance: number
          id: string
          notes: string | null
          opened_at: string
          opening_balance: number
          status: string
          user_id: string
        }
        Insert: {
          actual_balance?: number | null
          closed_at?: string | null
          created_at?: string
          difference?: number | null
          employee_id?: string | null
          expected_balance?: number
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          user_id: string
        }
        Update: {
          actual_balance?: number | null
          closed_at?: string | null
          created_at?: string
          difference?: number | null
          employee_id?: string | null
          expected_balance?: number
          id?: string
          notes?: string | null
          opened_at?: string
          opening_balance?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          group: string
          icon: string
          id: string
          name: string
          scope: Database["public"]["Enums"]["transaction_scope"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          group?: string
          icon?: string
          id?: string
          name: string
          scope: Database["public"]["Enums"]["transaction_scope"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          group?: string
          icon?: string
          id?: string
          name?: string
          scope?: Database["public"]["Enums"]["transaction_scope"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      cleaning_logs: {
        Row: {
          area: string
          checklist: Json | null
          cleaned_at: string
          created_at: string
          employee_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          area: string
          checklist?: Json | null
          cleaned_at?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          area?: string
          checklist?: Json | null
          cleaned_at?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_allocations: {
        Row: {
          category_id: string | null
          created_at: string
          delivery: number
          description: string
          eventos: number
          geral: number
          id: string
          ifood: number
          rappi: number
          salao: number
          updated_at: string
          user_id: string
          whatsapp: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          delivery?: number
          description: string
          eventos?: number
          geral?: number
          id?: string
          ifood?: number
          rappi?: number
          salao?: number
          updated_at?: string
          user_id: string
          whatsapp?: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          delivery?: number
          description?: string
          eventos?: number
          geral?: number
          id?: string
          ifood?: number
          rappi?: number
          salao?: number
          updated_at?: string
          user_id?: string
          whatsapp?: number
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_allocations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          customer_id: string | null
          discount_type: string
          discount_value: number
          family_group_id: string | null
          id: string
          min_order_value: number
          program_id: string | null
          type: string
          used_at: string | null
          used_in_sale_id: string | null
          user_id: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          customer_id?: string | null
          discount_type?: string
          discount_value?: number
          family_group_id?: string | null
          id?: string
          min_order_value?: number
          program_id?: string | null
          type?: string
          used_at?: string | null
          used_in_sale_id?: string | null
          user_id: string
          valid_from?: string
          valid_until?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          customer_id?: string | null
          discount_type?: string
          discount_value?: number
          family_group_id?: string | null
          id?: string
          min_order_value?: number
          program_id?: string | null
          type?: string
          used_at?: string | null
          used_in_sale_id?: string | null
          user_id?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_used_in_sale_id_fkey"
            columns: ["used_in_sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string | null
          complement: string | null
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          label: string
          neighborhood: string | null
          number: string | null
          street: string | null
          zipcode: string | null
        }
        Insert: {
          city?: string | null
          complement?: string | null
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string | null
          number?: string | null
          street?: string | null
          zipcode?: string | null
        }
        Update: {
          city?: string | null
          complement?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          label?: string
          neighborhood?: string | null
          number?: string | null
          street?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          active: boolean
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_street: string | null
          address_zipcode: string | null
          birth_date: string
          created_at: string
          family_group_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          qr_token: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          birth_date: string
          created_at?: string
          family_group_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          qr_token?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_street?: string | null
          address_zipcode?: string | null
          birth_date?: string
          created_at?: string
          family_group_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          qr_token?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_promotions: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          hire_date: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: string | null
          salary: number
          status: Database["public"]["Enums"]["employee_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hire_date?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          salary?: number
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hire_date?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
          salary?: number
          status?: Database["public"]["Enums"]["employee_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          acquisition_date: string
          acquisition_value: number
          brand: string | null
          category: string
          created_at: string
          current_value: number | null
          depreciation_method: string | null
          id: string
          location: string | null
          model: string | null
          name: string
          notes: string | null
          residual_value: number | null
          serial_number: string | null
          status: string | null
          updated_at: string
          useful_life_months: number
          user_id: string
        }
        Insert: {
          acquisition_date?: string
          acquisition_value?: number
          brand?: string | null
          category?: string
          created_at?: string
          current_value?: number | null
          depreciation_method?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name: string
          notes?: string | null
          residual_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          useful_life_months?: number
          user_id: string
        }
        Update: {
          acquisition_date?: string
          acquisition_value?: number
          brand?: string | null
          category?: string
          created_at?: string
          current_value?: number | null
          depreciation_method?: string | null
          id?: string
          location?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          residual_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          useful_life_months?: number
          user_id?: string
        }
        Relationships: []
      }
      equipment_maintenances: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          equipment_id: string
          id: string
          next_maintenance_date: string | null
          notes: string | null
          performed_at: string
          performed_by: string | null
          type: string
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          equipment_id: string
          id?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          type?: string
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          equipment_id?: string
          id?: string
          next_maintenance_date?: string | null
          notes?: string | null
          performed_at?: string
          performed_by?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenances_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      family_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          customer_id: string
          family_group_id: string
          id: string
          joined_at: string
          role: string
        }
        Insert: {
          customer_id: string
          family_group_id: string
          id?: string
          joined_at?: string
          role?: string
        }
        Update: {
          customer_id?: string
          family_group_id?: string
          id?: string
          joined_at?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_members_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      liabilities: {
        Row: {
          category: string
          created_at: string
          due_date: string | null
          id: string
          name: string
          notes: string | null
          type: string
          user_id: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          type: string
          user_id: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          type?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      loan_installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          loan_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["installment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          loan_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          loan_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["installment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_installments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          creditor: string | null
          due_day: number
          id: string
          installment_amount: number
          installments_paid: number
          installments_total: number
          interest_rate: number
          name: string
          notes: string | null
          remaining_amount: number
          scope: Database["public"]["Enums"]["transaction_scope"]
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creditor?: string | null
          due_day?: number
          id?: string
          installment_amount: number
          installments_paid?: number
          installments_total: number
          interest_rate?: number
          name: string
          notes?: string | null
          remaining_amount: number
          scope?: Database["public"]["Enums"]["transaction_scope"]
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          creditor?: string | null
          due_day?: number
          id?: string
          installment_amount?: number
          installments_paid?: number
          installments_total?: number
          interest_rate?: number
          name?: string
          notes?: string | null
          remaining_amount?: number
          scope?: Database["public"]["Enums"]["transaction_scope"]
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          balance_after: number
          created_at: string
          customer_id: string
          description: string | null
          expires_at: string | null
          family_group_id: string | null
          id: string
          points: number
          program_id: string
          sale_id: string | null
          type: string
        }
        Insert: {
          balance_after?: number
          created_at?: string
          customer_id: string
          description?: string | null
          expires_at?: string | null
          family_group_id?: string | null
          id?: string
          points: number
          program_id: string
          sale_id?: string | null
          type: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          customer_id?: string
          description?: string | null
          expires_at?: string | null
          family_group_id?: string | null
          id?: string
          points?: number
          program_id?: string
          sale_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_family_group_id_fkey"
            columns: ["family_group_id"]
            isOneToOne: false
            referencedRelation: "family_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "loyalty_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_programs: {
        Row: {
          active: boolean
          created_at: string
          expiration_days: number | null
          id: string
          name: string
          points_per_unit: number
          points_required: number
          reward_type: string
          reward_value: number
          rule_type: string
          scope: string
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expiration_days?: number | null
          id?: string
          name: string
          points_per_unit?: number
          points_required?: number
          reward_type?: string
          reward_value?: number
          rule_type?: string
          scope?: string
          type?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expiration_days?: number | null
          id?: string
          name?: string
          points_per_unit?: number
          points_required?: number
          reward_type?: string
          reward_value?: number
          rule_type?: string
          scope?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          actual_conversions: number | null
          actual_reach: number | null
          attachment_url: string | null
          budget: number
          channel: string
          cost_center: string | null
          created_at: string
          end_date: string | null
          expected_conversions: number | null
          expected_reach: number | null
          id: string
          name: string
          notes: string | null
          objective: string
          spent: number
          start_date: string
          status: string
          target_audience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_conversions?: number | null
          actual_reach?: number | null
          attachment_url?: string | null
          budget?: number
          channel?: string
          cost_center?: string | null
          created_at?: string
          end_date?: string | null
          expected_conversions?: number | null
          expected_reach?: number | null
          id?: string
          name: string
          notes?: string | null
          objective?: string
          spent?: number
          start_date?: string
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_conversions?: number | null
          actual_reach?: number | null
          attachment_url?: string | null
          budget?: number
          channel?: string
          cost_center?: string | null
          created_at?: string
          end_date?: string | null
          expected_conversions?: number | null
          expected_reach?: number | null
          id?: string
          name?: string
          notes?: string | null
          objective?: string
          spent?: number
          start_date?: string
          status?: string
          target_audience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["menu_category"]
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          sale_price: number
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["menu_category"]
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          sale_price?: number
          user_id: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["menu_category"]
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          sale_price?: number
          user_id?: string
        }
        Relationships: []
      }
      nfe_queries: {
        Row: {
          chave_nfe: string
          cnpj_emitente: string | null
          data_emissao: string | null
          entry_id: string | null
          id: string
          nome_emitente: string | null
          numero_nf: string | null
          queried_at: string
          response_data: Json | null
          status: string
          uf: string | null
          user_id: string
          valor_total: number | null
        }
        Insert: {
          chave_nfe: string
          cnpj_emitente?: string | null
          data_emissao?: string | null
          entry_id?: string | null
          id?: string
          nome_emitente?: string | null
          numero_nf?: string | null
          queried_at?: string
          response_data?: Json | null
          status?: string
          uf?: string | null
          user_id: string
          valor_total?: number | null
        }
        Update: {
          chave_nfe?: string
          cnpj_emitente?: string | null
          data_emissao?: string | null
          entry_id?: string | null
          id?: string
          nome_emitente?: string | null
          numero_nf?: string | null
          queried_at?: string
          response_data?: Json | null
          status?: string
          uf?: string | null
          user_id?: string
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nfe_queries_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      occurrences: {
        Row: {
          created_at: string
          customer_id: string | null
          description: string
          id: string
          resolution: string | null
          resolved_at: string | null
          sale_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          description: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          sale_id?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          description?: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          sale_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occurrences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occurrences_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          id: string
          notes: string | null
          price: number
          product_id: string
          recorded_at: string
          source: string
          supplier_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          price: number
          product_id: string
          recorded_at?: string
          source?: string
          supplier_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          price?: number
          product_id?: string
          recorded_at?: string
          source?: string
          supplier_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at: string
          id: string
          name: string
          notes: string | null
          quantity_current: number
          quantity_max: number | null
          quantity_min: number
          supplier_id: string | null
          unit: Database["public"]["Enums"]["product_unit"]
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          quantity_current?: number
          quantity_max?: number | null
          quantity_min?: number
          supplier_id?: string | null
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          quantity_current?: number
          quantity_max?: number | null
          quantity_min?: number
          supplier_id?: string | null
          unit?: Database["public"]["Enums"]["product_unit"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          notification_email: string | null
          notification_phone: string | null
          store_slug: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          notification_email?: string | null
          notification_phone?: string | null
          store_slug?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          notification_email?: string | null
          notification_phone?: string | null
          store_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          product_id: string
          quantity: number
          recipe_id: string
          unit: string
          waste_percentage: number
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          recipe_id: string
          unit?: string
          waste_percentage?: number
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          recipe_id?: string
          unit?: string
          waste_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          notes: string | null
          prep_time_minutes: number | null
          user_id: string
          yield_quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          notes?: string | null
          prep_time_minutes?: number | null
          user_id: string
          yield_quantity?: number
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          prep_time_minutes?: number | null
          user_id?: string
          yield_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          customer_phone: string
          id: string
          notes: string | null
          party_size: number
          reserved_date: string
          reserved_time: string
          status: string
          table_id: string | null
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          customer_phone: string
          id?: string
          notes?: string | null
          party_size?: number
          reserved_date: string
          reserved_time: string
          status?: string
          table_id?: string | null
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string
          id?: string
          notes?: string | null
          party_size?: number
          reserved_date?: string
          reserved_time?: string
          status?: string
          table_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          invited_email: string | null
          restaurant_id: string
          role: string
          status: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_email?: string | null
          restaurant_id: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_email?: string | null
          restaurant_id?: string
          role?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_members_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          slug: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          slug?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          slug?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          category: string
          channel: string
          comment: string | null
          created_at: string
          customer_id: string | null
          id: string
          rating: number
          responded_at: string | null
          response_text: string | null
          sale_id: string | null
          user_id: string
        }
        Insert: {
          category?: string
          channel?: string
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating: number
          responded_at?: string | null
          response_text?: string | null
          sale_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          channel?: string
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating?: number
          responded_at?: string | null
          response_text?: string | null
          sale_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          notes: string | null
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          notes?: string | null
          quantity?: number
          sale_id: string
          subtotal: number
          unit_price: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          channel: Database["public"]["Enums"]["sales_channel"]
          cost_center: string | null
          coupon_id: string | null
          created_at: string
          customer_id: string | null
          customer_name: string | null
          date: string
          delivery_delivered_at: string | null
          delivery_departed_at: string | null
          delivery_employee_id: string | null
          delivery_notes: string | null
          delivery_started_at: string | null
          delivery_status: string | null
          discount_amount: number
          estimated_delivery_minutes: number | null
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          session_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          table_number: string | null
          total_amount: number
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["sales_channel"]
          cost_center?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_delivered_at?: string | null
          delivery_departed_at?: string | null
          delivery_employee_id?: string | null
          delivery_notes?: string | null
          delivery_started_at?: string | null
          delivery_status?: string | null
          discount_amount?: number
          estimated_delivery_minutes?: number | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          table_number?: string | null
          total_amount?: number
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["sales_channel"]
          cost_center?: string | null
          coupon_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_delivered_at?: string | null
          delivery_departed_at?: string | null
          delivery_employee_id?: string | null
          delivery_notes?: string | null
          delivery_started_at?: string | null
          delivery_status?: string | null
          discount_amount?: number
          estimated_delivery_minutes?: number | null
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          session_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          table_number?: string | null
          total_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_delivery_employee_id_fkey"
            columns: ["delivery_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sales_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_goals: {
        Row: {
          created_at: string
          goal_type: string
          id: string
          period: string
          reference_date: string
          target_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          goal_type: string
          id?: string
          period: string
          reference_date?: string
          target_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          goal_type?: string
          id?: string
          period?: string
          reference_date?: string
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      sales_sessions: {
        Row: {
          channel: Database["public"]["Enums"]["sales_channel"]
          closed_at: string | null
          created_at: string
          id: string
          notes: string | null
          opened_at: string
          status: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Insert: {
          channel?: Database["public"]["Enums"]["sales_channel"]
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["sales_channel"]
          closed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          opened_at?: string
          status?: Database["public"]["Enums"]["session_status"]
          user_id?: string
        }
        Relationships: []
      }
      stock_entries: {
        Row: {
          created_at: string
          entry_type: string
          id: string
          nfe_date: string | null
          nfe_key: string | null
          nfe_number: string | null
          notes: string | null
          status: string
          supplier_id: string | null
          total_value: number
          updated_at: string
          user_id: string
          xml_raw: string | null
        }
        Insert: {
          created_at?: string
          entry_type?: string
          id?: string
          nfe_date?: string | null
          nfe_key?: string | null
          nfe_number?: string | null
          notes?: string | null
          status?: string
          supplier_id?: string | null
          total_value?: number
          updated_at?: string
          user_id: string
          xml_raw?: string | null
        }
        Update: {
          created_at?: string
          entry_type?: string
          id?: string
          nfe_date?: string | null
          nfe_key?: string | null
          nfe_number?: string | null
          notes?: string | null
          status?: string
          supplier_id?: string | null
          total_value?: number
          updated_at?: string
          user_id?: string
          xml_raw?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_entry_items: {
        Row: {
          cfop: string | null
          created_at: string
          discount: number
          entry_id: string
          id: string
          included: boolean
          matched_product_id: string | null
          ncm: string | null
          nfe_product_code: string | null
          nfe_product_name: string | null
          product_id: string | null
          quantity: number
          taxes: Json | null
          total_price: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          cfop?: string | null
          created_at?: string
          discount?: number
          entry_id: string
          id?: string
          included?: boolean
          matched_product_id?: string | null
          ncm?: string | null
          nfe_product_code?: string | null
          nfe_product_name?: string | null
          product_id?: string | null
          quantity?: number
          taxes?: Json | null
          total_price?: number
          unit?: string | null
          unit_price?: number
        }
        Update: {
          cfop?: string | null
          created_at?: string
          discount?: number
          entry_id?: string
          id?: string
          included?: boolean
          matched_product_id?: string | null
          ncm?: string | null
          nfe_product_code?: string | null
          nfe_product_name?: string | null
          product_id?: string | null
          quantity?: number
          taxes?: Json | null
          total_price?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_entry_items_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "stock_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entry_items_matched_product_id_fkey"
            columns: ["matched_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_entry_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          cost_price: number | null
          created_at: string
          date: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id: string
        }
        Insert: {
          cost_price?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
          user_id: string
        }
        Update: {
          cost_price?: number | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          active: boolean
          category: Database["public"]["Enums"]["supplier_category"]
          contact: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          category?: Database["public"]["Enums"]["supplier_category"]
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          category?: Database["public"]["Enums"]["supplier_category"]
          contact?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      table_orders: {
        Row: {
          created_at: string
          id: string
          menu_item_id: string
          notes: string | null
          quantity: number
          status: string
          subtotal: number
          table_session_id: string
          unit_price: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_item_id: string
          notes?: string | null
          quantity?: number
          status?: string
          subtotal?: number
          table_session_id: string
          unit_price?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_item_id?: string
          notes?: string | null
          quantity?: number
          status?: string
          subtotal?: number
          table_session_id?: string
          unit_price?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_orders_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_orders_table_session_id_fkey"
            columns: ["table_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      table_sessions: {
        Row: {
          closed_at: string | null
          customer_count: number
          id: string
          notes: string | null
          opened_at: string
          status: string
          table_id: string
          user_id: string
          waiter_id: string | null
        }
        Insert: {
          closed_at?: string | null
          customer_count?: number
          id?: string
          notes?: string | null
          opened_at?: string
          status?: string
          table_id: string
          user_id: string
          waiter_id?: string | null
        }
        Update: {
          closed_at?: string | null
          customer_count?: number
          id?: string
          notes?: string | null
          opened_at?: string
          status?: string
          table_id?: string
          user_id?: string
          waiter_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "table_sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "table_sessions_waiter_id_fkey"
            columns: ["waiter_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          active: boolean
          capacity: number
          created_at: string
          current_session_id: string | null
          id: string
          location: string
          number: number
          status: string
          user_id: string
        }
        Insert: {
          active?: boolean
          capacity?: number
          created_at?: string
          current_session_id?: string | null
          id?: string
          location?: string
          number: number
          status?: string
          user_id: string
        }
        Update: {
          active?: boolean
          capacity?: number
          created_at?: string
          current_session_id?: string | null
          id?: string
          location?: string
          number?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_current_session_id_fkey"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "table_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      temperature_logs: {
        Row: {
          created_at: string
          equipment: string
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          status: string
          temperature: number
          user_id: string
        }
        Insert: {
          created_at?: string
          equipment?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: string
          temperature: number
          user_id: string
        }
        Update: {
          created_at?: string
          equipment?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: string
          temperature?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "temperature_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          adjusted_by: string | null
          created_at: string
          employee_id: string
          id: string
          location: string | null
          manual_adjustment: boolean
          notes: string | null
          recorded_at: string
          type: string
          user_id: string
        }
        Insert: {
          adjusted_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          location?: string | null
          manual_adjustment?: boolean
          notes?: string | null
          recorded_at?: string
          type: string
          user_id: string
        }
        Update: {
          adjusted_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          location?: string | null
          manual_adjustment?: boolean
          notes?: string | null
          recorded_at?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          category_id: string | null
          created_at: string
          date: string
          description: string
          due_date: string | null
          id: string
          notes: string | null
          payment_method: string | null
          recurrence: Database["public"]["Enums"]["recurrence_type"] | null
          recurrent: boolean
          scope: Database["public"]["Enums"]["transaction_scope"]
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          recurrent?: boolean
          scope: Database["public"]["Enums"]["transaction_scope"]
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          category_id?: string | null
          created_at?: string
          date?: string
          description?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          recurrence?: Database["public"]["Enums"]["recurrence_type"] | null
          recurrent?: boolean
          scope?: Database["public"]["Enums"]["transaction_scope"]
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          arrived_at: string
          called_at: string | null
          customer_name: string
          customer_phone: string
          estimated_wait_minutes: number | null
          id: string
          notes: string | null
          party_size: number
          seated_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          arrived_at?: string
          called_at?: string | null
          customer_name: string
          customer_phone: string
          estimated_wait_minutes?: number | null
          id?: string
          notes?: string | null
          party_size?: number
          seated_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          arrived_at?: string
          called_at?: string | null
          customer_name?: string
          customer_phone?: string
          estimated_wait_minutes?: number | null
          id?: string
          notes?: string | null
          party_size?: number
          seated_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          active: boolean
          break_minutes: number
          created_at: string
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          active?: boolean
          break_minutes?: number
          created_at?: string
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          active?: boolean
          break_minutes?: number
          created_at?: string
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_owner_or_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      bill_type: "pagar" | "receber"
      employee_status: "ativo" | "inativo"
      installment_status: "pendente" | "pago" | "vencido"
      loan_status: "ativo" | "quitado"
      menu_category: "pizza" | "bebida" | "sobremesa" | "outro"
      payment_method: "dinheiro" | "pix" | "cartao" | "app"
      product_category: "ingrediente" | "embalagem" | "limpeza" | "outros"
      product_unit: "kg" | "l" | "un" | "cx" | "g"
      recurrence_type: "mensal" | "semanal" | "quinzenal"
      sale_status: "aberto" | "fechado" | "cancelado"
      sales_channel: "balcao" | "delivery" | "ifood" | "rappi" | "whatsapp"
      session_status: "aberto" | "fechado"
      stock_movement_type: "entrada" | "saida" | "ajuste"
      supplier_category:
        | "ingredientes"
        | "embalagens"
        | "equipamentos"
        | "outros"
      transaction_scope: "business" | "personal"
      transaction_status: "paid" | "pending"
      transaction_type: "revenue" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      bill_type: ["pagar", "receber"],
      employee_status: ["ativo", "inativo"],
      installment_status: ["pendente", "pago", "vencido"],
      loan_status: ["ativo", "quitado"],
      menu_category: ["pizza", "bebida", "sobremesa", "outro"],
      payment_method: ["dinheiro", "pix", "cartao", "app"],
      product_category: ["ingrediente", "embalagem", "limpeza", "outros"],
      product_unit: ["kg", "l", "un", "cx", "g"],
      recurrence_type: ["mensal", "semanal", "quinzenal"],
      sale_status: ["aberto", "fechado", "cancelado"],
      sales_channel: ["balcao", "delivery", "ifood", "rappi", "whatsapp"],
      session_status: ["aberto", "fechado"],
      stock_movement_type: ["entrada", "saida", "ajuste"],
      supplier_category: [
        "ingredientes",
        "embalagens",
        "equipamentos",
        "outros",
      ],
      transaction_scope: ["business", "personal"],
      transaction_status: ["paid", "pending"],
      transaction_type: ["revenue", "expense"],
    },
  },
} as const

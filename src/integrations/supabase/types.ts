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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categorias_cabo: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          chave: string
          created_at: string
          valor: string
        }
        Insert: {
          chave: string
          created_at?: string
          valor: string
        }
        Update: {
          chave?: string
          created_at?: string
          valor?: string
        }
        Relationships: []
      }
      limites_norma: {
        Row: {
          categoria_cabo: string
          created_at: string
          id: string
          norma: string | null
          parametro: string
          unidade: string | null
          valor_maximo: number | null
          valor_minimo: number | null
        }
        Insert: {
          categoria_cabo: string
          created_at?: string
          id?: string
          norma?: string | null
          parametro: string
          unidade?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Update: {
          categoria_cabo?: string
          created_at?: string
          id?: string
          norma?: string | null
          parametro?: string
          unidade?: string | null
          valor_maximo?: number | null
          valor_minimo?: number | null
        }
        Relationships: []
      }
      patch_panels: {
        Row: {
          created_at: string
          id: string
          identificacao: string
          localizacao: string | null
          numero: string | null
          numero_portas: number
          observacoes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identificacao: string
          localizacao?: string | null
          numero?: string | null
          numero_portas?: number
          observacoes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identificacao?: string
          localizacao?: string | null
          numero?: string | null
          numero_portas?: number
          observacoes?: string | null
        }
        Relationships: []
      }
      pontos_rede: {
        Row: {
          categoria_cabo: string
          created_at: string
          id: string
          identificacao: string
          localizacao: string | null
          observacoes: string | null
          patch_panel_id: string | null
          porta_patch_panel: number | null
          porta_switch: number | null
          switch_id: string | null
        }
        Insert: {
          categoria_cabo?: string
          created_at?: string
          id?: string
          identificacao: string
          localizacao?: string | null
          observacoes?: string | null
          patch_panel_id?: string | null
          porta_patch_panel?: number | null
          porta_switch?: number | null
          switch_id?: string | null
        }
        Update: {
          categoria_cabo?: string
          created_at?: string
          id?: string
          identificacao?: string
          localizacao?: string | null
          observacoes?: string | null
          patch_panel_id?: string | null
          porta_patch_panel?: number | null
          porta_switch?: number | null
          switch_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pontos_rede_patch_panel_id_fkey"
            columns: ["patch_panel_id"]
            isOneToOne: false
            referencedRelation: "patch_panels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pontos_rede_switch_id_fkey"
            columns: ["switch_id"]
            isOneToOne: false
            referencedRelation: "switches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nome: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      switches: {
        Row: {
          created_at: string
          id: string
          identificacao: string
          localizacao: string | null
          modelo: string | null
          numero: string | null
          numero_portas: number
          observacoes: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identificacao: string
          localizacao?: string | null
          modelo?: string | null
          numero?: string | null
          numero_portas?: number
          observacoes?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identificacao?: string
          localizacao?: string | null
          modelo?: string | null
          numero?: string | null
          numero_portas?: number
          observacoes?: string | null
        }
        Relationships: []
      }
      testes_certificacao: {
        Row: {
          categoria_cabo: string
          comprimento: number | null
          created_at: string
          data_teste: string
          falhas: Json
          id: string
          next: number | null
          observacoes: string | null
          perda_insercao: number | null
          ponto_rede_id: string
          resistencia: number | null
          resultado: string
          return_loss: number | null
          wire_map: boolean
        }
        Insert: {
          categoria_cabo: string
          comprimento?: number | null
          created_at?: string
          data_teste?: string
          falhas?: Json
          id?: string
          next?: number | null
          observacoes?: string | null
          perda_insercao?: number | null
          ponto_rede_id: string
          resistencia?: number | null
          resultado: string
          return_loss?: number | null
          wire_map?: boolean
        }
        Update: {
          categoria_cabo?: string
          comprimento?: number | null
          created_at?: string
          data_teste?: string
          falhas?: Json
          id?: string
          next?: number | null
          observacoes?: string | null
          perda_insercao?: number | null
          ponto_rede_id?: string
          resistencia?: number | null
          resultado?: string
          return_loss?: number | null
          wire_map?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "testes_certificacao_ponto_rede_id_fkey"
            columns: ["ponto_rede_id"]
            isOneToOne: false
            referencedRelation: "pontos_rede"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

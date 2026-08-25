export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      atleta_destaques: {
        Row: {
          atleta_id: string
          criado_em: string
          id: string
          midia_id: string | null
          ordem: number
          titulo: string
        }
        Insert: {
          atleta_id: string
          criado_em?: string
          id?: string
          midia_id?: string | null
          ordem?: number
          titulo: string
        }
        Update: {
          atleta_id?: string
          criado_em?: string
          id?: string
          midia_id?: string | null
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atleta_destaques_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atleta_destaques_midia_id_fkey"
            columns: ["midia_id"]
            isOneToOne: false
            referencedRelation: "atleta_midias"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_identificacao: {
        Row: {
          atleta_id: string
          cidade: string | null
          contato_responsavel: string | null
          data_nascimento: string
          nome_completo: string
        }
        Insert: {
          atleta_id: string
          cidade?: string | null
          contato_responsavel?: string | null
          data_nascimento: string
          nome_completo: string
        }
        Update: {
          atleta_id?: string
          cidade?: string | null
          contato_responsavel?: string | null
          data_nascimento?: string
          nome_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "atleta_identificacao_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: true
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_midias: {
        Row: {
          atleta_id: string
          capa: boolean
          criado_em: string
          id: string
          legenda: string | null
          ordem: number
          storage_path: string
          tipo: Database["public"]["Enums"]["tipo_midia"]
        }
        Insert: {
          atleta_id: string
          capa?: boolean
          criado_em?: string
          id?: string
          legenda?: string | null
          ordem?: number
          storage_path: string
          tipo: Database["public"]["Enums"]["tipo_midia"]
        }
        Update: {
          atleta_id?: string
          capa?: boolean
          criado_em?: string
          id?: string
          legenda?: string | null
          ordem?: number
          storage_path?: string
          tipo?: Database["public"]["Enums"]["tipo_midia"]
        }
        Relationships: [
          {
            foreignKeyName: "atleta_midias_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      atleta_saude: {
        Row: {
          atleta_id: string
          atualizado_em: string
          avaliacao_postural: Json | null
          historico_lesao: string | null
          massa_magra_pct: number | null
        }
        Insert: {
          atleta_id: string
          atualizado_em?: string
          avaliacao_postural?: Json | null
          historico_lesao?: string | null
          massa_magra_pct?: number | null
        }
        Update: {
          atleta_id?: string
          atualizado_em?: string
          avaliacao_postural?: Json | null
          historico_lesao?: string | null
          massa_magra_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "atleta_saude_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: true
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
        ]
      }
      atletas: {
        Row: {
          altura_cm: number | null
          apelido: string
          atualizado_em: string
          categoria: string
          clube_atual: string | null
          criado_em: string
          escolinha_id: string | null
          estado: Database["public"]["Enums"]["estado_perfil"]
          estado_uf: string | null
          id: string
          pe_dominante: string | null
          peso_kg: number | null
          posicao: string | null
          responsavel_id: string
        }
        Insert: {
          altura_cm?: number | null
          apelido: string
          atualizado_em?: string
          categoria: string
          clube_atual?: string | null
          criado_em?: string
          escolinha_id?: string | null
          estado?: Database["public"]["Enums"]["estado_perfil"]
          estado_uf?: string | null
          id?: string
          pe_dominante?: string | null
          peso_kg?: number | null
          posicao?: string | null
          responsavel_id: string
        }
        Update: {
          altura_cm?: number | null
          apelido?: string
          atualizado_em?: string
          categoria?: string
          clube_atual?: string | null
          criado_em?: string
          escolinha_id?: string | null
          estado?: Database["public"]["Enums"]["estado_perfil"]
          estado_uf?: string | null
          id?: string
          pe_dominante?: string | null
          peso_kg?: number | null
          posicao?: string | null
          responsavel_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atletas_escolinha_id_fkey"
            columns: ["escolinha_id"]
            isOneToOne: false
            referencedRelation: "escolinhas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atletas_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      consentimentos: {
        Row: {
          aceito_em: string
          agente: string | null
          atleta_id: string
          documento_url: string
          id: string
          ip: unknown
          responsavel_id: string
          revogado_em: string | null
          versao_termo: string
        }
        Insert: {
          aceito_em?: string
          agente?: string | null
          atleta_id: string
          documento_url: string
          id?: string
          ip?: unknown
          responsavel_id: string
          revogado_em?: string | null
          versao_termo: string
        }
        Update: {
          aceito_em?: string
          agente?: string | null
          atleta_id?: string
          documento_url?: string
          id?: string
          ip?: unknown
          responsavel_id?: string
          revogado_em?: string | null
          versao_termo?: string
        }
        Relationships: [
          {
            foreignKeyName: "consentimentos_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consentimentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "responsaveis"
            referencedColumns: ["id"]
          },
        ]
      }
      escolinhas: {
        Row: {
          cidade: string
          credenciada: boolean
          credenciada_desde: string | null
          criado_em: string
          estado_uf: string
          id: string
          nome: string
        }
        Insert: {
          cidade: string
          credenciada?: boolean
          credenciada_desde?: string | null
          criado_em?: string
          estado_uf: string
          id?: string
          nome: string
        }
        Update: {
          cidade?: string
          credenciada?: boolean
          credenciada_desde?: string | null
          criado_em?: string
          estado_uf?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      laudos: {
        Row: {
          atleta_id: string
          avaliador_id: string
          avaliador_nome: string
          contexto: Database["public"]["Enums"]["contexto_avaliacao"]
          criado_em: string
          id: string
          notas: Json
          profissional_id: string | null
          publicado_em: string | null
          rubrica_versao: string
          substitui_laudo_id: string | null
          texto: string | null
        }
        Insert: {
          atleta_id: string
          avaliador_id: string
          avaliador_nome: string
          contexto: Database["public"]["Enums"]["contexto_avaliacao"]
          criado_em?: string
          id?: string
          notas: Json
          profissional_id?: string | null
          publicado_em?: string | null
          rubrica_versao: string
          substitui_laudo_id?: string | null
          texto?: string | null
        }
        Update: {
          atleta_id?: string
          avaliador_id?: string
          avaliador_nome?: string
          contexto?: Database["public"]["Enums"]["contexto_avaliacao"]
          criado_em?: string
          id?: string
          notas?: Json
          profissional_id?: string | null
          publicado_em?: string | null
          rubrica_versao?: string
          substitui_laudo_id?: string | null
          texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "laudos_atleta_id_fkey"
            columns: ["atleta_id"]
            isOneToOne: false
            referencedRelation: "atletas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laudos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "laudos_rubrica_versao_fkey"
            columns: ["rubrica_versao"]
            isOneToOne: false
            referencedRelation: "rubricas"
            referencedColumns: ["versao"]
          },
          {
            foreignKeyName: "laudos_substitui_laudo_id_fkey"
            columns: ["substitui_laudo_id"]
            isOneToOne: false
            referencedRelation: "laudos"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          ativo: boolean
          atua_desde: string
          bio: string | null
          cidade: string | null
          credencial: string | null
          criado_em: string
          estado_uf: string | null
          id: string
          nome: string
          slug: string
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          atua_desde?: string
          bio?: string | null
          cidade?: string | null
          credencial?: string | null
          criado_em?: string
          estado_uf?: string | null
          id?: string
          nome: string
          slug: string
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          atua_desde?: string
          bio?: string | null
          cidade?: string | null
          credencial?: string | null
          criado_em?: string
          estado_uf?: string | null
          id?: string
          nome?: string
          slug?: string
          user_id?: string | null
        }
        Relationships: []
      }
      responsaveis: {
        Row: {
          criado_em: string
          id: string
          nome: string | null
        }
        Insert: {
          criado_em?: string
          id: string
          nome?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          nome?: string | null
        }
        Relationships: []
      }
      rubricas: {
        Row: {
          ativa: boolean
          itens: Json
          publicada_em: string
          versao: string
        }
        Insert: {
          ativa?: boolean
          itens: Json
          publicada_em?: string
          versao: string
        }
        Update: {
          ativa?: boolean
          itens?: Json
          publicada_em?: string
          versao?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      colunas_da_tabela: {
        Args: { nome: string }
        Returns: {
          column_name: string
        }[]
      }
      consentimento_vigente: { Args: { p_atleta: string }; Returns: boolean }
    }
    Enums: {
      contexto_avaliacao: "presencial" | "analise_video"
      estado_perfil:
        | "rascunho"
        | "aguardando_consentimento"
        | "ativo"
        | "suspenso"
        | "removido"
      tipo_midia: "foto" | "video"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contexto_avaliacao: ["presencial", "analise_video"],
      estado_perfil: [
        "rascunho",
        "aguardando_consentimento",
        "ativo",
        "suspenso",
        "removido",
      ],
      tipo_midia: ["foto", "video"],
    },
  },
} as const


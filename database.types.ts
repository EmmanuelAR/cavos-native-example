export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      card_waitlist: {
        Row: {
          country: string
          created_at: string
          email: string
          id: number
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          id?: number
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          id?: number
        }
        Relationships: []
      }
      code: {
        Row: {
          created_at: string
          id: number
          invitation_code: string
          uid: string
          uses: number
        }
        Insert: {
          created_at?: string
          id?: number
          invitation_code: string
          uid: string
          uses?: number
        }
        Update: {
          created_at?: string
          id?: number
          invitation_code?: string
          uid?: string
          uses?: number
        }
        Relationships: []
      }
      external_wallet: {
        Row: {
          address: string
          created_at: string
          id: number
          network: string
          org_id: number
          private_key: string
          public_key: string
          user_id: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: number
          network: string
          org_id: number
          private_key: string
          public_key: string
          user_id?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: number
          network?: string
          org_id?: number
          private_key?: string
          public_key?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_wallet_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "org"
            referencedColumns: ["id"]
          },
        ]
      }
      org: {
        Row: {
          active: boolean
          auth0_connection_id_dev: string | null
          auth0_connection_id_prod: string | null
          auth0_connection_name_dev: string | null
          auth0_connection_name_prod: string | null
          created_at: string
          email: string
          hash_secret: string
          id: number
          name: string
          secret: string
          uid: string | null
        }
        Insert: {
          active?: boolean
          auth0_connection_id_dev?: string | null
          auth0_connection_id_prod?: string | null
          auth0_connection_name_dev?: string | null
          auth0_connection_name_prod?: string | null
          created_at?: string
          email: string
          hash_secret: string
          id?: number
          name: string
          secret: string
          uid?: string | null
        }
        Update: {
          active?: boolean
          auth0_connection_id_dev?: string | null
          auth0_connection_id_prod?: string | null
          auth0_connection_name_dev?: string | null
          auth0_connection_name_prod?: string | null
          created_at?: string
          email?: string
          hash_secret?: string
          id?: number
          name?: string
          secret?: string
          uid?: string | null
        }
        Relationships: []
      }
      transaction: {
        Row: {
          amount: number
          created_at: string
          id: number
          tx_hash: string | null
          type: string
          uid: string
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: number
          tx_hash?: string | null
          type: string
          uid: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: number
          tx_hash?: string | null
          type?: string
          uid?: string
        }
        Relationships: []
      }
      user_profile: {
        Row: {
          auth0_id: string | null
          created_at: string
          email: string | null
          hashed_pin: string | null
          id: number
          phone_number: string | null
        }
        Insert: {
          auth0_id?: string | null
          created_at?: string
          email?: string | null
          hashed_pin?: string | null
          id?: number
          phone_number?: string | null
        }
        Update: {
          auth0_id?: string | null
          created_at?: string
          email?: string | null
          hashed_pin?: string | null
          id?: number
          phone_number?: string | null
        }
        Relationships: []
      }
      user_wallet: {
        Row: {
          address: string
          created_at: string
          face_id_enabled: boolean
          id: number
          phone: string | null
          pin: string
          private_key: string
          public_key: string
          uid: string
          updated_at: string
          user_name: string | null
        }
        Insert: {
          address: string
          created_at?: string
          face_id_enabled?: boolean
          id?: number
          phone?: string | null
          pin: string
          private_key: string
          public_key: string
          uid: string
          updated_at?: string
          user_name?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          face_id_enabled?: boolean
          id?: number
          phone?: string | null
          pin?: string
          private_key?: string
          public_key?: string
          uid?: string
          updated_at?: string
          user_name?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string | null
          id: number
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: number
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: number
        }
        Relationships: []
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
    Enums: {},
  },
} as const

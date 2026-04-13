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
      badges: {
        Row: {
          badge_type: string
          child_id: string
          created_at: string
          earned_at: string
          id: string
        }
        Insert: {
          badge_type: string
          child_id: string
          created_at?: string
          earned_at?: string
          id?: string
        }
        Update: {
          badge_type?: string
          child_id?: string
          created_at?: string
          earned_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_interests: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          interest: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          interest: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          interest?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_interests_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_preferences: {
        Row: {
          child_id: string
          created_at: string | null
          id: string
          preference: string
        }
        Insert: {
          child_id: string
          created_at?: string | null
          id?: string
          preference: string
        }
        Update: {
          child_id?: string
          created_at?: string | null
          id?: string
          preference?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_preferences_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_progress: {
        Row: {
          child_id: string
          created_at: string
          current_streak: number
          id: string
          last_activity_at: string | null
          longest_streak: number
          total_lessons_completed: number
        }
        Insert: {
          child_id: string
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_at?: string | null
          longest_streak?: number
          total_lessons_completed?: number
        }
        Update: {
          child_id?: string
          created_at?: string
          current_streak?: number
          id?: string
          last_activity_at?: string | null
          longest_streak?: number
          total_lessons_completed?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_progress_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      child_rewards: {
        Row: {
          child_id: string
          created_at: string
          id: string
          level: number
          xp_total: number
        }
        Insert: {
          child_id: string
          created_at?: string
          id?: string
          level?: number
          xp_total?: number
        }
        Update: {
          child_id?: string
          created_at?: string
          id?: string
          level?: number
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "child_rewards_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: true
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          age: number
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          age?: number
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      curriculum_modules: {
        Row: {
          child_id: string
          created_at: string
          description: string | null
          id: string
          status: string
          theme_emoji: string | null
          title: string
          week_number: number
        }
        Insert: {
          child_id: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          theme_emoji?: string | null
          title: string
          week_number: number
        }
        Update: {
          child_id?: string
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          theme_emoji?: string | null
          title?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_modules_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_schedules: {
        Row: {
          child_id: string
          created_at: string | null
          days: string[]
          id: string
          minutes_per_day: number
        }
        Insert: {
          child_id: string
          created_at?: string | null
          days?: string[]
          id?: string
          minutes_per_day?: number
        }
        Update: {
          child_id?: string
          created_at?: string | null
          days?: string[]
          id?: string
          minutes_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "learning_schedules_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          child_id: string
          completed: boolean
          completed_at: string | null
          content_json: Json | null
          created_at: string
          day_number: number
          description: string | null
          duration_minutes: number
          id: string
          is_daily_challenge: boolean
          module_id: string
          title: string
          type: string
        }
        Insert: {
          child_id: string
          completed?: boolean
          completed_at?: string | null
          content_json?: Json | null
          created_at?: string
          day_number: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_daily_challenge?: boolean
          module_id: string
          title: string
          type: string
        }
        Update: {
          child_id?: string
          completed?: boolean
          completed_at?: string | null
          content_json?: Json | null
          created_at?: string
          day_number?: number
          description?: string | null
          duration_minutes?: number
          id?: string
          is_daily_challenge?: boolean
          module_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "curriculum_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          onboarding_complete: boolean | null
          plan: string | null
          polar_customer_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          onboarding_complete?: boolean | null
          plan?: string | null
          polar_customer_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          onboarding_complete?: boolean | null
          plan?: string | null
          polar_customer_id?: string | null
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

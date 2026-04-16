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
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      beta_invites: {
        Row: {
          accepted_at: string | null
          email: string
          id: string
          invited_at: string
          tier: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          id?: string
          invited_at?: string
          tier?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          id?: string
          invited_at?: string
          tier?: string
        }
        Relationships: []
      }
      evidence: {
        Row: {
          composite: number
          consensus: number
          created_at: string
          credibility: number
          criteria_match: number
          date: string | null
          delta_log_odds: number
          direction: string
          id: string
          milestone_id: string
          raw_sources: Json | null
          recency: number
          source: string
          summary: string | null
          type: string
        }
        Insert: {
          composite?: number
          consensus?: number
          created_at?: string
          credibility?: number
          criteria_match?: number
          date?: string | null
          delta_log_odds?: number
          direction: string
          id?: string
          milestone_id: string
          raw_sources?: Json | null
          recency?: number
          source: string
          summary?: string | null
          type: string
        }
        Update: {
          composite?: number
          consensus?: number
          created_at?: string
          credibility?: number
          criteria_match?: number
          date?: string | null
          delta_log_odds?: number
          direction?: string
          id?: string
          milestone_id?: string
          raw_sources?: Json | null
          recency?: number
          source?: string
          summary?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      latent_log: {
        Row: {
          adjusted_confidence: number | null
          boundary_crossed: boolean | null
          derived_source_count: number | null
          domain: string | null
          hysteresis_blocked: boolean | null
          id: string
          milestone_id: string
          mu_delta: number | null
          post_mu: number | null
          post_sigma: number | null
          prior_mu: number | null
          prior_sigma: number | null
          tau: number | null
          timestamp: string
          was_conflict_shock_applied: boolean | null
          wire_cap_activated: boolean | null
          z_hat: number | null
        }
        Insert: {
          adjusted_confidence?: number | null
          boundary_crossed?: boolean | null
          derived_source_count?: number | null
          domain?: string | null
          hysteresis_blocked?: boolean | null
          id?: string
          milestone_id: string
          mu_delta?: number | null
          post_mu?: number | null
          post_sigma?: number | null
          prior_mu?: number | null
          prior_sigma?: number | null
          tau?: number | null
          timestamp?: string
          was_conflict_shock_applied?: boolean | null
          wire_cap_activated?: boolean | null
          z_hat?: number | null
        }
        Update: {
          adjusted_confidence?: number | null
          boundary_crossed?: boolean | null
          derived_source_count?: number | null
          domain?: string | null
          hysteresis_blocked?: boolean | null
          id?: string
          milestone_id?: string
          mu_delta?: number | null
          post_mu?: number | null
          post_sigma?: number | null
          prior_mu?: number | null
          prior_sigma?: number | null
          tau?: number | null
          timestamp?: string
          was_conflict_shock_applied?: boolean | null
          wire_cap_activated?: boolean | null
          z_hat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "latent_log_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      latent_states: {
        Row: {
          milestone_id: string
          mu: number
          sigma: number
          updated_at: string
        }
        Insert: {
          milestone_id: string
          mu?: number
          sigma?: number
          updated_at?: string
        }
        Update: {
          milestone_id?: string
          mu?: number
          sigma?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "latent_states_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: true
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          archetype: string | null
          created_at: string
          delta_log_odds: number
          dependencies: string[] | null
          description: string | null
          domain: string
          falsification: string | null
          id: string
          magnitude: number
          posterior: number
          prior: number
          status: string
          success_criteria: string | null
          tier: string
          title: string
          triage_score: number | null
          updated_at: string
          year: number
        }
        Insert: {
          archetype?: string | null
          created_at?: string
          delta_log_odds?: number
          dependencies?: string[] | null
          description?: string | null
          domain: string
          falsification?: string | null
          id: string
          magnitude?: number
          posterior?: number
          prior?: number
          status?: string
          success_criteria?: string | null
          tier: string
          title: string
          triage_score?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          archetype?: string | null
          created_at?: string
          delta_log_odds?: number
          dependencies?: string[] | null
          description?: string | null
          domain?: string
          falsification?: string | null
          id?: string
          magnitude?: number
          posterior?: number
          prior?: number
          status?: string
          success_criteria?: string | null
          tier?: string
          title?: string
          triage_score?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      pending_evidence: {
        Row: {
          composite_score: number
          consensus: number
          contradiction_pressure: number | null
          created_at: string
          credibility: number
          criteria_match: number
          decay_applied_at: string | null
          decayed_score: number | null
          direction: string
          evidence_type: string
          id: string
          milestone_id: string
          publisher_tier: number
          queue_reason: string | null
          raw_snippet: string | null
          recency: number
          reviewed_at: string | null
          reviewed_by: string | null
          scout_run_id: string | null
          source: string
          source_url: string | null
          status: string
          summary: string | null
        }
        Insert: {
          composite_score?: number
          consensus?: number
          contradiction_pressure?: number | null
          created_at?: string
          credibility?: number
          criteria_match?: number
          decay_applied_at?: string | null
          decayed_score?: number | null
          direction?: string
          evidence_type?: string
          id?: string
          milestone_id: string
          publisher_tier?: number
          queue_reason?: string | null
          raw_snippet?: string | null
          recency?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          scout_run_id?: string | null
          source: string
          source_url?: string | null
          status?: string
          summary?: string | null
        }
        Update: {
          composite_score?: number
          consensus?: number
          contradiction_pressure?: number | null
          created_at?: string
          credibility?: number
          criteria_match?: number
          decay_applied_at?: string | null
          decayed_score?: number | null
          direction?: string
          evidence_type?: string
          id?: string
          milestone_id?: string
          publisher_tier?: number
          queue_reason?: string | null
          raw_snippet?: string | null
          recency?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          scout_run_id?: string | null
          source?: string
          source_url?: string | null
          status?: string
          summary?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          onboarding_completed: boolean
          onboarding_step: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          onboarding_completed?: boolean
          onboarding_step?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scout_directives: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      scout_logs: {
        Row: {
          action: string
          created_at: string
          detail: Json | null
          id: string
          run_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: Json | null
          id?: string
          run_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: Json | null
          id?: string
          run_id?: string
        }
        Relationships: []
      }
      socratic_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai: boolean
          milestone_id: string
          topic_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai?: boolean
          milestone_id: string
          topic_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai?: boolean
          milestone_id?: string
          topic_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socratic_comments_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "socratic_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      socratic_topics: {
        Row: {
          created_at: string
          cynical_lens: string
          id: string
          milestone_id: string | null
          socratic_question: string
          topic_title: string
        }
        Insert: {
          created_at?: string
          cynical_lens: string
          id?: string
          milestone_id?: string | null
          socratic_question: string
          topic_title: string
        }
        Update: {
          created_at?: string
          cynical_lens?: string
          id?: string
          milestone_id?: string | null
          socratic_question?: string
          topic_title?: string
        }
        Relationships: []
      }
      trust_ledger: {
        Row: {
          calibration_snapshot: Json | null
          contributions: Json | null
          created_at: string
          delta_log_odds: number | null
          evidence_id: string | null
          full_state: Json
          id: string
          milestone_id: string
          posterior: number
          posterior_log_odds: number | null
          prev_hash: string | null
          prior: number
          prior_log_odds: number | null
          propagation: Json | null
          sha256_hash: string
          snapshot_type: string
        }
        Insert: {
          calibration_snapshot?: Json | null
          contributions?: Json | null
          created_at?: string
          delta_log_odds?: number | null
          evidence_id?: string | null
          full_state: Json
          id?: string
          milestone_id: string
          posterior: number
          posterior_log_odds?: number | null
          prev_hash?: string | null
          prior: number
          prior_log_odds?: number | null
          propagation?: Json | null
          sha256_hash: string
          snapshot_type?: string
        }
        Update: {
          calibration_snapshot?: Json | null
          contributions?: Json | null
          created_at?: string
          delta_log_odds?: number | null
          evidence_id?: string | null
          full_state?: Json
          id?: string
          milestone_id?: string
          posterior?: number
          posterior_log_odds?: number | null
          prev_hash?: string | null
          prior?: number
          prior_log_odds?: number | null
          propagation?: Json | null
          sha256_hash?: string
          snapshot_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_ledger_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          spot_number: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
          spot_number: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          spot_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_waitlist_spot: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

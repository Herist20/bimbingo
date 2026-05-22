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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: number
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: number
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: number
        }
        Relationships: []
      }
      client_notes: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          pinned: boolean
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          id?: string
          pinned?: boolean
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          pinned?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          archived_at: string | null
          client_user_id: string | null
          created_at: string
          custom_data: Json
          email: string | null
          faculty: string | null
          full_name: string
          id: string
          major: string | null
          nickname: string | null
          notes: string | null
          owner_id: string
          semester: number | null
          source: string | null
          student_id: string | null
          target_defense: string | null
          university: string | null
          updated_at: string
          whatsapp: string
        }
        Insert: {
          archived_at?: string | null
          client_user_id?: string | null
          created_at?: string
          custom_data?: Json
          email?: string | null
          faculty?: string | null
          full_name: string
          id?: string
          major?: string | null
          nickname?: string | null
          notes?: string | null
          owner_id: string
          semester?: number | null
          source?: string | null
          student_id?: string | null
          target_defense?: string | null
          university?: string | null
          updated_at?: string
          whatsapp: string
        }
        Update: {
          archived_at?: string | null
          client_user_id?: string | null
          created_at?: string
          custom_data?: Json
          email?: string | null
          faculty?: string | null
          full_name?: string
          id?: string
          major?: string | null
          nickname?: string | null
          notes?: string | null
          owner_id?: string
          semester?: number | null
          source?: string | null
          student_id?: string | null
          target_defense?: string | null
          university?: string | null
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      custom_fields: {
        Row: {
          archived_at: string | null
          created_at: string
          default_value: Json | null
          description: string | null
          entity_type: string
          field_type: string
          id: string
          key: string
          label: string
          options: Json
          owner_id: string
          required: boolean
          scope: string
          scope_ref: string | null
          sequence: number
          show_in_card: boolean
          show_in_form: boolean
          show_in_list: boolean
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          default_value?: Json | null
          description?: string | null
          entity_type: string
          field_type: string
          id?: string
          key: string
          label: string
          options?: Json
          owner_id: string
          required?: boolean
          scope?: string
          scope_ref?: string | null
          sequence?: number
          show_in_card?: boolean
          show_in_form?: boolean
          show_in_list?: boolean
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          default_value?: Json | null
          description?: string | null
          entity_type?: string
          field_type?: string
          id?: string
          key?: string
          label?: string
          options?: Json
          owner_id?: string
          required?: boolean
          scope?: string
          scope_ref?: string | null
          sequence?: number
          show_in_card?: boolean
          show_in_form?: boolean
          show_in_list?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      files: {
        Row: {
          bucket: string
          category: string | null
          filename: string
          id: string
          mime_type: string | null
          owner_id: string
          path: string
          project_id: string | null
          size_bytes: number | null
          task_id: string | null
          uploaded_at: string
        }
        Insert: {
          bucket?: string
          category?: string | null
          filename: string
          id?: string
          mime_type?: string | null
          owner_id: string
          path: string
          project_id?: string | null
          size_bytes?: number | null
          task_id?: string | null
          uploaded_at?: string
        }
        Update: {
          bucket?: string
          category?: string | null
          filename?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
          path?: string
          project_id?: string | null
          size_bytes?: number | null
          task_id?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      lecturers: {
        Row: {
          characteristics: string | null
          created_at: string
          custom_data: Json
          email: string | null
          faculty: string | null
          full_name: string
          id: string
          owner_id: string
          tags: string[]
          title: string | null
          university: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          characteristics?: string | null
          created_at?: string
          custom_data?: Json
          email?: string | null
          faculty?: string | null
          full_name: string
          id?: string
          owner_id: string
          tags?: string[]
          title?: string | null
          university?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          characteristics?: string | null
          created_at?: string
          custom_data?: Json
          email?: string | null
          faculty?: string | null
          full_name?: string
          id?: string
          owner_id?: string
          tags?: string[]
          title?: string | null
          university?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          custom_data: Json
          id: string
          installment_label: string | null
          method: string
          notes: string | null
          paid_at: string
          project_id: string
          proof_file_id: string | null
          reference: string | null
          verified: boolean
        }
        Insert: {
          amount: number
          created_at?: string
          custom_data?: Json
          id?: string
          installment_label?: string | null
          method: string
          notes?: string | null
          paid_at: string
          project_id: string
          proof_file_id?: string | null
          reference?: string | null
          verified?: boolean
        }
        Update: {
          amount?: number
          created_at?: string
          custom_data?: Json
          id?: string
          installment_label?: string | null
          method?: string
          notes?: string | null
          paid_at?: string
          project_id?: string
          proof_file_id?: string | null
          reference?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_proof_file_id_fkey"
            columns: ["proof_file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_lecturers: {
        Row: {
          lecturer_id: string
          project_id: string
          role: string
        }
        Insert: {
          lecturer_id: string
          project_id: string
          role: string
        }
        Update: {
          lecturer_id?: string
          project_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_lecturers_lecturer_id_fkey"
            columns: ["lecturer_id"]
            isOneToOne: false
            referencedRelation: "lecturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_lecturers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_lecturers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_lecturers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          project_id: string
          sequence: number
          status: string
          title: string
          updated_at: string
          weight_percent: number | null
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          project_id: string
          sequence: number
          status?: string
          title: string
          updated_at?: string
          weight_percent?: number | null
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          sequence?: number
          status?: string
          title?: string
          updated_at?: string
          weight_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          actual_end_date: string | null
          archived_at: string | null
          client_id: string
          created_at: string
          custom_data: Json
          description: string | null
          id: string
          owner_id: string
          start_date: string | null
          status: string
          target_end_date: string | null
          title: string
          total_value: number
          type: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          archived_at?: string | null
          client_id: string
          created_at?: string
          custom_data?: Json
          description?: string | null
          id?: string
          owner_id: string
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          title: string
          total_value?: number
          type?: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          archived_at?: string | null
          client_id?: string
          created_at?: string
          custom_data?: Json
          description?: string | null
          id?: string
          owner_id?: string
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          title?: string
          total_value?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string
          custom_data: Json
          description: string | null
          due_date: string | null
          id: string
          milestone_id: string | null
          order_index: number
          priority: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          custom_data?: Json
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          order_index?: number
          priority?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string
          custom_data?: Json
          description?: string | null
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          order_index?: number
          priority?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_finance_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_progress_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_finance_summary: {
        Row: {
          client_id: string | null
          last_payment_at: string | null
          outstanding: number | null
          owner_id: string | null
          payment_count: number | null
          project_id: string | null
          total_paid: number | null
          total_value: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      project_progress_summary: {
        Row: {
          completed_milestones: number | null
          owner_id: string | null
          progress_percent: number | null
          project_id: string | null
          total_milestones: number | null
        }
        Relationships: []
      }
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

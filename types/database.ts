
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
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
    Enums: {},
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

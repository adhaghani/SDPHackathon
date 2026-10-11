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
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          pinned: boolean
          published_at: string
          title: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string
          title: string
          township_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string
          title?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: NonNullable<Json>
          township_id: string
        }
        ComputedFields: never
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: NonNullable<Json>
          township_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: NonNullable<Json>
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          criteria: NonNullable<Json>
          description: string
          icon: string
          id: string
          name: string
          slug: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          criteria?: NonNullable<Json>
          description: string
          icon?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          criteria?: NonNullable<Json>
          description?: string
          icon?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        ComputedFields: never
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      booking_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_id: string
        }
        ComputedFields: never
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          borrower_handover_confirmed_at: string | null
          borrower_id: string
          borrower_return_marked_at: string | null
          borrower_would_have_bought: string | null
          created_at: string
          end_date: string
          handover_method: string
          handover_note: string | null
          handover_photo_paths: string[]
          id: string
          item_id: string
          lender_handover_confirmed_at: string | null
          lender_id: string
          lender_return_confirmed_at: string | null
          return_note: string | null
          return_photo_paths: string[]
          start_date: string
          status: string
          township_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          borrower_handover_confirmed_at?: string | null
          borrower_id: string
          borrower_return_marked_at?: string | null
          borrower_would_have_bought?: string | null
          created_at?: string
          end_date: string
          handover_method?: string
          handover_note?: string | null
          handover_photo_paths?: string[]
          id?: string
          item_id: string
          lender_handover_confirmed_at?: string | null
          lender_id: string
          lender_return_confirmed_at?: string | null
          return_note?: string | null
          return_photo_paths?: string[]
          start_date: string
          status?: string
          township_id: string
          updated_at?: string
        }
        Update: {
          borrower_handover_confirmed_at?: string | null
          borrower_id?: string
          borrower_return_marked_at?: string | null
          borrower_would_have_bought?: string | null
          created_at?: string
          end_date?: string
          handover_method?: string
          handover_note?: string | null
          handover_photo_paths?: string[]
          id?: string
          item_id?: string
          lender_handover_confirmed_at?: string | null
          lender_id?: string
          lender_return_confirmed_at?: string | null
          return_note?: string | null
          return_photo_paths?: string[]
          start_date?: string
          status?: string
          township_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string | null
          contribution: number
          created_at: string
          id: string
          rewarded_at: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          challenge_id: string
          completed_at?: string | null
          contribution?: number
          created_at?: string
          id?: string
          rewarded_at?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          contribution?: number
          created_at?: string
          id?: string
          rewarded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          action_types: string[]
          category_slug: string | null
          created_at: string
          description: string
          ends_at: string
          id: string
          partner_id: string | null
          reward_points: number
          scope: string
          starts_at: string
          status: string
          target: number
          title: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          action_types?: string[]
          category_slug?: string | null
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          partner_id?: string | null
          reward_points?: number
          scope?: string
          starts_at?: string
          status?: string
          target: number
          title: string
          township_id: string
        }
        Update: {
          action_types?: string[]
          category_slug?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          partner_id?: string | null
          reward_points?: number
          scope?: string
          starts_at?: string
          status?: string
          target?: number
          title?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          details: string
          id: string
          opened_by: string
          reason: string
          resolution: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
        }
        ComputedFields: never
        Insert: {
          booking_id: string
          created_at?: string
          details?: string
          id?: string
          opened_by: string
          reason: string
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          details?: string
          id?: string
          opened_by?: string
          reason?: string
          resolution?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          counts_as_sustainability: boolean
          icon: string
          id: string
          name: string
          slug: string
        }
        ComputedFields: never
        Insert: {
          counts_as_sustainability?: boolean
          icon?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          counts_as_sustainability?: boolean
          icon?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          check_in_method: string | null
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          role: string
          status: string
          updated_at: string
          user_id: string
          volunteer_hours_verified: number
        }
        ComputedFields: never
        Insert: {
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id: string
          volunteer_hours_verified?: number
        }
        Update: {
          check_in_method?: string | null
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
          volunteer_hours_verified?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          accessibility_tags: string[]
          capacity: number | null
          category_id: string
          cost_rm: number
          cover_path: string | null
          created_at: string
          description: string
          ends_at: string
          facility_id: string | null
          hidden: boolean
          host_id: string
          id: string
          languages: string[]
          location_text: string
          neighbourhood_id: string | null
          starts_at: string
          status: string
          title: string
          township_id: string
          updated_at: string
          volunteer_slots: number | null
        }
        ComputedFields: never
        Insert: {
          accessibility_tags?: string[]
          capacity?: number | null
          category_id: string
          cost_rm?: number
          cover_path?: string | null
          created_at?: string
          description?: string
          ends_at: string
          facility_id?: string | null
          hidden?: boolean
          host_id: string
          id?: string
          languages?: string[]
          location_text: string
          neighbourhood_id?: string | null
          starts_at: string
          status?: string
          title: string
          township_id: string
          updated_at?: string
          volunteer_slots?: number | null
        }
        Update: {
          accessibility_tags?: string[]
          capacity?: number | null
          category_id?: string
          cost_rm?: number
          cover_path?: string | null
          created_at?: string
          description?: string
          ends_at?: string
          facility_id?: string | null
          hidden?: boolean
          host_id?: string
          id?: string
          languages?: string[]
          location_text?: string
          neighbourhood_id?: string | null
          starts_at?: string
          status?: string
          title?: string
          township_id?: string
          updated_at?: string
          volunteer_slots?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          kind: string
          name: string
          township_id: string
          weekly_available_hours: number
        }
        ComputedFields: never
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          kind: string
          name: string
          township_id: string
          weekly_available_hours?: number
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          kind?: string
          name?: string
          township_id?: string
          weekly_available_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "facilities_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "interest_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          details: string
          helper_id: string | null
          hidden: boolean
          id: string
          kind: string
          needed_by: string | null
          neighbourhood_id: string | null
          requester_id: string
          status: string
          title: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: string
          helper_id?: string | null
          hidden?: boolean
          id?: string
          kind?: string
          needed_by?: string | null
          neighbourhood_id?: string | null
          requester_id: string
          status?: string
          title: string
          township_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: string
          helper_id?: string | null
          hidden?: boolean
          id?: string
          kind?: string
          needed_by?: string | null
          neighbourhood_id?: string | null
          requester_id?: string
          status?: string
          title?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_groups: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          township_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interest_groups_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      item_categories: {
        Row: {
          id: string
          name: string
          slug: string
          typical_new_price_rm: number
        }
        ComputedFields: never
        Insert: {
          id?: string
          name: string
          slug: string
          typical_new_price_rm?: number
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          typical_new_price_rm?: number
        }
        Relationships: []
      }
      items: {
        Row: {
          category_id: string
          condition: string
          created_at: string
          deposit_rm: number
          description: string
          estimated_new_price_rm: number | null
          handover_options: string[]
          hidden: boolean
          id: string
          max_loan_days: number
          neighbourhood_id: string | null
          owner_id: string
          photo_paths: string[]
          status: string
          title: string
          township_id: string
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          category_id: string
          condition?: string
          created_at?: string
          deposit_rm?: number
          description?: string
          estimated_new_price_rm?: number | null
          handover_options?: string[]
          hidden?: boolean
          id?: string
          max_loan_days?: number
          neighbourhood_id?: string | null
          owner_id: string
          photo_paths?: string[]
          status?: string
          title: string
          township_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          condition?: string
          created_at?: string
          deposit_rm?: number
          description?: string
          estimated_new_price_rm?: number | null
          handover_options?: string[]
          hidden?: boolean
          id?: string
          max_loan_days?: number
          neighbourhood_id?: string | null
          owner_id?: string
          photo_paths?: string[]
          status?: string
          title?: string
          township_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      levels: {
        Row: {
          level: number
          min_lifetime_points: number
          name: string
        }
        ComputedFields: never
        Insert: {
          level: number
          min_lifetime_points: number
          name: string
        }
        Update: {
          level?: number
          min_lifetime_points?: number
          name?: string
        }
        Relationships: []
      }
      neighbourhoods: {
        Row: {
          created_at: string
          id: string
          name: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          name: string
          township_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighbourhoods_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          enabled: boolean
          type: string
          updated_at: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          enabled?: boolean
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          enabled?: boolean
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          dedupe_key: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          body?: string
          created_at?: string
          dedupe_key: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          description: string
          id: string
          logo_path: string | null
          name: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          description?: string
          id?: string
          logo_path?: string | null
          name: string
          township_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          logo_path?: string | null
          name?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_baselines: {
        Row: {
          created_at: string
          id: string
          metric: string
          note: string
          period_label: string
          township_id: string
          value: number
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          id?: string
          metric: string
          note?: string
          period_label: string
          township_id: string
          value: number
        }
        Update: {
          created_at?: string
          id?: string
          metric?: string
          note?: string
          period_label?: string
          township_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "pilot_baselines_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          action_type: string
          created_at: string
          delta: number
          id: string
          metadata: NonNullable<Json>
          rule_id: string | null
          source_id: string
          source_type: string
          township_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          action_type: string
          created_at?: string
          delta: number
          id?: string
          metadata?: NonNullable<Json>
          rule_id?: string | null
          source_id: string
          source_type: string
          township_id: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          delta?: number
          id?: string
          metadata?: NonNullable<Json>
          rule_id?: string | null
          source_id?: string
          source_type?: string
          township_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "reward_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "points_ledger_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          comfort_prefs: NonNullable<Json>
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          interests: string[]
          language: string
          privacy_accepted_at: string | null
          recognition_opt_in: boolean
          terms_accepted_at: string | null
          updated_at: string
        }
        ComputedFields: never
        Insert: {
          avatar_path?: string | null
          comfort_prefs?: NonNullable<Json>
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id: string
          interests?: string[]
          language?: string
          privacy_accepted_at?: string | null
          recognition_opt_in?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          comfort_prefs?: NonNullable<Json>
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          interests?: string[]
          language?: string
          privacy_accepted_at?: string | null
          recognition_opt_in?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programme_costs: {
        Row: {
          amount_rm: number
          created_at: string
          id: string
          label: string
          month: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          amount_rm: number
          created_at?: string
          id?: string
          label: string
          month: string
          township_id: string
        }
        Update: {
          amount_rm?: number
          created_at?: string
          id?: string
          label?: string
          month?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programme_costs_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      redemptions: {
        Row: {
          code: string
          cost_bp: number
          created_at: string
          id: string
          reward_id: string
          status: string
          township_id: string
          used_at: string | null
          used_by: string | null
          user_id: string
          valid_until: string | null
        }
        ComputedFields: never
        Insert: {
          code: string
          cost_bp: number
          created_at?: string
          id?: string
          reward_id: string
          status?: string
          township_id: string
          used_at?: string | null
          used_by?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          cost_bp?: number
          created_at?: string
          id?: string
          reward_id?: string
          status?: string
          township_id?: string
          used_at?: string | null
          used_by?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
          township_id: string
        }
        ComputedFields: never
        Insert: {
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
          township_id: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
          township_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_rules: {
        Row: {
          action_type: string
          active: boolean
          category_slug: string | null
          created_at: string
          daily_cap: number | null
          id: string
          params: NonNullable<Json>
          points: number
          township_id: string | null
          weekly_cap: number | null
        }
        ComputedFields: never
        Insert: {
          action_type: string
          active?: boolean
          category_slug?: string | null
          created_at?: string
          daily_cap?: number | null
          id?: string
          params?: NonNullable<Json>
          points: number
          township_id?: string | null
          weekly_cap?: number | null
        }
        Update: {
          action_type?: string
          active?: boolean
          category_slug?: string | null
          created_at?: string
          daily_cap?: number | null
          id?: string
          params?: NonNullable<Json>
          points?: number
          township_id?: string | null
          weekly_cap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_rules_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          active: boolean
          cost_bp: number
          created_at: string
          description: string
          funded_by: string
          id: string
          kind: string
          partner_id: string | null
          per_user_limit: number
          stock: number
          title: string
          township_id: string
          unit_cost_rm: number
          valid_until: string | null
        }
        ComputedFields: never
        Insert: {
          active?: boolean
          cost_bp: number
          created_at?: string
          description?: string
          funded_by?: string
          id?: string
          kind?: string
          partner_id?: string | null
          per_user_limit?: number
          stock?: number
          title: string
          township_id: string
          unit_cost_rm?: number
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          cost_bp?: number
          created_at?: string
          description?: string
          funded_by?: string
          id?: string
          kind?: string
          partner_id?: string | null
          per_user_limit?: number
          stock?: number
          title?: string
          township_id?: string
          unit_cost_rm?: number
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rewards_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      township_members: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          neighbourhood_id: string | null
          role: string
          status: string
          township_id: string
          unit_label: string | null
          user_id: string
        }
        ComputedFields: never
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          neighbourhood_id?: string | null
          role?: string
          status?: string
          township_id: string
          unit_label?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          neighbourhood_id?: string | null
          role?: string
          status?: string
          township_id?: string
          unit_label?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "township_members_neighbourhood_id_fkey"
            columns: ["neighbourhood_id"]
            isOneToOne: false
            referencedRelation: "neighbourhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "township_members_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
      townships: {
        Row: {
          auto_approve_members: boolean
          created_at: string
          id: string
          is_demo: boolean
          join_code: string
          name: string
          pilot_start_date: string | null
          require_event_approval: boolean
          rewards_enabled: boolean
          settings: NonNullable<Json>
          slug: string
          timezone: string
        }
        ComputedFields: never
        Insert: {
          auto_approve_members?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          join_code: string
          name: string
          pilot_start_date?: string | null
          require_event_approval?: boolean
          rewards_enabled?: boolean
          settings?: NonNullable<Json>
          slug: string
          timezone?: string
        }
        Update: {
          auto_approve_members?: boolean
          created_at?: string
          id?: string
          is_demo?: boolean
          join_code?: string
          name?: string
          pilot_start_date?: string | null
          require_event_approval?: boolean
          rewards_enabled?: boolean
          settings?: NonNullable<Json>
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          township_id: string
          user_id: string
        }
        ComputedFields: never
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          township_id: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          township_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_member_points: {
        Row: {
          balance: number | null
          last_activity_at: string | null
          lifetime_points: number | null
          township_id: string | null
          user_id: string | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: "points_ledger_township_id_fkey"
            columns: ["township_id"]
            isOneToOne: false
            referencedRelation: "townships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_help_request: { Args: { p_request_id: string }; Returns: Json }
      admin_budget: {
        Args: { p_month?: string; p_township_id: string }
        Returns: Json
      }
      admin_insights: {
        Args: { p_days?: number; p_township_id: string }
        Returns: Json
      }
      admin_ledger_candidates: {
        Args: { p_limit?: number; p_township_id: string }
        Returns: Json
      }
      admin_rewards_economy: {
        Args: { p_days?: number; p_township_id: string }
        Returns: Json
      }
      approve_member: {
        Args: { p_approve: boolean; p_member_id: string }
        Returns: Json
      }
      award_points: {
        Args: {
          p_action_type: string
          p_category_slug?: string
          p_metadata?: Json
          p_occurred_at?: string
          p_source_id: string
          p_source_type: string
          p_township_id: string
          p_user_id: string
        }
        Returns: Json
      }
      block_user: { Args: { p_blocked_id: string }; Returns: Json }
      can_read_event: { Args: { p_event_id: string }; Returns: boolean }
      cancel_rsvp: { Args: { p_event_id: string }; Returns: Json }
      check_in: {
        Args: { p_method?: string; p_occurred_at?: string; p_rsvp_id: string }
        Returns: Json
      }
      complete_event: {
        Args: { p_event_id: string; p_occurred_at?: string }
        Returns: Json
      }
      complete_help_request: { Args: { p_request_id: string }; Returns: Json }
      create_announcement: { Args: { p_payload: Json }; Returns: Json }
      create_booking: {
        Args: {
          p_borrower_id?: string
          p_end_date: string
          p_handover_method?: string
          p_item_id: string
          p_start_date: string
        }
        Returns: Json
      }
      create_event: { Args: { p_payload: Json }; Returns: Json }
      create_help_request: { Args: { p_payload: Json }; Returns: Json }
      create_item: { Args: { p_payload: Json }; Returns: Json }
      create_report: { Args: { p_payload: Json }; Returns: Json }
      delete_my_account: { Args: Record<PropertyKey, never>; Returns: Json }
      evaluate_badges: {
        Args: { p_township_id: string; p_user_id: string }
        Returns: number
      }
      expire_stale_booking_requests: {
        Args: { p_now?: string }
        Returns: number
      }
      get_join_details: { Args: { p_join_code: string }; Returns: Json }
      has_role: {
        Args: { p_roles: string[]; p_township_id: string }
        Returns: boolean
      }
      health_check: { Args: Record<PropertyKey, never>; Returns: Json }
      is_active_member: { Args: { p_township_id: string }; Returns: boolean }
      is_booking_participant: {
        Args: { p_booking_id: string }
        Returns: boolean
      }
      is_event_staff: { Args: { p_event_id: string }; Returns: boolean }
      is_township_admin: { Args: { p_township_id: string }; Returns: boolean }
      join_group: { Args: { p_group_id: string }; Returns: Json }
      join_township: {
        Args: {
          p_join_code: string
          p_neighbourhood_id: string
          p_unit_label?: string
        }
        Returns: Json
      }
      leave_group: { Args: { p_group_id: string }; Returns: Json }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: Json
      }
      mark_redemption_used: { Args: { p_code: string }; Returns: Json }
      moderate_report: {
        Args: { p_action: string; p_report_id: string }
        Returns: Json
      }
      open_booking_dispute: {
        Args: { p_booking_id: string; p_details?: string; p_reason?: string }
        Returns: Json
      }
      redeem_reward: { Args: { p_reward_id: string }; Returns: Json }
      resolve_booking_dispute: {
        Args: { p_dispute_id: string; p_note?: string; p_resolution: string }
        Returns: Json
      }
      reverse_points: {
        Args: { p_ledger_id: string; p_reason: string }
        Returns: Json
      }
      rsvp_event: {
        Args: { p_event_id: string; p_occurred_at?: string; p_role?: string }
        Returns: Json
      }
      run_scheduled_jobs: { Args: Record<PropertyKey, never>; Returns: Json }
      save_programme_cost: {
        Args: { p_amount_rm: number; p_label: string; p_month: string }
        Returns: Json
      }
      send_booking_message: {
        Args: { p_body: string; p_booking_id: string }
        Returns: Json
      }
      set_notification_preference: {
        Args: { p_enabled: boolean; p_type: string }
        Returns: Json
      }
      show_limit: { Args: Record<PropertyKey, never>; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      township_pulse: {
        Args: { p_days?: number; p_township_id: string }
        Returns: Json
      }
      transition_booking: {
        Args: {
          p_action: string
          p_actor_id?: string
          p_booking_id: string
          p_occurred_at?: string
          p_payload?: Json
        }
        Returns: Json
      }
      update_challenge_progress: {
        Args: {
          p_action_type: string
          p_category_slug?: string
          p_occurred_at?: string
          p_township_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_profile: {
        Args: {
          p_comfort_prefs?: Json
          p_display_name: string
          p_interests?: string[]
          p_recognition_opt_in?: boolean
        }
        Returns: Json
      }
      verify_volunteer_hours: {
        Args: { p_hours: number; p_rsvp_id: string }
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
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
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

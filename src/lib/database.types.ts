// Database types matching Supabase schema
// Generated from migration files — update when schema changes

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          firebase_uid: string
          email: string
          name: string
          role: 'buyer' | 'developer' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firebase_uid: string
          email: string
          name: string
          role?: 'buyer' | 'developer' | 'admin'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          firebase_uid?: string
          email?: string
          name?: string
          role?: 'buyer' | 'developer' | 'admin'
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      developer_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          stripe_connect_id: string | null
          stripe_onboarded: boolean
          website_url: string | null
          support_email: string | null
          bio: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          stripe_connect_id?: string | null
          stripe_onboarded?: boolean
          website_url?: string | null
          support_email?: string | null
          bio?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          company_name?: string
          stripe_connect_id?: string | null
          stripe_onboarded?: boolean
          website_url?: string | null
          support_email?: string | null
          bio?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'developer_profiles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      apps: {
        Row: {
          id: string
          developer_id: string
          name: string
          slug: string
          icon: string
          category: 'Outreach' | 'Prospecting' | 'Meeting Prep' | 'Productivity'
          price_cents: number
          description: string
          long_description: string | null
          features: string[]
          file_path: string | null
          status: 'draft' | 'pending_review' | 'in_review' | 'approved' | 'rejected' | 'suspended'
          security_score: number | null
          version: string
          stripe_product_id: string | null
          stripe_price_id: string | null
          total_installs: number
          total_revenue_cents: number
          avg_rating: number
          review_count: number
          rejection_reason: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          name: string
          slug: string
          icon: string
          category: 'Outreach' | 'Prospecting' | 'Meeting Prep' | 'Productivity'
          price_cents?: number
          description: string
          long_description?: string | null
          features?: string[]
          file_path?: string | null
          status?: string
          security_score?: number | null
          version?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          rejection_reason?: string | null
        }
        Update: {
          name?: string
          slug?: string
          icon?: string
          category?: 'Outreach' | 'Prospecting' | 'Meeting Prep' | 'Productivity'
          price_cents?: number
          description?: string
          long_description?: string | null
          features?: string[]
          file_path?: string | null
          status?: string
          security_score?: number | null
          version?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          total_installs?: number
          total_revenue_cents?: number
          avg_rating?: number
          review_count?: number
          rejection_reason?: string | null
          published_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'apps_developer_id_fkey'
            columns: ['developer_id']
            isOneToOne: false
            referencedRelation: 'developer_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      app_versions: {
        Row: {
          id: string
          app_id: string
          version: string
          file_path: string
          changelog: string | null
          security_score: number | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          version: string
          file_path: string
          changelog?: string | null
          security_score?: number | null
          status?: string
          reviewed_by?: string | null
        }
        Update: {
          version?: string
          file_path?: string
          changelog?: string | null
          security_score?: number | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'app_versions_app_id_fkey'
            columns: ['app_id']
            isOneToOne: false
            referencedRelation: 'apps'
            referencedColumns: ['id']
          }
        ]
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          app_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: 'active' | 'canceled' | 'past_due' | 'trialing'
          trial_ends_at: string | null
          current_period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          app_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          trial_ends_at?: string | null
          current_period_end?: string | null
        }
        Update: {
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: 'active' | 'canceled' | 'past_due' | 'trialing'
          trial_ends_at?: string | null
          current_period_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'purchases_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'purchases_app_id_fkey'
            columns: ['app_id']
            isOneToOne: false
            referencedRelation: 'apps'
            referencedColumns: ['id']
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          purchase_id: string | null
          app_id: string | null
          buyer_id: string | null
          developer_id: string | null
          amount_cents: number
          platform_fee_cents: number
          developer_payout_cents: number
          stripe_payment_intent_id: string | null
          stripe_transfer_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          purchase_id?: string | null
          app_id?: string | null
          buyer_id?: string | null
          developer_id?: string | null
          amount_cents: number
          platform_fee_cents: number
          developer_payout_cents: number
          stripe_payment_intent_id?: string | null
          stripe_transfer_id?: string | null
          status?: string
        }
        Update: {
          status?: string
        }
        Relationships: []
      }
      app_reviews: {
        Row: {
          id: string
          app_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          user_id: string
          rating: number
          comment?: string | null
        }
        Update: {
          rating?: number
          comment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'app_reviews_app_id_fkey'
            columns: ['app_id']
            isOneToOne: false
            referencedRelation: 'apps'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'app_reviews_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      payouts: {
        Row: {
          id: string
          developer_id: string
          amount_cents: number
          stripe_payout_id: string | null
          status: 'pending' | 'processing' | 'paid' | 'failed'
          period_start: string | null
          period_end: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          developer_id: string
          amount_cents: number
          stripe_payout_id?: string | null
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          period_start?: string | null
          period_end?: string | null
        }
        Update: {
          amount_cents?: number
          stripe_payout_id?: string | null
          status?: 'pending' | 'processing' | 'paid' | 'failed'
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'payouts_developer_id_fkey'
            columns: ['developer_id']
            isOneToOne: false
            referencedRelation: 'developer_profiles'
            referencedColumns: ['id']
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          details: Record<string, unknown>
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: Record<string, unknown>
          ip_address?: string | null
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          dashboard_layout: 'grid' | 'compact' | 'list'
          app_order: string[]
          pinned_apps: string[]
          quick_launch: string[]
          custom_groups: Array<{ name: string; app_ids: string[] }>
          launcher_mode: 'modal' | 'panel' | 'tab' | 'window'
          theme: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dashboard_layout?: 'grid' | 'compact' | 'list'
          app_order?: string[]
          pinned_apps?: string[]
          quick_launch?: string[]
          custom_groups?: Array<{ name: string; app_ids: string[] }>
          launcher_mode?: 'modal' | 'panel' | 'tab' | 'window'
          theme?: Record<string, unknown>
        }
        Update: {
          dashboard_layout?: 'grid' | 'compact' | 'list'
          app_order?: string[]
          pinned_apps?: string[]
          quick_launch?: string[]
          custom_groups?: Array<{ name: string; app_ids: string[] }>
          launcher_mode?: 'modal' | 'panel' | 'tab' | 'window'
          theme?: Record<string, unknown>
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_preferences_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
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

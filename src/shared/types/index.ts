export type TransactionType = "income" | "expense";
export type TransactionSource = "manual" | "csv" | "ofx";
export type Frequency = "weekly" | "biweekly" | "monthly" | "yearly";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          household_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_url?: string | null;
          household_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_url?: string | null;
          household_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          created_by: string;
          invite_code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_by: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string;
          invite_code?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          icon?: string | null;
          color?: string | null;
          is_default?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          description: string | null;
          merchant: string | null;
          date: string;
          type: TransactionType;
          source: TransactionSource;
          ai_categorized: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          description?: string | null;
          merchant?: string | null;
          date: string;
          type: TransactionType;
          source?: TransactionSource;
          ai_categorized?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          category_id?: string | null;
          amount?: number;
          description?: string | null;
          merchant?: string | null;
          date?: string;
          type?: TransactionType;
          source?: TransactionSource;
          ai_categorized?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          household_id: string;
          category_id: string;
          amount: number;
          month: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          category_id: string;
          amount: number;
          month: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          category_id?: string;
          amount?: number;
          month?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_patterns: {
        Row: {
          id: string;
          household_id: string;
          merchant: string;
          estimated_amount: number;
          frequency: Frequency;
          last_seen: string | null;
          next_expected: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          merchant: string;
          estimated_amount: number;
          frequency: Frequency;
          last_seen?: string | null;
          next_expected?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          merchant?: string;
          estimated_amount?: number;
          frequency?: Frequency;
          last_seen?: string | null;
          next_expected?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_household_id: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      // create_household and join_household_by_invite are called via
      // supabase.rpc() with explicit .returns<Household>() typing in
      // householdApi.ts, because the Supabase client's generic inference
      // for RPC args doesn't resolve correctly with hand-written types.
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// Convenience aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Household = Database["public"]["Tables"]["households"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type TransactionInsert =
  Database["public"]["Tables"]["transactions"]["Insert"];
export type TransactionUpdate =
  Database["public"]["Tables"]["transactions"]["Update"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type BudgetInsert = Database["public"]["Tables"]["budgets"]["Insert"];
export type RecurringPattern =
  Database["public"]["Tables"]["recurring_patterns"]["Row"];

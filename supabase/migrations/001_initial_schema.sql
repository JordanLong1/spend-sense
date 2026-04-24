-- Spend Sense: Initial Schema
-- Run this in the Supabase SQL Editor

-- ============================================================================
-- 1. HELPER FUNCTIONS
-- ============================================================================

-- Auto-updates the updated_at column on row modification.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. TABLES (in FK dependency order)
-- ============================================================================

-- Households: shared budget unit (1-2 users)
CREATE TABLE public.households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  invite_code text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles: extends auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  household_id uuid REFERENCES public.households(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Categories: transaction categories (seeded per household)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  color text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, household_id)
);

-- Transactions: the core table
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  amount numeric(12,2) NOT NULL,
  description text,
  merchant text,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv', 'ofx')),
  ai_categorized boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Budgets: per-category monthly budgets
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  category_id uuid NOT NULL,
  amount numeric(12,2) NOT NULL,
  month date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (household_id, category_id, month),
  FOREIGN KEY (category_id, household_id) REFERENCES public.categories(id, household_id) ON DELETE CASCADE
);

-- Recurring patterns: detected recurring transactions
CREATE TABLE public.recurring_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  merchant text NOT NULL,
  estimated_amount numeric(12,2) NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  last_seen date,
  next_expected date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- updated_at triggers
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.households
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recurring_patterns
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. RLS HELPER FUNCTION (must be created after profiles table exists)
-- ============================================================================

-- Returns the household_id for the currently authenticated user.
-- SECURITY DEFINER bypasses RLS to avoid circular dependency with profiles table.
-- Uses plpgsql so Postgres defers table reference validation to runtime.
CREATE OR REPLACE FUNCTION public.get_user_household_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT household_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

-- ============================================================================
-- 5. ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_patterns ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Households: members can read, creator can update, authenticated users can create
CREATE POLICY "Members can read own household"
  ON public.households FOR SELECT
  USING (id = public.get_user_household_id());

CREATE POLICY "Creator can update household"
  ON public.households FOR UPDATE
  USING (id = public.get_user_household_id() AND created_by = auth.uid())
  WITH CHECK (id = public.get_user_household_id() AND created_by = auth.uid());

CREATE POLICY "Authenticated users can create households"
  ON public.households FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Categories: household-scoped CRUD
CREATE POLICY "Members can read categories"
  ON public.categories FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Members can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Members can update categories"
  ON public.categories FOR UPDATE
  USING (household_id = public.get_user_household_id())
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Members can delete categories"
  ON public.categories FOR DELETE
  USING (household_id = public.get_user_household_id());

-- Transactions: household-scoped CRUD
CREATE POLICY "Members can read transactions"
  ON public.transactions FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Members can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    household_id = public.get_user_household_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "Members can update transactions"
  ON public.transactions FOR UPDATE
  USING (household_id = public.get_user_household_id())
  WITH CHECK (
    household_id = public.get_user_household_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "Members can delete transactions"
  ON public.transactions FOR DELETE
  USING (household_id = public.get_user_household_id());

-- Budgets: household-scoped CRUD
CREATE POLICY "Members can read budgets"
  ON public.budgets FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Members can create budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Members can update budgets"
  ON public.budgets FOR UPDATE
  USING (household_id = public.get_user_household_id())
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Members can delete budgets"
  ON public.budgets FOR DELETE
  USING (household_id = public.get_user_household_id());

-- Recurring patterns: household-scoped CRUD
CREATE POLICY "Members can read recurring patterns"
  ON public.recurring_patterns FOR SELECT
  USING (household_id = public.get_user_household_id());

CREATE POLICY "Members can create recurring patterns"
  ON public.recurring_patterns FOR INSERT
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Members can update recurring patterns"
  ON public.recurring_patterns FOR UPDATE
  USING (household_id = public.get_user_household_id())
  WITH CHECK (household_id = public.get_user_household_id());

CREATE POLICY "Members can delete recurring patterns"
  ON public.recurring_patterns FOR DELETE
  USING (household_id = public.get_user_household_id());

-- ============================================================================
-- 6. RPC FUNCTIONS
-- ============================================================================

-- Creates a household, assigns the user to it, and seeds default categories.
CREATE OR REPLACE FUNCTION public.create_household(p_name text)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_household public.households;
  v_user_id uuid := auth.uid();
BEGIN
  -- Guard against unauthenticated callers
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already belong to a household
  IF (SELECT household_id FROM public.profiles WHERE id = v_user_id) IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  -- Create the household
  INSERT INTO public.households (name, created_by)
  VALUES (p_name, v_user_id)
  RETURNING * INTO v_household;

  -- Assign user to the household
  UPDATE public.profiles
  SET household_id = v_household.id
  WHERE id = v_user_id;

  -- Seed default categories
  INSERT INTO public.categories (household_id, name, icon, color, is_default) VALUES
    (v_household.id, 'Food & Dining', '🍽️', '#ef4444', true),
    (v_household.id, 'Transport', '🚗', '#f97316', true),
    (v_household.id, 'Housing', '🏠', '#eab308', true),
    (v_household.id, 'Utilities', '💡', '#84cc16', true),
    (v_household.id, 'Entertainment', '🎬', '#06b6d4', true),
    (v_household.id, 'Shopping', '🛍️', '#8b5cf6', true),
    (v_household.id, 'Health', '❤️', '#ec4899', true),
    (v_household.id, 'Income', '💰', '#22c55e', true),
    (v_household.id, 'Other', '📦', '#6b7280', true);

  RETURN v_household;
END;
$$;

-- Joins an existing household by invite code.
CREATE OR REPLACE FUNCTION public.join_household_by_invite(p_code text)
RETURNS public.households
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_household public.households;
  v_user_id uuid := auth.uid();
  v_member_count int;
BEGIN
  -- Guard against unauthenticated callers
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user doesn't already belong to a household
  IF (SELECT household_id FROM public.profiles WHERE id = v_user_id) IS NOT NULL THEN
    RAISE EXCEPTION 'User already belongs to a household';
  END IF;

  -- Find household by invite code
  SELECT * INTO v_household
  FROM public.households
  WHERE invite_code = p_code;

  IF v_household IS NULL THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;

  -- Check household isn't full (max 2 members)
  SELECT count(*) INTO v_member_count
  FROM public.profiles
  WHERE household_id = v_household.id;

  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'Household is full (maximum 2 members)';
  END IF;

  -- Assign user to the household
  UPDATE public.profiles
  SET household_id = v_household.id
  WHERE id = v_user_id;

  RETURN v_household;
END;
$$;

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX idx_transactions_household_date ON public.transactions (household_id, date DESC);
CREATE INDEX idx_transactions_household_category ON public.transactions (household_id, category_id);
CREATE INDEX idx_transactions_household_merchant ON public.transactions (household_id, merchant);
CREATE INDEX idx_budgets_household_month ON public.budgets (household_id, month);
CREATE INDEX idx_categories_household ON public.categories (household_id);
CREATE INDEX idx_profiles_household ON public.profiles (household_id);

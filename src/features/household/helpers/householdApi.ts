import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../../shared/lib/supabase";
import type { Household } from "../../../shared/types";

// The Supabase client's generic RPC type inference doesn't resolve correctly
// with hand-written Database types. We use an untyped client reference for
// RPC calls and apply return types explicitly via .returns<T>().
const rpc = (supabase as unknown as SupabaseClient).rpc.bind(supabase);

export async function createHousehold(name: string) {
  const { data, error } = await rpc("create_household", {
    p_name: name,
  }).returns<Household>();

  if (error) throw error;
  return data;
}

export async function joinHousehold(code: string) {
  const { data, error } = await rpc("join_household_by_invite", {
    p_code: code,
  }).returns<Household>();

  if (error) throw error;
  return data;
}

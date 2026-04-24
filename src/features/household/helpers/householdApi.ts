import { supabase } from "../../../shared/lib/supabase";
import type { Household } from "../../../shared/types";

type HouseholdRpcClient = {
  rpc(
    fn: "create_household",
    args: { p_name: string },
  ): ReturnType<typeof supabase.rpc>;
  rpc(
    fn: "join_household_by_invite",
    args: { p_code: string },
  ): ReturnType<typeof supabase.rpc>;
};

const householdRpcClient = supabase as typeof supabase & HouseholdRpcClient;

function createHouseholdRpc(name: string) {
  return householdRpcClient.rpc("create_household", {
    p_name: name,
  });
}

function joinHouseholdByInviteRpc(code: string) {
  return householdRpcClient.rpc("join_household_by_invite", {
    p_code: code,
  });
}

export async function createHousehold(name: string) {
  const { data, error } = await createHouseholdRpc(name).returns<Household>();

  if (error) throw error;
  return data;
}

export async function joinHousehold(code: string) {
  const { data, error } = await joinHouseholdByInviteRpc(code).returns<Household>();

  if (error) throw error;
  return data;
}

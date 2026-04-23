import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../../../shared/lib/supabase";
import type { Profile } from "../../../shared/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  setSession: (session) =>
    set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () =>
    set({ session: null, user: null, profile: null, isLoading: false }),
}));

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Failed to fetch profile:", error.message);
    return null;
  }

  return data;
}

// Self-initializing auth listener — runs at module load time.
// By the time any component renders, the store is already hydrating.
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setSession, setProfile, setLoading } = useAuthStore.getState();

  setSession(session);

  if (session?.user) {
    const profile = await fetchProfile(session.user.id);
    setProfile(profile);
  } else {
    setProfile(null);
  }

  setLoading(false);

  if (event === "SIGNED_OUT") {
    useAuthStore.getState().clear();
  }
});

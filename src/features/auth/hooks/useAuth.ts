import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const { session, user, profile, isLoading } = useAuthStore();

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    needsHousehold: !!session && !!profile && !profile.household_id,
  };
}

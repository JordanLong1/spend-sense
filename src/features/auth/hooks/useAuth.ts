import { useAuthStore } from "../stores/authStore";

export function useAuth() {
  const { session, user, profile, isLoading } = useAuthStore();
  const isProfilePending = !!session && profile === null;
  const effectiveIsLoading = isLoading || isProfilePending;

  return {
    session,
    user,
    profile,
    isLoading: effectiveIsLoading,
    isAuthenticated: !!session,
    needsHousehold: !!session && !isProfilePending && !!profile && !profile.household_id,
  };
}

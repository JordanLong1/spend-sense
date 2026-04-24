import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../shared/lib/supabase";
import { useAuthStore } from "../../auth/stores/authStore";
import { createHousehold, joinHousehold } from "../helpers/householdApi";

type Mode = "choose" | "create" | "join";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "message" in err) {
    return String(err.message);
  }
  return fallback;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refreshProfile() {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      useAuthStore.getState().setProfile(data);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createHousehold(name);
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to create household"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await joinHousehold(inviteCode);
      await refreshProfile();
      navigate("/");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to join household"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          Set up your household
        </h1>
        <p className="mb-8 text-center text-sm text-gray-600">
          A household groups your transactions and budgets. You can share it
          with one other person.
        </p>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("create")}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="block text-sm font-medium text-gray-900">
                Create a household
              </span>
              <span className="block text-sm text-gray-500">
                Start fresh with your own household
              </span>
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-left hover:bg-gray-50"
            >
              <span className="block text-sm font-medium text-gray-900">
                Join a household
              </span>
              <span className="block text-sm text-gray-500">
                Enter an invite code from someone else
              </span>
            </button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label
                htmlFor="householdName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Household name
              </label>
              <input
                id="householdName"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder='e.g. "The Smiths" or "My Budget"'
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create household"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="w-full text-sm text-gray-600 hover:underline"
            >
              Back
            </button>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label
                htmlFor="inviteCode"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Invite code
              </label>
              <input
                id="inviteCode"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                placeholder="Paste the invite code"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? "Joining..." : "Join household"}
            </button>
            <button
              type="button"
              onClick={() => setMode("choose")}
              className="w-full text-sm text-gray-600 hover:underline"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { signOut } from "../features/auth/helpers/authApi";

export function Layout() {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">Spend Sense</h1>
          <div className="flex items-center gap-4">
            {profile && (
              <span className="text-sm text-gray-600">
                {profile.display_name}
              </span>
            )}
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

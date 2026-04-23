import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    lazy: () =>
      import("../features/auth/components/LoginPage").then((m) => ({
        Component: m.LoginPage,
      })),
  },
  {
    path: "/signup",
    lazy: () =>
      import("../features/auth/components/SignupPage").then((m) => ({
        Component: m.SignupPage,
      })),
  },

  // Onboarding (authenticated, no household yet)
  {
    path: "/onboarding",
    lazy: () =>
      import("../features/household/components/OnboardingPage").then((m) => ({
        Component: m.OnboardingPage,
      })),
  },

  // Protected routes (authenticated + has household)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/",
            lazy: () =>
              import("../features/dashboard/components/DashboardPage").then(
                (m) => ({ Component: m.DashboardPage }),
              ),
          },
        ],
      },
    ],
  },
]);

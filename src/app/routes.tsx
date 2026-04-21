import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";

export const router = createBrowserRouter([
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
]);

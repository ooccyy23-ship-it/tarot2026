import { useEffect, useState } from "react";
import DrawToolPage from "../App";
import { DashboardPage } from "../pages/DashboardPage";
import { DataManagementPage } from "../pages/DataManagementPage";
import { NewObservationPage } from "../pages/NewObservationPage";
import { ObservationHistoryPage } from "../pages/ObservationHistoryPage";
import { PendingVerificationPage } from "../pages/PendingVerificationPage";
import { AppLayout } from "./AppLayout";

const routes = ["/", "/new", "/history", "/pending", "/data", "/draw"] as const;
export type AppRoute = (typeof routes)[number];

function getRoute(): AppRoute {
  const path = window.location.hash.replace(/^#/, "") || "/";
  return routes.includes(path as AppRoute) ? (path as AppRoute) : "/";
}

export function AppRouter() {
  const [route, setRoute] = useState<AppRoute>(getRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  let page;
  switch (route) {
    case "/new":
      page = <NewObservationPage />;
      break;
    case "/history":
      page = <ObservationHistoryPage />;
      break;
    case "/pending":
      page = <PendingVerificationPage />;
      break;
    case "/data":
      page = <DataManagementPage />;
      break;
    case "/draw":
      page = <DrawToolPage />;
      break;
    default:
      page = <DashboardPage />;
  }

  return <AppLayout currentRoute={route}>{page}</AppLayout>;
}

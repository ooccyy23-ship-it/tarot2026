import { useEffect, useState } from "react";
import DrawToolPage from "../App";
import { DashboardPage } from "../pages/DashboardPage";
import { DataManagementPage } from "../pages/DataManagementPage";
import { DeckDesignPage } from "../pages/DeckDesignPage";
import { NewObservationPage } from "../pages/NewObservationPage";
import { ObservationDetailPage } from "../pages/ObservationDetailPage";
import { ObservationHistoryPage } from "../pages/ObservationHistoryPage";
import { PendingVerificationPage } from "../pages/PendingVerificationPage";
import { SevenDayResearchPage } from "../pages/SevenDayResearchPage";
import { SevenDayResearchListPage } from "../pages/SevenDayResearchListPage";
import { AppLayout } from "./AppLayout";

const routes = ["/", "/new", "/research", "/history", "/pending", "/data", "/deck", "/draw"] as const;
export type AppRoute = (typeof routes)[number];

function getRoute(): string {
  const path = window.location.hash.replace(/^#/, "") || "/";
  if (
    routes.includes(path as AppRoute)
    || path.startsWith("/observations/")
    || path.startsWith("/research/")
  ) return path;
  return "/";
}

export function AppRouter() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const routePath = route.split(/[?#]/)[0];
  let page;
  if (routePath.startsWith("/observations/")) {
    const observationId = decodeURIComponent(routePath.slice("/observations/".length));
    page = <ObservationDetailPage observationId={observationId} startEditing={route.includes("edit=1")} />;
  } else if (routePath.startsWith("/research/")) {
    const sessionId = decodeURIComponent(routePath.slice("/research/".length));
    page = <SevenDayResearchPage sessionId={sessionId} />;
  } else switch (routePath) {
    case "/new":
      page = <NewObservationPage />;
      break;
    case "/history":
      page = <ObservationHistoryPage />;
      break;
    case "/research":
      page = <SevenDayResearchListPage />;
      break;
    case "/pending":
      page = <PendingVerificationPage />;
      break;
    case "/data":
      page = <DataManagementPage />;
      break;
    case "/deck":
      page = <DeckDesignPage />;
      break;
    case "/draw":
      page = <DrawToolPage />;
      break;
    default:
      page = <DashboardPage />;
  }

  return <AppLayout currentRoute={route}>{page}</AppLayout>;
}

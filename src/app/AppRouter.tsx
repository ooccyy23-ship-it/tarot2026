import { useEffect, useRef, useState } from "react";
import DrawToolPage from "../App";
import { DashboardPage } from "../pages/DashboardPage";
import { TarotAnalysisPage } from "../pages/TarotAnalysisPage";
import { TarotCooccurrencePage } from "../pages/TarotCooccurrencePage";
import { DailyTarotStatisticsPage } from "../pages/DailyTarotStatisticsPage";
import { TarotRecordImportPage } from "../pages/TarotRecordImportPage";
import { TarotRecordsPage } from "../pages/TarotRecordsPage";
import { TarotRecordDetailPage } from "../pages/TarotRecordDetailPage";
import { OpenObservationPage } from "../pages/OpenObservationPage";
import { TarotTrendAnalysisPage } from "../pages/TarotTrendAnalysisPage";
import { AppLayout } from "./AppLayout";
import { NetworkStatusNotice } from "../components/NetworkStatusNotice";

const routes = ["/", "/draw", "/open-observation", "/import", "/records", "/records/detail", "/analytics", "/analytics/daily", "/cooccurrence", "/trends"] as const;
export type AppRoute = (typeof routes)[number];

function getRoute(): string {
  const path = (window.location.hash.replace(/^#/, "") || "/").split("?")[0];
  if (routes.includes(path as AppRoute)) return path;
  return "/";
}

export function AppRouter() {
  const [route, setRoute] = useState(getRoute);
  const routeRef = useRef(route);

  useEffect(() => {
    const handleHashChange = () => {
      const nextRoute = getRoute();
      if (nextRoute === routeRef.current) return;
      const navigationEvent = new CustomEvent("tarot:before-route-change", {
        cancelable: true,
        detail: { from: routeRef.current, to: nextRoute },
      });
      if (!window.dispatchEvent(navigationEvent)) {
        window.history.replaceState(null, "", `#${routeRef.current}`);
        return;
      }
      routeRef.current = nextRoute;
      setRoute(nextRoute);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  let page;
  switch (route) {
    case "/analytics/daily":
      page = <DailyTarotStatisticsPage />;
      break;
    case "/import":
      page = <TarotRecordImportPage />;
      break;
    case "/analytics":
      page = <TarotAnalysisPage />;
      break;
    case "/cooccurrence":
      page = <TarotCooccurrencePage />;
      break;
    case "/trends":
      page = <TarotTrendAnalysisPage />;
      break;
    case "/records":
      page = <TarotRecordsPage />;
      break;
    case "/records/detail":
      page = <TarotRecordDetailPage />;
      break;
    case "/draw":
      page = <DrawToolPage />;
      break;
    case "/open-observation":
      page = <OpenObservationPage />;
      break;
    default:
      page = <DashboardPage />;
  }

  return <AppLayout currentRoute={route}><NetworkStatusNotice />{page}</AppLayout>;
}

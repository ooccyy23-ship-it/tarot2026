import { useEffect, useRef, useState } from "react";
import DrawToolPage from "../App";
import { DashboardPage } from "../pages/DashboardPage";
import { TarotAnalysisPage } from "../pages/TarotAnalysisPage";
import { DailyTarotStatisticsPage } from "../pages/DailyTarotStatisticsPage";
import { TarotRecordImportPage } from "../pages/TarotRecordImportPage";
import { TarotRecordsPage } from "../pages/TarotRecordsPage";
import { TarotRecordDetailPage } from "../pages/TarotRecordDetailPage";
import { SevenDayResearchListPage } from "../pages/SevenDayResearchListPage";
import { SevenDayResearchPage } from "../pages/SevenDayResearchPage";
import { AppLayout } from "./AppLayout";
import { NetworkStatusNotice } from "../components/NetworkStatusNotice";

const routes = ["/", "/draw", "/research", "/import", "/records", "/records/detail", "/analytics", "/analytics/daily"] as const;
export type AppRoute = (typeof routes)[number];

function getRoute(): string {
  const path = (window.location.hash.replace(/^#/, "") || "/").split("?")[0];
  if (path.startsWith("/research/")) return path;
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
    case "/research":
      page = <SevenDayResearchListPage />;
      break;
    case "/analytics/daily":
      page = <DailyTarotStatisticsPage />;
      break;
    case "/import":
      page = <TarotRecordImportPage />;
      break;
    case "/analytics":
      page = <TarotAnalysisPage />;
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
    default:
      if (route.startsWith("/research/")) {
        page = <SevenDayResearchPage sessionId={decodeURIComponent(route.slice("/research/".length))} />;
      } else {
        page = <DashboardPage />;
      }
  }

  return <AppLayout currentRoute={route}><NetworkStatusNotice />{page}</AppLayout>;
}

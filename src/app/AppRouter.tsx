import { useEffect, useState } from "react";
import DrawToolPage from "../App";
import { DashboardPage } from "../pages/DashboardPage";
import { TarotAnalysisPage } from "../pages/TarotAnalysisPage";
import { DailyTarotStatisticsPage } from "../pages/DailyTarotStatisticsPage";
import { TarotRecordImportPage } from "../pages/TarotRecordImportPage";
import { TarotRecordsPage } from "../pages/TarotRecordsPage";
import { AppLayout } from "./AppLayout";

const routes = ["/", "/draw", "/import", "/records", "/analytics", "/analytics/daily"] as const;
export type AppRoute = (typeof routes)[number];

function getRoute(): string {
  const path = window.location.hash.replace(/^#/, "") || "/";
  if (routes.includes(path as AppRoute)) return path;
  return "/";
}

export function AppRouter() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
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
    case "/records":
      page = <TarotRecordsPage />;
      break;
    case "/draw":
      page = <DrawToolPage />;
      break;
    default:
      page = <DashboardPage />;
  }

  return <AppLayout currentRoute={route}>{page}</AppLayout>;
}

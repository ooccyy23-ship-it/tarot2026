import type { ReactNode } from "react";
import { AuthStatus } from "../features/auth/components/AuthStatus";
import type { AppRoute } from "./AppRouter";

const navigation: Array<{ route: AppRoute; label: string }> = [
  { route: "/", label: "首頁" },
  { route: "/draw", label: "抽牌" },
  { route: "/research", label: "研究" },
  { route: "/import", label: "匯入" },
  { route: "/records", label: "紀錄" },
  { route: "/analytics", label: "統計" },
];

function isRouteActive(currentRoute: string, route: AppRoute): boolean {
  if (route === "/") return currentRoute === "/";
  return currentRoute === route || currentRoute.startsWith(`${route}/`);
}

export function AppLayout({ currentRoute, children }: { currentRoute: string; children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#/" aria-label="Tarot Validation System 首頁">
          <span className="brand-mark">T</span>
          <span>
            <strong>Tarot Validation System</strong>
            <small>塔羅抽牌與研究資料系統</small>
          </span>
        </a>
        <div className="header-controls">
          <nav className="top-nav" aria-label="主要導覽">
            {navigation.map((item) => (
              <a
                key={item.route}
                className={isRouteActive(currentRoute, item.route) ? "is-active" : ""}
                href={`#${item.route}`}
                aria-current={isRouteActive(currentRoute, item.route) ? "page" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <AuthStatus />
        </div>
      </header>
      <div className="page-container">{children}</div>
    </div>
  );
}

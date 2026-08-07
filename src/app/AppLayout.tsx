import type { ReactNode } from "react";
import { AuthStatus } from "../features/auth/components/AuthStatus";
import type { AppRoute } from "./AppRouter";

const navigation: Array<{ route: AppRoute; label: string }> = [
  { route: "/", label: "首頁" },
  { route: "/draw", label: "抽牌工具" },
  { route: "/records", label: "抽牌紀錄" },
  { route: "/analytics", label: "分析儀表板" },
];

export function AppLayout({ currentRoute, children }: { currentRoute: string; children: ReactNode }) {
  const activeRoute = currentRoute;
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#/" aria-label="塔羅抽牌與紀錄系統首頁">
          <span className="brand-mark">T</span>
          <span>
            <strong>塔羅抽牌系統</strong>
            <small>抽牌與紀錄</small>
          </span>
        </a>
        <div className="header-controls">
          <nav className="top-nav" aria-label="主要導覽">
            {navigation.map((item) => (
              <a
                key={item.route}
                className={activeRoute === item.route ? "is-active" : ""}
                href={`#${item.route}`}
                aria-current={activeRoute === item.route ? "page" : undefined}
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

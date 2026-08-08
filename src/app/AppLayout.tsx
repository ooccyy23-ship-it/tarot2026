import type { ReactNode } from "react";
import { AuthStatus } from "../features/auth/components/AuthStatus";
import type { AppRoute } from "./AppRouter";

const navigation: Array<{ route: AppRoute; label: string }> = [
  { route: "/draw", label: "抽牌工具" },
  { route: "/import", label: "紀錄匯入" },
  { route: "/records", label: "抽牌資料庫" },
  { route: "/analytics", label: "統計分析" },
];

export function AppLayout({ currentRoute, children }: { currentRoute: string; children: ReactNode }) {
  const activeRoute = currentRoute;
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

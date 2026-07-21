import type { ReactNode } from "react";
import type { AppRoute } from "./AppRouter";

const navigation: Array<{ route: AppRoute; label: string }> = [
  { route: "/", label: "首頁" },
  { route: "/new", label: "新增觀測" },
  { route: "/history", label: "歷史觀測" },
  { route: "/pending", label: "待驗證" },
  { route: "/data", label: "資料管理" },
  { route: "/draw", label: "抽牌工具" },
];

export function AppLayout({ currentRoute, children }: { currentRoute: string; children: ReactNode }) {
  const activeRoute = currentRoute.startsWith("/observations/") ? "/history" : currentRoute;
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#/" aria-label="塔羅觀測與現實驗證系統首頁">
          <span className="brand-mark">T</span>
          <span>
            <strong>塔羅觀測系統</strong>
            <small>現實驗證 v2</small>
          </span>
        </a>
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
      </header>
      <div className="page-container">{children}</div>
    </div>
  );
}

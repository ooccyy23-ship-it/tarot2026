# 塔羅觀測與現實驗證系統 v2

以 React、TypeScript 與 Vite 製作的本機優先 Web App。v2 在既有「塔羅五牌抽取系統」之外，逐步加入觀測前紀錄、題組、解讀與現實驗證流程。

## 第一階段完成範圍

- 首頁與六個主要導覽入口
- GitHub Pages 友善的 hash 路由
- IndexedDB 資料庫 `tarot-observation-db`
- `observations`、`questionGroups`、`settings` stores
- 題組與觀測資料型別
- 題組分類、名稱與五題預覽
- 可建立五題自訂題組
- 新增觀測步驟 1：基本資料與題組
- 新增觀測步驟 2：情緒、期待、焦慮與平靜程度
- 既有抽牌流程完整保留於「抽牌工具」

預設歷史題組資料目前為空，不含任何真實人物、私人觀測文字或 AI 解讀。後續將透過去識別化 JSON 匯入資料。

## 資料安全

本系統目前使用瀏覽器本機資料庫保存觀測紀錄。
清除瀏覽器資料或更換裝置可能導致資料遺失。
請定期使用「資料管理」匯出JSON備份。

請勿把真實觀測紀錄、姓名、情緒、事件或解讀加入 Git 追蹤的原始碼與資料檔。

Repository 內的 `115年序號牌卡對照表.xlsx` 是牌卡序號對照來源，並非歷史私人觀測資料。Office 產生的 `~$` 暫存檔已由 `.gitignore` 排除。

## 既有抽牌規則

- 輸入 `HH:MM` 時間並計算五序號
- 驗證序號是否在有效範圍
- 可選擇星期牌卡對照表
- 五次硬幣逐張操作並鎖定結果
- 正面為正位、反面為逆位
- 五張牌完成前不揭示最終結果

## 開發

```bash
pnpm install
pnpm dev
pnpm test
pnpm run build
```

Vite `base` 使用 `/tarot2026/`，應用程式路由使用 URL hash，可直接配合目前的 GitHub Pages workflow 部署。

## 專案結構

```text
src/
  app/
  pages/
  features/
    observations/
    questionGroups/
  components/
  data/
  logic/
  test/
  types/
```

## 授權

[MIT License](./LICENSE)

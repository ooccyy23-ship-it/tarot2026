# 塔羅五牌抽取系統 MVP

使用 React、TypeScript、Vite 建立的前端 Web App MVP，依照指定時間推導五個序號，對應星期牌卡表，並透過硬幣模擬完成五張牌的正逆位流程。

## 功能概覽

- 輸入抽牌時間並驗證 `HH:MM`
- 依時間規則計算五個序號
- 驗證序號是否落在 `1~78`
- 依星期載入對照表並保留五張牌狀態
- 依序執行五次硬幣翻轉
- 五次完成後揭示完整牌組與正逆位
- 支援複製完整抽牌結果
- 支援桌面與手機版 RWD

## 技術棧

- React 18
- TypeScript
- Vite
- Vitest
- 純前端，無後端、無登入、無 Firebase

## 授權

本專案目前附上 [MIT License](./LICENSE)。

## 專案結構

```text
src/
  components/
  data/
  logic/
  test/
  types/
scripts/
```

重點檔案：

- [src/App.tsx](./src/App.tsx)
- [src/data/weekdayMappings.json](./src/data/weekdayMappings.json)
- [scripts/convert_weekday_mappings.py](./scripts/convert_weekday_mappings.py)

## 資料來源

專案根目錄包含以下原始資料：

- `115年序號牌卡對照表.xlsx`
- `時間衍生五序號法 v1.pdf`
- `正逆位產生法 v1.pdf`

前端執行時不會解析 Excel，會直接使用已產生好的：

- `src/data/weekdayMappings.json`

## Excel 轉 JSON

若你之後更新 Excel，可重新執行一次性轉換腳本：

```bash
python scripts/convert_weekday_mappings.py
```

輸出會覆寫：

```text
src/data/weekdayMappings.json
```

## 本機開發

先安裝依賴：

```bash
pnpm install
```

啟動開發伺服器：

```bash
pnpm dev
```

## 測試與建置

執行單元測試：

```bash
pnpm test
```

正式建置：

```bash
pnpm build
```

預覽正式版輸出：

```bash
pnpm preview
```

## 已完成測試案例

- `09:55` 應產生 `55 / 64 / 49 / 06 / 39`
- `01:09` 的序號 3 為 `0`，應判定無效
- `23:59` 的序號 2 為 `82`，應判定無效
- 含前導 0 的序號可正確拆解
- 序號 4 依規則正確使用加法或差值
- 硬幣結果只會是正面或反面
- 鎖定後不得再次產生正逆位

## GitHub 上傳建議

建議提交：

- 原始程式碼
- `src/data/weekdayMappings.json`
- `package.json`
- `pnpm-lock.yaml`
- 原始規格 Excel / PDF

不建議提交：

- `node_modules/`
- `dist/`
- `.pnpm-store/`
- 本機快取與建置暫存檔

## 建議上傳流程

```bash
git init
git add .
git commit -m "Initial MVP for tarot five-card draw app"
git branch -M main
git remote add origin <你的 GitHub repo URL>
git push -u origin main
```

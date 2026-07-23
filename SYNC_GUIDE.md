# 家裡 / 公司 雙機同步 SOP

適用情境：

- 家裡電腦與公司電腦不能直接連線
- 以 GitHub 作為專案中繼站
- 透過 GitHub 頁面下載 ZIP，再手動搬移到另一台電腦

## 核心原則

1. GitHub 是唯一正式版本來源。
2. 同一時間盡量只在一台電腦上進行主要修改。
3. 每次換電腦前，先把最新版本整理並同步到 GitHub。
4. 不要同步建置產物或依賴資料夾。

## 不要同步的內容

- `node_modules/`
- `dist/`
- `.pnpm-store/`
- `tsconfig.tsbuildinfo`
- 其他本機快取或暫存檔

## 家裡電腦上傳流程

### 1. 完成修改後先驗證

```bash
pnpm test
pnpm build
```

### 2. 確認本次修改內容

```bash
git status
```

### 3. 提交並推送到 GitHub

```bash
git add .
git commit -m "feat: 本次修改摘要"
git push origin main
```

### 4. 到 GitHub 確認

確認以下內容：

- 最新 commit 已出現在 `main`
- 重要檔案有同步上去
- 若有 GitHub Pages，部署狀態正常

## 公司電腦更新流程

### 1. 先備份公司電腦目前專案

建議直接複製資料夾，例如：

```text
牌卡分析系統_backup_2026-07-23
```

### 2. 從 GitHub 下載最新版本

使用 GitHub 頁面：

- `Code`
- `Download ZIP`

### 3. 解壓縮後更新專案

建議做法：

- 不要把新 ZIP 內容直接和舊資料夾亂混
- 先建立新的乾淨資料夾
- 再把最新解壓縮內容放進去

如果你一定要覆蓋舊專案，也要先完成備份。

### 4. 安裝依賴

```bash
pnpm install
```

### 5. 驗證專案可用

```bash
pnpm test
pnpm build
pnpm dev
```

## 如果公司電腦也改過程式

這是最容易出錯的情況。

請改用這個流程：

1. 先把公司電腦修改過的檔案另外備份出來。
2. 再下載 GitHub 最新版。
3. 用比對方式把公司端改動補回新版本。
4. 驗證後再決定是否要重新推回 GitHub。

不要直接用新 ZIP 覆蓋有本地修改的專案資料夾。

## 每次同步前必查清單

### 上傳前

- `git status` 是否符合預期
- `pnpm test` 是否通過
- `pnpm build` 是否通過
- commit 訊息是否清楚

### 下載後

- `src/` 是否完整
- `scripts/` 是否完整
- `.github/` 是否存在
- `package.json` 是否存在
- `pnpm-lock.yaml` 是否存在
- `README.md` 是否存在

## 建議工作節奏

最穩的節奏是：

1. 在家裡電腦開發
2. 推到 GitHub
3. 公司電腦下載最新版本
4. 公司電腦只延續最新版本工作
5. 若公司也有修改，完成後再同步回 GitHub

## 避免版本混亂的重點

- 不要同時在兩台電腦各自修改同一批檔案太久
- 不要拿舊 ZIP 繼續改
- 不要把 `dist/` 當成原始碼同步
- 不要省略測試與建置驗證

## 適合這個專案的實際操作方式

這個專案目前是前端專案，重點同步檔案應包含：

- `src/`
- `scripts/`
- `.github/`
- `package.json`
- `pnpm-lock.yaml`
- `README.md`
- `LICENSE`
- `.gitignore`
- `.npmrc`
- Excel / PDF 原始規格檔

## 最後建議

若未來公司環境允許，最理想仍然是直接使用：

```bash
git pull
git push
```

但在目前限制下，使用 GitHub ZIP 作為雙機同步中介是可行的，只要固定照這份 SOP 操作，就能大幅降低版本錯亂風險。

# 正逆位 RNG 完整稽核報告

- 稽核日期：2026-08-14（Asia/Taipei）
- 稽核範圍：production RNG、五抽獨立性、UI/state、草稿恢復、一鍵與手動匯入、Firestore schema、統計計算、Git 歷史、模擬
- 變更限制：未修改 production RNG、Firestore 正式資料、統計公式或既有抽牌流程

## 摘要結論

目前 production 正逆位使用 `crypto.getRandomValues(new Uint32Array(1))`，以整數奇偶決定正反面，再固定映射為正位／逆位。Uint32 完整範圍共有 `2^32` 個值，偶數與奇數各半，因此 `% 2` 的理論機率精確為 50% / 50%，沒有 modulo bias。

大樣本模擬直接呼叫 production 的 `generateCoinSide()`：100 萬次正位率為 50.1137%；10 組各 10 萬次的正位率介於 49.630%～50.426%。100,000 組五張牌的逆位張數分布也接近理論二項分布。

在程式碼、state、匯入與統計鏈路中，沒有找到會把正位系統性改成逆位的證據。tarot2026 的 177 / 228 在公平 50/50 下屬於較少見的樣本（雙尾精確二項檢定約 `p = 0.0129`），但單靠這一批 405 張不能證明 RNG 有 bug。

本次無法在自動化稽核環境取得授權 Firebase 使用者憑證；Firestore Rules 會拒絕未登入讀取。因此無法獨立完成正式資料的 raw-format 重算與逐日／週／月分段。報告不以 UI 顯示值冒充 Firestore 原始重算。

## A. Production RNG

### 正式執行鏈

1. `src/logic/flipCoin.ts#getCryptoProvider`
   - 取得 `globalThis.crypto`。
   - 缺少 `crypto.getRandomValues` 時直接拋錯，不降級使用 `Math.random()`。
2. `src/logic/flipCoin.ts#generateCoinSide`
   - 建立 `Uint32Array(1)`。
   - 每次呼叫 `crypto.getRandomValues(buffer)`。
   - `buffer[0] % 2 === 0` → `heads`；否則 → `tails`。
3. `src/logic/flipCoin.ts#resolveOrientation`
   - `heads` → `upright`。
   - `tails` → `reversed`。
4. `src/logic/flipCoin.ts#finalizeCoinFlip`
   - 已鎖定結果直接原樣回傳。
   - 未鎖定才呼叫一次 `generateCoinSide()` 並建立鎖定結果。

### Production 呼叫點

- 五抽：`src/features/draw/components/FiveCardDrawModule.tsx#handleStopFlip`
- 單抽：`src/features/draw/components/SingleCardDrawModule.tsx#handleStopFlip`

沒有找到第二套 production 正逆位演算法。`Math.random()`／`crypto.randomUUID()` 的其他出現只用於 ID，不參與正逆位。

### 理論機率

- Uint32 範圍：0～4,294,967,295，共 `2^32` 個可能值。
- 偶數個數：`2^31`。
- 奇數個數：`2^31`。
- `upright = P(even) = 1/2`。
- `reversed = P(odd) = 1/2`。
- `% 2` 的除數可整除來源空間大小，沒有 modulo bias。
- 實作沒有 `< 0.5`、`<= 0.5`、`% 100` 或不對稱 threshold。

## B. Independence

- 五張牌是依序操作，每張完成時各自呼叫一次 `finalizeCoinFlip()`。
- 沒有先產生一個 random 再套用五張的 `cards.map(() => random)` 寫法。
- 每張使用新的 `Uint32Array(1)` 與新的 `crypto.getRandomValues()` 呼叫。
- 第 N 張只能在前一張鎖定後啟用；後續張按鈕保持 disabled。
- `setCards(currentCards => currentCards.map(...))` 使用 functional state update，並以 index 只更新目標牌，未發現 stale state、陣列原地 mutation 或 N/N+1 寫錯位置。
- 快速連點後，既有 `locked` guard 會原樣回傳已完成結果，避免同一張重新 RNG。未發現「畫面第二次／保存第一次」的可重現路徑。

## C. UI / State

### 動畫

- `src/components/CoinFlipCard.tsx` 的 1 秒 timer 只負責在動畫結束時呼叫 `onStop`。
- 動畫 CSS 與 icon 不產生 random，也不決定結果。

### 單一 orientation 值鏈

```text
finalizeCoinFlip().orientation
→ DrawCard.orientationResult.orientation
→ CoinFlipCard 顯示
→ buildDrawResult
→ DrawResult.cards[].orientation / orientationLabel
→ research session / observation / import draft
→ tarotRecords Firestore document
```

- `buildDrawResult()` 僅在五張均 locked 後建立結果。
- `orientationLabel` 直接由同一個 orientation 衍生：upright → 正位；reversed → 逆位。
- Research Session 的 `buildLockedResearchSetResult()` 與恢復函式只是複製 `orientation`、`orientationLabel`、`coinSide`，沒有重新計算。

### 草稿恢復

- `src/features/draw/storage/drawDraftStorage.ts` 僅接受：
  - coinSide：heads / tails
  - orientation：upright / reversed
  - locked：true（已完成的牌）
- 恢復時直接還原卡片資料，不重新 RNG，也不反轉 mapping。
- 驗證會拒絕跳號鎖定，例如第 3 張已完成但第 2 張未完成。

## D. Firestore

### 正式 tarotRecords schema

- collection：`tarotRecords/{recordId}`
- orientation：`"upright" | "reversed"`
- orientationLabel：`"正位" | "逆位"`
- importSource：`"draw_result" | "manual_text"`

`firestore.rules` 的 create/update 均限制 orientation 與 orientationLabel 為上述合法集合，因此目前前端不能新增 null、boolean、中文 orientation 或未知字串。

### Runtime 讀取風險

`tarotRecordRepository.ts#toRecord()` 對 Firestore document 採 TypeScript cast，沒有 runtime 驗證 orientation。若 Rules 啟用前已有 legacy/null/typo 文件，仍可能被讀進記憶體。這不會被目前統計錯算成 reversed，但可能使正逆位百分比總和小於 100%。

### 正式資料 raw audit 狀態

- 已建立唯讀聚合工具：`scripts/orientationRecordAudit.ts`。
- 可分辨 formal、中文 legacy、boolean、null、missing、unknown，並產出每日／ISO 週／每月統計。
- 本次自動化環境沒有已授權 Firebase 使用者登入狀態；Rules 正確阻擋未授權讀取。
- 因此尚未取得：invalid、null、unknown 的正式筆數與日期範圍。
- 也尚未能獨立驗證 UI 的 177 / 228 是否與 raw Firestore 完全一致。

## E. Statistics

`src/features/records/logic/tarotRecordStatistics.ts#calculateTarotRecordStatistics` 使用兩個明確 filter：

- `orientation === "upright"` 才計入正位。
- `orientation === "reversed"` 才計入逆位。

不存在 `if upright else reversed`，所以 null、undefined、typo、大小寫錯誤不會被錯算為逆位。

注意：百分比分母目前是全部 records 長度。若存在 invalid orientation，正位率與逆位率相加可能小於 100%。這是資料完整性呈現風險，不是逆位偏高來源。

## 匯入鏈檢查

### 一鍵匯入

- 正常完成的五抽：`orientationResult.orientation` 原樣帶入。
- reversed 對應逆位，沒有對調。
- 防禦性風險：`drawResultImport.ts` 對缺少 `orientationResult` 使用 `?? "upright"`，會默認正位。正常完成流程要求五張 locked，理論上不會缺值；但若未來其他呼叫端傳入不完整 card，可能造成正位污染。這不解釋目前逆位偏高。

### 手動文字匯入

- parser 目前只直接辨識中文字尾 `正位`、`逆位`。
- 英文 `upright`、`reversed` 不會自動辨識。
- 缺少 orientation 會產生 blocking issue，UI 顯示空白 selector，使用者選定後才可儲存；因此不會靜默以正位完成正式保存。
- 最終 mapping：正位 → upright；逆位 → reversed，沒有反向。

## F. Simulation

執行時間：2026-08-14 20:35（Asia/Taipei）。所有模擬直接使用 `src/logic/flipCoin.ts#generateCoinSide`，未連線或寫入 Firestore。

### 不同樣本數

| 樣本數 | 正位 | 正位率 | 逆位 | 逆位率 | 正位相對 50% 偏差 |
|---:|---:|---:|---:|---:|---:|
| 1,000 | 481 | 48.1000% | 519 | 51.9000% | -1.9000pp |
| 10,000 | 5,036 | 50.3600% | 4,964 | 49.6400% | +0.3600pp |
| 100,000 | 49,839 | 49.8390% | 50,161 | 50.1610% | -0.1610pp |
| 1,000,000 | 501,137 | 50.1137% | 498,863 | 49.8863% | +0.1137pp |

### 10 組 × 100,000

| 組別 | 正位 | 正位率 | 逆位 | 逆位率 | 偏差 |
|---:|---:|---:|---:|---:|---:|
| 1 | 49,936 | 49.936% | 50,064 | 50.064% | -0.064pp |
| 2 | 49,716 | 49.716% | 50,284 | 50.284% | -0.284pp |
| 3 | 50,426 | 50.426% | 49,574 | 49.574% | +0.426pp |
| 4 | 49,886 | 49.886% | 50,114 | 50.114% | -0.114pp |
| 5 | 50,089 | 50.089% | 49,911 | 49.911% | +0.089pp |
| 6 | 49,630 | 49.630% | 50,370 | 50.370% | -0.370pp |
| 7 | 49,773 | 49.773% | 50,227 | 50.227% | -0.227pp |
| 8 | 49,740 | 49.740% | 50,260 | 50.260% | -0.260pp |
| 9 | 50,213 | 50.213% | 49,787 | 49.787% | +0.213pp |
| 10 | 49,959 | 49.959% | 50,041 | 50.041% | -0.041pp |

### 100,000 組五張牌

| 每組逆位張數 | 實際組數 | 實際比例 | 理論比例 |
|---:|---:|---:|---:|
| 0 | 3,081 | 3.081% | 3.125% |
| 1 | 15,493 | 15.493% | 15.625% |
| 2 | 31,428 | 31.428% | 31.250% |
| 3 | 31,405 | 31.405% | 31.250% |
| 4 | 15,492 | 15.492% | 15.625% |
| 5 | 3,101 | 3.101% | 3.125% |

分布符合公平硬幣的 `Binomial(n=5, p=0.5)` 預期形狀。

## G. Historical Comparison

| 來源 | 正位 | 逆位 | 總數 | 正位率 | 逆位率 |
|---|---:|---:|---:|---:|---:|
| PiliApp Legacy | 326 | 334 | 660 | 49.394% | 50.606% |
| tarot2026（提供的 baseline） | 177 | 228 | 405 | 43.704% | 56.296% |

- PiliApp：公平 50/50 的雙尾精確二項檢定約 `p = 0.7853`。
- tarot2026：雙尾精確二項檢定約 `p = 0.0129`。
- tarot2026 樣本確實比常見隨機波動更偏逆位，但仍可能由公平隨機程序產生；它不是程式偏差的單獨證據。

## Git timeline

| 日期 | Commit | 內容 |
|---|---|---|
| 2026-07-21 | `ae6c6ca` | 首次加入 `flipCoin.ts` 與 Web Crypto parity RNG |
| 2026-07-24 | `20dcbcf` | 接入七日研究抽牌結果，複製既有 orientation |
| 2026-08-05 | `574b588` | 重做正逆位 UI 與動畫；未修改 RNG 函式 |
| 2026-08-05 | `b63e59a` | 新增單抽，重用 `finalizeCoinFlip()` |
| 2026-08-06 | `92c1ab7` | 新增 tarotRecords Firestore repository |
| 2026-08-06 | `129d236` | 新增正逆位統計 |
| 2026-08-12 | `28efc34` | 新增未完成抽牌恢復，保存既有 orientation |
| 2026-08-12 | `1366d63` | 新增完成結果一鍵匯入 |

`flipCoin.ts` 自首次 commit 後沒有 production 邏輯變更。

## H. Root Cause

**Inconclusive**

理由：production RNG、state mapping、保存 mapping 與統計計數的靜態稽核，以及大樣本模擬，都沒有顯示程式偏差；但本次未能以授權身分直接讀取 Firestore 原始文件，尚不能排除歷史資料格式或特定日期／版本資料污染。

就 RNG 子結論而言：**目前沒有找到程式偏差證據。**

## I. Recommendation

1. 下一步以已登入使用者執行一次 read-only Firestore audit，將 `tarotRecords` 傳入 `auditOrientationRecords()`，核對 177 / 228、invalid/null/unknown 與每日／週／月分段。
2. 未來新紀錄可新增：
   - `orientationSource`: `"piliapp" | "tarot2026" | "unknown"`
   - `orientationRngVersion`: `"external_piliapp" | "crypto_v1" | "unknown"`
3. 一鍵由 production draw 建立的新紀錄可可靠標記 `tarot2026` / `crypto_v1`。
4. 手動 legacy 匯入應要求使用者明確選來源；不能從文字或日期猜測。
5. 不回填既有 405 張，除非來源能由可靠 metadata 證明。
6. 後續若決定修正防禦性風險，可讓一鍵匯入在 orientation 缺失時阻擋，而非預設 upright；本次未修改。
7. 不加入人工平衡、rolling balance 或固定五張 2/3 配額。

## 稽核工具與 QA

- `scripts/orientationRngAudit.test.ts`
  - production RNG 的 1k、10k、100k、1m、10×100k、100k 五張組模擬。
- `scripts/orientationRecordAudit.ts`
  - 唯讀 raw orientation 分類與日／週／月聚合，不含任何寫入。
- `scripts/orientationRecordAudit.test.ts`
  - 驗證 formal、legacy、boolean、null、missing、unknown 分類。
- `src/logic/flipCoin.qa.test.ts`
  - 100,000 次 production RNG smoke test；合理容許範圍 48%～52%。

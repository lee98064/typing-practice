# 墨打 · 中文輸入法打字練習

把鍵盤切到英文，網頁自己模擬 **注音（大千）、嘸蝦米、行列30、大易三碼、倉頡三代**。每次按鍵即時變成字根；同一個字打錯 3 次，右側出現「字根卡」：字根表、簡碼、這個字為什麼這樣拆。

- 練習：60 篇公有領域文章（古文、詩詞、近代散文、法規公文），也能匯入自己的文章（UTF-8／Big5，簡體可轉繁體）
- 測驗：1／3／5／10 分鐘或整篇，成績單、速度曲線、錯鍵熱區、弱字特訓
- 字根探索：一個字並排看五種輸入法的碼與拆法、完整字根表
- PWA：可安裝、離線練習

## 開發

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm test           # Vitest：核心引擎與資料不變式
pnpm build          # vue-tsc + vite build（含 PWA）
pnpm preview
pnpm e2e            # Playwright（先 build；需 `pnpm exec playwright install chromium`）
```

部署到子路徑（例如 GitHub Pages）：`BASE=/repo-name/ pnpm build`。路由使用 hash，不需伺服器改寫。

## 資料管線

```
data-raw/            原始字表、字根研究草稿、文章原文、IDS 部件（含各自授權）
scripts/build-data.ts    → public/data/{im,roots,articles}/、zhuyin-phrases.json、sources.json、docs/data-report.md
scripts/build-decomp.ts  → public/data/decomp/（拆字對齊；只收錄能還原字表真實碼的拆法）、docs/decomp-report.md
```

```bash
pnpm tsx scripts/build-data.ts
pnpm tsx scripts/build-decomp.ts
```

## 架構

- `src/core/` 純 TypeScript（無 Vue）：`types.ts` 介面契約、`keyboard.ts` 實體鍵位、`engines/` 組字狀態機、`session.ts` 打字判定與計分、`explain.ts` 字根卡、`zhuyin-reading.ts` 破音字詞境
- `src/stores/` Pinia：設定（localStorage）、輸入法載入、文章庫與紀錄（IndexedDB）、打字 session
- `src/components/`、`src/views/` 墨韻介面

## 授權與來源

本站為**非商業**學習工具。各資料來源與授權見 `docs/research/im-sources.md` 與網站「關於」頁，重點：

| 資料 | 授權 |
|---|---|
| 嘸蝦米 liu57 字表 | 行易有限公司著作；Free for non-commercial use |
| 注音 McBopomofo 字音／詞音 | MIT（含 libtabe 聲明） |
| 行列30（gontera/array30） | 行列科技授權免費植入 |
| 大易三碼 dayi3.cin | 太易資訊授權開放下載，不得更改編碼後散佈 |
| 倉頡三代 cangjie3.txt | Freely redistributable without restriction |
| IDS（cjkvi-ids / CHISE） | GPL-2.0（僅建置時用於拆字對齊） |
| 內建文章 | 公有領域／著作權法第 9 條 |

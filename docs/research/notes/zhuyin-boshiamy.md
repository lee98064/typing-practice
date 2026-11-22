# 注音與嘸蝦米：來源、行為、字根及小型探測

## 哪些資料可公開再散布？現有注音表從哪裡來？

### Takeaway

建議注音採用本次已下載的 McBopomofo 單字音與詞音原始檔，同時保留 MIT 及 libtabe BSD-style 完整聲明。既有嘸蝦米三個檔案完全不更動；其 `Free for non-commercial use` 是非商業使用聲明，但再散布條文沒有展開，不能擴張解讀成開源授權。既有 `bopomofo.cin` 與 OpenVanilla 表高度同源，授權卻無法清楚追認，故不作為新網站的注音分發來源。

### Cited Findings

- 下載固定版為 `openvanilla/McBopomofo` commit `592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5`，日期記錄為2026-11-22。原檔、逐檔URL、bytes、SHA256 已寫入 [`data-raw/zhuyin/provenance.json`](../../../data-raw/zhuyin/provenance.json)。[專案](https://github.com/openvanilla/McBopomofo)、[固定版MIT全文](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/LICENSE.txt)。
- `BPMFBase.txt`：720,858 bytes，26,536筆字音，21,786個單一Unicode字元；每行為 `字 注音 拼音 大千鍵碼 字集`。這是字→多個讀音集合，不是依語境只留一個讀音。[raw](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFBase.txt)。
- `BPMFMappings.txt`：5,043,356 bytes，146,191筆詞音，140,582個不同詞；每行詞後接分開的注音音節，**沒有詞頻欄**。例如「銀行 ㄧㄣˊ ㄏㄤˊ」「行走 ㄒㄧㄥˊ ㄗㄡˇ」「音樂 ㄧㄣ ㄩㄝˋ」「快樂 ㄎㄨㄞˋ ㄌㄜˋ」「重複 ㄔㄨㄥˊ ㄈㄨˋ」「重量 ㄓㄨㄥˋ ㄌㄧㄤˋ」「長大 ㄓㄤˇ ㄉㄚˋ」「長度 ㄔㄤˊ ㄉㄨˋ」均已在檔內查得。[raw](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFMappings.txt)。
- `BPMFPunctuations.txt`：56,826 bytes，另外下載以免把語音字表誤當完整符號輸入規格；它包含 `_punctuation_`、`_ctrl_punctuation_` 之類的引擎內部查詢鍵，**不是使用者逐字輸入的ASCII碼字串**。[raw](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFPunctuations.txt)。
- 專案 MIT 允許複製、修改、發布與分發，須保留著作權與許可。歷史詞表的 libtabe/`tsi.src` 來源另見 BSD notices，故把 TaBE Project／Pai-Hsiang Hsiao 與中研院 Computer Systems and Communication Lab 兩段完整聲明都帶入；BSD條件包括來源保留聲明、二進位文件重現聲明、不可擅用作者名背書。[MIT](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/LICENSE.txt)、[libtabe原始COPYING](https://raw.githubusercontent.com/kcwu/libtabe/ea382a829c916f2cceda2022afdf8e8471e6e7b5/COPYING)、[本地完整來源授權記錄](../../../data-raw/zhuyin/LICENSE-SOURCE.txt)。沒有把詞表單純改標MIT而省掉歷史 notices。
- 現有 `bopomofo.cin` `%gen_inp`、`%selkey 123456789`、`%endkey 3467` 是通用CIN格式資訊；檔內沒有著作權或許可。它有14,428行碼字對、14,427組不同碼字對，與固定版 OpenVanilla `bpmf.cin` 14,149組不同配對中有14,130組相同；原檔獨有297組、OV獨有19組。名稱、空白格式與少數資料不同，不能說byte-identical。量測記錄在 `research-stats.json`；比較來源為[OV原檔](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/bpmf.cin)。
- OpenVanilla根目錄LICENSE特別把外部函式庫與資料表的授權交回各自檔案，因此不能把根目錄MIT自動套在沒有聲明的bpmf表。`%gen_inp` 本身不能判定來源或授權。XCIN/gcin同樣使用通用表格格式；未找到可證明「此份檔案」精確原始版本與其授權鏈的可靠證據。[OpenVanilla LICENSE](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/LICENSE.txt)。
- 使用者提供的 `boshiamy.cin` 原始六行標頭保留於 [`LICENSE-SOURCE.txt`](../../../data-raw/boshiamy/LICENSE-SOURCE.txt)：版本liu57a_ersu、行易copyright、趙惟倫2007格式轉換無附加限制、`Free for non-commercial use`。社群URL是 [蝦米族樂園](http://input.foruto.com/boshiamy/)，商業公司舊URL [liu.com.tw](http://www.liu.com.tw/)，現官網 [boshiamy.com](https://boshiamy.com/)。實測26,341筆碼字資料、21,949不同碼、13,563不同輸出，漢字範圍粗計13,069（不把標點當漢字）。保留原表不以新版商業107,561字庫替代。[目前Windows產品說明](https://boshiamy.com/product_win.php)。

| 注音候選資料 | 授權與適用性 | 決策 |
| --- | --- | --- |
| McBopomofo BPMFBase + BPMFMappings | MIT，並保留libtabe BSD歷史聲明；可公開、離線再散布 | 本次已下載、推薦 |
| libchewing phone/tsi資料 | 核心為LGPL-2.1-or-later；新版本data子模組已移Codeberg，務必檢查data自身授權，不能只拿測試用小字表 | 可作候選，這次不採以減少LGPL資料分發義務與子模組版本混淆；[核心COPYING](https://raw.githubusercontent.com/chewing/libchewing/master/COPYING)、[data子模組](https://codeberg.org/chewing/libchewing-data) |
| CNS11643全字庫注音 | 政府開放資料授權，適合作字元音；不是帶上下文頻率的國語詞典 | [官方資料頁](https://www.cns11643.gov.tw/pageView.jsp?ID=24)；與研究其他組的全字庫授權核對合併 |
| Unihan kMandarin | Unicode資料檔授權可再散布；主讀音、拼音表示、地域與詞境不足以替代臺灣注音詞音庫 | [Unihan](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)、[Unicode授權](https://www.unicode.org/license.txt)，本次不下載 |
| 萌典／教育部重編國語辭典 | 常見來源為CC BY-ND，須逐版確認；ND不能視為任意轉換和再編輯資料的普遍許可 | [moedict-data](https://github.com/g0v/moedict-data)，本次不採、不附來源不明轉換版 |

### Inferences

- 網頁與PWA離線資產都會實際分發資料，光寫「非營利」無法彌補一份檔案缺少授權。原 `bopomofo.cin` 應留在歷史資料區供溯源，未來編譯白名單只選新注音來源。這不要求替換使用者指定嘸蝦米字表。
- 注音破音字演算法可先用最長詞匹配／動態規劃覆蓋字串，再保留多音候選；詞表本身沒有頻率，遇到同詞多音或切詞歧義需額外權重或人工覆核，不能聲稱有140,582詞就能100%消歧。[詞音格式與內容](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFMappings.txt)。

### Gaps

- 嘸蝦米原標頭明示非商業「使用」，卻沒有詳細再散布、修改或次授權條款；保留為使用者指定的來源，不宣稱已取得官網現行產品EULA之外的完整授權函。公開PWA分發範圍仍是上線前風險，不能逕改成MIT。[完整原標頭與判讀](../../../data-raw/boshiamy/LICENSE-SOURCE.txt)。
- 原bopomofo表的「哪個人在哪個版本轉檔」無法完全定案；與OV高度重疊只支持同源推測，無法反向證明許可。比較候選授權不清者已從下載快取刪除，只留下統計與來源URL。[量測](../../../data-raw/zhuyin/research-stats.json)。

## 真實IME如何選字、送字及打符號？

### Takeaway

嘸蝦米正式候選編號是0起算，符合使用者指定行為；CIN的1234567890是通用表格前端指示，不能取代官蝦習慣。注音的聲調完成「音節轉換」，與全文正式送到應用程式的commit應分層。

### Cited Findings

- 官網macOS X2手冊「如何用嘸蝦米輸入文字」明示候選顯示0.嘸，Space送第0，其他候選按前方數字；基本鍵26字母加`, . ' [ ]`共31鍵，輸入緩衝最長五鍵；數字與`; / -`是加字詞輔助鍵，不能當首鍵。[X2完整官方手冊](https://boshiamy.com/product_x2_dl.php)。
- Windows J官網「加Ｖ輔助選字」明示精與睛都是MHU，睛是1選，MHUV可替代；V/R/S/F/W/L/C/B分別對應1..8選。EWD的1選岰不能以EWDV覆蓋已有雞碼；因此輔助碼不是無條件附加，必須先尊重實際表格。[Windows J官方章節](https://boshiamy.com/tutorial_function.php?page=5&sub=4)。X2手冊也有同一規則。[X2](https://boshiamy.com/product_x2_dl.php)。
- 標準嘸蝦米形根最多四根，超長取首二三尾，不足三根時補末筆／末形（數字例外）；這和上面「可輸入五鍵」不是矛盾，五鍵可含查詢／選字尾碼，不能說漢字標準拆五根。[官方規則](https://boshiamy.com/tutorial_beginner.php?page=4)。
- 使用者的 `index.js` 常數MAX_CODE_LENGTH=5、SHORTCUT_SUFFIX含V/R/S/F/W/L/C/B/K，V對第二候選至K對第十候選；`[`在程式轉成`*`，`]`轉成`?`，且`*`正規表示式用`.+`（至少一字根）。SHORTCUT_SUFFIX用來辨認已存在的選字尾碼與反查排序，不表示查表引擎會無條件動態合成所有尾碼。CIN `%selkey` 未被其parseBoshiamy讀取；正常候選標籤由host提供，所以prompt指定0123456789是host契約，而不是在這個JS內另有同字串常數。[使用者原檔](../../../data-raw/boshiamy/index.js)。
- 官網X2萬用字元說明也列`[`為不定長、`]`為一字根；同音字查詢先`'`再輸入已知同音字碼，進入結果後Space改為下一頁；注音查詢以`';`開頭。這些都是狀態機功能，不是CIN字表本身可完整表達。[官方X2查詢章節](https://boshiamy.com/product_x2_dl.php)。
- 嘸蝦米一碼/二碼簡碼與「簡速字根」不同：俞可作a根進入愉hai、偷pai；數字特設單根免補；「的d」是簡碼。字表無每筆codeType欄，不能只由碼長推斷是簡碼、容錯或加選字。[官方簡速根](https://boshiamy.com/tutorial_advance.php?page=1)、[官方規則](https://boshiamy.com/tutorial_beginner.php?page=4)。
- 大千：3上聲、4去聲、6陽平、7輕聲，Space一聲。單音節通常聲母+介音+韻母最多三個符號，再一個調鍵；輕聲印刷點在前，鍵入仍收尾。macOS官方示範繁體中文`z06wu35j/ jp6`，並區分自動轉換與Return確認全文；新一聲音節可能需第二次Space開候選。[Apple繁體注音](https://support.apple.com/zh-tw/guide/chinese-input-method/cimzt15531/104/mac/15.0)、[TOCFL標準鍵位教學](https://tocfl.edu.tw/tocfl/assets/files/20200420140722.pdf)。
- Windows注音：向下進入候選，方向鍵移動、數字選對應候選、Enter確認，候選焦點內Space是翻頁；關聯詞可用Shift+數字。數字選字發生在候選狀態，不能跟字根輸入中的數字聲韻鍵混用。[Microsoft繁體中文IME](https://support.microsoft.com/zh-tw/windows/hardware/input-devices/microsoft-traditional-chinese-ime)。
- 新單字音表實測一般音節鍵碼不超四，但兩個例外𰻞、𰻝有physical欄11u;6（而其注音字串是ㄅㄧㄤˊ）；這是來源的特殊項，不能當作大千標準音節五符號的規定。必須保留原檔、在未來轉換時另行標記與人工決定。[原表](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFBase.txt)。

| 符號 | 嘸蝦米指定原表中可查得的碼（擇常見） | 注音 |
| --- | --- | --- |
| ， | `,`，另`,,`重碼 | 不由注音發音取碼 |
| 。 | `.`，另`,.` | 同左 |
| 、 | `vv`，另`'` | 同左 |
| ； | `.,` | 同左 |
| ： | `..` | 同左 |
| 「／」 | `[`／`]`，也收`,[`／`,]` | 同左 |
| ？ | `s.` | 同左 |
| ！ | `v.`或`c.` | 同左 |
| 『／』 | `[[`／`]]`，也收`,[[`／`,]]` | 同左 |

以上嘸蝦米碼全部由指定表掃描，含候選碰撞，不保證第一候選；原表`bopomofo.cin`這11種標點皆無對應碼。[可重跑統計](../../../data-raw/zhuyin/validate_research.py)、[結果](../../../data-raw/zhuyin/research-stats.json)。使用者JS僅在組字中同時出現英文字母與括號時進入萬用查詢；單獨`[`、`[[`等仍可依表輸入引號。混合字母後就不能把查詢符號誤當一般碼。[官網X2](https://boshiamy.com/product_x2_dl.php)。

- Windows注音用Ctrl+符號或反引號後接符號，組合Shift取得大寫符號；Ctrl+Alt+,開符號鍵盤。這是IME層級處理，並非普通注音表碼。[Microsoft官方](https://support.microsoft.com/zh-tw/windows/hardware/input-devices/microsoft-traditional-chinese-ime)。
- 新McBopomofo符號檔實測含11類標點；例如逗號查詢鍵 `_ctrl_punctuation_,`、`_punctuation_<`，句號對應點號類鍵，引號 `_punctuation_[`與`]`、雙引號`{`與`}`，冒號`_punctuation_:`。這些是McBopomofo專有符號命名，應參照其鍵盤事件處理，不當作大千聲韻碼。[符號原檔](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFPunctuations.txt)。

### Inferences

- 墨打應固定候選0..9、Space首選，保留使用者引擎最大5鍵；區分標準四形根、表定短碼、表內選字碼與動態尾碼。K=9是既有引擎契約，官網本次明文只有V..B，不能對所有Windows/macOS版本宣稱K都生效。[Windows官方](https://boshiamy.com/tutorial_function.php?page=5&sub=4)、[使用者引擎](../../../data-raw/boshiamy/index.js)。
- 建議PWA注音採「單音節模擬」的明確模式：調號／Space完成一音節，選字送一字；文件須說這是網站練習規格，與Windows/macOS整句智慧注音有差別。勿實作成三聲字後必定再按Space才有候選。[Apple官方自動轉換](https://support.apple.com/zh-tw/guide/chinese-input-method/cimzt15531/104/mac/15.0)。

### Gaps

- Apple的獨立候選視窗頁此次多次回429，繁體注音章節已證實Space開候選／翻頁、Return確認；沒有在本次可讀內容中完整查定目前macOS每頁標籤數，因此不硬說一定1..9或1..0。[Apple候選頁](https://support.apple.com/zh-tw/guide/chinese-input-method/cim12992/104/mac/26)。
- 表內標點存在與引擎查詢鍵的優先衝突需後續產品決策；本任務只報告事實，不修改引擎。`[` wildcard定義中不定長是否含零根，官網文字與使用者JS`.+`有精確差異，應保留既有實作並註明。[官網](https://boshiamy.com/product_x2_dl.php)、[JS](../../../data-raw/boshiamy/index.js)。

## 字根草稿、例碼驗證與IDS是否能產生可信解說？

### Takeaway

注音42個實體鍵對應完整。嘸蝦米31鍵共468個根字串（逐鍵去重後總和），含基本、輔形、簡速根和20個無標準碼圖形近形記錄；這不是官方「字根總數」，也不是精確圖形輪廓完成宣告。兩輸入法合計20例全數與原表相符；注音50字詞典音→鍵碼一致率100%，但IDS推讀音不適用。

### Cited Findings

- [`zhuyin.json`](../../../data-raw/roots/zhuyin.json) 依大千37聲韻符號、4調號、Space一聲逐鍵轉寫，`key`是未Shift美式實體字元（Space以U+0020），不是ㄅ等顯示文字。每鍵有分類、位置與自寫聯想；這些鍵位屬排列慣例，不編造「英文字母為何具有那個聲音」的故事。[Apple標準鍵位](https://support.apple.com/zh-tw/guide/chinese-input-method/cimzt15531/104/mac/15.0)、[TOCFL](https://tocfl.edu.tw/tocfl/assets/files/20200420140722.pdf)。
- [`boshiamy.json`](../../../data-raw/roots/boshiamy.json) 對照[官方基本總圖](https://boshiamy.com/image/root_all.jpg)、[官方簡速表](https://boshiamy.com/images/table_speedroot.png)、[官方教學頁](https://boshiamy.com/tutorial_advance.php?page=1)、[Then.tw文字字根表](https://boshiamy.then.tw/shorthand)。`basicRoots`、`shortcutRoots`分層，`roots`合併；字母形、音、義以及英文Hand/Heart/Tree等均以自寫繁體中文說明；引號和通配符另設功能類，不當作漢字部件。
- Then.tw簡速根表使用20個自訂PUA字型。研究時已實際檢視字型glyph，轉為可編碼近形與`rootVariants.note`，例如無頂點良、未封底臼、少橫言、去兀垚等；保留sourceGlyphID便於日後核對，**沒有在roots塞入不可見PUA字元**。近形不等於完整字，因此精確IDS探測只使用額外的`probe_exact_components`，不拿「整個臣、來、突」當圖上局部省筆根。[Then.tw](https://boshiamy.then.tw/shorthand)、[官方簡速圖](https://boshiamy.com/images/table_speedroot.png)。
- `coverage.complete=false`是刻意保守：兩張官方圖已對照，但官方未全面列出全部搖頭擺尾與隱藏變形；主圖有局部形只能近似，J的PUA F0006圖形尤其需人工逐筆覆核。20個PUA形都有近形+note，並非20形完全漏掉。官方原圖、Then.tw字型不隨研究成果分發；使用原創重繪前仍須人工校對。[官方圖](https://boshiamy.com/image/root_all.jpg)、[自訂字型所在頁](https://boshiamy.then.tw/shorthand)。
- 例碼明due（日Day d、月u、末橫e補短）、休ptn（亻People p、木Tree t、末捺n）、林ttn、仁pre，機twwb截長、俞ai簡速，天edn容錯、精mhu／睛mhuv等均與指定原表比對。注音媽a8+Space、麻a86、馬a83、罵a84、嗎a87、中5j/+Space、銀行之行c;6、行走之行vu/6、音樂之樂m,4均與新單字音表相符。[規則來源](https://boshiamy.com/tutorial_beginner.php?page=4)、[已存例碼與驗證結果](../../../data-raw/zhuyin/research-stats.json)。
- 可重跑：`python3 data-raw/zhuyin/build_research_drafts.py`（重新產生自己的兩份JSON）、`python3 data-raw/zhuyin/validate_research.py`（20例、統計、標點與SHA）、`python3 data-raw/ids/probe_common.py`（共享形碼基準）。[腳本](../../../data-raw/zhuyin/validate_research.py)。
- 注音探測在共享50字上先讀取字音，依鍵位逐符號轉碼，再對照來源physical欄；50/50字全部所收讀音均一致，詞典覆蓋50/50。它沒有使用IDS，因此結果必須寫成「字音→鍵碼一致性50/50；IDS產音N/A」，不能寫「注音字形解碼命中100%」。[探測結果](../../../data-raw/zhuyin/probe-zhuyin.json)。
- 嘸蝦米真正forward探測採`probe_exact_components`字根集合、IDS依序展開、超4根首二三尾，最後才與CIN比對；不先查CIN來倒造解釋。共享probe無補短、幾何、眼順特殊重排、簡碼、未編碼根，預期命中低；最終命中6/50（12%），31/50有預測，其中25錯；19個無法解析；50/50在原表都有碼。詳見`data-raw/ids/probe-boshiamy.json`，不要把字表可查率當拆字命中率。[共享腳本](../../../data-raw/ids/probe_common.py)。

### Inferences

- 自動字根卡必須有「經驗證解說」「只有碼，未找到可信拆解」兩種狀態。只有根序列實際重現指定字表某一標準碼且每個部件都有位置與規則證據，才能解說WHY。簡碼與容錯碼應另掛，不能以IDS硬證明一碼簡碼原因。[官方截長補短及容錯](https://boshiamy.com/tutorial_beginner.php?page=4)。
- 嘸蝦米對IDS最麻煩的是根跨越IDS切分、圖形眼順不同於遞迴順序、補根為末筆或末形，以及同一根含形音義多種記法。下一階段可對IDS節點或連續子樹搜尋較大根，再使用形碼約束選擇路徑；仍須靠人工小型例外庫處理無Unicode圖形，不能只把字根字串串接。[規則](https://boshiamy.com/tutorial_beginner.php?page=4)。

### Gaps

- 目前JSON是機器可讀草稿；沒有主張官方所有潛在變形已精確重繪。資料中的近形是索引與說明用，不能用整個字的IDS直接替代局部圖形，具體位置仍需後續圖形證據。
- 詞音表提供破音字的詞境線索，不提供句法語意保證；沒有在此建立或訓練新的斷詞模型。


### 補充給統整者：詞音實測與原檔完整性

heteronym-checks.json 已對八組詞逐音節轉大千碼，並再核對每字的單字音表允許讀音；8/8全通過。這是詞音資料一致性測試，不是新切詞引擎的正確率。[原始詞音表](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFMappings.txt)、[測試結果](../../../data-raw/zhuyin/heteronym-checks.json)。

| 詞 | 每音節實體碼 | 一聲與送出說明 |
| --- | --- | --- |
| 銀行 | up6、c;6 | 兩音節各以6結束 |
| 行走 | vu/6、y.3 | 6、3結束各自音節 |
| 音樂 | up、m,4 | 音的up後另按Space一聲，樂以4結束 |
| 快樂 | dj94、xk4 | 兩音節各以4結束 |
| 重複 | tj/6、zj4 | 6、4結束 |
| 重量 | 5j/4、xu;4 | 4、4結束 |
| 長大 | 5;3、284 | 3、4結束 |
| 長度 | t;6、2j4 | 6、4結束 |

頓號只是分開展示兩音節，不是實體鍵；只有一聲Space是音節收尾鍵，送到應用程式的最終commit依IME狀態另處理。[Apple官方音節轉換與Return確認](https://support.apple.com/zh-tw/guide/chinese-input-method/cimzt15531/104/mac/15.0)。

原始三檔最終SHA256（可由shasum -a 256再查）：

- boshiamy.cin：d5d2fb887e170e76db2df8cd5fde5f7934bbb6b51cb084cbabde5d6f189fae15
- bopomofo.cin：0b8d0014c54b482e68eb0b5c2608f013326967c6a4480ab8bac8a12c50e93ff7
- index.js：027d72dd428a42c752b920ae783a6321739f409541a9911d24986428c330df2b

全部未修改；research-stats.json亦保存這組雜湊。[驗證腳本](../../../data-raw/zhuyin/validate_research.py)。

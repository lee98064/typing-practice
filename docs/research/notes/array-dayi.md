# 行列30與大易三碼：來源、字根與輸入行為

## 來源、版本與公開再散佈

### Takeaway

行列30可取得原作者明示免費授權的完整現代字碼表。大易取得有太易資訊直接授權標頭的歷史原表，但其中僅7,616字有≤3碼；不可將檔名dayi3誤寫成現行26,000字完整三碼版。現行完整三碼開放表仍是取得缺口。

### Cited Findings

- 行列官方聲明同時指向「方法」和「對照表」，明許任何中文系統植入及電腦書／CAI作者使用，不要求權利金或另行授權書。授權全文已保存於 `data-raw/array/LICENSE-SOURCE.txt`。這可涵蓋本案公開非營利PWA／教學，屬條款適用判讀，不是MIT或公有領域。[官方免費授權聲明](https://www.array.com.tw/BOX/BOX5.htm)
- 本次下載 `data-raw/array/array30.cin` 原始位元組；來源為gontera維護的OpenVanilla v2026-1.11（標頭2026-10-14）。保留 `array-shortcode.cin`、`array-special.cin`、`ar30portingSpec.txt`，全數固定commit `2e447f26079ddfea638d472e8faadefa953b7d64`；逐檔URL、SHA256和bytes見 `SOURCE-MANIFEST.json`。[主表raw](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array30-OpenVanilla-big.cin)、[簡碼raw](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-shortcode.cin)、[特別碼raw](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-special.cin)、[移植規格raw](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)
- 行列主表117,201碼字對、102,965不同單碼點輸出，其中101,985漢字（統計範圍見script；不等於臺灣常用字）；最長5碼，73,158列為5碼。簡碼9,300列含空槽占位符「⎔」（不能當成合法輸出），僅4,222不同碼字對、3,229不同單碼點輸出；特別碼398列、398字。主表資料包含同字不同容錯碼；不要用總列數當字數。[原始表與版本說明](https://github.com/gontera/array30)
- 原作者主表的現代維護repo未獨立附SPDX LICENSE；原作者對方法、對照表的廣泛授權是主要依據，新增字碼由維護者人工校訂的部分，並沒有另一份明示標準授權。應保留貢獻者來源，不能自行標MIT。[上游說明](https://github.com/gontera/array30)
- 大易推薦保留為研究／有限三碼候選的原表 `data-raw/dayi/dayi3.cin`，固定commit `ecf3260a49e61aacf4ffc951d40d390a46dc4cec`、163,693bytes、SHA256 `45f56c2c9bab15fb4c9a35ea98670ea654a4d3bbe2daf03dc20d0fffd0078ff3`，原文授權如下；`LICENSE-SOURCE.txt`已完整保存。[大易原檔raw](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin)

```text
# 本表格由太易資訊公司 (http://www.dayi.com) 授權，開放給使用者下載使用。
# 
# 使用者不得任意更改此表格中每個字的編碼規則並重新散佈，但允許改變此表格
# 的格式以適合其他平台或輸入法軟體使用。
#
```

- 該表18,638碼字對、13,052不同漢字，碼長1/2/3/4分別87/1,696/7,218/9,637列；7,616不同字有≤3碼，另5,436僅四碼。固定三碼模式應只支援原表已存在的≤3碼映射；此研究不刪原表、不把四碼擅自截短、不改候選順序。[同一原始檔](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin)
- 官方8.0產品頁明示26,000字全部三碼，兼容傳統四碼。故上述歷史表不能代替現行完整8.0、不能將5,436字四碼限制解釋為當代所有三碼版的必然規則。官方初學資料「常用字若以三碼」的舊措辭並不足以證明完整產品只給常用字三碼。[官方單字8.0產品](https://www.dayi.com/product_8.html)、[初學資料原則第3頁](https://www.dayi.com/assets/大易輸入法初學資料與範例.pdf#page=3)

候選來源比較（字數為實際下載分析；未保留不推薦候選原表）：

|輸入法／候選|raw URL|授權與本案再散佈|實測覆蓋／結論|
|---|---|---|---|
|行列gontera最新表|[OpenVanilla版raw](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array30-OpenVanilla-big.cin)|官方方法與對照表廣泛免費授權；可植入系統／CAI；保存原頭與來源|102,965單碼點輸出；推薦；下載|
|行列OpenVanilla|[raw](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/array30.cin)|同源行列對照表授權，軟體上層授權不取代資料授權|117,201列／102,968不同輸出（含3個多碼點輸出差異）；也可選，避免重複bundling|
|行列Rime|[main raw](https://raw.githubusercontent.com/rime/rime-array/557dbe38381de174fe96e53e9bf8c863a275307c/array30_main.dict.yaml)|[GPLv3全文](https://raw.githubusercontent.com/rime/rime-array/557dbe38381de174fe96e53e9bf8c863a275307c/LICENSE)；網站可用但須遵守GPL散佈／來源義務；其底表來源gontera，短碼序有調整|109,843列／92,877不同輸出（含標點；Ext-A–G版本）；不推薦取代最新主表|
|行列Chinese Open Desktop|[raw](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/array30.cin)|repo[CC0](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/LICENSE)，仍以原作者行列對照表授權作可追溯依據|117,248列／103,015不同輸出；不推薦另一個變體替代官方維護版|
|大易OpenVanilla原版|[raw](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin)|太易公司直接授權，允許移植格式、禁止改碼重散布；有條件推薦，不是標準開放授權|13,052漢字；7,616有≤3碼；下載但完整三碼取得仍未達成|
|大易OpenVanilla patched／MacDataTables|[patched raw](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3-patched.cin)、[Mac raw](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/Source/Mac/MacDataTables/dayi3.cin)|同限制，header另記2005改標點和候選序，不拿上層軟體license覆蓋|18,657列／13,068輸出，7,632有≤3碼；最大仍4。沒有解決完整三碼，且是更動版，不下載bundling|
|大易gcin流通表|[gcin-dayi3鏡像raw](https://raw.githubusercontent.com/righthandabacus/dayi_table/7a1b3c1b16248c8075e1d3713e9f67d34e97fcdd/8_gcin-dayi3.cin)|相同太易授權標頭；鏡像非新權利來源|18,638列／13,052字、≤3碼7,616，與原表覆蓋相同，不解決缺口|
|大易Chinese Open Desktop|[raw](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/dayi3.cin)|repo明示[CC0 1.0 Universal](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/LICENSE)，原檔僅「hkfonts from snik」而無太易授權鏈；不能自動認定轉載者有權將太易表改CC0|18,056列／14,072輸出，全部≤3碼。版本適合但權利鏈未明，本案不bundling；記URL與統計，刪除暫存|
|大易8.0官方Windows軟體|[產品來源](https://www.dayi.com/product_8.html)|可購買、安裝連網註冊的專有軟體；產品使用授權不等於可抽出資料公開重散布|官方26,000字全部三碼及700+符號；無可確認開放raw表，不抽取／不下載軟體|

### Inferences

- 大易條款允許格式轉換供其他平台使用，且限定「改編碼規則並重新散佈」，可合理解讀原編碼表可移植重散布；所以公開非營利網站有條件可用。但這不是官方另行回答PWA的授權聲明，務必保留原文和判讀層次。格式轉JSON時不得任意追加映射、調序、刪改碼規則。
- 大易最穩健可交付範圍是「歷史原授權表現有≤3碼7,616字」。若產品要求完整26,000字三碼，目前未找到同時滿足權利鏈與版本完整性的raw來源，不能假裝已滿足。

### Gaps

- 大易完整26,000字三碼表的可再散佈來源尚無。沒有聯絡權利人（本任務不授權對外發信）。
- gontera新增字集未另附獨立標準授權，原作者廣泛聲明與現代校訂者的權利連結應保留，不標成CC0。

## 輸入行為、簡碼與標點

### Takeaway

行列的根取法是前三後一，且一／二級簡碼是獨立查表狀態；數字鍵選字和空白查主表不能合併。大易上排數字都是字根，實際Windows官方候選標0–9與實體選字鍵不同。

### Cited Findings

- 行列30物理鍵為三排英文字母加`,.;/`共30鍵；使用者看到的標籤應為`1^…0^ / 1-…0- / 1v…0v`。按鍵`qwertyuiop / asdfghjkl; / zxcvbnm,./`由左至右對應第1…0行。[官方移植規格](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)
- 依筆順取最多四根，超過四根「前三後一」，不是首二尾二；同時取完整、涵蓋最多筆畫之根，括號根為特殊歸位。[官方取碼教室](https://www.array.com.tw/class/class2.htm)
- Unicode擴充表可有第五鍵`i`（8^），這是擴充／重碼字查找標記；不是四根規則改成五根。移植規格明示第五碼固定I；現代上游採Big5字不加I、部分其他BMP重碼加I、Ext-B後一律加I。[官方移植規格](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)、[維護者版說明](https://github.com/gontera/array30)
- 行列Windows／移植標準候選以`1234567890`標第1…10位。按第一／第二字根時顯示10個一／二級簡碼，可直接數字選取；按空白則查「剛好等於目前碼」的主表，若唯一直接上字，多個待選。重碼候選≤10再按空白選第一；超過十個時空白翻頁。下一字根鍵也可承接首候選。macOS本案指可核對的OpenVanilla行列，不聲稱所有macOS內建法均如此。[官方移植規格](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)、[下載的CIN selkey](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array30-OpenVanilla-big.cin)
- 行列一級簡碼300槽、二級9000槽共9300槽；空槽`⎔`是占位，保留候選位置但不能輸出該符號。398個特別碼主要是兩鍵，跟二級簡碼不同：特別碼可空白直接上字，簡碼數字選字。主表另有`t→的`單鍵特殊常用碼，不能把只有兩鍵的special檔當所有特例。[簡碼原表](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-shortcode.cin)、[特別碼原表](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-special.cin)
- 行列原生符號選單`w`後數字、不必先空白：`w1`標點、`w2`括號，顯示候選再按數字。可用空白／PgDn／Shift+右翻頁。`?`單碼萬用，`*`有首位不計順序查根與中間展開等特別規則，不能只套一般glob；`?`物理`/`需Shift，`*`物理`8`需Shift。[官方移植規格](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)
- 行列下載主表的標點實掃：`，`=`,`或`w1`；`。`=`.`或`w1`；`：；`=`;`或`w1`；`、？！…`在`w1`；`「」『』`在`w2`。簡碼表另提供`d`的`！「」、`、`/`的`？『』…`；其候選序取原檔。若只用主表會失去快捷簡碼符號。[主表raw](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array30-OpenVanilla-big.cin)
- 大易Windows官方8.0候選一列0–9，0是首選，不必再選或可接續打；索引1–5實體鍵依序`' [ ] - \`，6–9依序Shift+`' [ ] -`；請區分顯示標籤和實體數字鍵。CIN `%selkey '[]-\6789`只是框架設定，不能直接宣稱官方用這九個鍵選第一至九個，因第一候選省選、框架可能shift-selection，數字鍵本身也有根。[官方手冊第18頁鍵盤圖](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf#page=18)、[CIN原文](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin)
- 大易三碼規則是首根、第二根、尾根；不足三根全部取。取最大根、已寫筆畫不重複，可跨不連續筆順以符合造字精神（國、東、夷、秉、嗇、巨、巫）；口／囗／日／月遇交叉筆有專門判別。`X`是水根，`Z`是心根，不是倉頡難字／符號鍵。[官方取碼規則](https://www.dayi.com/assets/大易輸入法初學資料與範例.pdf#page=3)
- 官方8.0以空白結束一個字／詞；上排0–9是字根，半形數字可用數字鍵盤或英文模式。`?/*`可代未知碼但不可全用萬用碼；這是8.0的引擎行為，原CIN無法自行表達它。[官方手冊](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf)
- 大易原授權表實際**沒有**`，。、；：「」？！…『』`任何對應。官方Windows8.0有獨立快速標點鍵設定（預設五種`，。？、；`），另`=`前導全形符號：`=a`全形A、`=1`數字類、`=[`括號類、`={`角括號類含「」『』等。此功能是引擎／另表，不得說下載原表已支援。macOS以第三方OpenVanilla框架為例，不和Windows官方8.0混為同一套快捷鍵。[官方手冊第2、13–14、19頁](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf)

### Inferences

- 本案行列應保留主表／簡碼／特別碼三個角色與原序，空槽不輸出；候選標`1…0`。
- 本案大易三碼卡應顯示物理字根鍵（小寫），候選標`0…9`可接近官方Windows，但這是產品建議；macOS OpenVanilla有另一框架行為，應做命名設定而非宣稱跨OS唯一。大易原檔大寫碼查驗時轉小寫只是物理鍵正規化，原檔未修改。

### Gaps

- 沒有實際啟動Windows或macOS官方IME逐版實測；以上優先引用發明者移植規格、太易官方手冊與原CIN。macOS新版是否內建某法不作無來源斷言。
- 大易標點完整另表、全部Unicode三碼候選順序未取得合法開放原資料；不能用獨立按鍵規則生成字表而聲稱官方表。

## 字根草稿與IDS可行性

### Takeaway

JSON涵蓋行列30鍵與大易40鍵，附來源、根族、繁中自撰記憶、近似形說明與經表驗證範例。這是可審閱草稿；Unicode近似字不是無損字形輪廓，尚不能宣稱完整幾何字根教材完成。

### Cited Findings

- 行列 `roots/array.json`：逐鍵根族以[2023繁簡罕用字全字根圖](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/行列字根表v2023.jpg)為基準，含30個物理鍵、10行群組、3個表驗證範例明pu／林vv／法crx；官方另明言不少字根不是文字，例子只能以文字或特殊符號代替。[官方教室](https://www.array.com.tw/class/class2.htm)
- 大易 `roots/dayi.json`：40鍵、7個語義分類、自撰鍵位聯想；依[官方字根圖第2頁](https://www.dayi.com/assets/大易輸入法初學資料與範例.pdf#page=2)逐欄保留253個可抽取圖形槽 `root_variants`（每槽含最近Unicode、原PDF碼、頁與行）。已編碼根保留精確字；專用字形／缺筆旋轉以近似glyph+note處理；共用同一近似glyph不等於原圖同一形。一般介紹「254根」與本次253槽差一；已整頁視覺核對，另以300dpi裁切X水組確認中間確有空白行，並非文字抽取漏一根。圖版／計數慣例差異仍待釐清，不假造第254根。[官方筆形／屬性歸類說明第27–29頁](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf#page=27)
- 大易範例6個：明dj、林ii、江xr、支sx、秋vy、鑷0pp，全部直接比對下載原表通過。鑷完整根序金耳耳耳，三碼首二尾為0pp；簡碼不強作完整拆字解釋。行列3個範例也全過。重現：`python3 data-raw/array/verify.py`，產物 `data-raw/array/table-audit.json`，逐字列true。[大易原表](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin)
- 圖像本身沒有取得一律公開重製的明示授權，因此只在研究cache閱讀，沒有把官方原圖／PDF當作可bundling資產。root JSON是自行描述的事實，不沿用教學口訣全文。[大易下載頁僅說可列印學習](https://www.dayi.com/download.html)、[行列圖來源](https://www.array.com.tw/BOX/BOX5.htm)
- `roots`欄位為人讀圖示近似；`match_roots`另外列可辨識完整Unicode根子集，用於保守IDS試驗，避免把「某字局部的近似完整字」誤當成完整根。例如大易日的穿筆形不能因近似寫田就把田映到d；真田在7。來源圖上行列外框囗在p，口在`;`，已分別列出。[相同兩張官方根圖](https://www.dayi.com/assets/大易輸入法初學資料與範例.pdf#page=2)

### Inferences

- 目前行列根族轉錄和大易253槽皆能讓人審查，但未編碼形仍需逐形畫成可合法自製的向量，並保存局部筆畫遮罩，否則「完整輔助字形」只能以文字說明而非無損幾何提供。`status/completeness`已逐鍵明列限制，不可在最終報告稱全部輔助形已無誤。
- 大易與行列形碼IDS基線由同組 `data-raw/ids/probe_common.py` 執行；共用50字、從IDS往前對match_roots、套前三後一／首二尾，未知根拒絕，最後才查碼表，絕無以反查碼當拆字成功。具體rate及逐字結果以該agent最終輸出 `probe-array.json`、`probe-dayi.json`為準（本筆記寫入時因囗鍵位圖核修正重跑中；先前13/50、16/50不是最終結論）。
- 改良應在IDS節點上做可解釋的根覆蓋，結合筆順遮罩處理包圍／交叉、非連續取大根與圖形變體；以真表碼只作驗證約束，不准讓它倒推出一段虛構「WHY」。簡碼、特別碼和容錯碼應在主碼拆字後以特例層註解。

### Gaps

- 根稿是可審閱draft，非字形輪廓完全無損版本；大易253/254說法差異已作整頁及水組裁切視覺核對，仍待版次來源釐清；未編碼形局部界線仍需幾何校對。字根清單若要求幾何完備，本任務尚未全部達成，必須明列。
- IDS本身不保證書寫順序：行列前三後一尤其包圍／撇筆段；大易首二尾但先最大根可跨筆順，都不能單用子樹葉序處理。候選順序與短碼不能從IDS生成。

補充重現：`python3 data-raw/dayi/chart-slots.py` 可重下載官方PDF至gitignored cache並用Poppler逐欄抽取；輸出的253槽已人工看整頁與水組局部，專用字形近似Unicode不等同無損字型。研究暫存PDF／圖及不建議的候選表已刪除。

# 墨打輸入法資料來源、授權與操作查核

查核日期：2026-11-22。固定方法為大千注音、使用者提供的嘸蝦米 liu57a_ersu、行列30、大易三碼及倉頡三代；本次只新增原始資料與研究文件，沒有實作網站引擎。**可推薦注音字／詞音、行列30及倉頡三代資料；大易取得的是有直接授權的歷史原表，完整三碼字集仍有缺口。** 使用者指定的嘸蝦米原檔保持不變，原頭的非商業使用聲明照錄，沒有重新授權。公開網站與離線快取都涉及向訪客分發資料，因此「可免費下載」與「可再散布」分開判讀；以下是來源條款適用研究，不是權利人的個別法律確認。

## 採用資料與仍未解決的範圍

| 方法 | 本地原始檔／版本 | 實測覆蓋 | 公開非商業PWA判斷與建議 |
| --- | --- | --- | --- |
| 注音 | `data-raw/zhuyin/BPMFBase.txt`、`BPMFMappings.txt`、`BPMFPunctuations.txt`；McBopomofo固定版 | 26,536筆單字音／21,786字；146,191筆詞音／140,582詞 | 推薦；保留MIT全文及歷史libtabe兩組BSD-style聲明 |
| 嘸蝦米 | 既有 `data-raw/boshiamy/boshiamy.cin`，liu57a_ersu | 26,341列／13,563不同輸出；其中13,069漢字 | 依使用者指定保留；原頭允許非商業使用，未展開公開再散布條件，列上線前權利範圍待釐清事項 |
| 行列30 | `data-raw/array/array30.cin`，gontera v2026-1.11，另附簡碼與特別碼表 | 主表117,201列／102,965單碼點輸出，其中101,985漢字 | 推薦；依原作者對方法、對照表及CAI的廣泛免費授權，保留現代維護者來源；不是MIT／CC0 |
| 大易三碼 | `data-raw/dayi/dayi3.cin`，OpenVanilla歷史原授權表 | 18,638列／13,052漢字；僅7,616字有≤3碼，另5,436字只有四碼 | 有條件研究來源；太易允許移植格式、限制改碼再散布。**不能把它宣稱為完整三碼字集**，不能自行截短四碼 |
| 倉頡三代 | `data-raw/cangjie/cangjie3.txt`，SERIAL_NUMBER 2004111801，2008轉格式 | 17,578列／17,568單碼點輸出，其中16,860漢字 | 推薦歷史三代表；檔內明示可自由再散布，保留標頭及UTF-8 |

上述數字由實際原檔解析；「列數」「不同輸出」「漢字」分別統計，不能互代。漢字統計使用腳本註明的 U+3400..9FFF、U+20000..323AF 範圍，並非台灣常用字數。原檔及完整授權見各目錄的 `LICENSE-SOURCE.txt`，逐檔SHA-256與大小見 `SOURCE-MANIFEST.json`、`MANIFEST.json` 或 `provenance.json`。可重跑的數據在 [驗證紀錄](validation.md)。

### 固定下載來源與授權原文位置

| 資料 | 固定原始下載URL | 授權依據／本地全文 |
| --- | --- | --- |
| 行列主表 | [array30-OpenVanilla-big.cin](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array30-OpenVanilla-big.cin) | [原作者免費授權聲明](https://www.array.com.tw/BOX/BOX5.htm)；`data-raw/array/LICENSE-SOURCE.txt` |
| 行列簡碼 | [array-shortcode.cin](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-shortcode.cin) | 同上；保留9300槽原序與占位 |
| 行列特別碼／規格 | [array-special.cin](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-special.cin)、[ar30portingSpec.txt](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt) | 同上；規格保留作者與日期 |
| 大易原表 | [dayi3.cin](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin) | 檔案第1–5行太易直接授權；`data-raw/dayi/LICENSE-SOURCE.txt` |
| 倉頡三代表 | [cangjie3.txt](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt) | 檔內 `LICENSE = Freely redistributable without restriction`，另要求標頭不變、UTF-8；`data-raw/cangjie/LICENSE-SOURCE.txt` |
| 注音單字音 | [BPMFBase.txt](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFBase.txt) | [MIT全文](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/LICENSE.txt)，合併保留[libtabe COPYING](https://raw.githubusercontent.com/kcwu/libtabe/ea382a829c916f2cceda2022afdf8e8471e6e7b5/COPYING)；`data-raw/zhuyin/LICENSE-SOURCE.txt` |
| 注音詞音／標點 | [BPMFMappings.txt](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFMappings.txt)、[BPMFPunctuations.txt](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFPunctuations.txt) | 同上；原檔未修改 |

行列原作者明許各中文系統植入方法與對照表，也歡迎電腦書及CAI作者使用；這是本案公開教學適用的主要依據。gontera擴充字集沒有另附標準授權，因此仍保存原作者聲明、維護者及版本，不把沒有LICENSE的repo自行標MIT。大易原表則明許改格式適合其他平台，但禁止任意更改每字編碼規則後再散布；原編碼移植分發有條款支持，PWA適用仍是研究判讀，並非太易另發網站授權函。不得以OpenVanilla的軟體授權蓋掉檔內條款。([行列原始聲明](https://www.array.com.tw/BOX/BOX5.htm)、[大易原始授權](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin))

## 行列、大易、倉頡候選來源比較

### 行列30：採原作者授權下的現代維護主表

| 候選與原始檔 | 授權／公開再散布 | 本次覆蓋與判斷 |
| --- | --- | --- |
| [gontera固定版](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array30-OpenVanilla-big.cin) | 原作者方法／對照表廣泛免費授權；符合系統／CAI用途；保留來源 | 117,201列、102,965單碼點輸出；推薦，已下載 |
| [OpenVanilla array30.cin](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/array30.cin) | 同源行列授權；不靠上層軟體LICENSE | 117,201列、102,968不同輸出，與前者有多碼點輸出等差異；不重複打包 |
| [rime-array主表](https://raw.githubusercontent.com/rime/rime-array/557dbe38381de174fe96e53e9bf8c863a275307c/array30_main.dict.yaml) | [GPLv3](https://raw.githubusercontent.com/rime/rime-array/557dbe38381de174fe96e53e9bf8c863a275307c/LICENSE)；可公開散布，須遵守來源與GPL條件 | 109,843列／92,877不同輸出；短碼排序另有調整，不作本案主表 |
| [Chinese Open Desktop](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/array30.cin) | repo宣告[CC0](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/LICENSE)；仍保存行列原作者授權鏈 | 117,248列／103,015不同輸出；另一變體，不混入所選版本 |

行列另外下載的簡碼表有300個一級槽、9000個二級槽；9300行中包含空槽占位符 `⎔`，它不是合法輸出。不同碼字對4222組，單碼點輸出3229個，其中包含占位；特別碼另有398字。主表、簡碼、特別碼須保留各自角色，不能合併後排序而丟失候選位置。([固定簡碼原檔](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-shortcode.cin)、[特別碼原檔](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/OpenVanilla/array-special.cin))

### 大易：授權清楚的歷史表，尚不足以供完整三碼網站

| 候選與原始檔 | 授權／公開再散布 | 本次覆蓋與判斷 |
| --- | --- | --- |
| [OpenVanilla原版dayi3](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3.cin) | 太易直接授權；允許格式移植，限制改碼重散布 | 13,052字，7,616字有≤3碼；已下載，僅有條件推薦其既有三碼範圍 |
| [OV patched](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/dayi3-patched.cin)、[MacDataTables](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/Source/Mac/MacDataTables/dayi3.cin) | 同一限制；檔頭另有2005標點與候選序修改紀錄 | 18,657列／13,068輸出，7,632有≤3碼，最大仍4；不採修改版 |
| [gcin-dayi3流通鏡像](https://raw.githubusercontent.com/righthandabacus/dayi_table/7a1b3c1b16248c8075e1d3713e9f67d34e97fcdd/8_gcin-dayi3.cin) | 相同太易授權；鏡像不是新的權利來源 | 18,638列／13,052字，≤3碼7,616；未解決缺口 |
| [Chinese Open Desktop dayi3](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/dayi3.cin) | repo[CC0](https://raw.githubusercontent.com/chinese-opendesktop/cin-tables/ee10ba4ad467eeaf0e9ee57240007e8adc0d13ca/LICENSE)，表頭僅記hkfonts from snik，未見太易權利鏈 | 18,056列／14,072輸出，全部≤3碼；版本吸引人，但不以轉載者CC0消除來源疑點，未保留原表 |
| [太易官方8.0產品](https://www.dayi.com/product_8.html) | 專有產品使用授權，不能等同可抽出字表公開分發 | 官方稱26,000字全部三碼、兼容傳統四碼；未找到同時有明確再散布許可的完整raw表，不抽取軟體 |

**固定三碼要求沒有改成四碼。** 所選歷史原檔完整保留以研究，其四碼項不應冒充網站三碼可輸入項，也不能截短後造新三碼表。官方現行26,000字全部三碼的聲明，證明不能用歷史檔名掩蓋覆蓋差異；目前完整三碼來源仍待取得。([官方8.0](https://www.dayi.com/product_8.html))

### 倉頡：以明示第三代及檔內許可的表為基準

| 候選與原始檔 | 授權／公開再散布 | 本次覆蓋與判斷 |
| --- | --- | --- |
| [ibus-table-chinese cangjie3](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt) | 檔內自由再散布聲明；保留標頭、UTF-8 | 17,578列／17,568字元；推薦，已下載 |
| [OV cj.cin](https://raw.githubusercontent.com/openvanilla/openvanilla/master/DataTables/cj.cin) | 檔頭未見獨立許可；OV總授權將外部表交回各檔 | 17,532列／17,475輸出，有三代特徵與HKSCS；授權鏈不如所選表直接，未保留原表 |
| [Rime集成三代](https://raw.githubusercontent.com/cangjie-system/rime-cangjie-integrated/dcfba770189078a2f7b347793c8e155c3c39275d/cangjie.3-base.dict.yaml) | [MIT](https://raw.githubusercontent.com/cangjie-system/rime-cangjie-integrated/dcfba770189078a2f7b347793c8e155c3c39275d/LICENSE)，[README](https://raw.githubusercontent.com/cangjie-system/rime-cangjie-integrated/dcfba770189078a2f7b347793c8e155c3c39275d/README.md)說明檔案範圍 | 108,419列／97,057輸出，最大5碼；廣字集備選，來源為倉頡平台2012並有修訂／容錯；不混進歷史表 |
| [rime/rime-cangjie](https://github.com/rime/rime-cangjie) | [LGPL3](https://raw.githubusercontent.com/rime/rime-cangjie/master/LICENSE) | 目前官方配方為五代及其快速模式，版本不符，排除；不是三代候選覆蓋 |
| [libcangjie](https://cangjie.pages.freedesktop.org/projects/libcangjie/) | 程式庫LGPL3-or-later；獨立資料檔仍須另核 | [支援3與5](https://cangjie.pages.freedesktop.org/projects/libcangjie/documentation/versions.html)，本次raw端點未取得，字數未測，不臆填 |
| [CNS Properties.zip](https://data.cns11643.gov.tw/opendata/Properties.zip) | [政府開放資料](https://data.gov.tw/dataset/5961)，可選OGDL | 有CNS_cangjie屬性，未明示第三代；合法開放不等於版本符合，未作三代碼表 |

所選表以 `面 mwyl`、`廠 ifbk`、`這 yymr`、`黑 wgf`、`麵 jnmwl` 保存版本指紋。三代、五代及不同容錯擴充不能混稱同一標準。([所選三代原文](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt))

## 既有注音表的溯源與新字／詞音資料

既有 `data-raw/boshiamy/bopomofo.cin` 有 `%gen_inp`、`%selkey 123456789`、`%endkey 3467`，沒有著作權或授權聲明。`%gen_inp` 是通用CIN格式記號，XCIN、gcin、OpenVanilla相似表都能使用，不能由它證明來源。與固定OpenVanilla `bpmf.cin` 比較：原檔14,428列、14,427組不同配對；OV有14,149組，其中14,130組相同，原檔獨有297、OV獨有19。這支持高度同源的推測，**不等於檔案相同，也無法確認精確轉檔者或授權鏈**。OV LICENSE明說外部資料表依各檔許可，不能套根目錄MIT。原檔保留供溯源，新注音分發來源採McBopomofo。([OV比較原檔](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/bpmf.cin)、[OV授權](https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/LICENSE.txt))

| 注音候選 | 授權及限制 | 建議 |
| --- | --- | --- |
| McBopomofo單字音、詞音 | MIT並保留libtabe歷史BSD notices；可修改、發布、分發 | 已下載，單字與詞組讀音分開使用 |
| [libchewing](https://raw.githubusercontent.com/chewing/libchewing/master/COPYING)／[libchewing-data](https://codeberg.org/chewing/libchewing-data) | 核心LGPL2.1-or-later；資料子模組須另核自身條款及版本 | 候選，沒有拿測試小表冒充完整詞庫；此次不重複下載 |
| [CNS11643](https://www.cns11643.gov.tw/pageView.jsp?ID=24) | 政府開放授權，適合字元音 | 可作字音交叉檢查；不是含上下文權重的詞典 |
| [Unihan kMandarin](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip) | [Unicode資料授權](https://www.unicode.org/license.txt)可再散布 | 拼音主讀音、地域與詞境不足以代替台灣詞音庫；未下載 |
| [moedict-data](https://github.com/g0v/moedict-data) | 常見教育部來源有CC BY-ND，須逐版本核對，不可一律當可改作資料 | 不採ND權利範圍未釐清的轉換版 |

`BPMFBase` 每行含字、注音、拼音、大千physical欄、字集；同字可有多音。`BPMFMappings` 每行是詞及逐音節注音，**沒有詞頻欄**。已查到「銀行 ㄧㄣˊ ㄏㄤˊ」「行走 ㄒㄧㄥˊ ㄗㄡˇ」「音樂 ㄧㄣ ㄩㄝˋ」「快樂 ㄎㄨㄞˋ ㄌㄜˋ」，以及重複／重量、長大／長度等對比，可用最長詞或動態規劃幫助破音字判讀；同詞多音、斷詞歧義仍須保留候選或人工覆核，不能宣稱詞庫可百分之百消歧。([詞音原檔](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFMappings.txt))

嘸蝦米原頭完整保存在 `data-raw/boshiamy/LICENSE-SOURCE.txt`：行易copyright、趙惟倫2007格式轉換「無附加限制」、`Free for non-commercial use`。格式轉換者無附加限制不消除原權利人的權利；此處承認非商業使用許可，但原頭未展開redistribution、修改或次授權。公開離線PWA的範圍仍列待釐清風險，沒有把它改成開源授權，也沒有替換使用者表。

## 真實輸入法的選字、送字與特殊碼

下列依公開官方操作文件、移植規格及原表查核，沒有在Windows/macOS真機逐版本實測。**候選標籤、實體選字鍵、組字完成及送出全文是不同層次**；使用者設定、學習排序與版本可能改變候選畫面。無法核對的細節明列未知。

| 方法／實作 | 候選標籤與選字鍵 | 完成／送出 | 碼長與特例 |
| --- | --- | --- | --- |
| 大千：Windows微軟注音 | 候選狀態按對應數字；方向鍵移動，Enter確認；關聯詞可Shift+數字 | `3/4/6/7`分別三／四／二／輕聲，Space一聲，完成音節轉換；候選視窗Space翻頁，Enter確認焦點 | 一般最多3聲韻符號＋1調鍵；數字本身也可能是聲韻鍵，必須分狀態 |
| 大千：macOS繁體注音 | Space開候選／翻頁，對應數字或選取候選；目前每頁固定標籤個數未完全查定 | 聲調完成音節，Return確認預編輯全文；自動轉換不等於已送出 | 同一大千聲韻配置，不等同網站單字練習的commit流程 |
| 嘸蝦米：Windows J／macOS X2 | **0起算**，首選0，第二1；Space送首選；其他數字選對應候選 | 一般碼後Space；查詢結果Space可能翻頁 | 標準形根最多4，截長取首二三尾；輸入緩衝最多5鍵，可含輔助尾碼／查詢 |
| 行列30：官方移植規格／Windows；macOS以OpenVanilla為核對對象 | `1234567890`；打一／二根即顯示10個簡碼，直接數字選；不是先Space | Space查恰等於目前碼的主表；唯一直接上字，多個待選。≤10候選時再Space首選，超10時Space翻頁 | 依筆順最多4根，超長**前三後一**；Unicode擴充可有第五鍵`i`，不是第五根 |
| 大易：官方Windows 8.0 | 顯示`0…9`，0首選可省選；1–5實體鍵為`' [ ] - \`，6–9為Shift+`' [ ] -` | Space結束字／詞，亦可接續根鍵承接預設首選；數字上排本身有根 | 三碼取首、次、尾；原表實有四碼，不能拿最大碼長4改定網站版本 |
| 大易：macOS OpenVanilla資料 | 原CIN `%selkey '[]-\6789` 是框架設定，不能直接稱官方0…9數字選字規範 | 框架行為須另核；未確認當代macOS大易有唯一官方對應 | 不將Windows8.0快捷符號／選字規格套給所有macOS前端 |
| 倉頡三代：Windows微軟倉頡 | 對應數字選候選，Enter焦點；公開文字未保證固定10候選／0起算 | 編碼Space查／提交與候選Space翻頁分狀態 | 最多5碼；字首最多2、字身最多3；連體另有4碼截取 |
| 倉頡：macOS倉頡 | 對應數字，或移動後Space；`[`/`]`或`-`/`=`換候選列 | 輸入碼後Space插入；即時候選設定影響操作 | Apple以`z`代未知碼；這與所選表Z符號前綴是不同引擎功能 |

注音行為來源為 [Microsoft繁體中文IME](https://support.microsoft.com/zh-tw/windows/hardware/input-devices/microsoft-traditional-chinese-ime)、[Apple繁體注音](https://support.apple.com/zh-tw/guide/chinese-input-method/cimzt15531/104/mac/15.0)、[TOCFL標準鍵位](https://tocfl.edu.tw/tocfl/assets/files/20200420140722.pdf)。嘸蝦米來源為 [官方X2手冊](https://boshiamy.com/product_x2_dl.php)、[Windows J輔助選字](https://boshiamy.com/tutorial_function.php?page=5&sub=4)、[四根規則](https://boshiamy.com/tutorial_beginner.php?page=4)。行列依 [移植規格](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)、[官方取碼教室](https://www.array.com.tw/class/class2.htm)。大易依 [官方手冊第18頁及操作章節](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf)、[初學取碼規則](https://www.dayi.com/assets/大易輸入法初學資料與範例.pdf)。倉頡依 [Microsoft](https://support.microsoft.com/zh-hk/windows/hardware/input-devices/microsoft-traditional-chinese-ime)、[Apple倉頡](https://support.apple.com/en-jo/guide/chinese-input-method/cimcjt11820/mac)、[Apple候選操作](https://support.apple.com/en-jo/guide/chinese-input-method/cim12992/mac)。

### 嘸蝦米：保留0起算，不採CIN的1起算候選設定

官方X2直接示範「0.嘸」、Space送第0；官方Windows J以 `MHU` 精／睛示範第二候選「1選」，可用 `MHUV` 替代。故建議墨打維持使用者指定 `0123456789`，不依CIN `%selkey 1234567890` 改動。原 `index.js` 最長5鍵；尾碼 `V/R/S/F/W/L/C/B/K` 分別選第2…10候選。官方明文可確認 `V/R/S/F/W/L/C/B` 對1…8選；`K=9` 是既有引擎契約，本次未取得全平台官方保證。已有合法碼優先，例如 `EWDV` 已是雞，不能被動態「EWD的1選岰」覆蓋。([官方X2](https://boshiamy.com/product_x2_dl.php)、[Windows J](https://boshiamy.com/tutorial_function.php?page=5&sub=4)、[指定引擎](../../data-raw/boshiamy/index.js))

`[` 是不定長未知根，`]` 是單一未知根；指定引擎把前者轉 `.+`，至少匹配一根，不能默改成可空的 `.*`。`'` 同音查詢、`';` 注音查詢屬狀態功能。單／雙碼簡碼、可參與他字的「簡速字根」、標準碼、容錯碼、候選尾碼分開：例如的 `d` 是簡碼，俞 `a` 是簡速根；表本身沒有codeType欄，不能以碼長自動完成分類。([官方查詢與簡速說明](https://boshiamy.com/product_x2_dl.php)、[簡速根](https://boshiamy.com/tutorial_advance.php?page=1))

### 其他特殊碼不可跨方法類推

行列一／二級簡碼需數字選字，398特別碼可Space直接上字；主表還有 `t→的` 的特殊常用碼。`?`單碼、`*`具有首位不計順序等規則，不能當一般glob。大易數字0–9都是根，`x`是水、`z`是心；Windows8.0支援`?/*`查未知碼但不可全為萬用碼。倉頡 `x`是規定難字部分，如身 `hxh`、齊 `yx`，不是不懂就填X；`z`在所選表是符號區，Apple卻也用Z通配。倉頡一碼26列、二碼506列多為真正完整碼，不能稱一／二級簡碼；速成是另一方案，不屬本次三代簡碼。([行列規格](https://raw.githubusercontent.com/gontera/array30/2e447f26079ddfea638d472e8faadefa953b7d64/array30_spec/ar30portingSpec.txt)、[大易手冊](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf)、[倉頡原表](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt)、[Apple Z說明](https://support.apple.com/en-jo/guide/chinese-input-method/cimcjt11820/mac))

注音沒有形碼簡碼；第一聲Space通常不寫在資料code欄，卡片應另列commit。新單字表的𰻞／𰻝有 `physical=11u;6`，但注音字串是ㄅㄧㄤˊ；這兩筆來源特殊項須隔離人工處理，不可推成大千標準允許五個聲韻符號。([原字音表](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFBase.txt))

## 標點：實掃表內碼與引擎快捷鍵分開

| 符號 | 嘸蝦米指定表（擇可查得碼） | 行列主表 | 倉頡三代表 |
| --- | --- | --- | --- |
| ， | `,`、`,,` | `,`／`w1` | `zxab` |
| 。 | `.`／`,.` | `.`／`w1` | `zxad` |
| 、 | `vv`／`'`等 | `w1` | `zxac` |
| ； | `.,` | `;`／`w1` | `zxag` |
| ： | `..` | `;`／`w1` | `zxah` |
| 「／」 | `[`／`]`，另`,[`／`,]` | `w2` | `zxcd`／`zxce` |
| ？ | `s.` | `w1` | `zxai` |
| ！ | `v.`／`c.` | `w1` | `zxaj` |
| … | 不在本次11種嘸蝦米標點統計集合，不能由此斷言無碼 | `w1` | `zxal` |
| 『／』 | `[[`／`]]`，另`,[[`／`,]]` | `w2` | 另查表；不以「」碼推生 |

以上是「存在碼→候選」，不保證第一候選，也不保證任何引擎狀態都可直接使用：嘸蝦米`[`/`]`與萬用查詢衝突；行列`w1`／`w2`後要在符號頁選字。行列一級簡碼另有`d`的`！「」、`及`/`的`？『』…`，不能只載主表。完整盤點見 `data-raw/array/table-audit.json`、`data-raw/cangjie/validation.json`、`data-raw/zhuyin/research-stats.json`；原碼來源為各下載原檔。

**大易下載原表沒有「，。、；：「」？！…『』」映射。** 官方Windows8.0提供獨立快速標點設定（預設五種，。？、；）及 `=` 前導符號：`=a`全形A、`=1`數字類、`=[`括號類、`={`角括號類。這是引擎或另表能力，不得宣稱本次原表已包含；完整可分發標點另表仍缺。([官方手冊第2、13–14、19頁](https://www.dayi.com/assets/大易輸入法-8_0-操作說明2.pdf))

注音原 `bopomofo.cin` 也沒有上述常見標點，聲韻發音不負責標點。Windows注音／倉頡提供Ctrl+符號、反引號前導符號及Ctrl+Alt+,符號鍵盤。McBopomofo本次另存符號檔，例如 `_ctrl_punctuation_,`、`_punctuation_<`對逗號，`_punctuation_[`／`]`對引號、`{`／`}`對雙引號；它們是引擎內部查詢名稱，**不能當使用者逐字輸入的字碼**，須另依其鍵盤事件規則連接。([Microsoft官方](https://support.microsoft.com/zh-tw/windows/hardware/input-devices/microsoft-traditional-chinese-ime)、[McBopomofo符號原檔](https://raw.githubusercontent.com/openvanilla/McBopomofo/592d5b7f3ac2d8ee39ddf01c9e806af45d9f21c5/Source/Data/BPMFPunctuations.txt))

下一階段可據已確認表建立離線索引；完整大易三碼及標點表、嘸蝦米公開再散布範圍、macOS部分候選標籤細節仍須保留為未解事項。字根圖與教學PDF的圖像權利不由碼表授權自動涵蓋，本次沒有把權利未明的原圖／字型作為可發布資產。字根草稿及可核對例題見 [roots.md](roots.md)，拆字探測見 [decomposition.md](decomposition.md)。

# 倉頡三代、拆字與教育部字集查證

## 倉頡三代採哪個表？字根與實際操作如何區分？

### Takeaway
推薦已下載的 `data-raw/cangjie/cangjie3.txt`：檔案明示三代、五碼，並有獨立「Freely redistributable without restriction」授權。不得拿 Rime 官方主套件的五代替代三代；同為三代也應標記所選實作與歷史字集。

### Cited Findings

| 候選來源 | 原始檔／授權 | 本次實測覆蓋與結論 |
|---|---|---|
| ibus-table-chinese 三代（推薦、已存） | [固定commit原檔](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt)，檔內 `LICENSE = Freely redistributable without restriction`，同時要求不改標頭、UTF-8 | 17,578 code-output列，17,568獨立輸出字元，其中16,860落在本研究明定漢字區間 U+3400..9FFF 或 U+20000..323AF。可公開非營利再散布，原標頭完整保留。權利聲明與整個ibus專案GPL3分開看。來源作者Roy Chan，chinesecj.com，SERIAL_NUMBER2004111801，2008年轉格式。 |
| OpenVanilla `cj.cin` | [原檔](https://raw.githubusercontent.com/openvanilla/openvanilla/master/DataTables/cj.cin)，檔頭沒有獨立授權；[OV專案](https://github.com/openvanilla/openvanilla)有其總授權 | 實測17,532列、17,475獨立輸出；三代特徵面mwyl、廠ifbk、這yymr、黑wgf與推薦表一致。檔頭稱加入HKSCS；仍需查檔案來源的權利鏈，未下載保留此資料表，只存比較數值。 |
| RIME 倉頡輸入法集成 `cangjie.3-base.dict.yaml` | [固定commit原檔](https://raw.githubusercontent.com/cangjie-system/rime-cangjie-integrated/dcfba770189078a2f7b347793c8e155c3c39275d/cangjie.3-base.dict.yaml)、[MIT](https://raw.githubusercontent.com/cangjie-system/rime-cangjie-integrated/dcfba770189078a2f7b347793c8e155c3c39275d/LICENSE)；[README](https://raw.githubusercontent.com/cangjie-system/rime-cangjie-integrated/dcfba770189078a2f7b347793c8e155c3c39275d/README.md)明示根目錄檔案除特別聲明皆MIT，resources遵其原授權 | 實測108,419列、97,057獨立輸出，最大5碼。檔頭稱取自倉頡平台2012並修訂，符號另表，含Unicode外字容錯。廣字集備選，可按MIT保留通知再散布；本次選擇檔內原始再散布許可更直接的ibus歷史表，以減少改碼／容錯擴充對教學的影響。未混合兩表、未儲存原檔，只存比較數值。 |
| `rime/rime-cangjie` | [專案README](https://github.com/rime/rime-cangjie)、[LGPL3](https://raw.githubusercontent.com/rime/rime-cangjie/master/LICENSE)；raw檔案為 `cangjie5.base.dict.yaml` 等 | 官方配方目前只有倉頡五代及其快速模式，版本不符，排除。不能把名稱rime-cangjie當成第三代保證。 |
| libcangjie | [官方版本說明](https://cangjie.pages.freedesktop.org/projects/libcangjie/documentation/versions.html)同時支援3/5；[官方專案授權](https://cangjie.pages.freedesktop.org/projects/libcangjie/)為LGPL3-or-later | C API有明確版本參數，是版本對照候選。此次GitLab raw端點無法取得，沒有臆填資料表字數／獨立資料授權；僅能確認程式庫授權與3/5能力，不作本次bundled資料來源。 |
| 全字庫CNS倉頡屬性 | [Properties.zip](https://data.cns11643.gov.tw/opendata/Properties.zip)、[官方資料集與OGDL/OFL二擇一](https://data.gov.tw/dataset/5961) | 有CNS_cangjie.txt，但欄位未明確標第三代，且為CNS字形。可按OGDL再散布不代表符合固定三代。只讀樣本／格式，未當三代碼表保留。 |

上述覆蓋是本次Python直接解析字表的數值，重現資料在 `cangjie/validation.json`、`*-comparison.json`，不是專案宣傳的字數。`MANIFEST.json` 留本次檔案SHA-256。推薦表SHA256 `af3d2215f5abd02d022773a54583cb68c9bd64fc6989b20cfb0cdf421eeb951a`。原始下載、授權文字及日期在 `cangjie/LICENSE-SOURCE.txt`。

- **版本證據**：推薦表明寫「CangJie Input Method the 3rd Generation」，另以「面mwyl、廠ifbk、這yymr、黑wgf、麵jnmwl」作版本／變體指紋；不得把同一字不同版本當容錯偷偷改表。[表原文](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt)
- **碼長與選字鍵是引擎層**：推薦ibus原表 `MAX_KEY_LENGTH=5`、`SELECT_KEYS=1,2,3,4,5,6,7,8,9`、`AUTO_COMMIT=FALSE`；OV CIN則 `%selkey 1234567890`，因此表選字鍵本來就不是所有平台一致的官方規範。[ibus原檔](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt)、[OV原檔](https://raw.githubusercontent.com/openvanilla/openvanilla/master/DataTables/cj.cin)
- **Windows實際行為**：Microsoft公開操作說明說候選視窗以對應數字選字，Enter選焦點候選；焦點在候選視窗時Space翻頁。沒有由文字說明保證永遠固定10個候選，也不能由此推論第一字標0。`Ctrl+符號`輸入全形，反引號再符號及符號鍵盤亦有支援。墨打應把「正在編碼時Space查／提交」和「已展開候選時Space翻頁」分成狀態，而非Space一律提交。[Microsoft繁體中文IME](https://support.microsoft.com/zh-hk/windows/hardware/input-devices/microsoft-traditional-chinese-ime)
- **macOS實際行為**：Apple倉頡使用碼後Space插入；顯示候選後按對應數字，或移到欲選字後Space；`[`/`]`或`-`/`=`換候選列。候選即時顯示設定影響Space查字方式。[Apple倉頡說明](https://support.apple.com/en-jo/guide/chinese-input-method/cimcjt11820/mac)、[Apple候選操作](https://support.apple.com/en-jo/guide/chinese-input-method/cim12992/mac)
- **Z不是通用字根**：Apple實作以Z替代未知的任一碼，可在一碼序列多次使用；推薦資料表本身Z前綴則是符號區，兩者不能混作同一規則。X是規定的難字，例如身hxh、齊yx；不知道拆法不能一概用X。三代鍵名保留Z「重」，並不表示有一般字根重。[Apple](https://support.apple.com/en-jo/guide/chinese-input-method/cimcjt11820/mac)、[三代圖表與難字](https://www.hkcards.com/b1/cj-table)
- **短碼**：推薦表一碼26列是24主根再加曰(a)、乂(k)；兩碼506列並不等於「506個二級簡碼」，很多就是完整取碼。這份表沒有另外標註一級、二級簡碼；「速成」首尾碼是另一輸入方案，不能當本任務倉頡三代簡碼。[表原文](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt)
- **標點**：直接掃表有 `，zxab`、`、zxac`、`。zxad`、`；zxag`、`：zxah`、`？zxai`、`！zxaj`、`…zxal`、`「zxcd`、`」zxce`、`（zxbe`、`）zxbf`、`《zxbu`、`》zxbv`。這些是表內碼，不要求OS中文模式；Windows的Ctrl符號則是外加引擎快捷鍵。[原表](https://raw.githubusercontent.com/definite/ibus-table-chinese/bac13d268344311d48ad9bbc09c7df48b304066f/tables/cangjie/cangjie3.txt)、[Microsoft](https://support.microsoft.com/zh-hk/windows/hardware/input-devices/microsoft-traditional-chinese-ime)

`roots/cangjie.json` 以 `a..z` 實體鍵記錄24主根、X/Z功能，四群依序：哲理abcdefg（日月金木水火土）、筆畫hijklmn（竹戈十大中一弓）、人體opqr（人心手口）、字形stuvwy（尸廿山女田卜）。記憶說明自行撰寫，沒有把字母位置錯解為英文音譯。依[維基教科書輔助字形表](https://zh.wikibooks.org/wiki/倉頡輸入法/輔助字形)逐列記錄三代99形類／215個SVG變體識別碼，排除五代新增的水形cjr5m-e1、尸形cjr5m-s1；Unicode不能表精確筆勢者加note、例字及source_shape_ids。原始文字快照 `cangjie/root-chart-source.wiki` 按CC BY-SA4保留，沒有拷貝Commons圖檔。[來源表及版本差異](https://www.hkcards.com/b1/cj-table)

已驗證六例：明ab（左日右月）、林dd（兩木）、休od（亻為人輔形＋木）、好vnd（女＋子拆弓木）、學hbnd（上部字首首尾竹月＋子弓木）、身hxh（難字）。`python3 data-raw/cangjie/validate.py`逐例assert碼表存在；不能因Unicode近似字看起來相似就當相同根，例如「又」作部件取水，但獨立成字拆弓大；士作部件土，獨立字拆十一。[輔助字形獨立成字規則](https://zh.wikibooks.org/wiki/倉頡輸入法/輔助字形)

### Inferences

- PWA預設數字標籤可採1起算，以保留各平台使用者認知；頁面及設定應明說是在模擬指定版本的選定資料表，候選排序／頁大小不假稱完全復刻Windows或macOS。下載表只有9個選字鍵時，不應自動把候選序號當碼的一部分。
- 以歷史ibus表作第一版題庫最容易保持三代碼一致；若需要擴充到9萬字，另建立並版本化MIT集成三代表，對差異碼和字形逐一記錄，不要合併覆蓋原表。

### Gaps

- 不同Windows／macOS版本、詞頻學習、港臺字形與輸入設定會改候選；本次查公開文件、碼表及來源，未在真機逐版本操作。公開文件對固定標籤個數不完整；不宣稱全平台永久相同。
- JSON保留全表形類及變體索引，但Unicode近似仍無法表達每個缺筆／旋轉輪廓，尚非能直接幾何匹配的完備字形庫。此草稿應依來源圖做人工視覺校對；不得將「索引完整」寫成「每個圖形已Unicode精確還原」。

## IDS資料該選哪個？能否由構形自動解釋真實輸入碼？

### Takeaway
下載cjkvi的`ids.txt`（88,937資料列、2,161,631bytes），連同CHISE來源授權和GPL2全文；可再散布，但不能省略GPL義務。另保留政府開放的CNS部件表作無空間運算子的替代資料。50字前向baseline證明「有IDS」不等於「能直接產生可靠取碼說明」。

### Cited Findings

| 候選 | 授權及範圍 | 判斷 |
|---|---|---|
| cjkvi-ids `ids.txt`（推薦已下載） | [固定commit原檔](https://raw.githubusercontent.com/cjkvi/cjkvi-ids/86b4d16159f0079437870408f0ca186e529015db/ids.txt)；[README授權](https://raw.githubusercontent.com/cjkvi/cjkvi-ids/86b4d16159f0079437870408f0ca186e529015db/README.md)明示ids.txt衍自CHISE並遵其條款，其餘檔大多GPLv2 | `ids.txt`依CHISE GPL2-or-later。可公開網站傳輸／離線再散布，保留作者／原始資料／GPL；修改產生的衍生資料需追蹤GPL要求。不能推論某個未直接源自CHISE的擴充檔就是公有領域。 |
| CHISE IDS | [上游README](https://raw.githubusercontent.com/chise/ids/932316eabb66cd37c54061662b2dd9d1564024d3/README.md)授權GPL2-or-later；區分抽象字、具體字形，支援大量實體參照 | 合法可再散布，需GPL；當選定資料無臺灣變體、需更細語源／外字時有價值。未把整個CHISE套件巨量下載。 |
| BabelStone IDS | [原始檔](https://www.babelstone.co.uk/CJK/IDS.TXT)檔頭作者Andrew West宣稱IDS屬事實、不受美國版權，並放棄格式權利，個人／商業可自由用免署名；此查核版本97,680條、Unicode16、2025-06-27 | 不選為唯一授權依據：檔頭亦述來自Kawabata等上游，[Unicode L2/21-161](https://www.unicode.org/L2/L2021/21161-ids-copyright.pdf)專門記錄對此權利鏈的疑慮。作者自身權利放棄不必然消除上游GPL。只比較來源，未保留資料原檔。 |
| CNS部件 | [Properties.zip](https://data.cns11643.gov.tw/opendata/Properties.zip)的CNS_component.txt（2,134,887bytes）與CNS_component_ref.txt（11,925bytes），[官方資料集](https://data.gov.tw/dataset/5961)OGDL或OFL二擇一；本次選OGDL | 已下載到ids目錄並另註OGDL，沒有與GPL表混合。這是CNS字碼→部件編號序列、編號→Unicode／字形參照，缺乏⿰⿱等空間樹；含PUA，不能冒充完整IDS。 |

CJKVI IDS可能含地區`[T]`／`[G]`等標記、CDP實體或未編碼占位，來源明說歧義及字型需求。[CJKVI政策](https://raw.githubusercontent.com/cjkvi/cjkvi-ids/86b4d16159f0079437870408f0ca186e529015db/README.md)；CHISE進一步提醒一個Unicode字會統合不同字形，字形資料有意用實體表示，不能任意替換成看似相同Unicode。[CHISE](https://raw.githubusercontent.com/chise/ids/932316eabb66cd37c54061662b2dd9d1564024d3/README.md)

未找到附明確開放授權、又能逐字對應本次固定嘸蝦米／行列30／大易三碼表的完整「取碼理由」資料集。編碼表只是code→字，不含字根的區域座標與規則證明；倉頡集成亦只是碼表、符號／部首表而非拆碼證明。[集成檔案與說明](https://github.com/cangjie-system/rime-cangjie-integrated)

### Inferences

**具體演算法提案（尚未宣稱實作完成）**：

1. 先按原碼表建立每字可接受碼集合，保留全碼、短碼、容錯、符號類型；選一個明示來源的標準教學碼。不能把任何最短碼自動稱全碼。
2. 以臺灣字形取IDS樹，優先帶T標記；保留所有備選及外字實體。沒有可確認形狀的PUA／CDP回傳unknown。不能NFKC把字形差別抹掉。
3. 樹節點保留空間方向與可連接筆畫範圍；建立每個IM有版本的root matcher。匹配條件是字形／筆畫及位置，不是從目標碼倒猜「這塊應該叫某根」。Unicode近似欄位只作顯示，禁止當精確matching alias。
4. 由IDS空間次序產生取碼次序；IDS前序不等於筆順，尤其⿴囗需把末橫閉合、⿺辶移後，⿻交疊需要筆畫層重分。每次覆蓋節點／筆畫要保留證據。
5. 倉頡分「字首／字身」：只有合法可分割才套頭尾2＋首次尾3（最多5），連體超長取首、次、三、尾（最多4），另列包含省略、複合字、三代特別字首、X難字。行列需按原教學取**前三後一**，本題所舉「首二尾二」不能原樣套用。大易三碼首、次、尾，同時查清哪些是真三碼全碼、哪些是短碼；四碼兼容字不拿來當三碼規則成就。嘸蝦米需加入形音義多根、合體和補短、加選候選等版本規則。
6. 用動態規劃／有限寬度搜尋，狀態包含未覆蓋區域、根序列、字首字身界線、取碼規則、目標碼位置。碼表只用於剪枝與最終驗證；不能為配碼把任意子樹標一個無根形依據的字母。多條合法路徑時保留歧義；少例外、根形更貼近來源、符合大根優先者優先。輸出每個根的來源形／區域、採用規則、略去哪些中間根與完整重建碼。
7. 字根卡只有在「根形證據＋規則＋結果碼」皆成立時才給WHY；其餘只顯示已知碼／根表與待人工註解。注音改用字詞讀音與聲韻調組合；IDS無法產生讀音或解破音字，應用短語詞典及語境選讀音。

**本次可重跑baseline**：`python3 data-raw/ids/probe_common.py`。固定50字在 `ids/probe-chars.txt`（的、一、是、不了我有…），研究先定樣本，沒有用碼表答案調字根。先以精確Unicode子集／`match_roots`匹配，未知部件遞迴展開IDS，仍不知則無預測；倉頡用第一子樹粗分字首／字身，其他三形碼用根序列再截碼。碼表只在預測結束比對。沒有幾何、特殊字首、補短、真正帶例外的取碼器，因此是最低可行性探查，不是上述完整演算法。

| IM | 表內涵蓋 | 有預測 | 完全匹配 | 錯誤預測 | 無法預測 | 以50為分母 |
|---|---:|---:|---:|---:|---:|---:|
| 倉頡三代 | 50 | 13 | 11 | 2 | 37 | 22% |
| 行列30 | 50 | 18 | 13 | 5 | 32 | 26% |
| 大易三碼 | 50 | 19 | 16 | 3 | 31 | 32% |
| 嘸蝦米 | 50 | 31 | 6 | 25 | 19 | 12% |
| 注音 | 50字音表檢查，見注音研究者產物 | 不適用IDS | 另做50/50讀音→鍵位一致性 | — | — | **不是100% IDS命中** |

實際逐字預測／IDS／碼表全部接受碼／match/path皆保留 `ids/probe-{cangjie,array,dayi,boshiamy}.json`。注音另見 `zhuyin/probe-zhuyin.json`。同一有限樣本、全部涵蓋，分母沒有只挑成功字；命中率低反映通用IDS和IM實際拆法差距，不能把字→碼反查算成成功拆解。

### Gaps

- 沒有帶筆畫座標的字形庫；JSON中99類索引和215變體索引不等於215個已向量化的模板。三代特別字首、局部減筆及其他IM形音義連結仍需人工資料。
- 50字多為高頻、常見簡碼字，非隨機評估；碼表接受碼中含簡碼／容錯時的exact match只是「能用這碼輸入」，不是已證明是標準全碼。範例卡必須另外標記規則及人工核對。
- GPL解說衍生物與網站程式的授權邊界尚需正式發布時審視；本次保留原始、授權、來源並分開CNS政府資料，但不宣稱只要拆檔就能避免所有GPL義務。

## 教育部常用4808及次常用字清單的來源、授權與數量？

### Takeaway
常用清單由CNS開放資料重建4808獨立字，與教育部官方ODS逐字集合完全相同（差異0）；不保留原授權未明ODS。次常用採有CC BY-SA4明示授權的維基文庫轉錄6343字，保留原始碼與歷史版次，清楚分辨歷史6343與現行正字6329。

### Cited Findings

- [教育部官方下載頁](https://language.moe.gov.tw/material/info?m=9fe3ff5a-5a8c-4817-9e60-6337dd55a509)指民國71年9月1日公布4808字，提供[ODS](https://language.moe.gov.tw/uploads/files/17694982751710.ods)。該站版權宣告沒有給此檔專屬開放授權，故只作比對、已刪副本，沒有借用其他辭典的BY-ND條款替它授權。
- [CNS官方資料集](https://data.gov.tw/dataset/5961)明示使用者可選OGDL1.0或OFL1.1單一授權，無須同時兼具。本次選[OGDL全文](https://data.gov.tw/license)，允許改作／再散布／公開傳輸，需明確顯名。原始主機`www.cns11643.gov.tw`讀到20260805，改跟資料集正式連結`data.cns11643.gov.tw`取得[20261028 release](https://data.cns11643.gov.tw/opendata/release.txt)，記錄固定快照。
- 解析 `CNS_source.txt`有4808筆「常用國字標準字體表」來源標記，聯結4個Unicode對照檔後4808獨立字，全數有Unicode。官方ODS也是4808筆／4808字，對稱差0。輸出 `.txt`與含CNS/Unicode/char的`.tsv`，排序為CNS，不捏造教育部A號。`charlists/common-crosscheck.json`、`validation.json`是實測證據，`derive-lists.py`可重建。
- [教育部系統用語](https://dict.variants.moe.edu.tw/page.jsp?ID=89&la=0)歷史乙表為6334字＋9單位詞＝6343；但[正式七版正字表編輯說明](https://dict.variants.moe.edu.tw/appendix.jsp?ID=1&ID=0)現列6329次常用。5字移待考與9單位詞另列，不能把兩種字數混為來源出錯。
- 已下載[維基文庫固定oldid2334552](https://zh.wikisource.org/w/index.php?title=次常用國字標準字體表&oldid=2334552)原始碼（2023-11-25修訂），頁末明示[CC BY-SA4.0](https://creativecommons.org/licenses/by-sa/4.0/)，有[歷史作者](https://zh.wikisource.org/w/index.php?title=次常用國字標準字體表&action=history)可追溯。Python抽取6343列／6343獨立Unicode字，每列碼位與字符一致。衍生文本依相同授權，註明移除Wiki標記與轉TSV。這是轉錄版，原字表來源是教育部，不冒稱官方CSV。
- 本次CNS來源標記只有5768筆次常用，是其來源屬性標記不全，不能重建6343乙表；保留有明確OGDL的原始來源，另輸出明示partial檔，不用作完整題庫。原始會員／對照、授權全文和出處在 `charlists/`。

### Inferences

常用題庫可直接採CNS衍生4808；次常用若需要與歷史乙表一致，用6343轉錄版並標5待考／9單位，不把其轉錄流水序當原B字號。要對現行正式七版則另建6329範圍，不覆蓋歷史資料。

### Gaps

次常用目前有公開明示授權的完整轉錄文本，但未找到直接由教育部提供且明示OGDL的完整乙表機讀下載。原始官方ODS只查集合，未保留教育部編號排序資料；若日後需原字號，需在授權確認後另行取得，或以明確可再利用的轉錄版補足。

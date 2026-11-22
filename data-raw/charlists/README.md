# 維基百科衍生繁體字頻資料

取得日期：2026-11-22。此目錄依任務第 4 項明確要求建立。

- 上游：[Christian Zielinski 的 hanzifreq](https://github.com/czielinski/hanzifreq)，固定版本 `fe1905fe676adb4e5ac8a8cd2d6d7998735f5671`。
- 原始下載檔：`wikipedia-frequencies-original.html`。上游 README 明示此預先計算表以中文維基百科為語料；表中為繁簡混合的前 10,000 個字及其百分比，不含文章原文。
- 上游專案明列 MIT，完整聲明保留於 `LICENSE-hanzifreq-MIT.txt`。作者：Christian Zielinski，2015。
- 語料署名：中文維基百科貢獻者，作者可由[各條目歷史](https://zh.wikipedia.org/wiki/Special:History)追溯；原始語料適用 [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)／現行 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)，參見[維基媒體使用條款](https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use)。不把上游程式的 MIT 當成替維基百科原文重新授權。
- 本次變更：以 `opencc-python-reimplemented==0.1.7` 的 `s2tw` **逐字**對應，合併落到相同繁體字的來源百分比，重新排序，輸出 `wikipedia-zh-tw-frequency.tsv`。衍生表如涉及可保護的編排，依 CC BY-SA 4.0 提供；MIT 聲明與語料署名一併保留。
- 執行方式：安裝 `requests beautifulsoup4 opencc-python-reimplemented==0.1.7` 後，執行 `python3 docs/research/prepare_charlist.py`。資料與原檔 SHA-256、筆數及下載網址記於 `provenance.json`。

TSV 欄位：`rank`（合併後排名）、`character`（繁體字）、`frequency_percent`（上游百分比相加）、`source_characters`（原表哪些字被合併，保留對應的歧義）。共 7,939 字，由原表 10,000 列合併而成；上游只保留五位小數，合計 99.97519%，不重新正規化，也不虛構原始出現次數。

這是**維基百科繁簡混合字頻經單字轉換後的練習排序資料**，不是臺灣口語、新聞、教育部或中研院語料的實測繁體字頻。單字轉換無上下文，例如「发」預設成「發」，不能拆回「發／髮」各自頻率；「干、后、台、里」也有對應歧義。Wikipedia 的日期、人名及地名較多，排名不等於日常用字排名。前 10,000 字之外沒有資料，不能用缺值斷言某字從未使用。

未採用蔡志浩字頻表、中研院語料或教育部詞頻表：可公開查閱不等於允許重製散布；本次沒有找到足以涵蓋本網站散布方式的明確開放授權。也未把有「限研究／教學」條款的笪駿字頻表標為開放資料。

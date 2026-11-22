#!/usr/bin/env python3
"""下載固定版本字頻表，保留原檔，將單字確定性轉換為臺灣繁體後合併頻率。"""
import hashlib,json,csv,io,collections
from decimal import Decimal
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from opencc import OpenCC
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'data-raw/charlists';OUT.mkdir(parents=True,exist_ok=True)
s=requests.Session();s.headers['User-Agent']='MoDaArticleResearch/1.0 (open-data collection)'
sha='fe1905fe676adb4e5ac8a8cd2d6d7998735f5671'
base=f'https://raw.githubusercontent.com/czielinski/hanzifreq/{sha}/'
files={}
for path,name in [('hanzifreq/output/frequencies.html','wikipedia-frequencies-original.html'),('LICENSE.txt','LICENSE-hanzifreq-MIT.txt'),('README.md','upstream-README.md')]:
 r=s.get(base+path,timeout=45);r.raise_for_status();data=r.content;(OUT/name).write_bytes(data);files[name]={'source':base+path,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)}
cc=OpenCC('s2tw');freq=collections.defaultdict(Decimal);orig=collections.defaultdict(list)
for tr in BeautifulSoup((OUT/'wikipedia-frequencies-original.html').read_text(),'html.parser').select('tr'):
 cells=[c.get_text(strip=True) for c in tr.select('td')]
 if len(cells)!=4:continue
 rank,ch,pct,cumulative=cells
 tw=cc.convert(ch)
 if len(tw)!=1:raise ValueError((ch,tw))
 freq[tw]+=Decimal(pct);orig[tw].append(ch)
ranked=sorted(freq,key=lambda c:(-freq[c],ord(c)))
with (OUT/'wikipedia-zh-tw-frequency.tsv').open('w',encoding='utf-8',newline='') as f:
 w=csv.writer(f,delimiter='\t',lineterminator='\n');w.writerow(['rank','character','frequency_percent','source_characters'])
 for rank,ch in enumerate(ranked,1):w.writerow([rank,ch,f'{freq[ch]:.5f}',''.join(orig[ch])])
files['wikipedia-zh-tw-frequency.tsv']={'sha256':hashlib.sha256((OUT/'wikipedia-zh-tw-frequency.tsv').read_bytes()).hexdigest(),'rows':len(ranked),'source_rows':sum(map(len,orig.values())),'sum_frequency_percent':str(sum(freq.values()))}
(OUT/'provenance.json').write_text(json.dumps({'retrieved':'2026-11-22','repository_commit':sha,'files':files,'conversion':'opencc-python-reimplemented 0.1.7 / s2tw；依單字轉換，合併來源百分比；非臺灣語料的實測字頻'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(files,ensure_ascii=False,indent=2))

#!/usr/bin/env python3
"""研究資料核對：保留原字表順序；此檔不是輸入法或應用程式引擎。"""
from pathlib import Path
from collections import defaultdict, Counter
import json,re,hashlib
BASE=Path(__file__).resolve().parents[2]
def cin(path):
 text=path.read_text(); d=defaultdict(list);inside=False
 for line in text.splitlines():
  if re.match(r'%chardef\s+begin',line): inside=True;continue
  if re.match(r'%chardef\s+end',line):break
  p=line.split()
  if inside and len(p)==2:d[p[0]].append(p[1])
 return d
b=cin(BASE/'data-raw/boshiamy/boshiamy.cin'); original=cin(BASE/'data-raw/boshiamy/bopomofo.cin')
readings=defaultdict(list)
for line in (BASE/'data-raw/zhuyin/BPMFBase.txt').read_text().splitlines():
 if not line or line.startswith('#'):continue
 p=line.split();readings[p[0]].append({'bpmf':p[1],'pinyin':p[2],'physical':p[3],'group':p[4] if len(p)>4 else None})
checks=[]
for im in ('boshiamy','zhuyin'):
 roots=json.loads((BASE/f'data-raw/roots/{im}.json').read_text())
 assert len({x['key'] for x in roots['keys']})==len(roots['keys'])
 for rule in roots['rules']:
  for ex in rule.get('examples',[]):
   ok=(ex['char'] in b.get(ex['code'],[])) if im=='boshiamy' else (ex['code'] in [r['physical'] for r in readings[ex['char']]])
   checks.append({'im':im,**ex,'match':ok});assert ok,(im,ex)
phrases=[l.split() for l in (BASE/'data-raw/zhuyin/BPMFMappings.txt').read_text().splitlines() if l and not l.startswith('#')]
# 不以 table 去產生注音：把已知詞典注音轉為鍵碼，對照原檔的 physical 欄檢查轉換是否正確。
z=json.loads((BASE/'data-raw/roots/zhuyin.json').read_text()); zmap={s:x['key'] for x in z['keys'] for s in x['roots']}
sample=(BASE/'data-raw/ids/probe-chars.txt').read_text().strip()
zdetails=[]
for ch in sample:
 out=[]
 for r in readings[ch]:
  generated=''.join(zmap.get(s,'?') for s in r['bpmf'])
  out.append({**r,'mapped':generated,'match':generated==r['physical']})
 zdetails.append({'char':ch,'covered':bool(out),'readings':out,'all_mapped_correctly':bool(out) and all(x['match'] for x in out)})
phrase_checks=[]
for phrase in ['銀行','行走','音樂','快樂','重複','重量','長大','長度']:
 found=[p[1:] for p in phrases if p[0]==phrase]
 assert found,phrase
 for syllables in found:
  mapped=[''.join(zmap.get(s,'?') for s in bpmf) for bpmf in syllables]
  assert len(phrase)==len(mapped),(phrase,mapped)
  for ch,code in zip(phrase,mapped): assert code in [r['physical'] for r in readings[ch]],(phrase,ch,code)
  phrase_checks.append({'phrase':phrase,'bopomofo':syllables,'physical_syllables':mapped,'first_tone_commit':'未帶3/4/6/7的音節另按Space；音節之間不是固定輸入文字空格。','match':True})
(BASE/'data-raw/zhuyin/heteronym-checks.json').write_text(json.dumps(phrase_checks,ensure_ascii=False,indent=2)+'\n')
zhuyin_probe={'im':'zhuyin','sample_size':len(sample),'dictionary_coverage':sum(d['covered'] for d in zdetails),
 'consistent_characters':sum(d['all_mapped_correctly'] for d in zdetails),'IDS_prediction':'N/A: 字形樹不能推出讀音；此數值是來源讀音→鍵碼的一致性，不是破音字自動判斷正確率。','details':zdetails}
(BASE/'data-raw/zhuyin/probe-zhuyin.json').write_text(json.dumps(zhuyin_probe,ensure_ascii=False,indent=2)+'\n')
outputs=[v for vs in b.values() for v in vs];op=[v for vs in original.values() for v in vs]
punct='，。、；：「」？！『』'
stats={'boshiamy':{'entries':len(outputs),'unique_outputs':len(set(outputs)),'single_han':len({x for x in outputs if len(x)==1 and ('\u3400'<=x<='\u9fff' or '\U00020000'<=x<='\U000323af')}),'unique_codes':len(b),'lengths':dict(Counter(len(k) for k in b)), 'punctuation':{ch:[k for k,v in b.items() if ch in v] for ch in punct}},
 'supplied_bopomofo':{'entries':len(op),'unique_outputs':len(set(op)),'unique_codes':len(original),'max_code_length':max(map(len,original)),'punctuation':{ch:[k for k,v in original.items() if ch in v] for ch in punct}},
 'mcbopomofo_base':{'entries':sum(map(len,readings.values())),'unique_characters':len(readings),'max_raw_physical_length':max(len(r['physical']) for rs in readings.values() for r in rs),'exceptions_over4':[{'char':ch,**r} for ch,rs in readings.items() for r in rs if len(r['physical'])>4]},
 'mcbopomofo_phrases':{'entries':len(phrases),'unique_phrases':len({p[0] for p in phrases}),'heteronym_examples':[p for p in phrases if p[0] in ['銀行','行走','音樂','快樂','重複','重量','長大','長度']]},
 'mcbopomofo_punctuations':{ch:[l.split()[1] for l in (BASE/'data-raw/zhuyin/BPMFPunctuations.txt').read_text().splitlines() if len(l.split())>1 and l.split()[0]==ch] for ch in punct},
 'example_checks':checks,'zhuyin_probe_summary':{k:v for k,v in zhuyin_probe.items() if k!='details'},
 'original_sha256':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in (BASE/'data-raw/boshiamy').iterdir() if p.suffix in ('.cin','.js')}}
# 原檔與 OpenVanilla 的比較僅在有研究快取時重新核算，否則保留已量測數值（不下載或散布授權不明候選檔）。
cache=BASE/'data-raw/cache/zhuyin-boshiamy/bpmf.cin'
if cache.exists():
 ov=cin(cache);a={(k,c) for k,cs in original.items() for c in cs};d={(k,c) for k,cs in ov.items() for c in cs}
 stats['lineage_comparison']={'openvanilla_commit':'ecf3260a49e61aacf4ffc951d40d390a46dc4cec','url':'https://raw.githubusercontent.com/openvanilla/openvanilla/ecf3260a49e61aacf4ffc951d40d390a46dc4cec/DataTables/bpmf.cin','supplied_pairs':len(a),'openvanilla_pairs':len(d),'common_pairs':len(a&d),'only_supplied':len(a-d),'only_openvanilla':len(d-a)}
else:
 prior=BASE/'data-raw/zhuyin/research-stats.json'
 if prior.exists():stats['lineage_comparison']=json.loads(prior.read_text()).get('lineage_comparison')
(BASE/'data-raw/zhuyin/research-stats.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in stats.items() if k not in ['example_checks']},ensure_ascii=False,indent=2));print('verified worked examples:',len(checks))

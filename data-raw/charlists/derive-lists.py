"""Rebuild licensed inventories; preserves original source snapshots separately."""
from pathlib import Path
import re, json
base=Path(__file__).resolve().parent
mapping={}
for path in base.glob('CNS2UNICODE_*.txt'):
 for line in path.read_text().splitlines():
  p=line.split('\t')
  if len(p)>=2:mapping[p[0]]=chr(int(p[1],16))
common=[];secondary=[]
for line in (base/'CNS_source.txt').read_text().splitlines():
 p=line.split('\t')
 if len(p)<2:continue
 if p[1].startswith('常用國字標準字體表'):
  common.append((p[0],mapping.get(p[0],'')))
 elif p[1].startswith('次常用字國字標準字體表'):
  secondary.append((p[0],mapping.get(p[0],'')))
assert len(common)==4808 and all(x[1] for x in common)
(base/'moe-common-4808.txt').write_text(''.join(c for _,c in common)+'\n')
(base/'moe-common-4808.tsv').write_text('CNS\tUnicode\tchar\n'+''.join(f'{code}\tU+{ord(ch):04X}\t{ch}\n' for code,ch in common))
(base/'cns-secondary-partial.txt').write_text(''.join(ch for _,ch in secondary if ch)+'\n')
s=(base/'moe-secondary-wikisource.wiki').read_text()
rows=re.findall(r'^\|(\d+)\|\|-\{(.+?)\}-\|\|([0-9A-F]+)\|\|([^\n]*)',s,re.M)
assert len(rows)==6343,len(rows)
assert all(chr(int(cp,16))==ch for _,ch,cp,_ in rows)
assert len(set(ch for _,ch,_,_ in rows))==6343
(base/'moe-secondary-6343.txt').write_text(''.join(ch for _,ch,_,_ in rows)+'\n')
(base/'moe-secondary-6343.tsv').write_text('transcription_sequence\tUnicode\tchar\tnote\n'+''.join(f'{n}\tU+{cp}\t{ch}\t{note}\n' for n,ch,cp,note in rows))
report={'common':{'source_rows':len(common),'unique_unicode_chars':len(set(ch for _,ch in common)),'source':'CNS_source + CNS2UNICODE (20261028)','order':'CNS order; not MOE A-number order'},'secondary':{'source_rows':len(rows),'unique_unicode_chars':len(set(ch for _,ch,_,_ in rows)),'source':'Wikisource oldid=2334552','current_regular':6329,'moved_pending':5,'units':9,'order':'Wikisource transcription sequence; last14 are relocated entries'},'cns_secondary_source_only':{'rows':len(secondary),'warning':'CNS_source is not exhaustive of original MOE secondary inventory'}}
(base/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(report)

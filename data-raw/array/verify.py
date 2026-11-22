"""Reproduce research counts, punctuation inventory, and worked-example membership."""
from pathlib import Path
import json,collections,hashlib

def cin(path):
 active=False;rows=[]
 for line in Path(path).read_text().splitlines():
  s=line.strip()
  if s=='%chardef begin':active=True;continue
  if s=='%chardef end':active=False
  if active and s and not s.startswith('#'):
   t=s.split()
   if len(t)>=2:rows.append((t[0].lower(),t[1]))
 return rows

def han(c):
 n=ord(c);return 0x3400<=n<=0x4dbf or 0x4e00<=n<=0x9fff or 0xf900<=n<=0xfaff or 0x20000<=n<=0x323af or 0x323b0<=n<=0x3347f
out={}
for im,filename in [('array','array30.cin'),('array','array-shortcode.cin'),('array','array-special.cin'),('dayi','dayi3.cin')]:
 path=Path('data-raw')/im/filename;rows=cin(path);chars={v for k,v in rows if len(v)==1};mx=max(map(lambda r:len(r[0]),rows))
 inv={c:[k for k,v in rows if v==c] for c in '，。、；：「」？！…『』'}
 out[str(path)]={'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'rows':len(rows),'unique_code_output_pairs':len(set(rows)),'unique_single_codepoint_outputs':len(chars),'unique_han':sum(han(c) for c in chars),'max_code_length':mx,'code_length_counts':dict(sorted(collections.Counter(len(k) for k,v in rows).items())),'longest_examples':[(k,v) for k,v in rows if len(k)==mx][:8],'punctuation':inv}
 if filename in ('array30.cin','dayi3.cin'):
  data=json.loads((Path('data-raw/roots')/(im+'.json')).read_text());examples=[e for rule in data['rules'] for e in rule['examples']]
  result=[{'char':e['char'],'code':e['code'],'ok':(e['code'],e['char']) in rows} for e in examples]
  out[str(path)]['example_checks']=result
  assert all(e['ok'] for e in result),result
Path('data-raw/array/table-audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(out,ensure_ascii=False,indent=2))

"""Research checks: table counts, version signatures, examples, punctuation."""
from pathlib import Path
import json,hashlib,sys
base=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(base/'data-raw/ids'))
from probe_common import load_table
path=base/'data-raw/cangjie/cangjie3.txt';text=path.read_text();rows=[]
for line in text.split('BEGIN_TABLE',1)[1].split('END_TABLE',1)[0].splitlines():
 p=line.split()
 if len(p)>=2 and not line.lstrip().startswith('#'):rows.append(p[:2])
table=load_table(path);roots=json.loads((base/'data-raw/roots/cangjie.json').read_text());examples=[]
for rule in roots['rules']:
 for x in rule.get('examples',[]):
  ok=x['code'] in table.get(x['char'],set());assert ok,x;examples.append({'char':x['char'],'code':x['code'],'match':ok})
chars={ch for _,ch in rows};han=lambda ch:len(ch)==1 and (0x3400<=ord(ch)<=0x9fff or 0x20000<=ord(ch)<=0x323af)
r={'table_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'rows':len(rows),'unique_outputs':len(chars),'unique_han_in_documented_ranges':sum(han(ch) for ch in chars),'max_code_length':max(len(code) for code,_ in rows),'code_length_histogram':{str(n):sum(len(code)==n for code,_ in rows) for n in range(1,6)},'punctuation':{ch:sorted(table.get(ch,[])) for ch in '，。、；：「」？！…（）《》'},'version_probes':{ch:sorted(table.get(ch,[])) for ch in '面廠這黑麵'},'examples':examples,'root_coverage':roots['coverage']}
(base/'data-raw/cangjie/validation.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print(r)

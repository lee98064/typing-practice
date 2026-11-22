"""T1a research-only forward IDS baseline; never uses reverse table codes to predict.

Run from repo root: python3 data-raw/ids/probe_common.py
Unknown/unencoded components fail closed. This is a deliberately small feasibility
baseline, not a complete implementation of any input method's taking rules.
"""
from pathlib import Path
from collections import defaultdict
import json, re, hashlib

BASE = Path(__file__).resolve().parents[2]
IDC_ARITY = {c: 3 if c in '⿲⿳' else 2 for c in '⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻'}

def load_ids():
    out = {}
    for line in (BASE/'data-raw/ids/ids.txt').read_text().splitlines():
        if line.startswith('#'): continue
        p = line.split('\t')
        if len(p)<3: continue
        alternatives = p[2:]
        # Prefer Taiwan-tagged form, otherwise untagged, then first recorded form.
        seq = next((s for s in alternatives if re.search(r'\[[^]]*T', s)), None)
        seq = seq or next((s for s in alternatives if '[' not in s), alternatives[0])
        out[p[1]] = re.sub(r'\[[^]]*\]', '', seq)
    return out

def parse_ids(seq):
    tokens = re.findall(r'&[^;]+;|.', seq)
    def parse(i):
        if i >= len(tokens): raise ValueError('truncated IDS')
        token = tokens[i]; i += 1
        if token in IDC_ARITY:
            children = []
            for _ in range(IDC_ARITY[token]):
                child, i = parse(i); children.append(child)
            return (token, children), i
        return token, i
    tree, consumed = parse(0)
    if consumed != len(tokens): raise ValueError('trailing IDS')
    return tree

def load_table(path):
    out=defaultdict(set); text=Path(path).read_text(encoding='utf-8-sig')
    if '%chardef begin' in text:
        text=text.split('%chardef begin',1)[1].split('%chardef end',1)[0]
    elif 'BEGIN_TABLE' in text:
        text=text.split('BEGIN_TABLE',1)[1].split('END_TABLE',1)[0]
    for line in text.splitlines():
        p=line.split()
        if len(p)>=2 and not line.lstrip().startswith(('#','%')):
            code,ch=p[:2];code=code.lower()
            if len(ch)==1:out[ch].add(code)
    return out

def root_mapping(im):
    data=json.loads((BASE/f'data-raw/roots/{im}.json').read_text())
    if 'probe_exact_components' in data:
        return data['probe_exact_components'], {x['label']:x['key'] for x in data['keys'] if len(x['label'])==1}
    mapping={}
    for key in data['keys']:
        for root in key.get('match_roots',key.get('roots',[])):
            if isinstance(root,str) and len(root)==1:
                mapping.setdefault(root,key['key'])
    return mapping, {x['label']:x['key'] for x in data['keys'] if len(x['label'])==1}

def flatten_component(ch, ids, roots, seen=()):
    if ch in roots: return roots[ch]
    if ch in seen or ch not in ids or ids[ch]==ch: return None
    try: node=parse_ids(ids[ch])
    except ValueError:return None
    def visit(n):
        if isinstance(n,str):return flatten_component(n,ids,roots,(*seen,ch))
        pieces=[visit(c) for c in n[1]]
        return None if any(c is None for c in pieces) else ''.join(pieces)
    return visit(node)

def take(code,im):
    if im=='array': return code if len(code)<=4 else code[:3]+code[-1]
    if im=='dayi': return code if len(code)<=3 else code[:2]+code[-1]
    if im=='boshiamy': return code if len(code)<=4 else code[:3]+code[-1]
    return code if len(code)<=5 else code[:3]+code[-1]

def predict(ch, im, ids, roots, main):
    if ch in main: return main[ch], 'main-root'
    if ch not in ids:return None,'missing-ids'
    try:tree=parse_ids(ids[ch])
    except ValueError:return None,'unsupported-ids'
    if not isinstance(tree,str) and im=='cangjie':
        # Coarse first-child 字首 / remaining children 字身 hypothesis only.
        def flat(n):
            if isinstance(n,str):return flatten_component(n,ids,roots)
            p=[flat(c) for c in n[1]]
            return None if any(x is None for x in p) else ''.join(p)
        parts=[flat(n) for n in tree[1]]
        if any(x is None for x in parts):return None,'unknown-root'
        head=parts[0];body=''.join(parts[1:])
        head=head if len(head)<=2 else head[0]+head[-1]
        body=body if len(body)<=3 else body[:2]+body[-1]
        return head+body,'coarse-head-body'
    code=flatten_component(ch,ids,roots)
    return (take(code,im),'ordered-ids') if code is not None else (None,'unknown-root')

def run(im, table_path):
    ids=load_ids();roots,main=root_mapping(im);table=load_table(table_path)
    sample=(BASE/'data-raw/ids/probe-chars.txt').read_text().strip()
    details=[]
    for ch in sample:
        predicted,why=predict(ch,im,ids,roots,main)
        details.append({'char':ch,'ids':ids.get(ch),'predicted':predicted,'actual_codes':sorted(table.get(ch,[])),
                        'match':predicted is not None and predicted in table.get(ch,set()),'path':why})
    result={'im':im,'sample_size':len(sample),'table_covered':sum(bool(table.get(c)) for c in sample),
            'predicted':sum(x['predicted'] is not None for x in details),
            'exact_matches':sum(x['match'] for x in details),'details':details,
            'input_sha256':{str(Path(p).relative_to(BASE)):hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in [table_path,BASE/f'data-raw/roots/{im}.json',BASE/'data-raw/ids/ids.txt',BASE/'data-raw/ids/probe-chars.txt']},
            'limitations':'字根表精確 Unicode 子集；無筆畫幾何、連筆/包圍次序、簡碼、特別字首或容錯。表僅在預測完成後比對。'}
    (BASE/f'data-raw/ids/probe-{im}.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return {k:v for k,v in result.items() if k!='details'}

if __name__=='__main__':
    for im,table in [('cangjie','cangjie/cangjie3.txt'),('array','array/array30.cin'),('dayi','dayi/dayi3.cin'),('boshiamy','boshiamy/boshiamy.cin')]:
        if (BASE/f'data-raw/roots/{im}.json').exists():print(run(im,BASE/'data-raw'/table))

#!/usr/bin/env python3
"""離線檢查墨打文章：python3 data-raw/articles/check.py [--json 報告路徑]。只用標準函式庫。"""
import argparse,collections,hashlib,json,re,sys,unicodedata
from pathlib import Path
BASE=Path(__file__).resolve().parent
CATEGORIES={'古文','詩詞','近代散文','法規公文','原創'}
FIELDS={'id','title','author','era','category','excerpt','source','license','notes'}

def is_cjk(c):
 n=ord(c)
 return any(a<=n<=b for a,b in [(0x3400,0x4dbf),(0x4e00,0x9fff),(0xf900,0xfaff),(0x20000,0x2ee5f),(0x30000,0x3347f)])

def check(base):
 manifest=json.loads((base/'manifest.json').read_text(encoding='utf-8'))
 simplified=set(json.loads((BASE/'simplified-only.json').read_text(encoding='utf-8'))['characters'])
 results=[];errors=[];seen={};han_seen={};ids=set()
 for row in manifest:
  rid=row.get('id','');issues=[]
  if not FIELDS<=row.keys():issues.append('manifest 欄位缺漏')
  if not re.fullmatch('[a-z0-9]+(?:-[a-z0-9]+)*',rid):issues.append('id 格式錯誤')
  if rid in ids:issues.append('重複 id')
  ids.add(rid)
  if row.get('category') not in CATEGORIES:issues.append('分類錯誤')
  if type(row.get('excerpt')) is not bool:issues.append('excerpt 必須為布林值')
  if bool(row.get('excerpt')) != ('節選' in row.get('title','')):issues.append('節選標記不一致')
  if not re.match(r'https://',row.get('source','')):issues.append('來源須為 HTTPS URL')
  try:
   raw=(base/(rid+'.txt')).read_bytes();t=raw.decode('utf-8')
  except (OSError,UnicodeError) as e:
   errors.append(f'{rid}: {e}');continue
  chars=''.join(t.split());han=''.join(c for c in t if is_cjk(c))
  simplified_found=sorted(set(t)&simplified)
  half=sorted({c for c in t if 0x21<=ord(c)<=0x7e and (unicodedata.category(c).startswith('P') or unicodedata.category(c).startswith('S'))})
  nonbmp=sorted({c for c in t if ord(c)>0xffff})
  for label,items in [('疑似簡體專用字',simplified_found),('半形標點或符號',half),('非 BMP 字元',nonbmp)]:
   if items:issues.append(label+'：'+''.join(items))
  if any(c in t for c in ['\ufeff','\r','\t','\ufffd','\u200b']):issues.append('BOM、控制字元、替代字元或零寬空白')
  if not t.endswith('\n') or t.endswith('\n\n'):issues.append('檔尾須恰有一個換行')
  if '\n\n\n' in t or re.search(r'[^\n]\n[^\n]',t):issues.append('段落須以空白行分隔')
  if len(chars)>1500 or not chars:issues.append('篇幅超界或空文')
  if re.search(r'【評】|古文評註|一作|可以指：|版權|公有領域|本作品收錄|維基文庫|\[\d+\]|[〈＜].{0,20}[〉＞]',t):issues.append('可能殘留註解或網頁介面')
  for body,registry,label in [(chars,seen,'正文'),(han,han_seen,'純漢字正文')]:
   key=hashlib.sha256(body.encode()).hexdigest()
   if key in registry:issues.append(f'{label}與 {registry[key]} 重複')
   registry[key]=rid
  item={'id':rid,'title':row.get('title'),'char_count':len(chars),'cjk_count':len(han),'simplified_only':simplified_found,'half_width_punctuation':half,'non_bmp':nonbmp,'sha256':hashlib.sha256(raw).hexdigest(),'length_note':'短篇原文完整保留' if len(chars)<150 else '', 'errors':issues}
  results.append(item);errors.extend(f'{rid}: {issue}' for issue in issues)
 files={p.stem for p in base.glob('*.txt')}
 if files!=ids:errors.append(f'文章檔案與 manifest 不符：多出 {sorted(files-ids)}；缺少 {sorted(ids-files)}')
 if len(manifest)<50:errors.append('文章數量少於 50')
 return {'article_count':len(manifest),'categories':dict(collections.Counter(r.get('category') for r in manifest)),'articles':results,'errors':errors,'passed':not errors}

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--json',type=Path);parser.add_argument('--directory',type=Path,default=BASE);args=parser.parse_args()
 report=check(args.directory)
 for r in report['articles']:
  print(f"{r['id']}: 字元 {r['char_count']}；漢字 {r['cjk_count']}；簡體 {''.join(r['simplified_only']) or '無'}；半形標點 {''.join(r['half_width_punctuation']) or '無'}；非BMP {''.join(r['non_bmp']) or '無'}"+('；'+r['length_note'] if r['length_note'] else ''))
 print(json.dumps({k:v for k,v in report.items() if k!='articles'},ensure_ascii=False,indent=2))
 if args.json:args.json.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 return 0 if report['passed'] else 1
if __name__=='__main__':sys.exit(main())

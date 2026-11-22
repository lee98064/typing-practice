#!/usr/bin/env python3
"""依校對規則產生文章與來源紀錄。先執行 collect_articles.py，快取供此腳本使用。"""
import json,re,hashlib
from pathlib import Path
from urllib.parse import quote
from bs4 import BeautifulSoup
from opencc import OpenCC
from collect_articles import CATALOG,GROUPS,fetch,extract,ROOT
OUT=ROOT/'data-raw/articles';DOC=ROOT/'docs/research'
TW=OpenCC('t2tw')
EXCLUSIVE=json.loads((OUT/'simplified-only.json').read_text())['characters']
S2=OpenCC('s2tw')
# 保留原文的兼用字（余、岳、云、后等）；僅替換字典判定為簡體專用的字，再轉臺灣字形。
CHARMAP={c:S2.convert(c) for c in EXCLUSIVE}
VARIANTS=dict(zip('衞嵗隂脩靑吿囘旣卽葢隟僊甞荆颜㝢寳倶畧徧輭楡淸撑冩竝峯値麽羡絶縁竒鷄慙隣霑敎歳晩暎髣髴',
                      '衛歲陰修青告回既即蓋隙仙嘗荊顏宇寶俱略遍軟榆清撐寫並峰值麼羨絕緣奇雞慚鄰沾教歲晚映彷彿'))
VARIANTS.update({'愼':'慎','寃':'冤','鎭':'鎮','眞':'真','朶':'朵','袵':'衽','飜':'翻','妬':'妒','閑':'閒','茍':'苟','嘑':'呼','簑':'蓑','幷':'並','躱':'躲','鄕':'鄉','于':'於','祕':'祕','爲':'為','麤':'粗','襃':'褒','彊':'強','旛':'幡','筭':'算','鬭':'鬥','鬬':'鬥','汎':'泛','渌':'淥','沈':'沉','褭':'裊','泝':'溯'})
PUNCT=str.maketrans({',':'，','.':'。',';':'；',':':'：','?':'？','!':'！','(':'（',')':'）','[':'［',']':'］','“':'「','”':'」','‘':'『','’':'』','︰':'：','﹕':'：','﹔':'；','﹐':'，','﹑':'、','﹖':'？','﹗':'！','─':'—','－':'—','﹣':'—','―':'—'})

def normalize(text):
 text=re.sub(r'〈[^〈〉]*〉','',text)
 text=re.sub(r'\[[^\]]*\]','',text)
 text=''.join(CHARMAP.get(c,c) for c in text)
 text=TW.convert(text).translate(str.maketrans(VARIANTS)).translate(PUNCT)
 text=re.sub(r'([一二兩三四五六七八九十幾])只(?=[蒼鳥小])',r'\1隻',text)
 text=text.replace('豫備','預備')
 return text

def between(text,start,end,include=True):
 a=text.index(start);b=text.index(end,a)+len(end)
 return text[a:b]

def source(page):
 j=fetch(page)
 assert 'parse' in j,(page,j)
 p=j['parse'];html=p['text']['*']
 return extract(j),{'requested_page':page,'page':p['title'],'url':'https://zh.wikisource.org/wiki/'+quote(p['title'].replace(' ','_'),safe='/'),'revision':p['revid'],'revision_url':'https://zh.wikisource.org/w/index.php?oldid='+str(p['revid']),'parsed_html_sha256':hashlib.sha256(html.encode()).hexdigest()}

def select(row,ps):
 id=row['id'];excerpt=False;note='';title=row['page'].split('/')[-1]
 title=re.sub(r' \(.*?\)$','',title)
 if id=='tao-hua-yuan-ji':ps=ps[:1];note='僅取〈記〉正文；不含另附〈桃花源詩〉。'
 if id=='chi-bi-fu':ps=ps[:6];note='僅取首列通讀正文；不收書畫題跋及逐行異文。'
 if id=='liu-guo-lun':ps=ps[:6];note='僅取蘇洵正文，不含頁末《古文評註》評語。'
 if id=='wu-liu-xian-sheng':
  ps=[p.replace('極其言','揆其言').replace('簞瓢屢空—晏如也','簞瓢屢空，晏如也') for p in ps];note='校正來源「極其言」為通行本「揆其言」，並統一標點。'
 if id=='ai-lian-shuo':ps=ps[:2];note='不收頁末後人評語。'
 if id=='lan-ting-ji-xu':ps=ps[:1];note='取首列正文；不重複收異文版本。'
 if id=='teng-wang-ge-xu':ps=ps[:8];note='取首列正文及文末原詩；不重複收異文版本。'
 if id=='li-yun-da-tong':
  t=''.join(ps);ps=[between(t,'大道之行也，天下爲公','是謂大同。')];title='禮運大同篇';excerpt=True;note='取《禮記·禮運》「大道之行也」至「是謂大同」。古代編纂作品，無現代譯文。'
 if id=='quan-xue':
  clean=[re.sub(r'〈[^〈〉]*〉','',p) for p in ps]
  ps=[between(clean[0],'君子曰：學不可以已。','善假於物也。'),between(clean[1],'積土成山','用心躁也。')];title='勸學';excerpt=True;note='兩段節選：「君子曰」至「善假於物也」及「積土成山」至「用心躁也」；刪去雙行夾注。'
 if id=='lun-yu-xue-er':
  ps=[p for p in ps if not re.fullmatch('[一二三四五六七八九十]+之[一二三四五六七八九十]+',p)];title='論語選：學而';note='取〈學而第一〉原文，刪除章次與校注。'
 if id=='yu-wo-suo-yu':
  a=next(i for i,p in enumerate(ps) if p.startswith('孟子曰：「魚'))
  ps=ps[a:a+2];title='孟子選：魚我所欲也';excerpt=True;note='取《告子上》第十章，從「孟子曰：魚」至「失其本心」。'
 if id=='zou-ji-feng-qi-wang':ps=ps[:4];note='刪去頁末現代詞語註釋。'
 if id=='lian-po-lin-xiang-ru':ps=ps[7:8];title='廉頗藺相如列傳';excerpt=True;note='取「既罷歸國」至「為刎頸之交」，即將相和一段。'
 if id=='hong-men-yan':
  text=''.join(ps);ps=[between(text,'於是張良至軍門','立誅殺曹無傷。')];title='鴻門宴';excerpt=True;note='取《史記·項羽本紀》樊噲入帳、沛公脫身一段；自「於是張良至軍門」至「立誅殺曹無傷」。'
 if id=='gui-qu-lai-xi':title='歸去來兮辭並序'
 if id=='lv':
  ps=ps[5:9];ps=[p.replace('花換換換','花花花花').replace('水花。晶瑩','水花，晶瑩').replace('白梅。微雨','白梅，微雨').replace('仿佛一只','彷彿一隻').replace('她松松的','她鬆鬆的') for p in ps];title='綠';note='取《溫州的蹤跡》第二篇〈綠〉全文，刪除日期；依香港教育局原文校正「花換換換」及兩處誤斷句。校對來源：https://cd.edb.gov.hk/chi/resource/ncs/download/js_list/JS_lu.pdf'
 if id=='zai-bie-kang-qiao':
  ps=ps[:4];ps[0]=re.sub(r'^再別康橋','',ps[0]);title='再別康橋';note='刪除重複題名與寫作日期；依原詩分節。'
 if id=='shao-nian-zhong-guo':
  # 文章結尾完整段落，避免截斷演講論證。
  ps=ps[9:10];excerpt=True;note='取文末「任公曰：造成今日之老大中國者」至「與國無疆」，不含作者附識。'
 if id in ['xiang-fei','gu-xiang','bai-cao-yuan','kong-yi-ji','she-xi','a-chang']:
  if id=='she-xi':ps=ps[10:]
  chosen=[]
  for p in ps:
   if sum(map(len,chosen))+len(p)>1400:break
   chosen.append(p)
  ps=chosen;excerpt=True;note='取篇首連續完整段落，至篇幅上限前的段落末。'
  if id=='bai-cao-yuan':title='從百草園到三味書屋'
  if id=='she-xi':note='取童年平橋村段落，自「至於我看那好戲的時候」起，止於出發看戲之前；省略原作北京看戲部分。'
 if id=='yu-qi-shu':title='與妻訣別書'
 if id=='feng-zheng':
  title='風箏';ps=[p for p in ps if not re.fullmatch(r'[一二三四五六七八九十〇零○]+年[一二三四五六七八九十]+月[一二三四五六七八九十]+日[。．]?',p)]
 if id=='chun':title='春'
 if row['category']=='近代散文':
  ps=[p for p in ps if not re.fullmatch(r'（?[一二三四五六七八九十〇零○0-9]+年.*?[月日].*?[。．]?）?',p)]
 ps=[normalize(p) for p in ps if p]
 # 校正來源中的字形及標點；不改寫原文語彙。
 if id=='cao-gui-lun-zhan':ps=[p.replace('何以戰。','何以戰？') for p in ps]
 if id=='chi-bi-fu':ps=[p.replace('更乎酌','更酌') for p in ps]
 if id=='zai-bie-kang-qiao':
  text=''.join(ps);ps=[]
  for end in ['作別西天的雲彩。','在我的心頭蕩漾。','我甘心做一條水草！','沉澱著彩虹似的夢。','在星輝斑斕裡放歌。','沉默是今晚的康橋！','不帶走一片雲彩。']:
   k=text.index(end)+len(end);ps.append(text[:k]);text=text[k:]
  assert not text,text
 if excerpt:title+='（節選）'
 return title,ps,excerpt,note

MANIFEST=[];PROVENANCE=[]
for row in CATALOG:
 ps,src=source(row['page'])
 try:title,ps,excerpt,note=select(row,ps)
 except Exception as e:
  print('NEEDS REVIEW',row['id'],repr(e));continue
 text='\n\n'.join(ps)+'\n'
 if '可以指' in text or len(''.join(text.split()))<80:print('NEEDS REVIEW',row['id'],text[:150]);continue
 (OUT/(row['id']+'.txt')).write_text(text,encoding='utf-8')
 death=row['death'];lic=f'Public Domain（古代原文；作者／編者卒於{death}年）' if death!='古代' else 'Public Domain（古代原文；成書已逾千年，無現代翻譯）'
 if row['author']=='胡適':note+='臺灣公版；作者卒於1962年，採終身加70年的地區仍可能受保護。'
 if row['id']=='chun':note+='1933年作品；臺灣公版，未宣稱美國公版。'
 MANIFEST.append({k:row[k] for k in ['id','author','era','category']}|dict(title=title,excerpt=excerpt,source=src['url'],license=lic,notes=note))
 PROVENANCE.append(dict(id=row['id'],sources=[src],selection_note=note,start=ps[0][:35],end=ps[-1][-35:],normalization='僅簡體專用字對應＋OpenCC t2tw＋校對異體字與全形標點；不改寫原文'))
for row in GROUPS:
 parts=[];sources=[];poems=[]
 for page in row['pages']:
  ps,src=source(page)
  if page=='水調歌頭 (明月幾時有)':ps=ps[1:2]
  if page=='念奴嬌 (蘇軾)':ps=ps[:1]
  if page=='芙蓉樓送辛漸':ps=ps[:1]
  if page=='天淨沙 (白樸)':ps=ps[:4]
  if page=='山坡羊 (張養浩)':ps=ps[:1]
  if any('可以指' in p for p in ps):raise ValueError((page,ps))
  sources.append(src);parts.extend(normalize(p) for p in ps);poems.append(page)
 text='\n\n'.join(parts)+'\n'
 assert 150<=len(''.join(text.split()))<=400,(row['id'],len(text))
 (OUT/(row['id']+'.txt')).write_text(text)
 note='完整短篇合選：'+'、'.join(poems)+'。各篇之間以空白行分隔；篇名與作者對應見研究文件。'
 MANIFEST.append({k:row[k] for k in ['id','title','author','era','category']}|dict(excerpt=False,source=sources[0]['url'],license='Public Domain（古代原文；各作者卒年：'+row['death']+'年）',notes=note+' 其餘來源：'+'；'.join(s['url'] for s in sources[1:])))
 PROVENANCE.append(dict(id=row['id'],sources=sources,selection_note=note,start=parts[0][:35],end=parts[-1][-35:]))

# 中華民國憲法：僅前言與第一章六條。
roc_html=Path('/private/tmp/moda-research/roc.html').read_text()
roc=BeautifulSoup(roc_html,'html.parser')
ps=[re.sub(r'\s+','',e.get_text()) for e in roc.select('.law-article')[:7]]
assert len(ps)==7 and '國旗' in ps[-1]
row=dict(id='roc-constitution',title='中華民國憲法前言及第一章（節選）',author='制憲國民大會',era='民國',category='法規公文',excerpt=True,source='https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=A0000001',license='著作權法第9條第1項第1款（憲法不得為著作權之標的）',notes='取前言及第1條至第6條，省略條號；為憲法原典節選，非增修條文。')
(OUT/(row['id']+'.txt')).write_text('\n\n'.join(ps)+'\n');MANIFEST.append(row)
PROVENANCE.append(dict(id=row['id'],sources=[dict(url=row['source'],retrieved='2026-11-22',html_sha256=hashlib.sha256(roc_html.encode()).hexdigest())],selection_note=row['notes'],start=ps[0][:35],end=ps[-1][-35:]))

# 聯合國官方中文網頁第一至第十條；原頁為簡體，使用 s2tw，保留官方措辭。
un_html=Path('/private/tmp/moda-research/un.html').read_text();un=BeautifulSoup(un_html,'html.parser').select_one('.article-body')
ps=[];active=False
for e in un.children:
 if getattr(e,'name',None)=='h2':
  heading=e.get_text(strip=True)
  if heading=='第一条':active=True
  elif heading=='第十一条':break
 elif active and getattr(e,'name',None)=='p':ps.append(normalize(S2.convert(re.sub(r'\s+','',e.get_text()))))
assert len(ps)==10
row=dict(id='udhr',title='世界人權宣言第一至第十條（節選）',author='聯合國大會',era='現代',category='法規公文',excerpt=True,source='https://www.un.org/zh/about-us/universal-declaration-of-human-rights',license='聯合國網站節錄重用許可（須註明來源及取用日期；非CC0）',notes='© 聯合國；取用日期2026-11-22。依聯合國版權政策手冊第5.33(b)段重用官方中文網頁節錄。以OpenCC s2tw轉為繁體並調整標點，非另採他人譯本；非聯合國官方繁體版本。未使用徽章、插圖或前言。授權政策：https://uncitral.un.org/sites/default/files/media-documents/uncitral/en/policy_manual_rev_sept_2020.pdf')
(OUT/(row['id']+'.txt')).write_text('\n\n'.join(ps)+'\n');MANIFEST.append(row)
PROVENANCE.append(dict(id=row['id'],sources=[dict(url=row['source'],retrieved='2026-11-22',html_sha256=hashlib.sha256(un_html.encode()).hexdigest())],selection_note=row['notes'],start=ps[0][:35],end=ps[-1][-35:]))

(OUT/'manifest.json').write_text(json.dumps(MANIFEST,ensure_ascii=False,indent=2)+'\n')
(DOC/'provenance.json').write_text(json.dumps(PROVENANCE,ensure_ascii=False,indent=2)+'\n')
print('exported',len(MANIFEST))

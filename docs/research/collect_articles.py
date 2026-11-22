#!/usr/bin/env python3
"""收集維基文庫原文；依序請求，間隔一秒。需 requests、beautifulsoup4、opencc-python-reimplemented。"""
import json,re,time,hashlib
from pathlib import Path
from urllib.parse import quote
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
CACHE=Path('/private/tmp/moda-research/wiki');CACHE.mkdir(parents=True,exist_ok=True)
SESSION=requests.Session();SESSION.headers['User-Agent']='MoDaArticleResearch/1.0 (non-commercial public-domain text research; sequential 1 request/sec)'
ROWS='''chu-shi-biao|前出師表|諸葛亮|234|三國
 tao-hua-yuan-ji|桃花源記|陶淵明|427|東晉
 yue-yang-lou-ji|岳陽樓記|范仲淹|1052|北宋
 zui-weng-ting-ji|醉翁亭記|歐陽修|1072|北宋
 chi-bi-fu|前赤壁賦|蘇軾|1101|北宋
 lou-shi-ming|陋室銘|劉禹錫|842|唐
 ai-lian-shuo|愛蓮說|周敦頤|1073|北宋
 shi-shuo|師說|韓愈|824|唐
 lan-ting-ji-xu|蘭亭集序|王羲之|361|東晉
 teng-wang-ge-xu|滕王閣序|王勃|676|唐
 li-yun-da-tong|禮記/禮運|佚名（傳戴聖編）|古代|先秦至漢
 song-dong-yang|送東陽馬生序|宋濂|1381|明
 wu-liu-xian-sheng|五柳先生傳|陶淵明|427|東晉
 ma-shuo|馬說|韓愈|824|唐
 quan-xue|荀子/勸學篇|荀子|古代|戰國
 lun-yu-xue-er|論語/學而第一|孔子弟子及再傳弟子|古代|春秋至戰國
 yu-wo-suo-yu|孟子/告子上|孟子及其弟子|古代|戰國
 cao-gui-lun-zhan|曹劌論戰|左丘明（傳）|古代|春秋
 zou-ji-feng-qi-wang|鄒忌諷齊王納諫|劉向（編）|前6|西漢
 chen-qing-biao|陳情表 (西晉)|李密|287|西晉
 liu-guo-lun|六國論 (蘇洵)|蘇洵|1066|北宋
 shi-de-xi-shan|始得西山宴遊記|柳宗元|819|唐
 xiang-ji-xuan-zhi|項脊軒志|歸有光|1571|明
 xiao-shi-tan-ji|至小丘西小石潭記|柳宗元|819|唐
 bu-she-zhe-shuo|捕蛇者說|柳宗元|819|唐
 a-fang-gong-fu|阿房宮賦|杜牧|852|唐
 da-si-ma-jian-yi|答司馬諫議書|王安石|1086|北宋
 you-bao-chan-shan|遊褒禪山記|王安石|1086|北宋
 lian-po-lin-xiang-ru|史記/卷081|司馬遷|約前90|西漢
 hong-men-yan|史記/卷007|司馬遷|約前90|西漢
 zhu-zhi-wu|燭之武退秦師|左丘明（傳）|古代|春秋
 ji-shi-er-lang|祭十二郎文|韓愈|824|唐
 huang-zhou-kuai-zai|黃州快哉亭記|蘇轍|1112|北宋
 yu-zhu-yuan-si|與朱元思書|吳均|520|南朝梁
 gui-qu-lai-xi|歸去來辭並序|陶淵明|427|東晉
 mu-lan-shi|木蘭詩|佚名|古代|北朝
 chang-hen-ge|長恨歌|白居易|846|唐
 pi-pa-xing|琵琶行|白居易|846|唐
 bei-ying|背影|朱自清|1948|民國
 cong-cong|匆匆|朱自清|1948|民國
 he-tang-yue-se|荷塘月色|朱自清|1948|民國
 lv|溫州的蹤跡|朱自清|1948|民國
 kong-yi-ji|孔乙己|魯迅|1936|民國
 she-xi|社戲|魯迅|1936|民國
 shao-nian-zhong-guo|少年中國說|梁啟超|1929|清末
 zui-ku-yu-zui-le|最苦與最樂|梁啟超|1929|民國
 a-chang|阿長與山海經|魯迅|1936|民國
 luo-hua-sheng|落花生|許地山|1941|民國
 zai-bie-kang-qiao|再別康橋|徐志摩|1931|民國
 xiang-fei|想飛|徐志摩|1931|民國
 yu-qi-shu|與妻訣別書|林覺民|1911|清末
 gu-xiang|故鄉|魯迅|1936|民國
 feng-zheng|風箏|魯迅|1936|民國
 bai-cao-yuan|從百草園到三味書屋|魯迅|1936|民國'''
CATALOG=[]
for i,line in enumerate(ROWS.splitlines()):
 id,page,author,death,era=line.strip().split('|')
 category='古文' if i<35 else '詩詞' if i<38 or id=='zai-bie-kang-qiao' else '近代散文'
 CATALOG.append(dict(id=id,page=page,author=author,death=death,era=era,category=category))
GROUPS=[
 dict(id='tang-shi-shan-shui',title='唐詩選：山水田園',author='王維、孟浩然、柳宗元',death='761、740、819',era='唐',category='詩詞',pages=['山居秋暝','鹿柴 (王維)','竹里館 (王維)','鳥鳴澗','宿建德江','春曉 (孟浩然)','江雪']),
 dict(id='tang-shi-song-bie',title='唐詩選：送別與懷人',author='王勃、王維、李白、王昌齡',death='676、761、762、約756',era='唐',category='詩詞',pages=['送杜少府之任蜀州','送元二使安西','黃鶴樓送孟浩然之廣陵','贈汪倫','芙蓉樓送辛漸','九月九日憶山東兄弟']),
 dict(id='song-ci-xuan',title='宋詞選：江月與春景',author='蘇軾、辛棄疾、李清照',death='1101、1207、約1155',era='宋',category='詩詞',pages=['水調歌頭 (明月幾時有)','念奴嬌 (蘇軾)','青玉案 (辛棄疾)','如夢令 (李清照)/如夢令 (常記溪亭日暮)']),
 dict(id='yuan-qu-xuan',title='元曲選：秋思與懷古',author='馬致遠、張養浩、白樸',death='約1321、1329、約1306',era='元',category='詩詞',pages=['天淨沙·秋思','山坡羊 (張養浩)','天淨沙 (白樸)'])]

def fetch(page):
 file=CACHE/(quote(page,safe='')+'.json')
 if not file.exists():
  time.sleep(6.2)
  r=SESSION.get('https://zh.wikisource.org/w/api.php',params=dict(action='parse',page=page,prop='text|revid|categories',variant='zh-tw',format='json',redirects=1,maxlag=5),timeout=60)
  for retry in range(4):
   if r.status_code not in (429,503): break
   time.sleep(max(int(r.headers.get('Retry-After','0')),30*(retry+1)))
   r=SESSION.get(r.url,timeout=60)
  r.raise_for_status();j=r.json();file.write_text(json.dumps(j,ensure_ascii=False),encoding='utf-8')
 return json.loads(file.read_text())

def extract(j):
 if 'parse' not in j:return []
 soup=BeautifulSoup(j['parse']['text']['*'],'html.parser');root=soup.select_one('.mw-parser-output')
 for e in root.select('#headerContainer,.licenseContainer,.licenseBanner,.noprint,.mw-editsection,.reference,.references,.reflist,.variant-tooltip,style,script,table,.ws-noexport,.acContainer,.catlinks,.printfooter,.ambox,.navbox,.toc,.sisitem'):
  e.decompose()
 ps=[]
 for e in root.select('p,dd'):
  if e.name=='dd' and e.select('p,dd'):continue
  if e.find_parent(['li']):continue
  t=e.get_text('',strip=False)
  t=re.sub(r'[\s\u200b\ufeff]+','',t)
  if t and not t.startswith(('本作品','此作品','此文','本頁','維基百科','姊妹計劃','姊妹计划','這個作品')):ps.append(t)
 return ps

if __name__=='__main__':
 for row in CATALOG+GROUPS:
  for page in row.get('pages',[row.get('page')]):
   j=fetch(page);ps=extract(j)
   print(row['id'],page,'ERROR '+str(j.get('error')) if 'parse' not in j else f"r{j['parse']['revid']} {sum(map(len,ps))}字 {len(ps)}段",' | '.join(ps)[:100],flush=True)
 (ROOT/'docs/research/catalog.json').write_text(json.dumps(CATALOG+GROUPS,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

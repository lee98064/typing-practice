"""Audit of all 40 Dayi official chart columns. No font/image copied into draft."""
import json,pathlib,xml.etree.ElementTree as ET
import urllib.request,urllib.parse,subprocess
cache=pathlib.Path("data-raw/cache/array-dayi");cache.mkdir(parents=True,exist_ok=True)
if not (cache/"dayi-chart.html").exists():
 url="https://www.dayi.com/assets/"+urllib.parse.quote("大易輸入法初學資料與範例.pdf")
 (cache/"dayi-tutorial.pdf").write_bytes(urllib.request.urlopen(url,timeout=30).read())
 subprocess.run(["pdftotext","-f","2","-l","2","-bbox",str(cache/"dayi-tutorial.pdf"),str(cache/"dayi-chart.html")],check=True)
root=ET.parse('data-raw/cache/array-dayi/dayi-chart.html')
words=[(float(w.attrib['xMin']),float(w.attrib['yMin']),w.text) for w in root.findall('.//{http://www.w3.org/1999/xhtml}word') if w.text]
obj=json.loads(pathlib.Path('data-raw/roots/dayi.json').read_text());by={k['key']:k for k in obj['keys']}
# Ordered exact column roots, read on source page, with closest glyph per row including nonencoded shapes.
# Duplicates intentional: two original root shapes may map to the same closest encodable glyph.
near={
'0':'金 𠆢 乂 辶 廴 ㇏', 'i':'木 朩', 'x':'水 氵 三 氺 永 又 乂 又 攵 夂 攴', 'y':'火 灬 㣺 灬','f':'土 士 十 圭 丰 艹',
'a':'人 亻 𠆢 入 𠔉 𠆢','z':'心 忄 㣺','o':'口','1':'言 丨 丿','p':'耳 身 長 匚 上 其 乍 阝 卩','3':'目 且 直 上 止 非 片','g':'手 扌 十 亅','9':'足 ⻊ 止 ⻊ 疋 卜 丅','l':'女 𠃋 く 巛 凵',
'2':'牛 牜 𠂉 生 丑 丰','b':'馬 ㇆ ㇆ ㇆ 羽 乛 ㇆','c':'鹿 广 虍 丬 匕 七 乚 乙 ㇈ ㇉ 气',',':'犭 豕 犭 勹 力',';':'虫 禸 屮 凵 艮 民','n':'魚 角 𠂊 夕 夕 彑 刀 刂','h':'鳥 ㇀ 厂 厂 户 戶 户 尸 户 戶 ㇇',
'd':'日 曰 由 田','j':'月 冃 冂 夕 冫 冫 亅 乚','w':'山 屮 屮 凵 凹 臼 𦥑 𦥑','q':'石 几 儿 儿 兀 几 儿 𠘨','m':'雨 冎 宀 冖 冂 冂',
'7':'田 囗 囗','v':'禾 丿 大 夫 夭','8':'米 丷 八 𠔉 鬲 酉','/':'竹 丿 彡 彡 鬼','u':'艸 艹 卄 廾 井 並 业',
'r':'工 𢀖 匚 彐 亅 匚 巨 匚 匸 匚 ㇄','6':'車 甫 門 鬥 鼎 冂 丱 片 爿','.' :'舟 方 亠 冫 氵 丶','t':'糸 幺 乡 小 氺 氺 少','s':'革 甘 共 其 曲 世 十 才','k':'立 之 亠 衣 衣 く 衤 衤','e':'一 ㇀ 彳','4':'四 罒 罒 罒 罒 黑 黒 西','5':'王 壬 乚 ㇙ 乂 戈 氏'}
columns=[]
for row,ystart,yend in [(0,150,350),(1,440,640)]:
 headers=[(x,s) for x,y,s in words if (120<y<135 if row==0 else 410<y<425)]
 for x,s in headers:
  key={'０':'0','１':'1','２':'2','３':'3','４':'4','５':'5','６':'6','７':'7','８':'8','９':'9','，':',','／':'/','；':';','‧':'.'}.get(s,s.lower().translate(str.maketrans('ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ','abcdefghijklmnopqrstuvwxyz')))
  vals=sorted([(y,t) for xx,y,t in words if abs(xx-x)<3 and ystart<y<yend])
  glyphs=near[key].split()
  # Preserve every source slot even if closest glyph list requires later specialist review.
  variants=[]
  for i,(y,t) in enumerate(vals):
   glyph=t if not (0xE000<=ord(t[0])<=0xF8FF) else (glyphs[i] if i<len(glyphs) else by[key]['label'])
   variants.append({'id':f'{key}:{i+1}','glyph':glyph,'source_glyph':f'U+{ord(t):04X}','source_page':2,'source_row':i+1,'note':('原圖可編碼字形。' if glyph==t else '原圖為專用字形；以近似Unicode形表示，筆畫方向、缺筆或局部範圍須依官方圖核對，不可直接作整字根匹配。')})
  by[key]['root_variants']=variants
  by[key]['roots']=list(dict.fromkeys(v['glyph'] for v in variants))
  by[key]['completeness']=f'官方圖本鍵{len(variants)}個圖形槽均已列出；近似字形仍須幾何校對。'
  columns.append((key,len(variants),len(glyphs)))
obj['chart_slot_count']=sum(len(k['root_variants']) for k in obj['keys']);obj['chart_transcription_note']='逐欄保留官方PDF每個字形槽，source_glyph是原PDF字形識別，並非Unicode私用碼的跨字型語義。glyph為可編碼近似；無損幾何轉錄尚未完成。'
pathlib.Path('data-raw/roots/dayi.json').write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n')
print('slots',obj['chart_slot_count'],columns)

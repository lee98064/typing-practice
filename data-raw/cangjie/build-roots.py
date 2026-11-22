"""Research-only build: encodable representatives of every v3 chart shape class.
The source chart's SVG variants are indexed individually; Unicode proxies are
explicitly not suitable for pixel-exact matching. The precise probe subset is
separately curated, so proxies never become spurious forward root matches.
"""
from pathlib import Path
import re,json
base=Path(__file__).resolve().parents[2]
s=(base/'data-raw/cangjie/root-chart-source.wiki').read_text()
s=s[s.index('{| class=wikitable'):s.index('=== 練習')]
representatives={
'a':['日曰','日'], 'b':['月⺼⺝','冂⺆','冖','冂','月','爫'],
'c':['金釒','丷','八','儿'], 'd':['木朩','才','也'],
'e':['水','又','氵','氺'], 'f':['火','灬','小⺌','⺍','小'],
'g':['土','士'], 'h':['竹⺮','丿','⺁'], 'i':['戈','丶','广','厶'],
'j':['十','宀'], 'k':['大','𠂇','乂㐅','疒'], 'l':['中','丨','肀','衤'],
'm':['一','㇀','厂','𠂇','工'], 'n':['弓','亅','乛㇆','⺈','乙几'],
'o':['人入𠆢','𠂉','亻','㇏','㇏'], 'p':['心','忄','⺗','匕','乇','弋','勹'],
'q':['手','扌','丰','夫','㐄'], 'r':['口'], 's':['尸','彐','𠃌','匚','耳'],
't':['廿','廾','卄艹卌','卝','业','䒑丱'], 'u':['山','凵','乚','屮'],
'v':['女','巛幺','𠃊','𠄌','𠄌','𠄌'], 'w':['田','囗罒','毌'],
'y':['卜','亠','⺀','辶辵']}
labels=dict(zip('abcdefghijklmnopqrstuvwxy','日月金木水火土竹戈十大中一弓人心手口尸廿山女田難卜'))
cat=lambda k:'哲理類' if k<='g' else '筆畫類' if k<='n' else '人體類' if k<='r' else '字形類'
reasons={'a':'日月及五行依序排在 A 到 G；A 是日。','b':'哲理類第二位是月，對應 B。','c':'日月之後接金木水火土，金在 C。','d':'五行順序中的木在 D。','e':'五行順序中的水在 E。','f':'五行順序中的火在 F。','g':'五行順序中的土在 G。','h':'筆畫類從 H 開始；竹含斜撇，向丿形聯想。','i':'戈頂端有點，以點形聯想 I。','j':'十的橫豎相交，記住交形與 J。','k':'大有交叉撇捺，記住叉形與 K。','l':'中字的直豎貫穿上下，以縱形記 L。','m':'一是水平橫畫，以橫形記 M。','n':'弓有鉤折，筆畫類最後一位 N。','o':'人體類依人心手口順序安排；人為 O。','p':'人體類第二位的心在 P。','q':'人體類第三位的手在 Q。','r':'人體類第四位的口在 R。','s':'字形類由 S 開始；尸的側向框形可聯想到彐、匚。','t':'廿的兩豎並列，並形記 T。','u':'山向上仰開，仰形記 U。','v':'女的交紐形，引申幺、巛等曲折形，記 V。','w':'田及其方框，方形記 W。','y':'卜及旋轉、延伸的點橫形在 Y；X 留給難字。'}
keys={k:{'key':k,'label':labels[k],'roots':[],'category':cat(k),'mnemonic':reasons[k], 'note':'roots 包含所有下列字形類別的 Unicode 代表；若為近似，須連同 shape_classes 的 note 顯示，不可當成相同字元的無條件取碼。','shape_classes':[]} for k in representatives}
class_index={k:0 for k in representatives}
for block in re.split(r'\n\|-\n',s):
 line=next((l for l in block.splitlines() if l.startswith('| [[Image:cjr')),None)
 if not line or 'cjr5m-' in line:continue
 ids=re.findall(r'Image:([^|]+)',line);k=re.search(r'-([a-z])',ids[0])[1];idx=class_index[k];class_index[k]+=1
 glyphs=representatives[k][idx];examples=re.findall(r'30px\|([^\]]+)',block)
 examples=[x.replace('-{','').replace('}-','') for x in examples]
 obj={'representatives':list(glyphs),'source_shape_ids':ids,'example_characters':examples,'note':'Unicode 代表形；同列 SVG 的筆勢、旋轉或連接差異未必有獨立碼位。此類在 '+','.join(examples[:3])+' 中的局部位置才是判斷依據；不能把完整例字視為一碼字根。'}
 if k=='b' and idx==3:obj['note']+=' 此為冎上方重疊框的近似字形，並非完整冂；三代支援解釋在來源註解中有討論，個別實作可能異碼。'
 keys[k]['shape_classes'].append(obj)
 for glyph in glyphs:
  if glyph not in keys[k]['roots']:keys[k]['roots'].append(glyph)
assert class_index=={k:len(v) for k,v in representatives.items()},class_index
keys['x']={'key':'x','label':'難','roots':[],'category':'功能鍵','mnemonic':'X 代表取碼規則指定的難字部分；需記例外，並非把所有不會拆的部分改按 X。','note':'例如身 hxh、齊 yx；Z 的萬用字元／標點前綴屬實作行為。'}
keys['z']={'key':'z','label':'重','roots':[],'category':'功能鍵','mnemonic':'傳統鍵名為重；本表 Z 開頭主要用於標點，macOS 另以 Z 表示未知碼。','note':'不能把標點或萬用字元用途當成普遍字根。'}
examples=[{'char':'明','code':'ab','explain':'左右分割；日是字首，月是字身，各一碼，組成日月。'},{'char':'林','code':'dd','explain':'左右兩個木形，字首、字身各取木。'},{'char':'休','code':'od','explain':'左邊亻是人的輔助字形，右邊木；取人木。'},{'char':'好','code':'vnd','explain':'左邊女取 V；右邊子拆弓木，作字身保留兩碼，組成女弓木。'},{'char':'學','code':'hbnd','explain':'上部作字首，超過兩根時只留首根竹、尾根月；下部子作字身，取弓木。不可把 IDS 的臼、爻、冖逐項串成最後碼。'},{'char':'身','code':'hxh','explain':'屬規定的難字；取竹難竹，X 為難字部分。'}]
roots={'im':'cangjie','version':'3','status':'research-draft-unicode-proxies','sources':['https://zh.wikibooks.org/wiki/倉頡輸入法/輔助字形','https://www.hkcards.com/b1/cj-table','https://raw.githubusercontent.com/definite/ibus-table-chinese/master/tables/cangjie/cangjie3.txt'],'coverage':{'main_roots':24,'v3_shape_classes':sum(class_index.values()),'source_svg_variants':sum(len(c['source_shape_ids']) for x in keys.values() for c in x.get('shape_classes',[])),'excluded_v5_only':['cjr5m-e1.svg','cjr5m-s1.svg'],'note':'逐列保留三代形類與所有來源變體識別碼；Unicode 代表是草稿，不聲稱每個字形都能以單一 Unicode 精確顯示。'},'keys':[keys[k] for k in sorted(keys)],'groups':[{'name':'哲理類','keys':list('abcdefg'),'note':'日月金木水火土'},{'name':'筆畫類','keys':list('hijklmn'),'note':'竹戈十大中一弓；斜、點、交、叉、縱、橫、鉤'},{'name':'人體類','keys':list('opqr'),'note':'人心手口'},{'name':'字形類','keys':list('stuvwy'),'note':'尸廿山女田卜；側、並、仰、紐、方及卜形'}],'rules':[{'title':'字首與字身','body':'由上到下、由左到右、由外到內，先判定可否分割；分體字字首最多二碼取首尾，字身最多三碼取首次尾；總長最多五碼。連體字最多四碼，超長取首次三尾。包含、省略、複合字、特別字首及難字另行判定。輔助字形獨立成字時通常要再拆，不能沿用偏旁的一碼。','examples':examples}], 'probe_exact_components':dict(zip('日曰月金木水火土竹戈十大中一弓人心手口尸廿山女田卜','aabcdefghijklm nopqrstuvwy'.replace(' ','')))}
# Probe mapping is intentionally restricted to well-encoded unambiguous components.
roots['probe_exact_components']={**{labels[k]:k for k in 'abcdefghijklmnopqrstuvwy'},'曰':'a','亻':'o','入':'o','𠆢':'o','氵':'e','又':'e','灬':'f','忄':'p','扌':'q','宀':'j','冖':'b','冂':'b','爫':'b','丿':'h','丶':'i','厶':'i','广':'i','𠂇':'k','乂':'k','疒':'k','丨':'l','厂':'m','亅':'n','⺈':'n','匕':'p','勹':'p','彐':'s','匚':'s','廾':'t','艹':'t','屮':'u','凵':'u','幺':'v','巛':'v','囗':'w','罒':'w','亠':'y'}
(base/'data-raw/roots/cangjie.json').write_text(json.dumps(roots,ensure_ascii=False,indent=2)+'\n')
print(roots['coverage'])

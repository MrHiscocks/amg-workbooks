"""Scan assets, validate files, generate previews and a JSON catalogue. Never edit originals."""
import argparse, collections, hashlib, json, os, re, shutil, sys, unicodedata, wave
from pathlib import Path
from urllib.parse import quote
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
CATEGORIES={'players':'Players','enemies':'Enemies','ground':'Ground & platforms','hazards':'Hazards','collectables':'Collectables','endpoints':'Keys & exits','powerups':'Power-ups','projectiles':'Projectiles','decorations':'Decorations','backgrounds':'Backgrounds','interface':'Interface','audio':'Audio'}
THEMES={
 'Nature & wildlife':'nature woodland wildlife forest animal bee butterfly conservation habitat garden flower plant seed',
 'History & heritage':'castle medieval knight historical heritage museum roman viking mine mining bard',
 'Welsh culture':'welsh wales cymru dragon daffodil leek eisteddfod harp',
 'Fantasy & magic':'fantasy magic enchanted wizard potion crystal portal dragon ghost fairy',
 'Science & technology':'science robot digital online cyber computer circuit laboratory engineering technology battery',
 'Space & science fiction':'space alien lunar cosmic rocket astronaut satellite',
 'Food & healthy living':'food healthy eating fruit vegetable kitchen water bottle meal nutrition',
 'Sport & activity':'sport swimming pool exercise cycling bicycle football running activity helmet',
 'Community & wellbeing':'community wellbeing friendship donation charity repair volunteering calm music art library',
 'Environment & sustainability':'environment climate recycling reuse waste litter energy water conservation sustainable',
 'Adventure & travel':'adventure travel tourism ticket compass map explorer expedition trail transport',
}
ENVIRONMENTS={
 'Woodland & gardens':'woodland forest garden allotment tree moss grove', 'Mountains & alpine':'mountain alpine summit highland granite peak',
 'Desert & arid':'desert arid dune sandstone cactus', 'Volcano & lava':'volcano volcanic lava magma basalt caldera',
 'Polar & tundra':'polar tundra snow frozen ice glacier arctic aurora', 'Tropical & rainforest':'tropical rainforest jungle mangrove',
 'Savanna & grassland':'savanna grassland prairie steppe acacia', 'Coast & ocean':'coast ocean sea underwater reef beach harbour coral',
 'Rivers & wetlands':'river freshwater wetland marsh reed lake pond', 'Town & community':'town city community urban neighbourhood street library school',
 'Castle & ruins':'castle dungeon ruin medieval fort tower', 'Industrial & digital':'industrial factory machine digital cyber laboratory server',
 'Space':'space alien lunar planet cosmic', 'Indoors':'interior hall room kitchen workshop museum theatre indoor',
}

def label(name):
 s=re.sub(r'_strip\d+$','',Path(name).stem)
 s=re.sub(r'^(snd|s(?=[A-Z]))','',s)
 s=re.sub(r'Batch\d+$','',s)
 s=re.sub(r'(Move|Static|Idle)$','',s)
 s=re.sub(r'(?<=[a-z0-9])(?=[A-Z])',' ',s).replace('_',' ').replace('-',' ')
 return s[:1].upper()+s[1:]

def tags_list(value):
 return list(dict.fromkeys(str(x).strip() for x in (value if isinstance(value,list) else str(value or '').split(',')) if str(x).strip() and str(x).strip() not in ['scenario review','breadth expansion','environment expansion','movement-only','adaptable']))

def assigned(text,groups):
 return [name for name,words in groups.items() if any(re.search(r'\b'+re.escape(word)+r'\b',text) for word in words.split())]

def inspect_file(path,meta,base_url):
 raw=path.read_bytes(); sha=hashlib.sha256(raw).hexdigest()
 if meta.get('sourceSha256') and sha != meta['sourceSha256']:raise ValueError(f'{path.name}: source hash changed. Review and update the sidecar sourceSha256 when intentionally replacing a file.')
 rel=path.relative_to(ROOT/'assets').as_posix()
 f={'path':rel,'name':path.name,'bytes':len(raw),'sha256':sha,'format':path.suffix[1:].upper(),'url':base_url+quote(rel,safe='/'),'variant':meta.get('variant','primary')}
 if path.suffix.lower()=='.png':
  im=Image.open(path); im.load(); w,h=im.size
  match=re.search(r'_strip(\d+)$',path.stem)
  n=int(match.group(1)) if match else 1
  if '_strip' in path.stem and not match:raise ValueError(f'{rel}: malformed strip suffix; use _stripN with a positive frame count')
  if n<1 or w%n:raise ValueError(f'{rel}: strip width {w} is not divisible by {n} frames')
  if meta.get('frames') and int(meta['frames'])!=n:raise ValueError(f'{rel}: metadata frame count disagrees with filename')
  if meta.get('frameWidth') and int(meta['frameWidth'])!=w//n:raise ValueError(f'{rel}: incorrect frame width')
  if meta.get('frameHeight') and int(meta['frameHeight'])!=h:raise ValueError(f'{rel}: incorrect frame height')
  if n>1 and not match:raise ValueError(f'{rel}: missing strip suffix')
  f.update(width=w,height=h,frames=n,frameWidth=w//n,frameHeight=h)
  if n>1 and f['variant']=='primary':f['variant']='movement'
  frame=im.convert('RGBA').crop((0,0,w//n,h))
  frame.thumbnail((360,180),Image.Resampling.LANCZOS)
  thumb='thumbnails/'+sha[:24]+'.webp'; (ROOT/'public/thumbnails').mkdir(exist_ok=True,parents=True)
  if not (ROOT/'public'/thumb).exists():frame.save(ROOT/'public'/thumb,'WEBP',quality=90,method=6)
  f['thumbnail']=thumb
 else:
  f.update(frames=1,duration=meta.get('duration'),loop=bool(meta.get('loop',path.suffix=='.ogg')))
  if path.suffix=='.wav':
   with wave.open(str(path)) as wav:f.update(duration=wav.getnframes()/wav.getframerate(),sampleRate=wav.getframerate(),channels=wav.getnchannels())
 return f

def build(external=False):
 base=os.environ.get('ASSET_BASE_URL','').strip()
 if external:
  if not base.startswith('https://'):raise ValueError('External build requires ASSET_BASE_URL=https://... ending at the assets folder')
  if not base.endswith('/'):base+='/'
 else:base='downloads/'
 groups={};errors=[]; paths=list(sorted((ROOT/'assets').rglob('*')))
 for path in paths:
  if not path.is_file() or path.suffix.lower() not in ('.png','.ogg','.wav'):continue
  try:
   if path.is_symlink():raise ValueError(f'Symlinks not supported: {path}')
   rel=path.relative_to(ROOT/'assets');cat=rel.parts[0]
   if cat not in CATEGORIES:raise ValueError(f'Unknown category {cat}; use one of {", ".join(CATEGORIES)}')
   side=path.with_suffix(path.suffix+'.json');m=json.loads(side.read_text()) if side.exists() else {}
   if not isinstance(m,dict):raise ValueError(f'{side.name}: metadata must be an object')
   name=path.name
   if path.suffix=='.png' and not re.match(r'^s[A-Za-z0-9_]+\.png$',name):raise ValueError(f'{name}: use a GameMaker sprite name beginning with s, with no spaces')
   if path.suffix in ('.ogg','.wav') and not re.match(r'^snd[A-Za-z0-9_]+\.(ogg|wav)$',name):raise ValueError(f'{name}: use an audio name beginning with snd, with no spaces')
   # Generated IDs depend on category and filename, not theme folders; moving a theme folder retains baskets.
   id=m.get('id') or 'auto-'+hashlib.sha256((cat+'/'+name).encode()).hexdigest()[:16]
   if not re.fullmatch(r'[A-Za-z0-9_-]+',id):raise ValueError(f'Unsafe ID {id}')
   f=inspect_file(path,m,base)
   f.update(origin=m.get('origin',[f.get('frameWidth',0)//2,f.get('frameHeight',0)] if cat in ('players','enemies') else [0,0]),mask=m.get('mask'),fps=m.get('fps',8),placement=m.get('placement',''))
   if not isinstance(f['origin'],list) or len(f['origin'])!=2 or any(not isinstance(v,(int,float)) for v in f['origin']):raise ValueError(f'{name}: origin must be [x, y] numbers')
   if not isinstance(f['fps'],(int,float)) or not (0<f['fps']<=120 if f['frames']>1 else 0<=f['fps']<=120):raise ValueError(f'{name}: fps must be between 0 and 120')
   if f['variant'] not in ('primary','movement','static','idle'):raise ValueError(f'{name}: unknown variant {f["variant"]}')
   if not isinstance(m.get('themes',[]),list) or not isinstance(m.get('environments',[]),list):raise ValueError(f'{name}: themes and environments must be arrays')
   if id not in groups:
    groups[id]={'id':id,'name':m.get('title') or label(name),'category':cat,'tags':tags_list(m.get('tags'))+list(rel.parts[1:-1]),'files':[],'description':m.get('description',''),'form':{'floating':'float','flying':'fly','rotor':'fly'}.get(m.get('form',''),m.get('form','')),'batch':m.get('batch',0),'repeatHorizontal':bool(m.get('repeatHorizontal',False)),'themes':m.get('themes',[]),'environments':m.get('environments',[])}
   if groups[id]['category']!=cat:raise ValueError(f'{id} belongs to more than one category')
   groups[id]['files'].append(f)
  except Exception as e:errors.append(str(e))
 if errors:raise ValueError('\n'.join(errors))
 seen_names={}
 for a in groups.values():
  a['files'].sort(key=lambda f:({'movement':0,'primary':1,'static':2,'idle':3}.get(f['variant'],1),f['name']))
  a['primary']=a['files'][0]
  a['defaultFiles']=[f['path'] for f in a['files'] if f['variant'] in ('movement','primary')] or [a['primary']['path']]
  a['animated']=a['primary']['frames']>1
  a['tags']=sorted(set(a['tags']))
  text=' '.join([a['name'],a['category'],*a['tags'],a['form']]).lower()
  a['themes']=sorted(set(a['themes']+assigned(text,THEMES)))
  a['environments']=sorted(set(a['environments']+assigned(text,ENVIRONMENTS)))
  a['search']=unicodedata.normalize('NFKD',text+' '+' '.join(a['themes']+a['environments'])+' '+a['id']+' '+' '.join(f['name'] for f in a['files'])).encode('ascii','ignore').decode().lower()
  for f in a['files']:
   target=a['category']+'/'+f['name']
   if target.lower() in seen_names:raise ValueError(f'Duplicate download filename {target} conflicts with {seen_names[target.lower()]}')
   seen_names[target.lower()]=f['path']
 featured=['PL001','EN001','HZ027','HZ059','BG070','AU001','GR041','CO001']
 assets=sorted(groups.values(),key=lambda a:(featured.index(a['id']) if a['id'] in featured else 100,a['name'].lower(),a['id']))
 result={'schemaVersion':1,'title':'Game Forge Asset Library','counts':{'concepts':len(assets),'files':sum(len(a['files']) for a in assets),'bytes':sum(f['bytes'] for a in assets for f in a['files'])},'categories':[{'id':id,'label':name,'count':sum(a['category']==id for a in assets)} for id,name in CATEGORIES.items()],'assets':assets,'hosting':'external' if external else 'local','sourceRevision':os.environ.get('GITHUB_SHA','local')}
 (ROOT/'public').mkdir(exist_ok=True);(ROOT/'public/catalogue.json').write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
 live={f.get('thumbnail') for a in assets for f in a['files']}
 for thumb in (ROOT/'public/thumbnails').glob('*.webp'):
  if thumb.relative_to(ROOT/'public').as_posix() not in live:thumb.unlink()
 print(json.dumps({'validated':result['counts'],'hosting':result['hosting']}))
 return result
if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('--external',action='store_true');args=ap.parse_args()
 try:build(args.external)
 except Exception as e:print('CATALOGUE BUILD FAILED\n'+str(e),file=sys.stderr);sys.exit(1)

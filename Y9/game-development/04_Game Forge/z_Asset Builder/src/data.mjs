export const normalise = s => String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const synonyms={cymru:'welsh',wales:'welsh',collectible:'collectable',collectibles:'collectables',volcanic:'volcano',lava:'lava',npc:'enemies'};
export function filterAssets(assets,{category='all',query='',theme='',environment='',movement=''}={}) {
 const words=normalise(query).trim().split(/\s+/).filter(Boolean);
 return assets.filter(a=>(category==='all'||a.category===category)&&(!theme||a.themes.includes(theme))&&(!environment||a.environments.includes(environment))&&(!movement||(movement==='animated'?a.animated:movement==='static'?!a.animated&&a.category!=='audio':a.form===movement))&&words.every(w=>a.search.includes(w)|| (synonyms[w]&&a.search.includes(synonyms[w]))));
}
export function defaultFiles(assets){return assets.flatMap(a=>a.files.filter(f=>a.defaultFiles.includes(f.path)).map(f=>({...f,category:a.category,assetName:a.name,assetId:a.id})));}
export function parseSelection(text,knownIds){const x=JSON.parse(text);if(x.schemaVersion!==1||!Array.isArray(x.ids)||x.ids.length>100000||x.ids.some(id=>typeof id!=='string'))throw Error('This is not a Game Forge selection file.');return {ids:[...new Set(x.ids)].filter(id=>knownIds.has(id)),missing:[...new Set(x.ids)].filter(id=>!knownIds.has(id)),name:typeof x.name==='string'?x.name.slice(0,80):'My Game Forge assets'};}
export function selectionText(ids,name){return JSON.stringify({schemaVersion:1,name,ids:[...ids]},null,2);}
export function safeName(s){return String(s).normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'game-forge-package';}
export function formatBytes(n){return n<1024?`${n} B`:n<1024*1024?`${(n/1024).toFixed(0)} KB`:`${(n/1024/1024).toFixed(1)} MB`;}
export function fileDescription(f){return f.format==='PNG'?`${f.frames>1?f.frames+'-frame movement strip':'PNG'} · ${f.frameWidth} × ${f.frameHeight}`:`${f.format} · ${f.loop?'Music loop':'Sound effect'}`;}

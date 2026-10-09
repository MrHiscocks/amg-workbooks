import {defaultFiles,safeName} from './data.mjs';
export function saveBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export async function fetchVerified(file,signal){
 let last;
 for(let attempt=0;attempt<3;attempt++){
  if(signal?.aborted)throw new DOMException('Download cancelled','AbortError');
  try {
   const response=await fetch(file.url,{signal:AbortSignal.any([...(signal?[signal]:[]),AbortSignal.timeout(30000)]),cache:attempt?'reload':'default'});
   if(!response.ok)throw Error(`HTTP ${response.status}`);
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length!==file.bytes)throw Error('File size does not match the catalogue');
   if(globalThis.crypto?.subtle){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==file.sha256)throw Error('File checksum does not match the catalogue');}
   return bytes;
  }catch(e){last=e;if(signal?.aborted)throw new DOMException('Download cancelled','AbortError');}
 }
 throw Error(`${file.name}: ${last.message}. Try again; no incomplete ZIP has been downloaded.`);
}
export async function downloadFile(file){const bytes=await fetchVerified(file);saveBlob(new Blob([bytes]),file.name);}
export function importNotes(assets){return ['LEVEL LAB | GAME FORGE','Import these original files without resizing or cropping.','Keep _stripN on animation filenames so GameMaker divides them into N frames.','PNG files do not encode origins, masks or playback speeds. Set the values below in GameMaker.','Artwork does not supply movement, collision or scoring code.','Base grid: 64 × 64. Test assets in your own project.','',...assets.flatMap(a=>[`${a.name} (${a.id})`,...a.files.filter(f=>a.defaultFiles.includes(f.path)).map(f=>`${f.name}\n${f.format==='PNG'?`  Frame: ${f.frameWidth} × ${f.frameHeight}; frames: ${f.frames}; origin: (${f.origin.join(', ')}).\n  ${f.frames>1?`Suggested speed: ${f.fps} frames per second. `:''}${f.mask?'Mask: '+(typeof f.mask==='string'?f.mask:JSON.stringify(f.mask)):''}`:`  ${f.loop?'Looping music':'Event sound effect'}; ${f.duration?.toFixed(2)||'?'} seconds.`}\n  ${f.placement||a.description||''}`),''])].join('\n');}
export async function downloadPackage(assets,name,notes,onProgress,signal){
 const files=defaultFiles(assets); if(!files.length)throw Error('Add some assets first.');
 const entries={};let next=0,done=0;onProgress({done,total:files.length,phase:'Downloading'});
 await Promise.all(Array.from({length:Math.min(4,files.length)},async()=>{while(next<files.length){const f=files[next++];const data=await fetchVerified(f,signal);if(signal?.aborted)throw new DOMException('Cancelled','AbortError');const key=f.category+'/'+f.name;if(entries[key])throw Error('Duplicate file in package: '+key);entries[key]=data;onProgress({done:++done,total:files.length,phase:'Downloading'});}}));
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
 if(notes)entries['IMPORT_NOTES.txt']=new TextEncoder().encode(importNotes(assets));
 entries['game-forge-selection.json']=new TextEncoder().encode(JSON.stringify({schemaVersion:1,name,ids:assets.map(a=>a.id)},null,2));
 onProgress({done,total:files.length,phase:'Preparing ZIP'});
 const {zip}=await import('fflate');
 const output=await new Promise((resolve,reject)=>{let terminate;const abort=()=>{terminate?.();reject(new DOMException('Cancelled','AbortError'));};signal?.addEventListener('abort',abort,{once:true});terminate=zip(entries,{level:0},(err,result)=>{signal?.removeEventListener('abort',abort);err?reject(err):resolve(result);});});
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');saveBlob(new Blob([output],{type:'application/zip'}),safeName(name)+'.zip');
}

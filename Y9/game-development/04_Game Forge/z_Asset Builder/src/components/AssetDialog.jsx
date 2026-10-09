import {useEffect,useRef,useState} from 'react';
import {X,Play,Pause,Download,Check,Plus,FlipHorizontal2,Grid2X2,Repeat2} from 'lucide-react';
import Media from './Media';
import {formatBytes,fileDescription} from '../data.mjs';
export default function AssetDialog({asset,selected,onClose,onToggle,onDownload}){
 const dialog=useRef(null);const [playing,setPlaying]=useState(false),[mirror,setMirror]=useState(false),[grid,setGrid]=useState(true),[repeat,setRepeat]=useState(false),[file,setFile]=useState(asset.primary);
 useEffect(()=>{dialog.current.showModal();return()=>dialog.current?.close();},[]);
 const animated=file.frames>1;
 return <dialog ref={dialog} className="asset-dialog" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose();}} aria-labelledby="asset-heading">
  <button className="modal-close icon-button" onClick={onClose} aria-label="Close asset details"><X/></button>
  <div className="detail-layout"><div className="detail-visual">
   <Media asset={asset} file={file} large playing={playing} mirror={mirror} grid={grid} repeat={repeat}/>
   {file.format!=='PNG'?<audio key={file.path} controls preload="metadata" src={file.url} loop={file.loop} aria-label={`Listen to ${asset.name}`}/>:<div className="preview-controls">
    {animated&&<button onClick={()=>setPlaying(!playing)} aria-pressed={playing}>{playing?<Pause/>:<Play/>}{playing?'Pause':'Play'}</button>}
    {asset.category!=='backgrounds'&&<button onClick={()=>setGrid(!grid)} aria-pressed={grid}><Grid2X2/>Show grid</button>}
    {animated&&<button onClick={()=>setMirror(!mirror)} aria-pressed={mirror}><FlipHorizontal2/>Mirror</button>}
    {asset.repeatHorizontal&&<button onClick={()=>setRepeat(!repeat)} aria-pressed={repeat}><Repeat2/>Repeat preview</button>}
   </div>}
   {animated&&<div className="frame-strip">{Array.from({length:file.frames},(_,i)=><div key={i} className="checker"><div aria-label={`Frame ${i+1}`} role="img" style={{width:file.frameWidth,height:file.frameHeight,backgroundImage:`url("${file.url}")`,backgroundPosition:`-${i*file.frameWidth}px 0`}}/><span>{i+1}</span></div>)}</div>}
   <p className="small muted">Preview shown enlarged. Download keeps its original size.</p>
  </div><div className="detail-info">
   <span className="detail-kind">{animated?'Movement animation':file.loop?'Music loop':file.format==='PNG'?'Game asset':'Sound effect'}</span><h2 id="asset-heading">{asset.name}</h2>
   {asset.description&&<p>{asset.description}</p>}
   <dl className="specs">{file.format==='PNG'?<><div><dt>Per frame</dt><dd>{file.frameWidth} × {file.frameHeight} px</dd></div><div><dt>Frames</dt><dd>{file.frames}</dd></div><div><dt>Download size</dt><dd>{file.width} × {file.height} px</dd></div><div><dt>Origin</dt><dd>({file.origin.join(', ')})</dd></div></>:<><div><dt>Format</dt><dd>{file.format}</dd></div><div><dt>Length</dt><dd>{file.duration?.toFixed(2)} seconds</dd></div></>}<div><dt>File size</dt><dd>{formatBytes(file.bytes)}</dd></div></dl>
   <div className="tags">{asset.tags.slice(0,6).map(tag=><span key={tag}>{tag}</span>)}</div>
   <div className="filename"><span>Download file</span><code>{file.name}</code></div>
   {animated&&<p className="small">Keep the filename so GameMaker recognises all {file.frames} frames.</p>}
   <div className="detail-actions"><button className="gold" onClick={()=>onToggle(asset.id)} aria-pressed={selected}>{selected?<Check/>:<Plus/>}{selected?'Added to package':'Add to package'}</button><button onClick={()=>onDownload(file)}><Download/>{animated?'Download strip':'Download file'}</button></div>
   <details className="import-settings"><summary>Import settings</summary><p>{file.placement||'Use the original canvas size. Set the origin above in the sprite editor.'}</p>{animated&&<p>Suggested playback: {file.fps} frames per second. Use a fixed collision mask across every frame.</p>}{file.mask&&<p>Mask: {typeof file.mask==='string'?file.mask:Object.entries(file.mask).map(([k,v])=>`${k}: ${v}`).join(', ')}</p>}<p>Origins and collision settings are not stored in PNG files.</p></details>
   {asset.files.length>1&&<details className="import-settings"><summary>Other existing exports ({asset.files.length-1})</summary><p className="small">Movement is the default for characters. These are existing alternatives.</p>{asset.files.map(f=><div className="alternate" key={f.path}><button onClick={()=>{setFile(f);setPlaying(false);}} aria-pressed={file.path===f.path}>{f.variant==='primary'?f.name:f.variant}<span>{fileDescription(f)}</span></button><button className="icon-button" aria-label={`Download ${f.name}`} onClick={()=>onDownload(f)}><Download/></button></div>)}</details>}
  </div></div>
 </dialog>;
}

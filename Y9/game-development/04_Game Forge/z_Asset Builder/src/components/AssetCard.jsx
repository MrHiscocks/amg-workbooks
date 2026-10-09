import {Download,Check,Plus} from 'lucide-react';
import Media from './Media';
export default function AssetCard({asset,selected,onToggle,onOpen,onDownload,label}){
 const p=asset.primary;
 return <article className={`asset-card ${selected?'selected':''}`}>
  <button className="preview-button" onClick={()=>onOpen(asset)} aria-label={`Preview ${asset.name}`}>
   <Media asset={asset}/>{asset.animated&&<span className="badge">Animated</span>}
  </button>
  <button className="asset-title" onClick={()=>onOpen(asset)}>{asset.name}</button>
  <p className="asset-meta">{p.format==='PNG'?`${label} · ${p.frameWidth} × ${p.frameHeight}`:`${p.loop?'Music':'Sound effect'} · ${p.loop?'Loop':`${p.duration?.toFixed(1)||'?'}s`}`}</p>
  <div className="card-actions"><button className={`gold ${selected?'is-added':''}`} aria-label={`${selected?'Remove':'Add'} ${asset.name} ${selected?'from':'to'} package`} aria-pressed={selected} onClick={()=>onToggle(asset.id)}>{selected?<Check size={17}/>:<Plus size={17}/>} <span className="full-add-label">{selected?'Added':'Add to package'}</span><span className="short-add-label" aria-hidden="true">{selected?'Added':'Add'}</span></button><button className="icon-button" aria-label={`Download ${asset.name}`} title={`Download ${p.name}`} onClick={()=>onDownload(p)}><Download/></button></div>
 </article>;
}

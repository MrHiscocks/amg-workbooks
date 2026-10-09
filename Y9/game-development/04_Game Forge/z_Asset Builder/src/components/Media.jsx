import {useEffect,useState} from 'react';
import {Headphones,AudioLines,ImageOff} from 'lucide-react';
export default function Media({asset,file=asset.primary,large=false,playing=false,mirror=false,grid=true,repeat=false,onFrame}){
 const [frame,setFrame]=useState(0),[broken,setBroken]=useState(false);
 useEffect(()=>{setFrame(0);setBroken(false);},[file.path]);
 useEffect(()=>{if(!playing||file.frames<2)return;const timer=setInterval(()=>setFrame(f=>(f+1)%file.frames),1000/(file.fps||8));return()=>clearInterval(timer);},[playing,file.frames,file.fps]);
 useEffect(()=>{onFrame?.(frame);},[frame,onFrame]);
 if(file.format!=='PNG')return <div className="audio-art" aria-hidden="true"><Headphones/><AudioLines/></div>;
 if(broken)return <div className="media-error"><ImageOff/>Preview unavailable. You can retry in details.</div>;
 if(large&&file.frames>1){const scale=Math.min(3,250/file.frameHeight);return <div className={`preview-stage ${grid?'checker':''}`}><div role="img" aria-label={`${asset.name}, frame ${frame+1} of ${file.frames}`} className="sprite-frame" style={{width:file.frameWidth*scale,height:file.frameHeight*scale,backgroundImage:`url("${file.url}")`,backgroundSize:`${file.width*scale}px ${file.height*scale}px`,backgroundPosition:`-${frame*file.frameWidth*scale}px 0`,transform:mirror?'scaleX(-1)':''}}/></div>;}
 if(large&&repeat)return <div className="repeat-stage" role="img" aria-label={`${asset.name}, repeated horizontally`} style={{backgroundImage:`url("${file.url}")`}}/>;
 return <div className={`${large?'preview-stage':'card-image'} ${grid&&asset.category!=='backgrounds'?'checker':''} ${asset.category==='backgrounds'?'background-art':''}`}><img src={large?file.url:file.thumbnail} alt={asset.name} loading={large?'eager':'lazy'} onError={()=>setBroken(true)} style={{transform:mirror?'scaleX(-1)':''}}/></div>;
}

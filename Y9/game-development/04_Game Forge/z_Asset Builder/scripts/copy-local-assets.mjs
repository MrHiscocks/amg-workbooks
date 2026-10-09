import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist/downloads', { recursive:true });
await cp('assets','dist/downloads',{recursive:true,filter:p=>!p.endsWith('.json')&&!p.endsWith('.md')});

import { readFileSync } from 'node:fs';
export const catalog=JSON.parse(readFileSync(new URL('../../ios/PaperPop/Resources/catalog.json',import.meta.url),'utf8'));
export const topics=new Set(catalog.topics.map(t=>t.id));
export const papers=new Map(catalog.papers.map(p=>[p.id,p]));
export async function route(req,url) {if(req.method==='GET' && url.pathname==='/v1/catalog')return catalog;}

import { randomUUID } from 'node:crypto';
import { db,transaction } from '../database.mjs';
import { fail,now,text } from './shared.mjs';
export function validatePoster(input) {
 if(!input||typeof input!=='object'||Array.isArray(input))fail(422,'解读必须为 JSON 对象');
 const list=(value,max=30)=>{if(value===undefined)return [];if(!Array.isArray(value)||value.length>max||!value.every(s=>typeof s==='string'&&s.length<5000))fail(422,'解读列表格式无效');return value;};
 const title=text(input.title,300,'解读标题');
 if(!Array.isArray(input.sections)||input.sections.length<1||input.sections.length>30)fail(422,'至少需要一节有出处的解读');
 const sections=input.sections.map(s=>({title:text(s.title,300,'小节标题'),text:text(s.text,20000,'解读正文'),label:text(s.label,500,'出处/依据')}));
 const evidence=input.evidence??[];if(!Array.isArray(evidence)||evidence.length>20)fail(422,'证据列表无效');
 const result={title,sections,hook:typeof input.hook==='string'?text(input.hook,5000,'引入',0):'',flow:list(input.flow),evidence:evidence.map(e=>({label:text(e.label,300,'证据标题'),value:text(e.value,300,'证据结果'),context:text(e.context,2000,'证据条件')})),related:list(input.related),example:{title:'',before:'',after:''},sourceUrl:'',version:'',status:'draft'};
 if(input.example?.title)result.example={title:text(input.example.title,300,'例子标题'),before:text(input.example.before,3000,'例子前'),after:text(input.example.after,3000,'例子后')};
 return result;
}
export function interpretation(id){const r=db.prepare('SELECT * FROM interpretations WHERE id=?').get(id);return r?{...r,data:JSON.parse(r.data),provenance:JSON.parse(r.provenance)}:null;}
export function saveDraft(paperId,input,{id,revision}={}) {
 const paper=db.prepare('SELECT * FROM papers WHERE id=?').get(paperId);if(!paper)fail(404,'论文不存在');
 const poster=validatePoster(input.poster);
 const version=input.paperVersion??paper.latestVersion;
 if(!Number.isInteger(version)||!db.prepare('SELECT 1 FROM paper_versions WHERE paperId=? AND version=?').get(paperId,version))fail(422,'论文版本不存在');
 poster.sourceUrl=JSON.parse(paper.data).sourceUrl;poster.version=`editorial-${version}`;
 const provenance=input.provenance||{mode:'manual',sourceUrl:poster.sourceUrl};
 if(JSON.stringify(provenance).length>30000)fail(422,'出处记录过大');
 const at=now();
 if(id){
  const r=db.prepare("UPDATE interpretations SET data=?,provenance=?,paperVersion=?,updatedAt=?,revision=revision+1 WHERE id=? AND paperId=? AND status='draft' AND revision=?").run(JSON.stringify(poster),JSON.stringify(provenance),version,at,id,paperId,revision);
  if(!r.changes)fail(409,'草稿已变化或不在草稿状态，请重新加载');
 }else{
  id=randomUUID();db.prepare('INSERT INTO interpretations(id,paperId,paperVersion,status,data,provenance,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?)').run(id,paperId,version,'draft',JSON.stringify(poster),JSON.stringify(provenance),at,at);
 }
 return interpretation(id);
}
export function publish(id,revision,onPublish=()=>{}) {
 return transaction(()=>{
  const d=interpretation(id);if(!d)fail(404,'解读不存在');
  if(d.status!=='draft'||d.revision!==revision)fail(409,'请重新加载当前草稿');
  const paper=db.prepare('SELECT latestVersion FROM papers WHERE id=?').get(d.paperId);
  if(d.paperVersion!==paper.latestVersion)fail(409,'论文已有新版，请基于新版检查解读再发布');
  validatePoster(d.data);
  db.prepare("UPDATE interpretations SET status='withdrawn',updatedAt=?,revision=revision+1 WHERE paperId=? AND status='published'").run(now(),d.paperId);
  const data={...d.data,status:'published'};
  db.prepare("UPDATE interpretations SET status='published',data=?,publishedAt=?,updatedAt=?,revision=revision+1 WHERE id=?").run(JSON.stringify(data),now(),now(),id);
  onPublish();return interpretation(id);
 });
}
export function withdraw(id,revision) {
 const r=db.prepare("UPDATE interpretations SET status='withdrawn',updatedAt=?,revision=revision+1 WHERE id=? AND revision=? AND status='published'").run(now(),id,revision);if(!r.changes)fail(409,'请重新加载已发布解读');return interpretation(id);
}
export async function route(){return undefined;}

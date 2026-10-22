const $=id=>document.getElementById(id);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n;};
const state={csrf:'',view:'papers',overview:null,selected:null,draft:null,poster:null,offsets:{papers:0,tasks:0,reports:0,users:0,audit:0}};
function notice(message,error=false){$('notice').textContent=message;$('notice').className=error?'error':'';}
async function api(path,method='GET',data){
 const response=await fetch('/admin/api/'+path,{method,headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:data===undefined?undefined:JSON.stringify(data)});
 const result=await response.json();if(!response.ok){if(response.status===401){$('workspace').hidden=true;$('login').hidden=false;}throw new Error(result.error||'请求失败');}return result;
}
function action(label,fn,cls='secondary'){const b=el('button',label,cls);b.type='button';b.addEventListener('click',()=>run(fn,b));return b;}
async function run(fn,button){if(button)button.disabled=true;try{notice('');await fn();}catch(e){notice(e.message,true);}finally{if(button)button.disabled=false;}}
function label(parent,text,input){const l=el('label',text);l.append(input);parent.append(l);return input;}
function input(parent,title,value='',type='text'){const i=el('input');i.type=type;i.value=value??'';return label(parent,title,i);}
function area(parent,title,value,rows=4){const i=el('textarea');i.value=value??'';i.rows=rows;return label(parent,title,i);}
function select(parent,title,options,value){const s=el('select');for(const [id,name] of options){const o=el('option',name);o.value=id;s.append(o);}s.value=value;return label(parent,title,s);}
function empty(parent,message){parent.replaceChildren(el('p',message,'muted card'));}
async function overview(){state.overview=await api('overview');$('stats').replaceChildren(...[['papers','已入库论文'],['drafts','待发布草稿'],['pendingTasks','待执行 / 处理任务'],['reports','未处理举报']].map(([key,title])=>{const n=el('div',undefined,'stat');n.append(el('b',state.overview[key]),el('span',title));return n;}));$('source').replaceChildren(...state.overview.sources.map(s=>{const o=el('option',`${s.id} · ${s.category} → ${s.topic}`);o.value=s.id;return o;}));}
async function show(view){state.view=view;for(const node of document.querySelectorAll('.view'))node.hidden=node.id!==view+'-view';for(const node of document.querySelectorAll('nav button'))node.classList.toggle('active',node.dataset.view===view);await load();}
async function load(){switch(state.view){case 'papers':await loadPapers();break;case 'tasks':await loadTasks();break;case 'reports':await loadReports();break;case 'users':await loadUsers();break;case 'audit':await loadAudit();break;}}
async function enter(identity){state.csrf=identity.csrf;$('login').hidden=true;$('workspace').hidden=false;$('identity').replaceChildren(el('span',identity.name),action('退出',async()=>{await api('logout','POST');state.csrf='';$('workspace').hidden=true;$('login').hidden=false;$('identity').replaceChildren();}));await overview();await show(state.view);}
$('login-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const d=Object.fromEntries(new FormData(e.target));await enter(await api('login','POST',d));e.target.reset();},e.submitter);});
for(const b of document.querySelectorAll('nav button'))b.addEventListener('click',()=>run(()=>show(b.dataset.view)));
$('refresh').addEventListener('click',()=>run(async()=>{await overview();await load();}));
$('search-form').addEventListener('submit',e=>{e.preventDefault();state.offsets.papers=0;run(loadPapers);});
$('new-paper').addEventListener('click',()=>metadataEditor(null));
async function loadPapers(){
 const list=await api(`papers?q=${encodeURIComponent($('search').value)}&offset=${state.offsets.papers}`);
 $('paper-list').replaceChildren(...list.items.map(p=>{const n=action('',()=>loadPaper(p.id),'paper-item'+(p.id===state.selected?' selected':''));n.append(el('b',p.title),el('small',`${p.id} · ${p.topic} · v${p.paperVersion}`),el('span',p.visibility==='withdrawn'?'已下架':p.poster?'解读已发布':'摘要论文','badge'));return n;}));
 if(!list.items.length)empty($('paper-list'),'没有匹配的论文。');
 const prev=action('上一页',async()=>{state.offsets.papers=Math.max(0,state.offsets.papers-30);await loadPapers();});prev.disabled=state.offsets.papers===0;
 const next=action('下一页',async()=>{state.offsets.papers=list.nextOffset;await loadPapers();});next.disabled=list.nextOffset===null;
 $('paper-pages').replaceChildren(prev,el('span',`第 ${state.offsets.papers/30+1} 页`),next);
}
async function loadPaper(id){state.selected=id;const paper=await api('papers/'+encodeURIComponent(id));metadataEditor(paper);}
function metadataEditor(paper){
 const editor=$('editor');editor.replaceChildren(el('p','PAPER DETAILS','eyebrow'),el('h2',paper?'论文资料':'新增论文'));
 const form=el('form');editor.append(form);
 const id=input(form,'论文 ID',paper?.id||'');id.required=true;id.readOnly=!!paper;
 const name=input(form,'短标题（App 显示）',paper?.name||'');
 const title=input(form,'论文标题',paper?.title||'');title.required=true;
 const authors=area(form,'作者（每行一位）',paper?.authors.join('\n')||'',2);
 const topic=select(form,'研究方向',state.overview.topics.map(t=>[t.id,t.name]),paper?.topic||state.overview.topics[0].id);
 const summary=area(form,'原始摘要',paper?.summary||'',6);summary.required=true;
 const source=input(form,'原文链接',paper?.sourceUrl||'','url');source.required=true;
 const date=paper?null:input(form,'首次发表日期',new Date().toISOString().slice(0,10),'date');
 const visibility=paper?select(form,'公开状态',[['public','公开'],['withdrawn','下架']],paper.visibility):null;
 const featured=paper?input(form,'精选状态','','checkbox'):null;if(featured)featured.checked=paper.featured;
 const save=el('button',paper?'保存论文资料':'添加论文');form.append(save);
 form.addEventListener('submit',e=>{e.preventDefault();run(async()=>{const data={id:id.value.trim(),name:name.value.trim()||title.value.trim(),title:title.value.trim(),authors:authors.value.split('\n').map(x=>x.trim()).filter(Boolean),topic:topic.value,summary:summary.value.trim(),sourceUrl:source.value.trim()};if(paper){data.visibility=visibility.value;data.featured=featured.checked;await api('papers/'+encodeURIComponent(paper.id),'PUT',data);}else{data.date=date.value;await api('papers','POST',data);}notice('论文资料已保存。');await overview();await loadPapers();await loadPaper(data.id);},save);});
 if(!paper)return;
 editor.append(el('hr'),el('h2','解读与发布'));
 editor.append(el('p','草稿不会出现在 App 中。修改已发布内容时，先复制成新草稿；检查预览后再发布。','muted small'));
 const choose=el('div',undefined,'actions');editor.append(choose);
 choose.append(action('新建空白草稿',()=>draftEditor(paper,null,{title:'',hook:'',flow:[],sections:[{title:'研究问题',label:'原文出处（例如摘要 / §3）',text:''}],evidence:[],related:[]})));
 for(const d of paper.interpretations)choose.append(action(`${d.status==='draft'?'草稿':d.status==='published'?'已发布':'已下架'} · ${d.id.slice(0,8)}`,()=>draftEditor(paper,d,d.data)));
 const container=el('section');container.id='draft-editor';editor.append(container);
 if(paper.interpretations.length){const d=paper.interpretations.find(d=>d.status==='draft')||paper.interpretations[0];draftEditor(paper,d,d.data);}
}
function preview(parent,poster){parent.replaceChildren(el('h2',poster.title||'未填写标题'));if(poster.hook)parent.append(el('p',poster.hook));for(const step of poster.flow||[])parent.append(el('p','→ '+step));for(const section of poster.sections||[])parent.append(el('h3',section.title),el('p',section.text),el('small',section.label,'muted'));for(const e of poster.evidence||[])parent.append(el('h3',`${e.label} · ${e.value}`),el('p',e.context));}
function draftEditor(paper,draft,base){
 const parent=$('draft-editor');parent.replaceChildren();state.draft=draft;
 const readOnly=!!draft&&draft.status!=='draft';
 parent.append(el('h3',draft?`${draft.status} · 论文 v${draft.paperVersion} · 修订 ${draft.revision}`:'未保存草稿'));
 const version=select(parent,'依据的论文版本',(paper.versions||[paper.paperVersion]).map(v=>[String(v),`论文 v${v}`]),String(draft?.paperVersion||paper.paperVersion));
 const title=input(parent,'解读标题',base.title),hook=area(parent,'引入 / 例子（可留空）',base.hook,2),flow=area(parent,'方法流程（每行一步，可留空）',(base.flow||[]).join('\n'),3);
 const sections=el('div');parent.append(sections);const fields=[];
 const addSection=s=>{const box=el('div',undefined,'card');sections.append(box);const f={box,title:input(box,'小节标题',s.title),text:area(box,'解读正文',s.text,5),label:input(box,'出处与范围（必填）',s.label)};fields.push(f);box.append(action('移除此节',()=>{box.remove();fields.splice(fields.indexOf(f),1);},'danger'));};
 for(const s of base.sections||[])addSection(s);
 parent.append(action('添加小节',()=>addSection({title:'',text:'',label:''})));
 const evidence=area(parent,'证据 JSON（可留空或 []；每条包含 label、value、context）',JSON.stringify(base.evidence||[],null,2),3);evidence.className='code';
 const provenance=area(parent,'出处记录 JSON',JSON.stringify(draft?.provenance||{mode:'manual',scope:'请标注摘要速读或全文解读',sourceUrl:paper.sourceUrl},null,2),3);provenance.className='code';
 const data=()=>({paperVersion:Number(version.value),revision:draft?.revision,poster:{...base,title:title.value,hook:hook.value,flow:flow.value.split('\n').map(x=>x.trim()).filter(Boolean),sections:fields.map(f=>({title:f.title.value,text:f.text.value,label:f.label.value})),evidence:JSON.parse(evidence.value||'[]')},provenance:JSON.parse(provenance.value||'{}')});
 const actions=el('div',undefined,'actions'),output=el('div',undefined,'preview');parent.append(actions,output);
 actions.append(action('预览',()=>preview(output,data().poster)));
 if(readOnly){
  actions.append(action('复制为新草稿',()=>draftEditor(paper,null,base)));
  if(draft.status==='published')actions.append(action('下架解读',async()=>{await api('interpretations/'+draft.id+'/withdraw','POST',{revision:draft.revision});notice('解读已下架，App 刷新后生效。');await overview();await loadPaper(paper.id);},'danger'));
  for(const node of parent.querySelectorAll('input,select,textarea'))node.disabled=true;for(const node of parent.querySelectorAll('button'))if(['移除此节','添加小节'].includes(node.textContent))node.disabled=true;
 }else{
  actions.append(action('保存草稿',async()=>{const result=await api(draft?'interpretations/'+draft.id:'papers/'+encodeURIComponent(paper.id)+'/drafts',draft?'PUT':'POST',data());notice('草稿已保存，尚未公开。');await overview();const refreshed=await api('papers/'+encodeURIComponent(paper.id));metadataEditor(refreshed);draftEditor(refreshed,result,result.data);},''));
  if(draft)actions.append(action('发布当前已保存版本',async()=>{await api('interpretations/'+draft.id+'/publish','POST',{revision:draft.revision});notice('解读已发布，App 刷新后可见。');await overview();await loadPapers();await loadPaper(paper.id);},''));
 }
 preview(output,base);
}
$('collect-form').addEventListener('submit',e=>{e.preventDefault();run(async()=>{const data=Object.fromEntries(new FormData(e.target));for(const k of ['from','until'])if(data[k])data[k]=new Date(data[k]).toISOString();else delete data[k];if(!data.idList)delete data.idList;const task=await api('collect','POST',data);notice('任务已投递：'+task.id);await overview();await loadTasks();},e.submitter);});
async function loadTasks(){const result=await api('tasks?offset='+state.offsets.tasks);$('tasks-page').textContent='第 '+(state.offsets.tasks/30+1)+' 页';$('task-list').replaceChildren(...result.items.map(t=>{const n=el('div',undefined,'card');n.append(el('h3',`${t.kind} · ${t.status}`),el('small',`${t.id} · 尝试 ${t.attempts}/${t.maxAttempts}`,'muted'),el('pre',JSON.stringify(t.progress,null,2)));if(t.error)n.append(el('p',t.error));const a=el('div',undefined,'actions');a.append(action('查看执行记录',async()=>{const detail=await api('tasks/'+t.id);$('task-detail').hidden=false;$('task-detail').replaceChildren(el('h3','任务详情'),el('pre',JSON.stringify(detail,null,2)));}));if(t.status==='failed')a.append(action('重新执行',async()=>{await api('tasks/'+t.id+'/retry','POST',{});notice('任务已重新排队。');await loadTasks();}));n.append(a);return n;}));if(!result.items.length)empty($('task-list'),'暂无任务。投递后启动 worker 执行。');}
async function loadReports(){const r=await api('reports?offset='+state.offsets.reports);$('reports-page').textContent='第 '+(state.offsets.reports/30+1)+' 页';$('report-list').replaceChildren(...r.items.map(report=>{const n=el('div',undefined,'card');n.append(el('h3',report.targetType+' · '+report.targetId),el('p',report.reason),el('small',report.resolution?'处理结果：'+report.resolution+' · '+report.notes:'待处理','muted'));const notes=area(n,'处理说明',report.notes||'',2);const a=el('div',undefined,'actions');for(const [value,title] of [['dismissed','记录为无需处理'],['hidden','隐藏被举报内容']])a.append(action(title,async()=>{await api('reports/'+report.id+'/resolve','POST',{resolution:value,notes:notes.value});notice('处理结果已保存并记录审计。');await overview();await loadReports();},value==='hidden'?'danger':'secondary'));n.append(a);return n;}));if(!r.items.length)empty($('report-list'),'暂无举报。');}
async function loadUsers(){const r=await api('users?offset='+state.offsets.users);$('users-page').textContent='第 '+(state.offsets.users/30+1)+' 页';$('user-list').replaceChildren(...r.items.map(user=>{const n=el('div',undefined,'card');n.append(el('h3',user.name),el('small',`${user.id} · ${user.restricted?'已限制':'正常'}`,'muted'));const reason=input(n,'限制 / 解除说明',user.reason||'');n.append(action(user.restricted?'解除账号限制':'限制账号',async()=>{await api('users/'+user.id+'/restriction','POST',{restricted:!user.restricted,reason:reason.value});notice('账号状态已更新。');await loadUsers();},user.restricted?'secondary':'danger'));return n;}));if(!r.items.length)empty($('user-list'),'暂无普通账号。');}
async function loadAudit(){const r=await api('audit?offset='+state.offsets.audit);$('audit-page').textContent='第 '+(state.offsets.audit/30+1)+' 页';$('audit-list').replaceChildren(...r.items.map(a=>{const n=el('div',undefined,'card');n.append(el('h3',a.action),el('small',`${a.createdAt} · ${a.admin} · ${a.target}`,'muted'),el('pre',a.details));return n;}));if(!r.items.length)empty($('audit-list'),'暂无操作记录。');}
for(const button of document.querySelectorAll('[data-page]'))button.addEventListener('click',()=>run(async()=>{const view=button.dataset.page;state.offsets[view]=Math.max(0,state.offsets[view]+Number(button.dataset.delta)*30);await load();}));
run(async()=>{try{const response=await fetch('/admin/api/me');if(response.ok)await enter(await response.json());}catch{notice('无法连接本地后台，请确认 API 已启动。',true);}});

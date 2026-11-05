'use strict';
let notebookQueryV9='',notebookFilterV9='all',notebookBookV9='all',notebookAreaV9='all';
const notebookBooksV9=new Map(),notebookReferencesV9=new Map(),notebookLoadingV9=new Map();
const stateKeyV9=book=>book==='beginner'?'nihongo-study-v1':'nihongo-study-v1-'+book;
const bookLabelV9=book=>window.BOOKS[book]?.label||'';
const notebookWordV9=(data,id)=>data?.vocab.find(w=>w.id===(data.vocabAliases?.[id]||id));
function bookStateV9(book){if(book===window.BOOK_ID)return S;try{return JSON.parse(localStorage.getItem(stateKeyV9(book))||'{}')}catch{return {}}}
function writeBookStateV9(book,mutate){const state=bookStateV9(book);mutate(state);if(book===window.BOOK_ID)save();else localStorage.setItem(stateKeyV9(book),JSON.stringify(state))}
function notebookURLV9(book,path){const safe=/^[A-Za-z0-9/%_:.-]+$/.test(path||'')?path:'lessons';return book===window.BOOK_ID?'#'+safe:'./?book='+encodeURIComponent(book)+'#'+safe}
function sourceCaptionV9(pages){const numbers=[...new Set((pages||[]).filter(Number.isFinite).map(p=>p-window.BOOK_CONFIG.sourceOffset).filter(p=>p>0))];return window.BOOK_ID!=='advanced'&&numbers.length?`<p class="source-caption">第 ${numbers.join('、')} 页</p>`:''}
function contextV9(kind,object={}){
 const [view,lesson,tab,point,number]=(location.hash.slice(1)||'lesson/'+(S.lastLesson||1)+'/notes/0').split('/');
 const book=window.BOOK_ID,cat=window.STUDY_REFERENCE?.categories.find(c=>c.id===lesson),entry=cat?.entries.find(e=>e.id===tab);
 let area=view==='lesson'?'课程':view==='grammar'?'语法':view==='kana'?'五十音':'语汇',label='',route=location.hash.slice(1),title=object.word||object.ja||object.title||'';
 if(kind==='kana'){area='五十音';label='五十音 · '+object.hira;route='kana/'+encodeURIComponent(object.hira);title=object.hira+' / '+object.kata}
 else if(kind==='reference'){area='语法';label='语法 · '+(cat?.title||object.categoryTitle||'')+' · '+(entry?.title||object.title||'');title=entry?.title||object.title}
 else if(view==='grammar'&&entry){label='语法 · '+cat.title+' · '+entry.title;if(kind==='sentence'&&object.id)route='grammar/'+cat.id+'/'+entry.id+'/sentence/'+object.id}
 else if(view==='lesson'){const l=byLesson(lesson);label='课程 · 第'+lesson+'课'+(tab==='reading'?' · '+(point==='dialogue'?'会话':'课文'):tab==='vocab'?' · 语汇':tab==='notes'?' · '+(l?.grammar[Number(point)||0]?.title||'讲解'):' · 练习')}
 else if(kind==='word'){
  const n=object.lesson||object.lessons?.[0],parts=object.reference?.split('/'),rc=window.STUDY_REFERENCE?.categories.find(c=>c.id===parts?.[0]),re=rc?.entries.find(e=>e.id===parts?.[1]);label='语汇'+(n?' · 第'+n+'课':rc?' · '+rc.title+' · '+(re?.title||''):'');route='vocabulary/word/'+object.id;
 }else label=area;
 if(kind==='word'){area='语汇';if(view==='lesson')route='lesson/'+lesson+'/vocab/word/'+object.id}
 if(kind==='sentence'&&object.id&&view==='lesson'&&tab==='notes')route='lesson/'+lesson+'/notes/'+(point||0)+'/sentence/'+object.id;
 return {book,area,label,route,title};
}
function noteKeyV9(kind,id){return kind+':'+id}
function noteTextV9(kind,id){return S.itemNotes?.[noteKeyV9(kind,id)]?.text||''}
function noteActionV9(kind,id){return button('笔记','item-note',`data-note-kind="${esc(kind)}" data-note-id="${esc(id)}"`,'text-button')}
function notePreviewV9(kind,id){const text=noteTextV9(kind,id);return text?`<p class="inline-user-note">${esc(text)}</p>`:''}
function noteEditorV9(kind,id,source,heading=true){const key=noteKeyV9(kind,id),text=S.itemNotes?.[key]?.text||'';window.noteSourcesV9??={};window.noteSourcesV9[key]=source;const field=`<textarea class="memo" data-item-note="${esc(key)}" aria-label="${esc(source.title||'条目')}笔记" placeholder="写下笔记">${esc(text)}</textarea>`;return heading?`<section class="learning-section user-note"><h3>笔记</h3>${field}</section>`:field}
function openItemNoteV9(kind,id){
 let object,source;
 if(kind==='word'){object=byWord(id);if(!object)return;source=contextV9('word',object)}
 else if(kind==='kana'){object=[...D.history.kana,...voiced,...yon].find(k=>k.hira===id);if(!object)return;source=contextV9('kana',object)}
 else return;
 modal('笔记',noteEditorV9(kind,id,source,false));
}
function savedSnapshotV9(item){
 if(item.type==='word'){const w=byWord(item.id);if(w)item.word={id:w.id,word:w.word,kana:w.kana,ruby:w.ruby,meaning:w.meaning,lesson:w.lesson}}
 if(item.type==='grammar'&&!item.source){const g=byLesson(item.lesson)?.grammar[item.gi];item.source={book:window.BOOK_ID,area:'课程',label:'课程 · 第'+item.lesson+'课 · '+(g?.title||'讲解'),route:'lesson/'+item.lesson+'/notes/'+item.gi,title:g?.title||'讲解'}}
 if(!item.source)item.source=contextV9(item.type==='reference'?'reference':item.type==='kana'?'kana':item.type==='word'?'word':'sentence',item.word||item.example||item.kana||item.reference||item);
 item.savedAt??=Date.now();return item;
}
function saveReferenceV9(category,id){const cat=window.STUDY_REFERENCE.categories.find(c=>c.id===category),e=cat?.entries.find(e=>e.id===id);if(e)addSaved({type:'reference',id,category,reference:{title:e.title,titleRuby:e.titleRuby,summary:e.summary},source:{book:window.BOOK_ID,area:'语法',label:'语法 · '+cat.title+' · '+e.title,route:'grammar/'+category+'/'+id,title:e.title}})}
function legacySourceV9(book,item,data){
 if(item.source)return item.type==='kana'&&item.source.route==='kana'?{...item.source,route:'kana/'+encodeURIComponent(item.kana.hira)}:item.source;
 if(item.type==='word'){const w=notebookWordV9(data,item.id);return {book,area:'语汇',label:'语汇'+(w?.lesson?' · 第'+w.lesson+'课':''),route:'vocabulary/word/'+(w?.id||item.id),title:w?.word||'已收藏词语'}}
 if(item.type==='grammar'){const l=data?.lessons.find(l=>l.id===item.lesson),g=l?.grammar[item.gi];return {book,area:'课程',label:'课程 · 第'+item.lesson+'课 · '+(g?.title||'讲解'),route:'lesson/'+item.lesson+'/notes/'+(item.gi||0),title:g?.title||'语法'}}
 const ex=item.example;let found;
 for(const r of data?.readings||[])for(const sec of r.sections)for(const e of sec.entries)if(e.id===ex?.id||e.ja===item.ja)found={book,area:'课程',label:'课程 · 第'+r.lesson+'课 · '+(sec.type==='dialogue'?'会话':'课文'),route:'lesson/'+r.lesson+'/reading/'+sec.type+'/'+sec.entries.indexOf(e),title:e.ja};
 if(found)return found;
 for(const l of data?.lessons||[])for(const [i,g] of l.grammar.entries())if(g.examples.some(e=>e.id===ex?.id||e.ja===item.ja))return {book,area:'课程',label:'课程 · 第'+l.id+'课 · '+g.title,route:'lesson/'+l.id+'/notes/'+i,title:item.ja};
 for(const cat of notebookReferencesV9.get(book)?.categories||[])for(const e of cat.entries)if(e.examples?.some(x=>x.id===ex?.id||x.ja===item.ja)){const x=e.examples.find(x=>x.id===ex?.id||x.ja===item.ja);return {book,area:'语法',label:'语法 · '+cat.title+' · '+e.title,route:'grammar/'+cat.id+'/'+e.id+'/sentence/'+x.id,title:item.ja||x.ja}}
 return {book,area:'课程',label:'课程',route:'lessons',title:item.ja||'收藏'};
}
async function fetchBookJSONV9(book,kind){const path='books/'+book+'/'+kind+'.json.gz?v=12';const r=await fetch(path);if(!r.ok)throw Error('资料未能载入');if('DecompressionStream'in window)return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).json();const text=await(await fetch('books/'+book+'/'+kind+'.js?v=12')).text();return JSON.parse(kind==='audio-extra'?text.split('const x=')[1].split(';window.STUDY_AUDIO.tracks=')[0]:text.slice(text.indexOf('=')+1).replace(/;\s*$/,''))}
function ensureNotebookBookV9(book){
 if(book===window.BOOK_ID){notebookBooksV9.set(book,D);notebookReferencesV9.set(book,window.STUDY_REFERENCE);return}
 if(notebookLoadingV9.has(book))return;
 const state=bookStateV9(book);if(!(state.wrong?.length||Object.values(state.itemNotes||{}).some(n=>n.text)))return;
 const work=(async()=>{
  const [data,audio,extra,reference]=await Promise.all([fetchBookJSONV9(book,'data'),fetchBookJSONV9(book,'audio'),fetchBookJSONV9(book,'audio-extra'),fetchBookJSONV9(book,'reference')]);
  for(const key of ['tracks','clips','byText'])Object.assign(audio[key],extra[key]);
  notebookBooksV9.set(book,data);notebookReferencesV9.set(book,reference);window.OfficialVoice.registerBook(book,audio);
  if(location.hash.startsWith('#notebook'))updateNotebookV9();
 })().catch(()=>{});notebookLoadingV9.set(book,work);
}
function notebookEntriesV9(){
 const result=[];
 for(const book of Object.keys(window.BOOKS)){
  const state=bookStateV9(book),data=book===window.BOOK_ID?D:notebookBooksV9.get(book);
  (state.wrong||[]).forEach((item,index)=>result.push({kind:'saved',book,index,item,source:legacySourceV9(book,item,data),data,date:item.savedAt||0}));
  for(const [lesson,text] of Object.entries(state.notes||{}))if(typeof text==='string'&&text.trim())result.push({kind:'note',book,key:'lesson:'+lesson,text,source:{book,area:'课程',label:'课程 · 第'+lesson+'课',title:'第'+lesson+'课笔记',route:'lesson/'+lesson+'/notes/'+(state.points?.[lesson]||0)},date:0});
  for(const [key,n] of Object.entries(state.itemNotes||{}))if(n.text?.trim())result.push({kind:'note',book,key,text:n.text,source:n.source||{book,area:'笔记',label:'笔记',title:'笔记',route:'lessons'},date:n.updatedAt||0});
 }
 return result.sort((a,b)=>b.date-a.date);
}
function notebookListenV9(book,id,value){const audioID=book===window.BOOK_ID?id:book+'::'+id;return voiceButton(value,audioID,'','听')}
function notebookDataV10(book){return book===window.BOOK_ID?D:notebookBooksV9.get(book)}
function notebookReferenceV10(book){return book===window.BOOK_ID?window.STUDY_REFERENCE:notebookReferencesV9.get(book)}
function notebookUnitV10(book,unit){const data=notebookDataV10(book);if(!data)return unit;const index=readingIndexV10(data,notebookReferenceV10(book));return index.byId.get(unit?.id)||index.byText.get(unit?.ja||unit?.word)||unit}
function notebookSentenceV10(book,unit){const e=notebookUnitV10(book,unit);return e?.ja?`<div class="notebook-study"><p class="notebook-sentence">${jp(e.ja,e.ruby)}</p><p class="translation">${esc(e.zh||'')}</p>${romajiLineV10(e)}${e.id?notebookListenV9(book,e.id,e):''}</div>`:''}
function notebookWordBlockV10(book,w){return w?`<div class="notebook-study"><div class="notebook-word">${jp(w.word,w.ruby)}</div><p class="translation">${esc(w.meaning||'')}</p>${romajiLineV10(notebookUnitV10(book,w))}${notebookListenV9(book,'word:'+w.id,w)}</div>`:'<p class="quiet">正在载入词语…</p>'}
function notebookKanaV10(book,k){return k?`<div class="notebook-study"><div class="notebook-word" lang="ja">${esc(k.hira)} / ${esc(k.kata)}</div><p class="translation">${esc(kanaMeaningV10(k))}</p>${romajiLineV10(kanaRomanV10(k.hira))}${notebookListenV9(book,'kana:'+k.hira,k.hira)}</div>`:''}
function notebookPointV10(book,g){if(!g)return '';const formula=g.formula?`<p class="grammar-formula" lang="ja">${jp(g.formula,g.formulaRuby)}</p>`:'';return `<h2 class="notebook-title">${jp(g.title,g.titleRuby)}</h2>${formula}<p class="translation">${esc(g.summary||g.explanation||'')}</p>${g.formulaRomaji?romajiLineV10(g.formulaRomaji):''}${g.examples?.[0]?notebookSentenceV10(book,g.examples[0]):''}`}
function notebookSourceStudyV10(book,source,key){
 const data=notebookDataV10(book),reference=notebookReferenceV10(book);if(!data)return '<p class="quiet">正在载入内容…</p>';
 const route=(source.route||'').split('/'),type=key?.split(':')[0],id=key?.slice((type?.length||0)+1);
 if(type==='word')return notebookWordBlockV10(book,notebookWordV9(data,id));
 if(type==='kana'){const hira=decodeURIComponent(id||route[1]||'');return notebookKanaV10(book,[...data.history.kana,...voiced,...yon].find(k=>k.hira===hira))}
 if(type==='sentence'){const index=readingIndexV10(data,reference),e=index.byId.get(id);if(e)return notebookSentenceV10(book,e)}
 if(route[0]==='grammar'){const cat=reference?.categories.find(c=>c.id===route[1]),g=cat?.entries.find(g=>g.id===route[2]);return notebookPointV10(book,g)}
 if(route[0]==='lesson'){
  const lesson=data.lessons.find(l=>String(l.id)===route[1]);if(!lesson)return '';
  if(route[2]==='notes'&&type!=='lesson')return notebookPointV10(book,lesson.grammar[Number(route[3])||0]);
  if(route[2]==='reading'){const section=data.readings?.find(r=>String(r.lesson)===route[1])?.sections.find(s=>s.type===route[3]);return notebookSentenceV10(book,section?.entries[Number(route[4])||0])}
  return `<h2 class="notebook-title">${jp(lesson.title,lesson.titleRuby)}</h2><p class="translation">${esc(lesson.titleZh||'')}</p>${romajiLineV10(lesson.titleRomaji||'')}`;
 }
 return '';
}
function notebookEntryV9(row){
 const {book,source}=row;let content='';const data=notebookDataV10(book),reference=notebookReferenceV10(book);
 if(row.kind==='note')content=notebookSourceStudyV10(book,source,row.key)+`<p class="notebook-note">${esc(row.text)}</p>`;
 else{
  const x=row.item;
  if(x.type==='word')content=notebookWordBlockV10(book,notebookWordV9(data,x.id)||x.word);
  else if(x.type==='reference'){const g=reference?.categories.find(c=>c.id===x.category)?.entries.find(e=>e.id===x.id);content=notebookPointV10(book,g||x.reference)}
  else if(x.type==='kana')content=notebookKanaV10(book,x.kana);
  else if(x.type==='grammar'){const g=data?.lessons.find(l=>l.id===x.lesson)?.grammar[x.gi];content=notebookPointV10(book,g)||`<h2 class="notebook-title">${esc(source.title)}</h2>`}
  else content=notebookSentenceV10(book,x.example||{ja:x.ja,zh:x.zh});
 }
 return `<article class="notebook-row"><p class="notebook-source">${esc(bookLabelV9(book))} · ${esc(source.label)}</p>${content}<div class="notebook-actions"><a class="text-button" href="${notebookURLV9(book,source.route)}">打开原处 →</a>${row.kind==='note'?button('编辑','edit-global-note',`data-book="${book}" data-note-key="${esc(row.key)}"`,'text-button'):button('移出','remove-global-saved',`data-book="${book}" data-index="${row.index}"`,'text-button')}</div></article>`;
}
function notebookResultsV9(){const q=norm(notebookQueryV9).toLowerCase();const items=notebookEntriesV9().filter(r=>(notebookFilterV9==='all'||r.kind===notebookFilterV9)&&(notebookBookV9==='all'||r.book===notebookBookV9)&&(notebookAreaV9==='all'||r.source.area===notebookAreaV9)&&(!q||norm(JSON.stringify([r.text,r.item,r.source])).toLowerCase().includes(q)));return items.map(notebookEntryV9).join('')||'<div class="empty">'+(q?'没有匹配内容':'收藏与笔记会保存在这里')+'</div>'}
function updateNotebookV9(start=false){const target=document.querySelector('#notebook-results');if(target)withStudyTransitionV9(()=>{target.innerHTML=notebookResultsV9();if(start)alignLearningContentV9(target);window.OfficialVoice?.sync()},'#notebook-results')}
function notebookViewV9(){
 for(const book of Object.keys(window.BOOKS))ensureNotebookBookV9(book);
 return `<div class="learning-switchboard notebook-switchboard"><div class="switchboard-top"><h1>收藏夹·笔记本</h1><select class="select section-select" aria-label="收藏来源" data-notebook-filter="area">${["all","五十音","课程","语汇","语法"].map(id=>`<option value="${id}" ${notebookAreaV9===id?"selected":""}>${id==="all"?"全部来源":id}</option>`).join("")}</select></div><div class="switchboard-bottom"><div class="notebook-filters">${[['all','全部'],['saved','收藏'],['note','笔记']].map(([id,label])=>button(label,'notebook-filter',`data-filter="${id}"`,notebookFilterV9===id?'active':'')).join('')}</div><select class="select notebook-book-select" aria-label="收藏册别" data-notebook-filter="book">${[['all','全部册别'],...Object.keys(window.BOOKS).map(id=>[id,bookLabelV9(id)])].map(([id,label])=>`<option value="${id}" ${notebookBookV9===id?'selected':''}>${label}</option>`).join('')}</select></div></div><div class="search-line"><input class="search" id="notebook-search" type="search" aria-label="查找收藏与笔记" placeholder="查找收藏与笔记" value="${esc(notebookQueryV9)}"></div><div id="notebook-results">${notebookResultsV9()}</div>`;
}
document.addEventListener('click',event=>{
 const t=event.target.closest('[data-action]');if(!t)return;const action=t.dataset.action;
 if(action==='item-note')openItemNoteV9(t.dataset.noteKind,t.dataset.noteId);
 if(action==='save-reference')saveReferenceV9(t.dataset.category,t.dataset.id);
 if(action==='save-kana'){const k=[...D.history.kana,...voiced,...yon].find(k=>k.hira===t.dataset.kana);if(k)addSaved({type:'kana',id:k.hira,kana:{hira:k.hira,kata:k.kata}})}
 if(action==='notebook-filter'){notebookFilterV9=t.dataset.filter;document.querySelectorAll('[data-action="notebook-filter"]').forEach(b=>b.classList.toggle('active',b===t));updateNotebookV9(true)}
 if(action==='remove-global-saved'){writeBookStateV9(t.dataset.book,state=>state.wrong.splice(Number(t.dataset.index),1));updateNotebookV9()}
 if(action==='edit-global-note'){
  const row=notebookEntriesV9().find(r=>r.kind==='note'&&r.book===t.dataset.book&&r.key===t.dataset.noteKey);if(!row)return;
  modal('笔记',`<p class="notebook-source">${esc(bookLabelV9(row.book))} · ${esc(row.source.label)}</p><textarea class="memo" data-global-note="${esc(row.key)}" data-book="${row.book}" aria-label="编辑笔记">${esc(row.text)}</textarea>`);
 }
});
let editedItemNoteV9=false;
document.addEventListener('input',event=>{
 const t=event.target;
 if(t.id==='notebook-search'){notebookQueryV9=t.value;updateNotebookV9()}
 if(t.dataset.itemNote){S.itemNotes??={};S.itemNotes[t.dataset.itemNote]={text:t.value,source:window.noteSourcesV9[t.dataset.itemNote],updatedAt:Date.now()};editedItemNoteV9=true;save()}
 if(t.dataset.globalNote){writeBookStateV9(t.dataset.book,state=>{if(t.dataset.globalNote.startsWith('lesson:'))state.notes[t.dataset.globalNote.slice(7)]=t.value;else state.itemNotes[t.dataset.globalNote]={...state.itemNotes[t.dataset.globalNote],text:t.value,updatedAt:Date.now()}});updateNotebookV9()}
});
document.querySelector('#dialog').addEventListener('close',()=>{if(editedItemNoteV9){editedItemNoteV9=false;if(location.hash===shownRouteV8)render({immediate:true})}});
window.addEventListener('storage',()=>{if(location.hash.startsWith('#notebook'))updateNotebookV9()});

document.addEventListener('change',event=>{const kind=event.target.dataset.notebookFilter;if(kind==='book')notebookBookV9=event.target.value;if(kind==='area')notebookAreaV9=event.target.value;if(kind)updateNotebookV9(true)});

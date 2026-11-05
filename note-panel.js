'use strict';
let notePanelV29=null,noteAnchorV29=null,notePanelFrameV29=0;
function closeNotePanelV29(refresh=true){if(!notePanelV29)return;const p=notePanelV29;notePanelV29=null;noteAnchorV29?.setAttribute('aria-expanded','false');noteAnchorV29=null;try{p.hidePopover?.()}catch{}p.remove();if(refresh&&location.hash.startsWith('#notebook'))updateNotebookV9()}
function placeNotePanelV29(){
 if(!notePanelV29||!noteAnchorV29?.isConnected){closeNotePanelV29(false);return}
 const p=notePanelV29,r=noteAnchorV29.getBoundingClientRect(),vw=document.documentElement.clientWidth,vh=window.visualViewport?.height||innerHeight,w=Math.min(390,vw-24),h=Math.min(p.scrollHeight,vh-24);let x=r.right+12,y=r.top-12;
 if(x+w>vw-12){x=Math.max(12,Math.min(r.left,vw-w-12));y=r.bottom+10}
 if(y+h>vh-12)y=Math.max(12,vh-h-12);p.style.width=w+'px';p.style.left=x+'px';p.style.top=y+'px';p.style.maxHeight=(vh-24)+'px';p.style.transformOrigin=Math.max(0,Math.min(w,r.right-x))+'px '+Math.max(0,Math.min(h,r.top-y))+'px';
}
function openNotePanelV29(anchor,{book,key,source,text}){
 if(notePanelV29&&noteAnchorV29===anchor){closeNotePanelV29();return}closeNotePanelV29(false);if(!anchor)return;
 const p=document.createElement('section');p.className='note-comment-panel';p.setAttribute('role','dialog');p.setAttribute('aria-label',source.label+'笔记');p.setAttribute('popover','manual');
 p.innerHTML=`<div class="note-comment-head"><span>笔记</span><button type="button" data-action="close-note-panel" aria-label="关闭笔记">×</button></div><p class="note-comment-source">${esc(bookLabelV9(book))} · ${esc(source.label)}</p><div class="note-comment-context">${mixedJapaneseV18(source.title||source.label)}</div><textarea class="memo" data-global-note="${esc(key)}" data-book="${esc(book)}" aria-label="${esc(source.label)}笔记" placeholder="写下笔记">${esc(text||'')}</textarea><p class="quiet note-autosave">自动保存</p>`;
 writeBookStateV9(book,state=>{if(!key.startsWith('lesson:')){state.itemNotes??={};state.itemNotes[key]??={text:text||'',source,updatedAt:Date.now()}}});
 (anchor.closest('dialog')||document.body).append(p);notePanelV29=p;noteAnchorV29=anchor;anchor.setAttribute('aria-expanded','true');if(p.showPopover){try{p.showPopover()}catch{p.removeAttribute('popover')}}else p.removeAttribute('popover');placeNotePanelV29();
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches)p.animate([{opacity:0,transform:'translateX(-8px) scale(.97)'},{opacity:1,transform:'translateX(0) scale(1)'}],{duration:190,easing:'ease-out'});p.querySelector('textarea').focus({preventScroll:true});
}
function openItemNoteV9(kind,id,anchor){
 let object,source;
 if(kind==='word'){object=byWord(id);if(object)source=contextV9('word',object)}
 if(kind==='kana'){object=[...D.history.kana,...voiced,...yon].find(k=>k.hira===id);if(object)source=contextV9('kana',object)}
 if(kind==='sentence'){object=readingIndexV10(D,window.STUDY_REFERENCE).byId.get(id);if(object)source=contextV9('sentence',object)}
 if(kind==='course'){const [l,i]=id.split(':').map(Number),g=byLesson(l)?.grammar[i];if(g){object=g;source={book:window.BOOK_ID,area:'课程',label:'课程 · 第'+l+'课 · '+g.title,title:g.title,route:'lesson/'+l+'/notes/'+i}}}
 if(kind==='reference'){const cat=window.STUDY_REFERENCE.categories.find(c=>c.entries.some(e=>e.id===id));object=cat?.entries.find(e=>e.id===id);if(object)source={book:window.BOOK_ID,area:'语法',label:'语法 · '+cat.title+' · '+object.title,title:object.title,route:'grammar/'+cat.id+'/'+id}}
 if(!source)return;openNotePanelV29(anchor,{book:window.BOOK_ID,key:noteKeyV9(kind,id),source,text:noteTextV9(kind,id)});
}
function writeKanaPairV29(hira){const k=[...D.history.kana,...voiced,...yon].find(k=>k.hira===hira||k.kata===hira);if(!k)return;modal('书写',`<div class="writing-pair">${[['hira','平假名',k.hira],['kata','片假名',k.kata]].map(([id,label,glyph])=>`<section><h3>${label}</h3><p class="writing-glyph" lang="ja">${esc(glyph)}</p>${romajiLineV10(kanaRomanV10(k.hira))}<div class="writing-sheet"><span class="writing-guide" lang="ja" aria-hidden="true">${esc(glyph)}</span><canvas class="writing" id="writing-${id}" aria-label="${label}${glyph}书写区" width="600" height="450"></canvas></div>${button('清空','clear-writing',`data-canvas="writing-${id}"`,'text-button')}</section>`).join('')}</div>`,()=>{setupCanvas('writing-hira');setupCanvas('writing-kata')})}
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-action]');if(!t)return;
 if(t.dataset.action==='close-note-panel')closeNotePanelV29();
 if(t.dataset.action==='save-course-point'){const lesson=Number(t.dataset.lesson),gi=Number(t.dataset.point);addSaved({type:'grammar',lesson,gi})}
 if(t.dataset.action==='save-reading-sentence'){const ex=readingIndexV10(D,window.STUDY_REFERENCE).byId.get(t.dataset.sentenceId);if(ex)addSaved({type:'sentence',id:ex.id,ja:ex.ja,zh:ex.zh,example:ex})}
 if(t.dataset.action==='saved-note'){
  const book=t.dataset.book,state=bookStateV9(book),item=state.wrong[Number(t.dataset.index)];if(!item)return;const data=notebookDataV10(book),source=legacySourceV9(book,item,data),kind=item.type==='grammar'?'course':item.type==='reference'?'reference':item.type==='exam'?'exam':item.type,key=kind+':'+(kind==='course'?item.lesson+':'+item.gi:item.id||item.example?.id||item.kana?.hira);
  if(kind==='exam'){state.examItems??={};state.examItems[item.id]=item.exam}
  openNotePanelV29(t,{book,key,source,text:key.startsWith('lesson:')?state.notes?.[key.slice(7)]||'':state.itemNotes?.[key]?.text||''});
 }
});
document.addEventListener('pointerdown',e=>{if(notePanelV29&&!notePanelV29.contains(e.target)&&!e.target.closest('[data-action="item-note"],[data-action="exam-note"],[data-action="edit-global-note"],[data-action="saved-note"]'))closeNotePanelV29()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&notePanelV29){e.preventDefault();e.stopImmediatePropagation();closeNotePanelV29()}},true);
for(const event of ['scroll','resize'])window.addEventListener(event,()=>{if(notePanelV29&&!notePanelFrameV29)notePanelFrameV29=requestAnimationFrame(()=>{notePanelFrameV29=0;placeNotePanelV29()})},{capture:true,passive:true});
let headerObserverV29,sectionObserverV29;
function syncStickyHeadersV29(){const h=document.querySelector('.site-header'),board=document.querySelector('.learning-switchboard,.grammar-switchboard');const measure=()=>{document.documentElement.style.setProperty('--site-header-height',(document.querySelector('.site-header')?.getBoundingClientRect().height||0)+'px');document.documentElement.style.setProperty('--section-header-height',(document.querySelector('.learning-switchboard,.grammar-switchboard')?.getBoundingClientRect().height||0)+'px')};measure();if(!headerObserverV29&&window.ResizeObserver){headerObserverV29=new ResizeObserver(measure);headerObserverV29.observe(h)}sectionObserverV29?.disconnect();if(board&&window.ResizeObserver){sectionObserverV29=new ResizeObserver(measure);sectionObserverV29.observe(board)}}

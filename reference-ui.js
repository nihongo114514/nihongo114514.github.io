'use strict';
let shownRouteV8='',pendingNavigationV8=null,grammarQueryV8='',vocabularyQueryV8='',vocabularyPosV8='all';
const positionsV8=new Map();
const detailStatesV8=new Map();
let conjugationKindV8='verb',conjugationWordV8=0;
function verbTableV8(index=conjugationWordV8){
 const groups=window.STUDY_REFERENCE.conjugations,group=groups.find(x=>x.id===conjugationKindV8)||groups[0];conjugationWordV8=Math.min(index,group.entries.length-1);const word=group.entries[conjugationWordV8];
 modal('活用查询',`<div class="controls"><select class="select" aria-label="活用词类" data-change="conjugation-kind">${groups.map(x=>`<option value="${x.id}" ${x.id===group.id?'selected':''}>${x.title}</option>`).join('')}</select><select class="select" aria-label="活用词例" data-change="conjugation-word">${group.entries.map((x,i)=>`<option value="${i}" ${i===conjugationWordV8?'selected':''}>${esc(x.title)}</option>`).join('')}</select></div><div class="reference-forms conjugation-forms">${word.forms.map(f=>`<div class="reference-form"><div class="form-label">${f.label}</div><div class="form-jp">${jp(f.ja,f.ruby)}</div>${voiceButton(f,f.id,'form-listen','听','sentence')}</div>`).join('')}</div>`);
}
const lessonHasWordV8=(w,id)=>w.lesson===Number(id)||(w.lessons||[]).includes(Number(id));
function rememberDetailsV8(){if(shownRouteV8)detailStatesV8.set(shownRouteV8,[...document.querySelectorAll('#main details')].filter(e=>e.open).map((e,i)=>e.dataset.detailKey||e.querySelector('summary')?.textContent+'|'+[...document.querySelectorAll('#main details')].indexOf(e)))}
function rememberPositionV8(){if(shownRouteV8)positionsV8.set(shownRouteV8,scrollY);rememberDetailsV8();if(document.querySelector('.lesson-head')){S.lastCourseY=scrollY;save()}}
function navigateV8(target,options={}){
 rememberPositionV8();const old=shownRouteV8,hash='#'+target;
 let y=Number.isFinite(options.y)?options.y:null,anchor=null;
 if(options.anchor){const el=document.querySelector(options.anchor);if(el)anchor={selector:options.anchor,top:el.getBoundingClientRect().top}}
 if(y===null&&(/^#lesson\//.test(old)&&/^#lesson\//.test(hash)||old===hash||options.keep))y=scrollY;
 pendingNavigationV8={hash,y,anchor};
 if(location.hash===hash)render();else location.hash=target;
}
function renderV8(){
 const hash=location.hash||'#',old=shownRouteV8,oldY=scrollY;
 rememberDetailsV8();
 if(old)positionsV8.set(old,oldY);
 let [r,a,b,c,d]=hash.slice(1).split('/');
 if(!r||r==='home'){r='lesson';a=S.lastLesson||1;b='notes';c=S.points[a]||0}
 if(r==='reader'){r='lesson';a=S.lastLesson||1;b='reading';c=0}
 if(r==='resources'||r==='settings'){r='lessons';setTimeout(settings,0)}
 if(r==='lab')r='grammar';if(r==='cards')r='vocabulary';
 nav(r);activeExamples=[];
 const views={lessons:courses,lesson:()=>lessonView(a,b,c,d),kana:kanaView,grammar:()=>grammarViewV8(a,b),vocabulary:()=>vocabularyViewV8(a,b)};
 $('#main').innerHTML=(views[r]||courses)()+`<footer class="page-footer">${button('回到顶端 ↑','back-top','','text-button')}</footer>`;
 const openDetails=detailStatesV8.get(hash)||[];document.querySelectorAll('#main details').forEach((e,i)=>{if(openDetails.includes(e.dataset.detailKey||e.querySelector('summary')?.textContent+'|'+i))e.open=true});
 furiState();window.OfficialVoice?.sync();shownRouteV8=hash;
 if(r==='lesson'){S.lastCourseRoute=['lesson',a,b||'notes',c??0,d].filter(x=>x!==undefined).join('/');save()}
 const pending=pendingNavigationV8;pendingNavigationV8=null;
 let y=pending&&pending.hash===hash?pending.y:null;
 if(y===null)y=hash===old?oldY:(positionsV8.get(hash)??0);
 if(pending?.anchor){const el=document.querySelector(pending.anchor.selector);if(el)y=scrollY+el.getBoundingClientRect().top-pending.anchor.top}
 window.scrollTo({top:Math.max(0,y),behavior:'instant'});
 if(old&&old!==hash&&!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#main').animate([{opacity:.6},{opacity:1}],{duration:140,easing:'ease-out'});
}
function returnCourseV8(){return S.lastCourseRoute?button('← 返回第'+(S.lastCourseRoute.split('/')[1]||S.lastLesson)+'课','return-course','','text-button'):''}
function vocabularyTabsV8(active){return `<div class="tabs vocabulary-tabs">${[['','词表'],['cards','词卡'],['saved','收藏']].map(([id,t])=>`<a class="tab ${active===id?'active':''}" href="#vocabulary${id?'/'+id:''}">${t}</a>`).join('')}</div>`}
function vocabularyViewV8(mode,id){
 if(mode==='saved'||mode==='wrong')return `<div class="page-top"><h1>语汇 · 收藏</h1>${returnCourseV8()}</div>${vocabularyTabsV8('saved')}`+savedView().replace(/^<div class="page-top">[\s\S]*?<\/div>/,'');
 if(mode==='cards'||mode==='lesson')return reviewViewV8(mode==='lesson'?id:null);
 const words=filteredVocabularyV8();
 return `<div class="page-top"><h1>语汇</h1>${returnCourseV8()}</div>${vocabularyTabsV8('')}<div class="controls">${button(S.preset==='all'?'全书':S.scope.join('—')+'课','range','','text-button')}<select class="select" aria-label="语汇词类" data-change="vocabulary-pos">${[['all','全部词类'],['名','名词'],['動','动词'],['形','形容词'],['副','副词'],['助','助词与助动词'],['数','数词']].map(([k,v])=>`<option value="${k}" ${vocabularyPosV8===k?'selected':''}>${v}</option>`).join('')}</select></div><div class="search-line"><input class="search" type="search" id="vocabulary-search" aria-label="查找本册语汇" placeholder="日语、读音或中文" value="${esc(vocabularyQueryV8)}"></div><div id="vocabulary-results">${wordList(words,S.vocabularyPage||0)}</div>`;
}
function filteredVocabularyV8(){
 const q=norm(vocabularyQueryV8).toLowerCase();return D.vocab.filter(w=>(w.lesson===0&&S.preset==='all'||(w.lessons||[w.lesson]).some(n=>n>=S.scope[0]&&n<=S.scope[1]))&&(!q||norm(w.search||w.word+' '+w.kana+' '+w.meaning).toLowerCase().includes(q))&&(vocabularyPosV8==='all'||(vocabularyPosV8==='数'?/数|量词|计数/.test(w.pos):vocabularyPosV8==='動'?/[动動]|[自他][五一サカ]/.test(w.pos):vocabularyPosV8==='形'?/[形]/.test(w.pos):w.pos.includes(vocabularyPosV8))));
}
function reviewViewV8(lessonId){
 const words=dueWords(lessonId);window.reviewWords=words;if(reviewIndex>=words.length)reviewIndex=0;const w=words[reviewIndex];
 return `<div class="page-top"><h1>语汇 · 词卡</h1>${returnCourseV8()}</div>${vocabularyTabsV8('cards')}<div class="review-top"><span>${lessonId?'第'+lessonId+'课':(S.preset==='all'?'全书':S.scope.join('—')+'课')}</span><span>${words.length} 词待复习</span></div>${w?`<button class="flashcard" data-action="flip" aria-label="翻转词卡"><span class="word">${jp(w.word,w.ruby)}</span>${flipped?`<span class="meaning">${esc(w.meaning)}</span><span class="pos">${esc(w.pos)}</span>`:''}</button><div class="sentence-actions" style="justify-content:center">${voiceButton(w,window.OfficialVoice?.wordId(w.id),'','听')}${button('收藏','save-word',`data-id="${w.id}"`)}</div><div class="review-actions">${button('再看','review-word',`data-id="${w.id}" data-result="again"`)}${button('认识','review-word',`data-id="${w.id}" data-result="good"`,'know')}</div>`:'<div class="empty">本轮已完成</div>'}`;
}
function grammarViewV8(category,id){
 const R=window.STUDY_REFERENCE;if(!R)return '<p>语法资料载入中。</p>';
 const cat=R.categories.find(x=>x.id===category),entry=cat?.entries.find(x=>x.id===id);
 if(entry)return grammarEntryViewV8(cat,entry);
 const categories=cat?[cat]:R.categories;
 return `<div class="page-top"><h1>语法</h1>${button('活用查询','verb-table','','text-button')}</div><div class="search-line"><input class="search" type="search" id="grammar-search" aria-label="查找语法" placeholder="数词、活用、助词或句型" value="${esc(grammarQueryV8)}"></div><div id="grammar-results">${grammarIndexV8(categories,grammarQueryV8,!!cat)}</div><details class="detail"><summary>参考资料</summary><div class="refs">${(R.sources||[]).map(x=>`<p><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></p>`).join('')}<p>${esc(R.coverageNote||'')}</p></div></details>`;
}
function grammarIndexV8(categories,query='',expanded=false){
 const q=norm(query).toLowerCase();
 if(q||expanded)return categories.flatMap(c=>c.entries.filter(e=>!q||norm([e.title,e.summary,e.formula,e.search,...(e.notes||[]),...(e.forms||[]).flatMap(x=>[x.ja,x.kana,x.zh]),...(e.examples||[]).flatMap(x=>[x.ja,x.kana,x.zh])].filter(Boolean).join(' ')).toLowerCase().includes(q)).map(e=>`<a class="reference-row" href="#grammar/${c.id}/${e.id}"><span>${jp(e.title,e.titleRuby)}</span><small>${esc(e.sourceLabel||c.title)}</small></a>`)).join('')||'<div class="empty">未找到</div>';
 return categories.map(c=>`<details class="reference-category" data-detail-key="${c.id}"><summary><span>${esc(c.title)}</span><small>${c.entries.length}</small></summary>${c.entries.map(e=>`<a class="reference-row" href="#grammar/${c.id}/${e.id}"><span>${jp(e.title,e.titleRuby)}</span><small>${esc(e.sourceLabel||'')}</small></a>`).join('')}</details>`).join('');
}
function grammarEntryViewV8(cat,e){
 const i=cat.entries.findIndex(x=>x.id===e.id);
 return `<div class="page-top"><h1>语法</h1><a href="#grammar/${cat.id}" class="text-button">${esc(cat.title)}</a></div><div class="point-nav reference-picker"><select class="select" data-change="reference-entry" data-category="${cat.id}" aria-label="语法条目">${cat.entries.map(x=>`<option value="${x.id}" ${x.id===e.id?'selected':''}>${esc(x.title)}</option>`).join('')}</select><span class="quiet">${i+1} / ${cat.entries.length}</span></div><h2 class="reference-title">${jp(e.title,e.titleRuby)}</h2>${e.formula?`<div class="formula">${jp(e.formula,e.formulaRuby)}</div>`:''}<p class="explanation">${esc(e.summary)}</p>${(e.notes||[]).map(n=>`<p class="reference-note">${esc(n)}</p>`).join('')}${e.forms?.length?`<div class="reference-forms">${e.forms.map(f=>`<div class="reference-form"><div class="form-label">${esc(f.label||'')}</div><div class="form-jp">${jp(f.ja,f.ruby)}</div><div class="form-meaning">${esc(f.zh||'')}${f.note?`<small>${esc(f.note)}</small>`:''}</div>${voiceButton(f,f.id,'form-listen','听','sentence')}</div>`).join('')}</div>`:''}${(e.examples||[]).map((x,j)=>sentence(x,j)).join('')}${e.lesson?`<p class="reference-source"><a class="quiet" href="#lesson/${e.lesson}/notes/${e.point||0}">教材第${e.lesson}课</a></p>`:''}<div class="pager reference-pager">${i>0?`<a href="#grammar/${cat.id}/${cat.entries[i-1].id}">← 上一节</a>`:'<span></span>'}${i+1<cat.entries.length?`<a href="#grammar/${cat.id}/${cat.entries[i+1].id}">下一节 →</a>`:'<span></span>'}</div>`;
}
function installV8Navigation(){
 history.scrollRestoration='manual';
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const target=a.getAttribute('href').slice(1);if(target==='main')return;
  e.preventDefault();let anchor=null;
  if(a.closest('.reference-pager'))anchor='.reference-pager';
  navigateV8(target,anchor?{anchor}:{});
 },true);
 document.addEventListener('click',e=>{
  const t=e.target.closest('[data-action]');if(!t)return;
  if(t.dataset.action==='back-top')window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  if(t.dataset.action==='return-course')navigateV8(S.lastCourseRoute,{y:S.lastCourseY||0});
 });
 document.addEventListener('change',e=>{
  if(e.target.dataset.change==='conjugation-kind'){conjugationKindV8=e.target.value;conjugationWordV8=0;verbTableV8(0)}
  if(e.target.dataset.change==='conjugation-word')verbTableV8(Number(e.target.value));
  if(e.target.dataset.change==='reference-entry')navigateV8('grammar/'+e.target.dataset.category+'/'+e.target.value,{anchor:'.reference-picker'});
  if(e.target.dataset.change==='vocabulary-pos'){vocabularyPosV8=e.target.value;S.vocabularyPage=0;$('#vocabulary-results').innerHTML=wordList(filteredVocabularyV8(),0)}
 });
 document.addEventListener('input',e=>{
  if(e.target.id==='grammar-search'){grammarQueryV8=e.target.value;$('#grammar-results').innerHTML=grammarIndexV8(window.STUDY_REFERENCE.categories,grammarQueryV8)}
  if(e.target.id==='vocabulary-search'){vocabularyQueryV8=e.target.value;S.vocabularyPage=0;$('#vocabulary-results').innerHTML=wordList(filteredVocabularyV8(),0)}
 });
}

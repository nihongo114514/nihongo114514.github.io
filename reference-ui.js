'use strict';
const studyTransitionStatesV9=new WeakMap();
function withStudyTransitionV9(update,selector='#main',immediate=false){
 const element=document.querySelector(selector);if(!element){update();return}
 const previous=studyTransitionStatesV9.get(element),opacity=getComputedStyle(element).opacity;previous?.animation?.cancel();
 for(const animation of element.getAnimations())if(animation.id==='study-enter')animation.cancel();
 const state={animation:null};studyTransitionStatesV9.set(element,state);const current=()=>studyTransitionStatesV9.get(element)===state;
 if(immediate||!element.animate||matchMedia('(prefers-reduced-motion: reduce)').matches){update();element.dataset.transitionPhase='idle';return}
 element.dataset.transitionPhase='out';element.dataset.transitionEngine='fade';state.animation=element.animate([{opacity},{opacity:0}],{duration:75,easing:'ease-out',fill:'forwards'});
 state.animation.finished.then(()=>{
  if(!current())return;update();state.animation.cancel();element.dataset.transitionPhase='in';state.animation=element.animate([{opacity:0},{opacity:1}],{duration:140,easing:'ease-out'});return state.animation.finished;
 }).then(()=>{if(current())element.dataset.transitionPhase='idle'}).catch(()=>{});
}
function closeModalV9(){if($('#dialog').open)withStudyTransitionV9(()=>$('#dialog').close(),'#dialog-content')}
function alignLearningContentV9(target){const board=document.querySelector('.learning-switchboard,.grammar-switchboard');if(board&&board.getBoundingClientRect().top<=(document.querySelector('.site-header')?.getBoundingClientRect().height||0)+1)window.scrollTo({top:Math.max(0,scrollY+target.getBoundingClientRect().top-board.getBoundingClientRect().bottom-18),behavior:'instant'})}
function switchWordPageV9(t){const target=$('#word-results')||$('#all-word-results')||$('#vocabulary-results');if(!target)return;withStudyTransitionV9(()=>{target.innerHTML=wordList(window.filteredWords||[],Number(t.dataset.page));if(target.id==='vocabulary-results'){S.vocabularyPage=wordPage;save()}else if(target.id==='word-results'){S.wordPages??={};S.wordPages[S.lastLesson]=wordPage;save()}alignLearningContentV9(target)},'#'+target.id)}

let shownRouteV8='',pendingNavigationV8=null,vocabularyPosV8='all';
const positionsV8=new Map();
const detailStatesV8=new Map();
let conjugationKindV8='verb',conjugationWordV8=0;
function verbTableV8(index=conjugationWordV8){
 const groups=window.STUDY_REFERENCE.conjugations,group=groups.find(x=>x.id===conjugationKindV8)||groups[0];conjugationWordV8=Math.min(index,group.entries.length-1);const word=group.entries[conjugationWordV8];
 modal('活用查询',`<div class="controls"><select class="select" aria-label="活用词类" data-change="conjugation-kind">${groups.map(x=>`<option value="${x.id}" ${x.id===group.id?'selected':''}>${x.title}</option>`).join('')}</select><select class="select" aria-label="活用词例" data-change="conjugation-word">${group.entries.map((x,i)=>`<option value="${i}" ${i===conjugationWordV8?'selected':''}>${esc(x.title)}</option>`).join('')}</select></div><div class="conjugation-headword"><div class="form-jp">${jp(word.title,word.ruby)}</div><div class="translation">${esc(word.titleZh||'')}</div>${romajiLineV10(word.titleRomaji||'')}</div><div class="reference-forms conjugation-forms">${word.forms.map(f=>`<div class="reference-form"><div class="form-label">${esc(f.label)}</div><div class="form-jp">${jp(f.ja,f.ruby)}</div><div class="translation form-meaning">${esc(f.zh)}</div>${romajiLineV10(f)}<div class="form-audio">${voiceButton(f,f.id,'form-listen','听','sentence')}<span class="bookmark-actions">${button('收藏','save-reading-sentence',`data-sentence-id="${f.id}"`,'text-button')}${noteActionV9('sentence',f.id)}</span></div></div>`).join('')}</div>`);
}
const lessonHasWordV8=(w,id)=>w.lesson===Number(id)||(w.lessons||[]).includes(Number(id));
function rememberDetailsV8(){if(shownRouteV8)detailStatesV8.set(shownRouteV8,[...document.querySelectorAll('#main details')].filter(e=>e.open).map((e,i)=>e.dataset.detailKey||e.querySelector('summary')?.textContent+'|'+[...document.querySelectorAll('#main details')].indexOf(e)))}
function rememberPositionV8(){if(shownRouteV8)positionsV8.set(shownRouteV8,scrollY);rememberDetailsV8()}
function navigateV8(target,options={}){
 rememberPositionV8();const old=shownRouteV8,hash='#'+target;
 let y=Number.isFinite(options.y)?options.y:null,anchor=null;
 window.scrollTo({top:scrollY,behavior:'instant'});
 if(options.anchor){const el=document.querySelector(options.anchor),board=document.querySelector('.learning-switchboard,.grammar-switchboard');let top=el?.getBoundingClientRect().top;if(options.anchor==='.sentence-block')top=Math.max(top||0,(board?.getBoundingClientRect().bottom||0)+18);if(el||options.anchor==='.sentence-block')anchor={selector:options.anchor,top}}
 if(y===null&&(/^#lesson\//.test(old)&&/^#lesson\//.test(hash)||old===hash||options.keep))y=scrollY;
 pendingNavigationV8={hash,y,anchor};
 if(location.hash===hash)render();else location.hash=target;
}
function renderV8(){
 const hash=location.hash||'#',old=shownRouteV8,oldY=scrollY;
 rememberDetailsV8();
 if(old)positionsV8.set(old,oldY);
 let [r,a,b,c,d]=hash.slice(1).split('/');
 const legacyWord=r==='vocabulary'&&a==='word'?b:r==='lesson'&&b==='vocab'&&c==='word'?d:null,redirect=D.vocabRedirects?.[legacyWord];
 if(redirect){const parts=redirect.route.split('/');[r,a,b,c,d]=parts;history.replaceState(null,'','#'+redirect.route)}
 if(!r||r==='home'){r='lesson';a=S.lastLesson||1;b='notes';c=S.points[a]||0}
 if(r==='reader'){r='lesson';a=S.lastLesson||1;b='reading';c=0}
 if(r==='resources'||r==='settings'){r='lessons';setTimeout(settings,0)}
 if(r==='lab')r='grammar';if(r==='cards'){r='vocabulary';a=a||'cards'}if(r==='vocabulary'&&['saved','wrong'].includes(a))r='notebook';
 let focusedKana='';if(r==='kana'&&a&&hash!==old){try{focusedKana=decodeURIComponent(a)}catch{}if(voiced.some(k=>k.hira===focusedKana))kanaGroup='voiced';else if(yon.some(k=>k.hira===focusedKana))kanaGroup='yoon';else kanaGroup='basic'}
 nav(r);activeExamples=[];
 const views={lessons:courses,lesson:()=>lessonView(a,b,c,d),kana:kanaView,grammar:()=>grammarViewV8(a,b),vocabulary:()=>vocabularyViewV8(a,b),exam:()=>examViewV29(a,b),notebook:notebookViewV9};
 closeNotePanelV29(false);
 $('#main').innerHTML=(views[r]||courses)()+`<footer class="page-footer">${button('回到顶端 ↑','back-top','','text-button')}</footer>`;
 if(r==='lesson'&&b==='reading'){const board=document.querySelector('.course-switchboard');for(const selector of ['.reading-controls','.reading-picker']){const part=document.querySelector(selector);if(board&&part)board.append(part)}}
 const openDetails=detailStatesV8.get(hash)||[];document.querySelectorAll('#main details').forEach((e,i)=>{if(openDetails.includes(e.dataset.detailKey||e.querySelector('summary')?.textContent+'|'+i))e.open=true});
 syncStickyHeadersV29();furiState();window.OfficialVoice?.sync();shownRouteV8=hash;if(focusedKana)requestAnimationFrame(()=>kanaCard(focusedKana));
 const pending=pendingNavigationV8;pendingNavigationV8=null;
 let y=pending&&pending.hash===hash?pending.y:null;
 if(y===null)y=hash===old?oldY:(positionsV8.get(hash)??0);
 if(pending?.anchor){const el=document.querySelector(pending.anchor.selector);if(el){const board=el.closest('.grammar-switchboard,.learning-switchboard'),position=board?.style.position;if(board)board.style.position='relative';y=scrollY+el.getBoundingClientRect().top-pending.anchor.top;if(board)board.style.position=position}}
 window.scrollTo({top:Math.max(0,y),behavior:'instant'});
 const focusedSentence=/\/sentence\/([^/]+)$/.exec(hash);if(focusedSentence&&hash!==old){const target=document.querySelector('[data-source-sentence="'+CSS.escape(focusedSentence[1])+'"]'),board=document.querySelector('.learning-switchboard,.grammar-switchboard');if(target)window.scrollTo({top:Math.max(0,scrollY+target.getBoundingClientRect().top-(board?.getBoundingClientRect().height||0)-(document.querySelector('.site-header')?.getBoundingClientRect().height||0)-18),behavior:'instant'})}

}

function courseSelectorV9(id='',tab='notes'){return `<select class="select section-select" aria-label="课程课次" data-change="course-lesson" data-tab="${esc(tab)}"><option value="" ${id?'':'selected'}>全部课程</option>${D.lessons.map(l=>`<option value="${l.id}" ${Number(id)===l.id?'selected':''}>第${l.id}课 · ${esc(l.title)}</option>`).join('')}</select>`}
function kanaGroupSelectorV9(inCard=false){return `<select class="select section-select" aria-label="假名分组" data-change="${inCard?'kana-card-group':'kana-group'}">${[['basic','清音'],['voiced','浊音 · 半浊音'],['yoon','拗音']].map(([id,label])=>`<option value="${id}" ${kanaGroup===id?'selected':''}>${label}</option>`).join('')}</select>`}
function vocabularyLessonSelectV9(){const value=String(S.vocabularyLesson||'all');return `<select class="select section-select" aria-label="语汇课次" data-change="vocabulary-lesson">${[['all','全书'],...D.lessons.map(l=>[String(l.id),'第'+l.id+'课 · '+l.title]),['supplement','补充语汇']].map(([id,label])=>`<option value="${id}" ${value===id?'selected':''}>${esc(label)}</option>`).join('')}</select>`}
function vocabularySwitchboardV9(active){return `<div class="learning-switchboard vocabulary-switchboard"><div class="switchboard-top"><h1>语汇</h1>${vocabularyLessonSelectV9()}</div><div class="switchboard-bottom">${vocabularyTabsV8(active)}<select class="select word-class-select" aria-label="语汇词类" data-change="vocabulary-pos">${[['all','全部词类'],['名','名词'],['動','动词'],['形','形容词'],['副','副词'],['助','助词与助动词'],['数','数词']].map(([id,label])=>`<option value="${id}" ${vocabularyPosV8===id?'selected':''}>${label}</option>`).join('')}</select></div></div>`}
function vocabularyTabsV8(active){return `<div class="tabs vocabulary-tabs">${[['','词表'],['cards','词卡']].map(([id,t])=>`<a class="tab ${active===id?'active':''}" href="#vocabulary${id?'/'+id:''}">${t}</a>`).join('')}</div>`}
function vocabularyViewV8(mode,id){
 if(mode==='saved'||mode==='wrong')return notebookViewV9();
 if(mode==='cards'||mode==='lesson')return reviewViewV8(mode==='lesson'?id:null);
 if(mode==='word'&&byWord(id)){const w=byWord(id);S.vocabularyLesson=w.lesson?String(w.lesson):'supplement';S.vocabularyPage=0;vocabularyPosV8='all'}
 const words=mode==='word'&&byWord(id)?[byWord(id)]:filteredVocabularyV8();
 return `${vocabularySwitchboardV9('')}<div id="vocabulary-results">${wordList(words,S.vocabularyPage||0)}</div>`;
}
function filteredVocabularyV8(){
 return D.vocab.filter(w=>(S.vocabularyLesson==='supplement'?w.lesson===0:Number(S.vocabularyLesson)>0?lessonHasWordV8(w,S.vocabularyLesson):true)&&(vocabularyPosV8==='all'||(vocabularyPosV8==='数'?/数|量词|计数/.test(w.pos):vocabularyPosV8==='動'?/[动動]|[自他][五一サカ]/.test(w.pos):vocabularyPosV8==='形'?/[形]/.test(w.pos):w.pos.includes(vocabularyPosV8))));
}
function reviewViewV8(lessonId){if(lessonId)S.vocabularyLesson=String(lessonId);const words=filteredVocabularyV8().filter(w=>!S.cards[w.id]||S.cards[w.id].due<=Date.now());window.reviewWords=words;if(reviewIndex>=words.length)reviewIndex=0;const w=words[reviewIndex];return `${vocabularySwitchboardV9('cards')}<div class="review-top"><span>${Number(S.vocabularyLesson)>0?'第'+S.vocabularyLesson+'课':S.vocabularyLesson==='supplement'?'补充语汇':'全书'}</span><span>${words.length} 词待复习</span></div>${w?`<article class="flashcard"><div class="word">${jp(w.word,w.ruby)}</div><div class="translation">${esc(w.meaning)}</div>${romajiLineV10(w)}<div class="pos">${esc(w.pos)}</div></article><div class="sentence-actions">${voiceButton(w,window.OfficialVoice?.wordId(w.id),'','听')}<span class="bookmark-actions">${button('收藏','save-word',`data-id="${w.id}"`)}${noteActionV9('word',w.id)}</span></div><div class="review-actions">${button('再看','review-word',`data-id="${w.id}" data-result="again"`)}${button('认识','review-word',`data-id="${w.id}" data-result="good"`,'know')}</div>`:'<div class="empty">本轮已完成</div>'}`}

function grammarViewV8(category,id){
 const R=window.STUDY_REFERENCE;if(!R)return '<p>语法资料载入中。</p>';
 if(!category&&S.grammarLocation){category=S.grammarLocation.category;id=S.grammarLocation.entry}
 const cat=R.categories.find(x=>x.id===category);
 if(cat){const entry=cat.entries.find(e=>e.id===id)||cat.entries.find(e=>e.id===S.grammarEntries?.[cat.id])||cat.entries[0];return grammarEntryViewV8(cat,entry)}
 return grammarSwitchesV9(null)+`<div id="grammar-results">${grammarIndexV8(R.categories)}</div>`;
}
function grammarSwitchesV9(cat,entry){
 const R=window.STUDY_REFERENCE;
 return `<div class="grammar-switchboard"><div class="grammar-top"><div class="grammar-heading"><h1>语法</h1>${button('活用查询','verb-table','','text-button')}</div><select class="select module-select" data-change="reference-category" aria-label="语法模块"><option value="all">全部模块</option>${R.categories.map(c=>`<option value="${c.id}" ${c.id===cat?.id?'selected':''}>${esc(c.title)}</option>`).join('')}</select></div>${entry?`<div class="point-nav reference-picker"><select class="select" data-change="reference-entry" data-category="${cat.id}" aria-label="语法条目">${cat.entries.map(e=>`<option value="${e.id}" ${e.id===entry.id?'selected':''}>${esc(e.title)}</option>`).join('')}</select><span class="quiet">${cat.entries.indexOf(entry)+1} / ${cat.entries.length}</span></div>`:''}</div>`;
}
function grammarIndexV8(categories){
 return `<div class="grammar-modules">${categories.map(c=>`<a class="grammar-module" href="#grammar/${c.id}/${S.grammarEntries?.[c.id]||c.entries[0].id}"><span>${esc(c.title)}</span><small>${c.entries.length} 条</small></a>`).join('')}</div>`;
}
function grammarEntryViewV8(cat,e){
 const i=cat.entries.findIndex(x=>x.id===e.id);S.grammarEntries??={};S.grammarEntries[cat.id]=e.id;S.grammarLocation={category:cat.id,entry:e.id};save();
 const source={book:window.BOOK_ID,area:'语法',label:'语法 · '+cat.title+' · '+e.title,title:e.title,route:'grammar/'+cat.id+'/'+e.id};
 return grammarSwitchesV9(cat,e)+`<div class="reference-title-line"><h2 class="reference-title">${mixedJapaneseV18(e.title,e.titleRuby)}</h2><span class="bookmark-actions">${button('收藏','save-reference',`data-category="${cat.id}" data-id="${e.id}"`,'text-button')}${noteActionV9('reference',e.id)}</span></div>${e.formula?`<div class="formula">${mixedJapaneseV18(e.formula,e.formulaRuby,'formula')}</div>`:''}<p class="explanation">${studyProseV18(e.summary)}</p>${romajiLineV10(e.formulaRomaji||'','formula-romaji')}${(e.notes||[]).map(n=>n===byLesson(e.lesson)?.grammar[e.point||0]?.commonMistake?`<section class="learning-section"><h3>易错点</h3><p>${studyProseV18(n)}</p></section>`:`<p class="reference-note">${studyProseV18(n)}</p>`).join('')}${e.forms?.length?`<div class="reference-forms">${e.forms.map(f=>`<div class="reference-form"><div class="form-label">${esc(f.label||'')}</div><div class="form-jp">${jp(f.ja,f.ruby)}</div><div class="translation form-meaning">${esc(f.zh||'')}</div>${romajiLineV10(f)}<div class="form-audio">${voiceButton(f,f.id,'form-listen','听','sentence')}<span class="bookmark-actions">${button('收藏','save-reading-sentence',`data-sentence-id="${f.id}"`,'text-button')}${noteActionV9('sentence',f.id)}</span></div>${f.note?`<p class="form-note">${studyProseV18(f.note)}</p>`:''}</div>`).join('')}</div>`:''}${(e.examples||[]).map((x,j)=>sentence(x,j)).join('')}${e.lesson?`<p class="source-caption"><a href="#lesson/${e.lesson}/notes/${e.point||0}">第${e.lesson}课 · ${esc(e.title)}</a></p>`:''}<div class="pager reference-pager">${i>0?`<a href="#grammar/${cat.id}/${cat.entries[i-1].id}">← 上一节</a>`:'<span></span>'}${i+1<cat.entries.length?`<a href="#grammar/${cat.id}/${cat.entries[i+1].id}">下一节 →</a>`:'<span></span>'}</div>`;
}
function installV8Navigation(){
 history.scrollRestoration='manual';
 document.addEventListener('click',e=>{
  const a=e.target.closest('a[href^="#"]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
  const target=a.getAttribute('href').slice(1);if(target==='main')return;
  e.preventDefault();let anchor=null;
  if(a.closest('.reference-pager'))anchor='.reference-picker';
  navigateV8(target,anchor?{anchor}:{});
 },true);
 document.addEventListener('click',e=>{
  const t=e.target.closest('[data-action]');if(!t)return;
  if(t.dataset.action==='back-top')window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 });
 document.addEventListener('change',e=>{
  if(e.target.dataset.change==='course-lesson'){const n=Number(e.target.value),tab=e.target.dataset.tab||'notes';navigateV8(n?'lesson/'+n+'/'+tab+'/'+(tab==='notes'?(S.points[n]||0):''):'lessons',{anchor:'.learning-switchboard'})}
  if(e.target.dataset.change==='kana-card-group'){kanaGroup=e.target.value;render();kanaCard(kanaSet()[0].hira)}
  if(e.target.dataset.change==='kana-card-character')kanaCard(e.target.value);
  if(e.target.dataset.change==='vocabulary-lesson'){S.vocabularyLesson=e.target.value;S.vocabularyPage=0;reviewIndex=0;flipped=false;save();navigateV8(location.hash.includes('/cards')?'vocabulary/cards':'vocabulary',{anchor:'.vocabulary-switchboard'})}
  if(e.target.dataset.change==='conjugation-kind'){conjugationKindV8=e.target.value;conjugationWordV8=0;verbTableV8(0)}
  if(e.target.dataset.change==='conjugation-word')verbTableV8(Number(e.target.value));
  if(e.target.dataset.change==='reference-category'){const id=e.target.value,cat=window.STUDY_REFERENCE.categories.find(c=>c.id===id);navigateV8(cat?'grammar/'+id+'/'+(S.grammarEntries?.[id]||cat.entries[0].id):'grammar/all',{anchor:'.grammar-switchboard'})}
  if(e.target.dataset.change==='reference-entry')navigateV8('grammar/'+e.target.dataset.category+'/'+e.target.value,{anchor:'.reference-picker'});
  if(e.target.dataset.change==='vocabulary-pos'){vocabularyPosV8=e.target.value;S.vocabularyPage=0;reviewIndex=0;render()}
 });
;
}

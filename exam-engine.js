'use strict';
// Source-linked question templates. Only the selected paper stores randomized choices.
const ExamEngineV29=(()=>{
 const sections=['vocabulary','grammar','reading','listening'];
 const normalize=s=>String(s??'').normalize('NFKC').replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-96)).replace(/[\s。．、，.!！？?]/g,'');
 const shuffle=(xs,rng=Math.random)=>{const a=xs.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const nearMeaning=(a,b)=>{a=normalize(a);b=normalize(b);if(a.includes(b)||b.includes(a))return true;const x=new Set([...a].slice(0,-1).map((_,i)=>a.slice(i,i+2))),y=new Set([...b].slice(0,-1).map((_,i)=>b.slice(i,i+2)));let same=0;for(const v of x)if(y.has(v))same++;return same/Math.max(1,Math.min(x.size,y.size))>.45};
 const shortMeaning=w=>String(w.meaning||'').split('；').slice(0,2).join('；');
 function gapReadingV35(u,a,b){let p=0,out='';for(const n of u.ruby||[]){const z=p+n.text.length,l=Math.max(a,p),r=Math.min(b,z);if(l<r){if(n.reading&&(l!==p||r!==z))return '';out+=n.reading||n.text.slice(l-p,r-p)}p=z}return out}
 function acceptedWordV35(w){const xs=[w.word,w.kana,...(w.acceptedAliasesV35||[]),...({'明日':['あした','あす','みょうにち'],'その後':['そのあと','そのご'],'30歳':['さんじっさい','さんじゅっさい'],'くらい':['ぐらい'],'ぐらい':['くらい']}[w.word]||[])];if(w.word==='聞く'&&/听/.test(w.meaning))xs.push('聴く');return [...new Set(xs)]}
 function numericV35(s){return s.replace(/[一二三四五六七八九十百千〇零]+(?=[年歳才時分秒人回本冊枚個日月週間])/g,x=>{const digits={'〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9},factors={'十':10,'百':100,'千':1000};let sum=0,n=0;if(!/[十百千]/.test(x))return [...x].map(c=>digits[c]).join('');for(const c of x)if(c in digits)n=digits[c];else{sum+=(n||1)*factors[c];n=0}return String(sum+n)})}
 function build(data,reference,audio,book,curated=[],extraKana=[]){
  const units=new Map(),words=new Map(data.vocab.map(w=>[w.id,w])),items=[],seen=new Set();
  const add=q=>{if(!seen.has(q.id)){seen.add(q.id);items.push(q)}};
  const register=(u,lesson,route,label)=>{if(!units.has(u.id))units.set(u.id,{...u,lesson,route,label})};
  for(const r of data.readings)for(const sec of r.sections)sec.entries.forEach((u,i)=>register(u,r.lesson,`lesson/${r.lesson}/reading/${sec.type}/${i}`,`第${r.lesson}课 · ${sec.type==='dialogue'?'会话':'课文'}`));
  for(const l of data.lessons)l.grammar.forEach((g,i)=>g.examples.forEach(u=>register(u,l.id,`lesson/${l.id}/notes/${i}`,`第${l.id}课 · ${g.title}`)));
  for(const cat of reference.categories)for(const g of cat.entries){if(g.lesson)for(const u of [...g.examples||[],...g.forms||[]])register(u,g.lesson,`grammar/${cat.id}/${g.id}`,`第${g.lesson}课 · ${g.title}`)}
  const voiced=id=>!!audio.clips[id]?.clipUrl&&!audio.clips[id]?.includeChinese;
  for(const w of data.vocab){
   const lessons=[...new Set([w.lesson,...w.lessons||[]].filter(n=>n>0&&n<=data.lessons.length))];if(!lessons.length||!w.meaning||!w.kana)continue;
   const base={wordId:w.id,lessons,unitIds:[],family:'w:'+w.id};
   if(/[一-鿿々]/.test(w.word)&&/^[ぁ-ゖァ-ヺー]+$/.test(w.kana)){
    add({...base,id:'read:'+w.id,section:'vocabulary',kind:'word-reading'});
    add({...base,id:'write:'+w.id,section:'vocabulary',kind:'word-writing'});
   }
   add({...base,id:'meaning:'+w.id,section:'vocabulary',kind:'word-meaning'});
   if(voiced('word:'+w.id)){
    add({...base,id:'hear:'+w.id,section:'listening',kind:'word-listen'});
    if(!/[~～〜]/.test(w.word+w.kana))add({...base,id:'dictate:'+w.id,section:'listening',kind:'dictation'});
   }
   const used=new Set(),gaps=w.examGapsV35||[];for(const [uid,start,end]of gaps){const u=units.get(uid);if(!u||used.has(u.lesson)||u.ja.length>180||u.ja.slice(start,end)!==w.word)continue;used.add(u.lesson);add({...base,id:'fill:'+w.id+':'+u.id,section:'vocabulary',kind:'word-fill',lessons:[u.lesson],unitIds:[u.id],family:'s:'+u.id,gap:{unitId:u.id,start,end}})}
  }
  for(const u of units.values()){
   if(!u.zh||u.ja.length<8||u.ja.length>230)continue;
   const base={lessons:[u.lesson],unitIds:[u.id],family:'s:'+u.id};
   add({...base,id:'sense:'+u.id,section:'reading',kind:'sentence-meaning'});
   if(voiced(u.id))add({...base,id:'listen:'+u.id,section:'listening',kind:'sentence-listen'});
   if(u.parts?.length>=3&&u.parts.length<=6&&u.parts.every(p=>p.chunk.length<=40)&&u.parts.map(p=>p.chunk).join('')===u.ja&&new Set(u.parts.map(p=>p.chunk)).size===u.parts.length)add({...base,id:'order:'+u.id,section:'grammar',kind:'order'});
  }
  for(const group of reference.conjugations)for(const entry of group.entries){
   const occurrences=[...units.values()].filter(u=>u.ja.includes(entry.title));const lessons=[...new Set(occurrences.map(u=>u.lesson))];if(!lessons.length)continue;
   entry.forms.forEach((f,i)=>{const observed=occurrences.filter(u=>u.ja.includes(f.ja)).map(u=>u.lesson);add({id:'form:'+group.id+':'+entry.title+':'+i,section:'grammar',kind:'form',lessons,observedLessons:observed,supplement:true,unitIds:[],family:'f:'+entry.title+':'+i,form:f,formGroup:entry.forms,head:entry.title,headRuby:entry.ruby,groupTitle:group.title})});
  }
  for(const q of curated){if(!q.unitIds.every(id=>units.has(id))||q.options.length!==4||!q.options.includes(q.answer))continue;add({...q,kind:'curated',lessons:[q.lesson],family:'s:'+q.unitIds[0]})}
  if(book==='beginner')for(const k of [...data.history.kana.map((k,i)=>({...k,romaji:k.romaji==='wo'?'o':k.romaji,lesson:i<20?1:i<38?2:3})),...extraKana]){
   const lesson=k.lesson,id='kana-'+k.hira;
   add({id,section:'vocabulary',kind:'kana',lessons:[lesson],family:id,kana:k,unitIds:[]});
   if(voiced('kana:'+k.hira))add({id:'hear-'+id,section:'listening',kind:'kana-listen',lessons:[lesson],family:id,kana:k,unitIds:[]});
  }
  return {data,reference,audio,book,units,words,items,voiced};
 }
 function eligible(bank,from,to,supplement=true){return bank.items.filter(q=>q.lessons.some(n=>n>=from&&n<=to)&&(!q.supplement||supplement&&(from===1&&to===bank.data.lessons.length||q.observedLessons.some(n=>n>=from&&n<=to))))}
 function materialize(bank,q,pool,rng){
  const x={...q,lesson:q.lessons.find(n=>n>=pool.from&&n<=pool.to)};delete x.lessons;delete x.formGroup;delete x.observedLessons;
  const w=bank.words.get(q.wordId),u=bank.units.get(q.unitIds[0]),otherWords=pool.words;
  const choose=(answer,values)=>{const choices=shuffle([...new Set(values.filter(t=>t&&normalize(t)!==normalize(answer)))],rng).slice(0,3);if(choices.length<3)return null;return shuffle([answer,...choices],rng)};
  if(q.kind==='curated')x.options=shuffle(q.options,rng);
  else if(q.kind==='form'){
   x.prompt=`选择「${q.head}」的${q.form.label}。`;x.answer=q.form.ja;x.options=choose(x.answer,q.formGroup.map(f=>f.ja));x.explanation=`「${q.head}」的${q.form.label}是「${q.form.ja}」，本形式表示“${q.form.zh}”。`;x.unitIds=[];x.reviewUnit=q.form;
  }else if(q.kind==='order'){
   x.prompt='按教材原句的顺序复原词块。';x.cue=u.zh;x.order=shuffle(u.parts.map((_,i)=>i),rng);if(x.order.every((v,i)=>v===i))x.order.reverse();x.answer=u.parts.map((_,i)=>i);x.explanation=u.parts.map(p=>p.chunk+'：'+p.note).join('\n');
  }else if(q.kind==='sentence-meaning'||q.kind==='sentence-listen'){
   x.prompt=q.kind==='sentence-listen'?'听录音，选择与句子内容相符的一项。':'选择对这句话理解正确的一项。';x.answer=u.zh;x.options=choose(x.answer,pool.sentences.filter(e=>normalize(e.ja)!==normalize(u.ja)&&!nearMeaning(e.zh,u.zh)).map(e=>e.zh));x.explanation='原句的意思是：'+u.zh+'\n'+(u.parts||[]).map(p=>p.chunk+'：'+p.note).join('\n');x.audioId=u.id;
  }else if(q.kind==='kana'||q.kind==='kana-listen'){
   const ks=bank.items.filter(t=>t.kind==='kana'&&t.lessons.some(n=>n>=pool.from&&n<=pool.to)).map(t=>t.kana);x.prompt=q.kind==='kana-listen'?'听录音，选择对应的假名。':'选择这个假名的读音。';x.answer=q.kind==='kana-listen'?q.kana.hira:q.kana.romaji;x.options=choose(x.answer,[...new Map(ks.map(k=>[k.romaji,k])).values()].filter(k=>k.romaji!==q.kana.romaji).map(k=>q.kind==='kana-listen'?k.hira:k.romaji));x.audioId='kana:'+q.kana.hira;x.explanation=q.kana.hira+' / '+q.kana.kata+'，读音 '+q.kana.romaji+'。';
  }else if(w){
   x.audioId='word:'+w.id;
   if(q.kind==='word-reading'){x.prompt='选择这个词的正确读音。';x.cue=shortMeaning(w);x.answer=w.kana;x.options=choose(x.answer,otherWords.filter(t=>t.word!==w.word&&/^[ぁ-ゖァ-ヺー]+$/.test(t.kana)&&Math.abs(t.kana.length-w.kana.length)<=2).map(t=>t.kana))}
   if(q.kind==='word-writing'){x.prompt='选择与所给读音、词义对应的日语写法。';x.cue=shortMeaning(w);x.answer=w.word;x.options=choose(x.answer,otherWords.filter(t=>/[一-鿿々]/.test(t.word)&&normalize(t.kana)!==normalize(w.kana)).map(t=>t.word))}
   if(['word-meaning','word-listen'].includes(q.kind)){x.prompt=q.kind==='word-listen'?'听录音，选择这个词的一种常见含义。':'选择这个词的一种常见含义。';x.answer=shortMeaning(w);const first=x.answer.split(/[；，、（）()]/)[0];x.options=choose(x.answer,otherWords.filter(t=>t.word!==w.word&&normalize(t.kana)!==normalize(w.kana)).map(shortMeaning).filter(t=>!t.includes(first)&&!x.answer.includes(t.split(/[；，、（）()]/)[0])&&!nearMeaning(t,x.answer)))}
   if(q.kind==='dictation'){x.prompt='根据词义提示听写，可填写日语汉字或假名。';x.cue=shortMeaning(w);x.answer=w.word;x.accepted=acceptedWordV35(w)}
   if(q.kind==='word-fill'){x.prompt='根据句意补全教材原句，可填写日语汉字或假名。';x.cue=u.zh;x.answer=w.word;x.accepted=[...acceptedWordV35(w),gapReadingV35(u,q.gap.start,q.gap.end)].filter(Boolean)}
   x.explanation='「'+w.word+'」读作「'+w.kana+'」，词义：'+w.meaning.replace(/[。；]+$/,'')+'。'+(q.kind==='word-fill'?'\n补全后的句意：'+u.zh:'');
  }
  if(q.kind!=='order'&&!x.accepted&&(!x.options||x.options.length!==4))return null;
  x.source={titleJapanese:q.section!=='listening'&&!!(w||u||q.kana)&&q.kind!=='form',titleRuby:!q.gap&&w?w.ruby:!q.gap&&u?u.ruby:undefined,book:bank.book,area:'考试',label:'考试 · 第'+x.lesson+'课 · '+(q.point||({vocabulary:'文字语汇',grammar:'语法',reading:'阅读',listening:'听力'})[q.section]),route:'exam/q/'+encodeURIComponent(q.id),title:q.section==='listening'?x.prompt:q.gap?bank.units.get(q.gap.unitId).ja.slice(0,q.gap.start)+'（　　　）'+bank.units.get(q.gap.unitId).ja.slice(q.gap.end):w?w.word:q.kind==='form'?q.head+' · '+q.form.label:q.kana?q.kana.hira+' / '+q.kana.kata:u?.ja||q.prompt||x.prompt};
  return x;
 }
 function generate(bank,from,to,count=150,supplement=true,recent=[],rng=Math.random){
  const available=eligible(bank,from,to,supplement),wordSet=new Set(available.filter(q=>q.wordId).map(q=>q.wordId)),pool={from,to,words:[...wordSet].map(id=>bank.words.get(id)),sentences:[...bank.units.values()].filter(u=>u.lesson>=from&&u.lesson<=to&&u.zh&&u.ja.length>8)},used=new Set(),picked=[],seenRecent=new Set(recent),quotas=[.36,.25,.19,.20].map(p=>Math.round(count*p));quotas[0]+=count-quotas.reduce((a,b)=>a+b,0);
  const candidates={};for(const section of sections){const list=shuffle(available.filter(q=>q.section===section),rng);list.sort((a,b)=>Number(seenRecent.has(a.id))-Number(seenRecent.has(b.id))||Number(b.kind==='curated')-Number(a.kind==='curated'));const buckets=new Map();for(const q of list){const l=q.lessons.find(n=>n>=from&&n<=to);if(!buckets.has(l))buckets.set(l,[]);buckets.get(l).push(q)}const ordered=[];while([...buckets.values()].some(a=>a.length))for(const l of shuffle([...buckets.keys()],rng)){const q=buckets.get(l).shift();if(q)ordered.push(q)}candidates[section]=ordered}
  const take=(section,n)=>{while(n>0&&candidates[section].length){const q=candidates[section].shift();if(used.has(q.family))continue;const x=materialize(bank,q,pool,rng);if(!x)continue;used.add(q.family);picked.push(x);n--}};
  sections.forEach((s,i)=>take(s,quotas[i]));while(picked.length<count&&sections.some(s=>candidates[s].length)){const before=picked.length;for(const s of sections)if(picked.length<count)take(s,1);if(picked.length===before&&!sections.some(s=>candidates[s].length))break}
  return {version:35,id:'paper-'+Date.now().toString(36)+'-'+rng().toString(36).slice(2,10),from,to,requested:count,questions:sections.flatMap(s=>picked.filter(q=>q.section===s)),answers:{},submitted:false,createdAt:Date.now()};
 }
 const answered=(q,a)=>q.kind==='order'?Array.isArray(a)&&a.length>0:typeof a==='string'&&a.trim()!=='';
 const correct=(q,a)=>q.kind==='order'?Array.isArray(a)&&a.length===q.answer.length&&a.every((v,i)=>v===q.answer[i]):(q.accepted||[q.answer]).some(v=>(q.accepted?numericV35(normalize(v)):normalize(v))===(q.accepted?numericV35(normalize(a)):normalize(a)));
 return {build,eligible,generate,normalize,shuffle,answered,correct,sections};
})();
if(typeof module!=='undefined')module.exports=ExamEngineV29;

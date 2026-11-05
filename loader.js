'use strict';
window.BOOKS={beginner:{label:'初级',sourceOffset:19},intermediate:{label:'中级',sourceOffset:16},advanced:{label:'高级（饭制）',sourceOffset:0}};
window.BOOK_ID=new URLSearchParams(location.search).get('book')||'beginner';
if(!window.BOOKS[window.BOOK_ID])window.BOOK_ID='beginner';
window.BOOK_CONFIG=window.BOOKS[window.BOOK_ID];
const bookSelect=document.querySelector('#book-select');bookSelect.value=window.BOOK_ID;
let bookNavigationV9=0;bookSelect.addEventListener('change',()=>{const token=++bookNavigationV9,target='./?book='+encodeURIComponent(bookSelect.value)+(location.hash.startsWith('#notebook')?'#notebook':'#lessons'),leave=()=>{if(token===bookNavigationV9)location.href=target};if(matchMedia('(prefers-reduced-motion: reduce)').matches){leave();return}document.querySelector('#main').animate([{opacity:1},{opacity:0}],{duration:100,easing:'ease-out',fill:'forwards'}).finished.then(leave).catch(leave)});
document.title='新世纪日本语教程 · '+window.BOOK_CONFIG.label;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.head.append(el)})}
async function bookData(){
 if('DecompressionStream' in window){
  try{
   const values=await Promise.all(['data','audio','reference','audio-extra'].map(async kind=>{
    const response=await fetch('books/'+window.BOOK_ID+'/'+kind+'.json.gz?v=12');
    if(!response.ok||!response.body)throw Error('Data unavailable');
    return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).json();
   }));
   [window.STUDY_DATA,window.STUDY_AUDIO,window.STUDY_REFERENCE]=values;
   const data=window.STUDY_DATA,contexts=data.vocabularyContexts;
   if(contexts){for(const word of data.vocab)word.contexts=(word.contexts||[]).map(id=>contexts[id]);delete data.vocabularyContexts}
   for(const key of ['tracks','clips','byText'])Object.assign(window.STUDY_AUDIO[key],values[3][key]);
   return true;
  }catch{}
 }
 for(const kind of ['data','audio','reference','audio-extra'])await script('books/'+window.BOOK_ID+'/'+kind+'.js?v=12');
 return false;
}
(async()=>{try{
 document.querySelector('#main').innerHTML='<p class="quiet" role="status">载入中…</p>';
 const compressed=await bookData();
 for(const src of ['voice.js?v=12','reference-ui.js?v=12','reading-support.js?v=12','notebook.js?v=12','app.js?v=12'])await script(src);
 if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  const message={type:'CACHE_BOOK',book:window.BOOK_ID,compressed};
  navigator.serviceWorker.ready.then(r=>r.active?.postMessage(message)).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>navigator.serviceWorker.controller?.postMessage(message));
 }
}catch{document.querySelector('#main').innerHTML='<p class="quiet">资料未能载入，请联网后刷新。</p>'}})();

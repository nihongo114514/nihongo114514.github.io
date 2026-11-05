'use strict';
window.BOOKS={beginner:{label:'初级',sourceOffset:19},intermediate:{label:'中级',sourceOffset:16},advanced:{label:'高级（饭制）',sourceOffset:0}};
window.BOOK_ID=new URLSearchParams(location.search).get('book')||'beginner';
if(!window.BOOKS[window.BOOK_ID])window.BOOK_ID='beginner';
window.BOOK_CONFIG=window.BOOKS[window.BOOK_ID];
const bookSelect=document.querySelector('#book-select');bookSelect.value=window.BOOK_ID;
let bookNavigationV9=0;bookSelect.addEventListener('change',()=>{const token=++bookNavigationV9,target='./?book='+encodeURIComponent(bookSelect.value)+(location.hash.startsWith('#notebook')?'#notebook':'#lessons'),leave=()=>{if(token===bookNavigationV9)location.href=target};if(matchMedia('(prefers-reduced-motion: reduce)').matches){leave();return}document.querySelector('#main').animate([{opacity:1},{opacity:0}],{duration:100,easing:'ease-out',fill:'forwards'}).finished.then(leave).catch(leave)});
document.title='新世纪日本语教程 · '+window.BOOK_CONFIG.label;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.head.append(el)})}
const BOOK_BACKUP_V13="https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/e3c9a37134afe0919eb6e8866dd07d04232bf390/";
const BOOK_HASHES_V13={"books/beginner/data.json.gz":"0807f36e0a3ff8a0e03ac7f167da907debe18bb4f5e5d8a7c51d5d5487cda2e5","books/beginner/audio.json.gz":"229e4322b8bb901fcc4ae7af5013b3f09edb1c44594eca2c07ff93f60d6fe190","books/beginner/reference.json.gz":"9e44dd3ef47234a385dc6c87887e9edf2fb1e552b64335cf07c0b2330e8e011a","books/beginner/audio-extra.json.gz":"bc4da3b09efff775ebbfb3df87fff1d00f0840c3eb630d0dfbf1f527f2f6633e","books/intermediate/data.json.gz":"7ea452c7fcafee17ba64ca38851f358c46804102d45ec3869e63ab152abe1402","books/intermediate/audio.json.gz":"d5071c84588cd8ffd53006af912e7bc3bd83281b16da6363101c969b496f0b11","books/intermediate/reference.json.gz":"afccc5fcf2564fa8a02a4be7ed825ec54eb68668717253e21c48f8cbf5bf2c84","books/intermediate/audio-extra.json.gz":"bc4da3b09efff775ebbfb3df87fff1d00f0840c3eb630d0dfbf1f527f2f6633e","books/advanced/data.json.gz":"0e9312133bb78156622d6a8c99833a0cc943d7422b808d87ba25f2c73d06f4f2","books/advanced/audio.json.gz":"b4ba8c8fca282e6681f31b461f10a4293faa116a502765e1433ce49d82ead8e2","books/advanced/reference.json.gz":"f9273fdb47f626aa180eb975865fda92ae9ba911503934988d9d190df5f0d601","books/advanced/audio-extra.json.gz":"bc4da3b09efff775ebbfb3df87fff1d00f0840c3eb630d0dfbf1f527f2f6633e"};
const BUNDLE_HASH_V13="8f7275ebf6e0d47f0feb80cfb673d8dfa204ef351424b61e94c6f6ee8c808768",BUNDLE_BACKUP_V13="https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/refs/heads/main/app.bundle.js?sha=8f7275ebf6e0d47f0feb80cfb673d8dfa204ef351424b61e94c6f6ee8c808768";
async function verifiedResourceV13(path,backup,expected){
 const first=new AbortController(),second=new AbortController();
 async function attempt(url,controller){const r=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!r.ok)throw Error('Resource unavailable');const bytes=await r.arrayBuffer();const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==expected)throw Error('Resource version changed');return {bytes,url}}
 const primary=attempt(path,first),alternate=new Promise(resolve=>setTimeout(resolve,1200)).then(()=>attempt(backup,second));
 try{const result=await Promise.any([primary,alternate]);if(result.url===path)second.abort();else first.abort();try{const cache=await caches.open('nihongo-series-shell-v15');const response=new Response(result.bytes);await Promise.all([cache.put(new URL(path,location.href).href,response.clone()),cache.put(result.url,response.clone())])}catch{}return result}finally{}
}
async function stylesheetV13(){
 try{const result=await verifiedResourceV13('style.css?v=15',BOOK_BACKUP_V13+'style.css',"7623b8e53a717055375dd3e5f8f92786292bafe530758dfd399ffd012bc78557");let css=new TextDecoder().decode(result.bytes);css=css.replace(/url\('fonts\/([^']+)'\)/g,(_,name)=>"url('"+BOOK_BACKUP_V13+"fonts/"+name+"'),url('fonts/"+name+"')");const el=document.createElement('style');el.dataset.stylesheetSha256="7623b8e53a717055375dd3e5f8f92786292bafe530758dfd399ffd012bc78557";el.dataset.resourceSource=result.url;el.textContent=css;document.head.append(el)}catch{const el=document.createElement('link');el.rel='stylesheet';el.href='style.css?v=15';document.head.append(el)}
}
async function appBundleV13(){
 try{const result=await verifiedResourceV13('app.bundle.js?v=15',BUNDLE_BACKUP_V13,BUNDLE_HASH_V13);const el=document.createElement('script');el.dataset.bundleSha256=BUNDLE_HASH_V13;el.dataset.resourceSource=result.url;el.textContent=new TextDecoder().decode(result.bytes);document.head.append(el)}catch{await script('app.bundle.js?v=15')}
}
async function bookData(){
 if('DecompressionStream' in window){
  try{
   const values=await Promise.all(['data','audio','reference','audio-extra'].map(async kind=>{
    const path='books/'+window.BOOK_ID+'/'+kind+'.json.gz',result=await verifiedResourceV13(path+'?v=15',BOOK_BACKUP_V13+path,BOOK_HASHES_V13[path]);
    document.querySelector('#main').dataset['loaded'+kind.replace('-','')]=result.url;
    return new Response(new Response(result.bytes).body.pipeThrough(new DecompressionStream('gzip'))).json();
   }));
   [window.STUDY_DATA,window.STUDY_AUDIO,window.STUDY_REFERENCE]=values;
   const data=window.STUDY_DATA,contexts=data.vocabularyContexts;
   if(contexts){for(const word of data.vocab)word.contexts=(word.contexts||[]).map(id=>contexts[id]);delete data.vocabularyContexts}
   for(const key of ['tracks','clips','byText'])Object.assign(window.STUDY_AUDIO[key],values[3][key]);
   return true;
  }catch{}
 }
 for(const kind of ['data','audio','reference','audio-extra'])await script('books/'+window.BOOK_ID+'/'+kind+'.js?v=15');
 return false;
}
(async()=>{try{
 document.querySelector('#main').innerHTML='<p class="quiet" role="status">载入中…</p>';
 const [compressed]=await Promise.all([bookData(),stylesheetV13()]);
 await appBundleV13();
 if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  const message={type:'CACHE_SHELL'};
  navigator.serviceWorker.ready.then(r=>r.active?.postMessage(message)).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>navigator.serviceWorker.controller?.postMessage(message));
 }
}catch{document.querySelector('#main').innerHTML='<p class="quiet">资料未能载入，请联网后刷新。</p>'}})();

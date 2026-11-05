'use strict';
window.BOOKS={beginner:{label:'初级',sourceOffset:19},intermediate:{label:'中级',sourceOffset:16},advanced:{label:'高级（饭制）',sourceOffset:0}};
window.BOOK_ID=new URLSearchParams(location.search).get('book')||'beginner';
if(!window.BOOKS[window.BOOK_ID])window.BOOK_ID='beginner';
window.BOOK_CONFIG=window.BOOKS[window.BOOK_ID];
const bookSelect=document.querySelector('#book-select');bookSelect.value=window.BOOK_ID;
let bookNavigationV9=0;bookSelect.addEventListener('change',()=>{const token=++bookNavigationV9,target='./?book='+encodeURIComponent(bookSelect.value)+(location.hash.startsWith('#notebook')?'#notebook':location.hash.startsWith('#exam')?'#exam':'#lessons'),leave=()=>{if(token===bookNavigationV9)location.href=target};if(matchMedia('(prefers-reduced-motion: reduce)').matches){leave();return}document.querySelector('#main').animate([{opacity:1},{opacity:0}],{duration:100,easing:'ease-out',fill:'forwards'}).finished.then(leave).catch(leave)});
document.title='新世纪日本语教程 · '+window.BOOK_CONFIG.label;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.head.append(el)})}
const BOOK_BACKUP_V13="https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/6bbba7ece35a5bdcd91274b100c0175130b62bdb/";
const BOOK_HASHES_V13={"books/advanced/data.json.gz":{"plain":"a83a939622ed09a70adf8946a0b500d676dc3b533a8454ee45628e12507e09c1"},"books/advanced/reference.json.gz":{"plain":"4241d82cdb4db6f3e912e838f4311ffaf8d0918c5bcb8e5117a4b66004c2a12f"},"books/advanced/audio-extra.json.gz":{"plain":"2f8eb3454fb0bd2ff00703ae22c5d86b2a05ee9163fcc2a35e929820fcfaf337"},"books/advanced/audio.json.gz":{"plain":"8136669438d23989ce8b48e55e8e6a4515d5ef30b677c37dc32214a7dac97812"},"books/beginner/data.json.gz":{"plain":"cb88aaea84b0074e910671d33b3b135ef40885ce190f911d74d5ec94176cdaab"},"books/beginner/reference.json.gz":{"plain":"dc65cbc10dc7cae7150a4b5981d850760e8ee9f5c9fa9b63b57793db668a1643"},"books/beginner/audio-extra.json.gz":{"plain":"2f8eb3454fb0bd2ff00703ae22c5d86b2a05ee9163fcc2a35e929820fcfaf337"},"books/beginner/audio.json.gz":{"plain":"dcae2d9b84e03bd776d60d99467da1dca4b59b99ed5070be338193de65efb881"},"books/intermediate/data.json.gz":{"plain":"c9abfd24c5a3f0f0e8529d30947d78ca86592c8b85d23db5e84a6975f5262265"},"books/intermediate/reference.json.gz":{"plain":"6c78a09d327c02da5810b465c8e05ecdf1d17bee014254d479a0a1b4d2aafcb9"},"books/intermediate/audio-extra.json.gz":{"plain":"2f8eb3454fb0bd2ff00703ae22c5d86b2a05ee9163fcc2a35e929820fcfaf337"},"books/intermediate/audio.json.gz":{"plain":"1a9661006a7b6d5271cad72d3eb01bcb6a37a28e972e095709a21818843b4142"}};
const BUNDLE_HASH_V13="cd253aafd5e327967e426d31ab9670165c147137c305c5027c4d3594eb0e3e61",BUNDLE_BACKUP_V13="https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/refs/heads/main/app.bundle.js?sha=cd253aafd5e327967e426d31ab9670165c147137c305c5027c4d3594eb0e3e61";
async function verifiedResourceV13(path,backup,expected){
 const first=new AbortController(),second=new AbortController();
 async function attempt(url,controller){const r=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!r.ok)throw Error('Resource unavailable');let bytes=await r.arrayBuffer();const cacheBytes=bytes;if(expected?.plain&&new Uint8Array(bytes)[0]===31&&new Uint8Array(bytes)[1]===139)bytes=await new Response(new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==(expected?.plain||expected))throw Error('Resource version changed: '+digest.slice(0,12));return {bytes,cacheBytes,url}}
 const primary=attempt(path,first),alternate=new Promise(resolve=>setTimeout(resolve,1200)).then(()=>attempt(backup,second));
 try{let result;try{result=await Promise.any([primary,alternate])}catch(error){document.querySelector('#main').dataset.resourceError=JSON.stringify((error.errors||[error]).map(x=>x.message));throw error}if(result.url===path)second.abort();else first.abort();try{const cache=await caches.open('nihongo-series-shell-v36');const response=new Response(result.cacheBytes||result.bytes);await Promise.all([cache.put(new URL(path,location.href).href,response.clone()),cache.put(result.url,response.clone())])}catch{}return result}finally{}
}
async function stylesheetV13(){
 const inline=document.querySelector('#study-initial-style');if(inline&&inline.dataset.stylesheetSha256==="10a6dea26b3259a702876b71b01533ec86c218ac0eea2e31a859d83d3d214cf4")return;
 try{const result=await verifiedResourceV13('style.css?v=36',"https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/refs/heads/main/style.css?sha=10a6dea26b3259a702876b71b01533ec86c218ac0eea2e31a859d83d3d214cf4","10a6dea26b3259a702876b71b01533ec86c218ac0eea2e31a859d83d3d214cf4");let css=new TextDecoder().decode(result.bytes);css=css.replace(/url\('fonts\/([^']+)'\)/g,(_,name)=>location.hostname==='nihongo114514.github.io'?"url('https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/6bbba7ece35a5bdcd91274b100c0175130b62bdb/fonts/"+name+"'),url('fonts/"+name+"')":"url('fonts/"+name+"'),url('https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/6bbba7ece35a5bdcd91274b100c0175130b62bdb/fonts/"+name+"')");const el=document.createElement('style');el.dataset.stylesheetSha256="10a6dea26b3259a702876b71b01533ec86c218ac0eea2e31a859d83d3d214cf4";el.dataset.resourceSource=result.url;el.textContent=css;document.head.append(el)}catch{const el=document.createElement('link');el.rel='stylesheet';el.href='style.css?v=36';document.head.append(el)}
}
async function appBundleV13(){
 try{const result=await verifiedResourceV13('app.bundle.js?v=36',BUNDLE_BACKUP_V13,BUNDLE_HASH_V13);const el=document.createElement('script');el.dataset.bundleSha256=BUNDLE_HASH_V13;el.dataset.resourceSource=result.url;el.textContent=new TextDecoder().decode(result.bytes);document.head.append(el)}catch{await script('app.bundle.js?v=36')}
}
async function bookData(){
 if('DecompressionStream' in window){
  try{
   const values=await Promise.all(['data','audio','reference','audio-extra'].map(async kind=>{
    const path='books/'+window.BOOK_ID+'/'+kind+'.json.gz',result=await verifiedResourceV13(path+'?v=36',BOOK_BACKUP_V13+path,BOOK_HASHES_V13[path]);
    document.querySelector('#main').dataset['loaded'+kind.replace('-','')]=result.url;
    return new Response(result.bytes).json();
   }));
   [window.STUDY_DATA,window.STUDY_AUDIO,window.STUDY_REFERENCE]=values;
   const data=window.STUDY_DATA,contexts=data.vocabularyContexts;
   if(contexts){for(const word of data.vocab)word.contexts=(word.contexts||[]).map(id=>contexts[id]);delete data.vocabularyContexts}
   for(const key of ['tracks','clips','byText'])Object.assign(window.STUDY_AUDIO[key],values[3][key]);
   return true;
  }catch{}
 }
 for(const kind of ['data','audio','reference','audio-extra'])await script('books/'+window.BOOK_ID+'/'+kind+'.js?v=36');
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

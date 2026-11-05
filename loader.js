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
const BOOK_HASHES_V13={"books/beginner/data.json.gz":{"plain":"8b8b672a2b83b084281f747d0ca19c91c8d0a1fbbc09b4b7169874c71656a2db"},"books/beginner/audio.json.gz":{"plain":"ca4b97330121a82998f22fb0d888dc0d1ddf0b24729f259595b5aeb2df67d53b"},"books/beginner/reference.json.gz":{"plain":"45fdb5c6569e78d285cda91670768aae6a0f60880cc318c0f8b0d2baca4168eb"},"books/beginner/audio-extra.json.gz":{"plain":"2f8eb3454fb0bd2ff00703ae22c5d86b2a05ee9163fcc2a35e929820fcfaf337"},"books/intermediate/data.json.gz":{"plain":"bb828ea6434ec5246e8e59c9413dcd9bea4e24173ebc181620cf00dafadef30f"},"books/intermediate/audio.json.gz":{"plain":"79b5e11f5770ac01417c94650a6818b8c0bed7ce63bc179adbb875400ea76e41"},"books/intermediate/reference.json.gz":{"plain":"4572f383b57b7a39f1f3d7ed275571d623888a03661e0eb3f5f857d0e9ef36a1"},"books/intermediate/audio-extra.json.gz":{"plain":"2f8eb3454fb0bd2ff00703ae22c5d86b2a05ee9163fcc2a35e929820fcfaf337"},"books/advanced/data.json.gz":{"plain":"c0df8a174f8128da9b2534b37e55189df2464f155fed10f7b3c562a2bf0e8957"},"books/advanced/audio.json.gz":{"plain":"7479cdfe703dc5615509c451b012aa7bae233b459ed842e6a2eb9f812b9707e8"},"books/advanced/reference.json.gz":{"plain":"8ac5c6712ca39775dafc96048ae086e5e4ef971d1c9af5ff36aa2e523e258092"},"books/advanced/audio-extra.json.gz":{"plain":"2f8eb3454fb0bd2ff00703ae22c5d86b2a05ee9163fcc2a35e929820fcfaf337"}};
const BUNDLE_HASH_V13="9472b958f0a97bf6b3afa9b482208eeb2e51009bc8d11479f998ad8fcbdd377b",BUNDLE_BACKUP_V13="https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/refs/heads/main/app.bundle.js?sha=9472b958f0a97bf6b3afa9b482208eeb2e51009bc8d11479f998ad8fcbdd377b";
async function verifiedResourceV13(path,backup,expected){
 const first=new AbortController(),second=new AbortController();
 async function attempt(url,controller){const r=await fetch(url,{signal:controller.signal,credentials:'omit'});if(!r.ok)throw Error('Resource unavailable');let bytes=await r.arrayBuffer();const cacheBytes=bytes;if(expected?.plain&&new Uint8Array(bytes)[0]===31&&new Uint8Array(bytes)[1]===139)bytes=await new Response(new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(digest!==(expected?.plain||expected))throw Error('Resource version changed: '+digest.slice(0,12));return {bytes,cacheBytes,url}}
 const primary=attempt(path,first),alternate=new Promise(resolve=>setTimeout(resolve,1200)).then(()=>attempt(backup,second));
 try{let result;try{result=await Promise.any([primary,alternate])}catch(error){document.querySelector('#main').dataset.resourceError=JSON.stringify((error.errors||[error]).map(x=>x.message));throw error}if(result.url===path)second.abort();else first.abort();try{const cache=await caches.open('nihongo-series-shell-v16');const response=new Response(result.cacheBytes||result.bytes);await Promise.all([cache.put(new URL(path,location.href).href,response.clone()),cache.put(result.url,response.clone())])}catch{}return result}finally{}
}
async function stylesheetV13(){
 try{const result=await verifiedResourceV13('style.css?v=16',BOOK_BACKUP_V13+'style.css',"7623b8e53a717055375dd3e5f8f92786292bafe530758dfd399ffd012bc78557");let css=new TextDecoder().decode(result.bytes);css=css.replace(/url\('fonts\/([^']+)'\)/g,(_,name)=>"url('"+BOOK_BACKUP_V13+"fonts/"+name+"'),url('fonts/"+name+"')");const el=document.createElement('style');el.dataset.stylesheetSha256="7623b8e53a717055375dd3e5f8f92786292bafe530758dfd399ffd012bc78557";el.dataset.resourceSource=result.url;el.textContent=css;document.head.append(el)}catch{const el=document.createElement('link');el.rel='stylesheet';el.href='style.css?v=16';document.head.append(el)}
}
async function appBundleV13(){
 try{const result=await verifiedResourceV13('app.bundle.js?v=16',BUNDLE_BACKUP_V13,BUNDLE_HASH_V13);const el=document.createElement('script');el.dataset.bundleSha256=BUNDLE_HASH_V13;el.dataset.resourceSource=result.url;el.textContent=new TextDecoder().decode(result.bytes);document.head.append(el)}catch{await script('app.bundle.js?v=16')}
}
async function bookData(){
 if('DecompressionStream' in window){
  try{
   const values=await Promise.all(['data','audio','reference','audio-extra'].map(async kind=>{
    const path='books/'+window.BOOK_ID+'/'+kind+'.json.gz',result=await verifiedResourceV13(path+'?v=16',BOOK_BACKUP_V13+path,BOOK_HASHES_V13[path]);
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
 for(const kind of ['data','audio','reference','audio-extra'])await script('books/'+window.BOOK_ID+'/'+kind+'.js?v=16');
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

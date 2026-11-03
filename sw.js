const SHELL='nihongo-series-shell-v6',AUDIO='nihongo-audio-original-v1';
const ASSETS=['./','./index.html','./loader.js?v=6','./style.css?v=6','./voice.js?v=6','./app.js?v=6','./icon.svg','./manifest.webmanifest'];
const pendingAudio=new Map();
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nihongo-')&&key!==SHELL&&key!==AUDIO).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
async function wholeAudio(url){
 const cache=await caches.open(AUDIO),saved=await cache.match(url);if(saved)return saved;
 if(!pendingAudio.has(url))pendingAudio.set(url,(async()=>{
  // Fetch the complete original without a browser Range header. Some authenticated
  // asset responses cannot serve a first seek reliably; local byte ranges can.
  const r=await fetch(url,{credentials:'same-origin'});
  if(r.status!==200||r.redirected||!/audio\/|application\/octet-stream/i.test(r.headers.get('content-type')||''))throw new Error('Original recording unavailable');
  const bytes=await r.arrayBuffer(),full=new Response(bytes,{headers:{'Content-Type':'audio/mpeg','Content-Length':String(bytes.byteLength),'Accept-Ranges':'bytes'}});
  try{await cache.put(url,full.clone())}catch{}
  return full;
 })());
 try{return(await pendingAudio.get(url)).clone()}finally{pendingAudio.delete(url)}
}
async function cacheAudio(url){
 const u=new URL(url,self.location.href);u.hash='';if(u.origin!==self.location.origin||!u.pathname.includes('/audio/')||!u.pathname.endsWith('.mp3'))return;
 try{await wholeAudio(u.href)}catch{}
}
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_AUDIO')event.waitUntil(cacheAudio(event.data.url));if(event.data?.type==='CACHE_BOOK'&&['beginner','intermediate','advanced'].includes(event.data.book)){const b=event.data.book;event.waitUntil(caches.open(SHELL).then(cache=>cache.addAll(['./books/'+b+'/data.js?v=6','./books/'+b+'/audio.js?v=6'])))}});
async function audioResponse(request,url){
 const saved=await wholeAudio(url.href);
 const range=request.headers.get('range');if(!range)return saved;
 const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match)return fetch(request);
 const bytes=await saved.arrayBuffer(),total=bytes.byteLength;
 let start=match[1]?Number(match[1]):Math.max(0,total-Number(match[2]));
 let end=match[1]?(match[2]?Math.min(Number(match[2]),total-1):total-1):total-1;
 if(start>=total||start>end)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+total}});
 return new Response(bytes.slice(start,end+1),{status:206,headers:{'Content-Type':'audio/mpeg','Accept-Ranges':'bytes','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${total}`}});
}
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);url.hash='';if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/downloads/'))return;
 if(url.pathname.includes('/audio/')){event.respondWith(audioResponse(event.request,url));return}
 event.respondWith(fetch(event.request).then(response=>{
  if(response.ok&&!response.redirected&&response.type!=='opaqueredirect'){const copy=response.clone();caches.open(SHELL).then(cache=>cache.put(event.request,copy))}
  return response;
 }).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});

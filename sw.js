const SHELL='nihongo-series-shell-v39',AUDIO='nihongo-audio-original-v1';
const ASSETS=["./","./index.html","./loader.js?v=39","./icon.svg","./manifest.webmanifest"];
const BOOK_BACKUP_V13="https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/6bbba7ece35a5bdcd91274b100c0175130b62bdb/";
const pendingAudio=new Map();
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('nihongo-')&&key!==SHELL&&key!==AUDIO).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
async function recordingResponseV13(url){
 const first=new AbortController(),second=new AbortController(),path=new URL(url).pathname.replace(/^\//,'');
 async function attempt(target,controller){const r=await fetch(target,{credentials:'omit',signal:controller.signal});if(r.status!==200||!/audio\/|application\/octet-stream/i.test(r.headers.get('content-type')||''))throw Error('Recording unavailable');return {bytes:await r.arrayBuffer(),target}}
 const primary=attempt(url,first),alternate=new Promise(resolve=>setTimeout(resolve,1200)).then(()=>attempt(((path.startsWith('audio/clips/')||path.startsWith('audio/v39-'))?'https://raw.githubusercontent.com/nihongo114514/nihongo114514.github.io/refs/heads/main/':BOOK_BACKUP_V13)+path,second));
 const result=await Promise.any([primary,alternate]);if(result.target===url)second.abort();else first.abort();return new Response(result.bytes,{headers:{'Content-Type':'audio/mpeg','Content-Length':String(result.bytes.byteLength),'Accept-Ranges':'bytes'}});
}
async function wholeAudio(url){
 const cache=await caches.open(AUDIO),saved=await cache.match(url);if(saved)return saved;
 if(!pendingAudio.has(url))pendingAudio.set(url,(async()=>{
  // Fetch the complete original without a browser Range header. Some authenticated
  // asset responses cannot serve a first seek reliably; local byte ranges can.
  const r=await recordingResponseV13(url);
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
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_SHELL')event.waitUntil(caches.open(SHELL).then(cache=>Promise.allSettled(ASSETS.map(url=>cache.add(url)))));if(event.data?.type==='CACHE_AUDIO')event.waitUntil(cacheAudio(event.data.url));if(event.data?.type==='CACHE_BOOK'&&['beginner','intermediate','advanced'].includes(event.data.book)){const b=event.data.book,suffix=event.data.compressed?'.json.gz?v=39':'.js?v=39';event.waitUntil(caches.open(SHELL).then(cache=>Promise.allSettled(['data','audio','reference','audio-extra'].flatMap(kind=>['./books/'+b+'/'+kind+suffix,BOOK_BACKUP_V13+'books/'+b+'/'+kind+(event.data.compressed?'.json.gz':'.js')]).map(url=>cache.add(url)))))}});
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
 const url=new URL(event.request.url);url.hash='';if(event.request.method!=='GET')return;if(url.origin==='https://raw.githubusercontent.com'&&url.pathname.startsWith('/nihongo114514/nihongo114514.github.io/')){event.respondWith(caches.match(event.request).then(saved=>saved||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(SHELL).then(cache=>cache.put(event.request,copy))}return response}).catch(()=>caches.match(event.request).then(response=>response||Response.error()))));return}if(url.origin!==self.location.origin||url.pathname.includes('/downloads/'))return;if(url.searchParams.has('v')&&!/\/(?:loader|sw)\.js$/.test(url.pathname)){event.respondWith(caches.match(event.request).then(saved=>saved||fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(SHELL).then(cache=>cache.put(event.request,copy))}return response})));return}
 if(url.pathname.includes('/audio/')){event.respondWith(audioResponse(event.request,url));return}
 event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{
  if(response.ok&&!response.redirected&&response.type!=='opaqueredirect'){const copy=response.clone();caches.open(SHELL).then(cache=>cache.put(event.request,copy))}
  return response;
 }).catch(()=>caches.match(event.request).then(response=>response||(event.request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});

'use strict';
function playbackRateSelectV9(){const rate=window.OfficialVoice?.getRate()||1;return `<select class="rate-select" data-playback-rate aria-label="朗读速度">${[.25,.5,1,1.5,2].map(r=>`<option value="${r}" ${rate===r?'selected':''}>${r}×</option>`).join('')}</select>`}
(()=>{
 const books=new Map([[window.BOOK_ID,window.STUDY_AUDIO]]),rates=[.25,.5,1,1.5,2];
 let rate=1;try{const saved=Number(localStorage.getItem('nihongo-audio-rate'));if(rates.includes(saved))rate=saved}catch{}
 const audio=document.createElement('audio');audio.id='official-audio';audio.preload='metadata';audio.hidden=true;audio.setAttribute('aria-hidden','true');document.body.append(audio);
 let unit=null,position=0,playing=false,loading=false,serial=0,raf=0,ctx=null,worker=null,workerID=0,dspSource=null,dspGain=null,dspStart=0,dspOffset=0,dspRate=1,mode='native',child=null,lastHighlight='',endTimer=0,fromDialog=false;
 const pending=new Map(),rawCache=new Map(),processedCache=new Map();let rawBytes=0,processedBytes=0;
 const budget=32*1024*1024;
 const key=s=>String(s||'').normalize('NFKC').replace(/[\s、。，,.！？!?「」『』“”‘’（）()・：:；;]/g,'').toLowerCase();
 const clock=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 function resolve(id){const split=String(id||'').indexOf('::'),book=split<0?window.BOOK_ID:id.slice(0,split),raw=split<0?id:id.slice(split+2),data=books.get(book);return {book,raw,data,c:data?.clips?.[raw]}}
 const clip=id=>resolve(id).c||null;
 function touch(cache,k){const value=cache.get(k);if(value){cache.delete(k);cache.set(k,value)}return value}
 function put(cache,k,value,bytes,which){if(bytes>budget)return;if(cache.has(k)){const old=cache.get(k);if(which==='raw')rawBytes-=old.bytes;else processedBytes-=old.bytes;cache.delete(k)}cache.set(k,{value,bytes});if(which==='raw')rawBytes+=bytes;else processedBytes+=bytes;while((which==='raw'?rawBytes:processedBytes)>budget){const oldest=cache.keys().next().value,old=cache.get(oldest);cache.delete(oldest);if(which==='raw')rawBytes-=old.bytes;else processedBytes-=old.bytes}}
 function audioContext(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();return ctx}
 function resumeContext(){try{return audioContext().resume()}catch{return Promise.resolve()}}
 function sourceProgress(){return Math.max(0,dspOffset+(playing?Math.max(0,ctx.currentTime-dspStart)*dspRate:0))}
 function currentPosition(){if(!unit)return 0;if(!playing||loading)return position;if(mode==='sequence'&&child){const local=dspSource?sourceProgress():Math.max(0,audio.currentTime);return Math.max(0,Math.min(unit.total,child.begin+Math.min(child.duration,local)))}if(mode==='dsp')return Math.min(unit.total,sourceProgress());if(mode==='native'&&audio.src)return Math.max(0,Math.min(unit.total,audio.currentTime-unit.start));return position}
 function stopSources(){clearTimeout(endTimer);endTimer=0;cancelAnimationFrame(raf);audio.pause();if(dspSource){const source=dspSource,gain=dspGain;dspSource=null;source.onended=null;try{gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setValueAtTime(gain.gain.value,ctx.currentTime);gain.gain.linearRampToValueAtTime(0,ctx.currentTime+.005);source.stop(ctx.currentTime+.006);setTimeout(()=>{source.disconnect();gain.disconnect()},20)}catch{}}}
 function emit(){
  const pos=unit?currentPosition():0;
  document.querySelectorAll('[data-action="audio-play"]').forEach(b=>{const same=b.dataset.audioId===unit?.id;b.textContent=same&&loading?'…':'听';b.setAttribute('aria-pressed',String(same&&playing&&!loading));b.setAttribute('aria-busy',String(same&&loading));b.setAttribute('aria-label',same&&playing?'暂停当前条目':'听当前条目')});
  document.querySelectorAll('[data-playback-rate]').forEach(s=>s.value=String(rate));
  document.querySelectorAll('[data-voice-strip]').forEach(el=>{const id=el.dataset.voiceStrip,c=clip(id);if(!c)return;const same=id===unit?.id,input=el.querySelector('input');input.disabled=!same||loading;input.max=String(same?unit.total:c.end-c.start);input.value=String(same?pos:0);el.querySelector('time').textContent=clock(same?pos:0)+' / '+clock(same?unit.total:c.end-c.start)});
  document.querySelectorAll('[data-listen-control]').forEach(el=>{const active=el.dataset.listenControl===unit?.id;el.dataset.position=String(active?pos:0);el.dataset.duration=String(active?unit.total:0);el.dataset.playing=String(active&&playing&&!loading);el.dataset.rate=String(rate)});
  let highlight='';if(playing&&!loading&&unit){if(mode==='sequence')highlight=child?.raw||'';else if(unit.data.sections?.[unit.raw]){const absolute=audio.currentTime;highlight=(unit.data.sections[unit.raw].entries||[]).find(id=>{const c=unit.data.clips[id];return c&&absolute>=c.start-.04&&absolute<c.end+.04})||''}else if(unit.physical)highlight=unit.raw}
  document.querySelectorAll('[data-reading-entry]').forEach(el=>el.classList.toggle('is-speaking',!!highlight&&el.dataset.readingEntry===highlight));
  if(highlight&&highlight!==lastHighlight&&unit?.data.sections?.[unit.raw]){lastHighlight=highlight;const el=document.querySelector('[data-reading-entry="'+CSS.escape(highlight)+'"]');if(el&&document.visibilityState==='visible'){const r=el.getBoundingClientRect();if(r.top<Math.max(70,(document.querySelector('.learning-switchboard,.grammar-switchboard')?.getBoundingClientRect().bottom||0)+14)||r.bottom>innerHeight-60)el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}
 }
 function tick(){if(!unit||!playing)return;if(mode==='native'&&!unit.physical&&!loading&&audio.currentTime>=unit.end){position=unit.total;playing=false;stopSources();emit();return}emit();raf=requestAnimationFrame(tick)}
 function startTick(){cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)}
 function scheduleNativeEnd(token){clearTimeout(endTimer);endTimer=0;if(!unit||mode!=='native'||unit.physical||!playing||loading)return;const remaining=Math.max(0,unit.end-audio.currentTime);endTimer=setTimeout(()=>{if(token!==serial||!playing||mode!=='native')return;if(audio.currentTime>=unit.end-.015){position=unit.total;playing=false;stopSources();emit()}else scheduleNativeEnd(token)},Math.max(10,remaining/rate*1000+10))}
 function cacheAudio(url){const message={type:'CACHE_AUDIO',url:new URL(url,location.href).href};if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage(message)}
 function finish(){clearTimeout(endTimer);endTimer=0;position=unit?.total||0;playing=false;loading=false;cancelAnimationFrame(raf);dspSource=null;emit()}
 function stop(){serial++;position=0;playing=false;loading=false;stopSources();unit=null;child=null;lastHighlight='';emit()}
 function fail(error){if(error?.name==='AbortError')return;playing=false;loading=false;stopSources();emit();console.warn('Audio playback:',error?.message||error);document.dispatchEvent(new CustomEvent('official-audio-error',{detail:'暂时无法播放，请重试。'}))}
 async function decoded(url){const saved=touch(rawCache,url);if(saved)return saved.value;const r=await fetch(url);if(!r.ok)throw Error('Audio unavailable');const buffer=await audioContext().decodeAudioData(await r.arrayBuffer());const mono=new Float32Array(buffer.length);for(let c=0;c<buffer.numberOfChannels;c++){const data=buffer.getChannelData(c);for(let i=0;i<mono.length;i++)mono[i]+=data[i]/buffer.numberOfChannels}const value={pcm:mono,sampleRate:buffer.sampleRate,duration:buffer.duration};put(rawCache,url,value,mono.byteLength,'raw');return value}
 function stretch(pcm,sampleRate,targetRate){
  if(!worker){worker=new Worker('vendor/signalsmith/signalsmith-worker.js?v=16');worker.onmessage=({data})=>{const item=pending.get(data.id);if(!item)return;pending.delete(data.id);data.error?item.reject(Error(data.error)):item.resolve(data)};worker.onerror=error=>{for(const item of pending.values())item.reject(Error(error.message||'Audio processing failed'));pending.clear();worker.terminate();worker=null}}
  const id=++workerID,copy=pcm.slice();return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,pcm:copy.buffer,sampleRate,rate:targetRate},[copy.buffer])});
 }
 async function processed(url,targetRate){const k=url+'|'+targetRate,cached=touch(processedCache,k);if(cached)return cached.value;const raw=await decoded(url);if(raw.pcm.length/targetRate>8000000)throw Error('Clip too long for processing');const out=await stretch(raw.pcm,raw.sampleRate,targetRate),buffer=audioContext().createBuffer(1,out.outputFrames,out.sampleRate);buffer.copyToChannel(new Float32Array(out.pcm),0);const result={buffer,duration:raw.duration};put(processedCache,k,result,buffer.length*4,'processed');return result}
 function sequenceFor(u){const ids=u.data.sections?.[u.raw]?.entries||[],entries=ids.map(id=>({raw:id,c:u.data.clips[id]})).filter(x=>x.c?.clipUrl);if(!entries.length)return null;return entries.map(x=>({...x,begin:Math.max(0,x.c.start-u.c.start),duration:x.c.clipDuration}))}
 function launchBuffer(buffer,offset,token,onEnd){
  if(token!==serial||!playing)return;const source=audioContext().createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.playbackRate.value=1;source.connect(gain);gain.connect(ctx.destination);const now=ctx.currentTime+.008;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+.005);dspSource=source;dspGain=gain;dspStart=now;dspOffset=offset;dspRate=rate;source.onended=()=>{source.disconnect();gain.disconnect();if(token!==serial||dspSource!==source)return;dspSource=null;onEnd()};source.start(now,Math.min(buffer.duration,offset/rate));loading=false;emit();startTick();
 }
 async function playSequence(token){
  const list=unit.sequence,index=list.findIndex(x=>x.begin+x.duration>position+.002);if(index<0){finish();return}
  child=list[index];const offset=Math.max(0,position-child.begin),url=child.c.clipUrl;
  if(child.duration>30){await startNative(url,offset,true,token);return}
  const prepared=await processed(url,rate);if(token!==serial||!playing)return;
  for(const next of list.slice(index+1,index+3))if(next.duration<=30)processed(next.c.clipUrl,rate).catch(()=>{});
  launchBuffer(prepared.buffer,offset,token,()=>{position=child.begin+child.duration+.003;if(index+1>=list.length)finish();else{loading=true;emit();playSequence(token).catch(fail)}});
 }
 async function startNative(url,offset,physical,token){
  audio.dataset.token=String(token);audio.src=physical?url:url+'#t='+unit.start.toFixed(3)+','+unit.end.toFixed(3);audio.playbackRate=rate;audio.preservesPitch=true;audio.webkitPreservesPitch=true;
  audio.addEventListener('loadedmetadata',()=>{if(token!==serial)return;if(physical&&mode!=='sequence'&&Number.isFinite(audio.duration))unit.total=audio.duration;audio.currentTime=physical?offset:unit.start+offset;emit()},{once:true});cacheAudio(url);await audio.play();if(token===serial){loading=false;emit();startTick();scheduleNativeEnd(token)}
 }
 async function startAt(offset=position){
  const token=++serial;stopSources();position=Math.max(0,Math.min(unit.total,offset));playing=true;loading=true;child=null;emit();
  try{
   if(rate<=.5&&!unit.physical&&(unit.sequence=sequenceFor(unit))){mode='sequence';await resumeContext();await playSequence(token)}
   else if(rate!==1&&unit.physical&&unit.total<=30){mode='dsp';await resumeContext();const result=await processed(unit.url,rate);if(token!==serial||!playing)return;unit.total=result.duration;launchBuffer(result.buffer,position,token,finish)}
   else{mode='native';await startNative(unit.url,position,unit.physical,token)}
  }catch(error){if(token===serial)fail(error)}
 }
 function pause(){position=currentPosition();playing=false;loading=false;serial++;stopSources();emit()}
 function play(id,sentenceOnly=false){
  const found=resolve(id),c=found.c,track=c&&found.data.tracks[c.file];if(!c||!track)return;if(sentenceOnly&&(!c.clipUrl||c.includeChinese))return;resumeContext();
  if(unit?.id===id){if(playing){pause();return}if(position>=unit.total-.025)position=0;startAt(position);return}
  serial++;stopSources();unit={...found,id,c,physical:!!c.clipUrl,start:c.clipUrl?0:c.start,end:c.clipUrl?c.clipDuration:c.end,total:c.clipUrl?c.clipDuration:c.end-c.start,url:c.clipUrl||track.url};position=0;lastHighlight='';startAt(0);
 }
 function setRate(value){value=Number(value);if(!rates.includes(value))return;const oldPosition=currentPosition(),resume=playing;rate=value;try{localStorage.setItem('nihongo-audio-rate',String(rate))}catch{}if(unit){pause();position=oldPosition;if(resume){resumeContext();startAt(position)}}emit()}
 function seek(id,value){if(!unit||unit.id!==id)return;const resume=playing;pause();position=Math.max(0,Math.min(unit.total-.005,Number(value)||0));if(resume){resumeContext();startAt(position)}else emit()}
 audio.addEventListener('ended',()=>{if(Number(audio.dataset.token)!==serial)return;if(mode==='sequence'&&playing&&child){const index=unit.sequence.indexOf(child);position=child.begin+child.duration+.003;if(index+1>=unit.sequence.length)finish();else{loading=true;playSequence(serial).catch(fail)}}else if(mode==='native'&&unit)finish()});
 audio.addEventListener('error',()=>{if(unit&&Number(audio.dataset.token)===serial&&(mode==='native'||mode==='sequence'&&!dspSource))fail(audio.error)});
 ['timeupdate','playing','pause','loadedmetadata','seeked'].forEach(name=>audio.addEventListener(name,()=>{if(mode==='native'||mode==='sequence')emit()}));
 document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;if(b.dataset.action==='audio-play'){fromDialog=!!b.closest('#dialog');play(b.dataset.audioId,b.dataset.audioScope==='sentence')}});
 document.addEventListener('change',e=>{if(e.target.hasAttribute('data-playback-rate'))setRate(e.target.value)});
 document.addEventListener('input',e=>{if(e.target.dataset.voiceSeek)seek(e.target.dataset.voiceSeek,e.target.value)});
document.querySelector('#dialog').addEventListener('close',()=>{if(fromDialog){stop();fromDialog=false}});window.addEventListener('hashchange',stop);
 window.OfficialVoice={clip,textId:text=>window.STUDY_AUDIO.byText?.[key(text)]||null,wordId:id=>clip('word:'+id)?'word:'+id:null,kanaId:s=>clip('kana:'+s)?'kana:'+s:null,play,stop,sync:emit,clock,getRate:()=>rate,setRate,registerBook:(id,data)=>books.set(id,data)};emit();
})();

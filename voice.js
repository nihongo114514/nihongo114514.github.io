'use strict';
// Pre-recorded source audio and labeled, pre-rendered advanced narration share one player.
(()=>{
 const data=window.STUDY_AUDIO||{tracks:{},clips:{},byText:{},sections:{}};
 const audio=document.createElement('audio');audio.id='official-audio';audio.preload='metadata';audio.hidden=true;audio.setAttribute('aria-hidden','true');document.body.append(audio);
 let active=null,activeSpan=null,stopTimer=0,raf=0,loading=false,lastHighlight='',generation=0;
 const key=s=>String(s||'').normalize('NFKC').replace(/[\s、。，,.！？!?「」『』“”‘’（）()・：:；;]/g,'').toLowerCase();
 const clock=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
 const clip=id=>data.clips?.[id]||null;
 function emit(){
  const c=activeSpan,playing=!!c&&!audio.paused&&!audio.ended,pos=c?Math.max(0,Math.min(c.end-c.start,audio.currentTime-c.start)):0;
  document.querySelectorAll('[data-action="audio-play"]').forEach(b=>{const same=b.dataset.audioId===active;b.textContent=same&&loading?'载入中…':same&&playing?'暂停':b.dataset.label||'听';b.setAttribute('aria-pressed',String(same&&playing))});
  document.querySelectorAll('[data-voice-strip]').forEach(el=>{const id=el.dataset.voiceStrip,x=clip(id);if(!x)return;const same=id===active,input=el.querySelector('input');input.disabled=!same||loading;input.value=String(same?pos:0);el.querySelector('time').textContent=clock(same?pos:0)+' / '+clock(x.end-x.start)});
  let current='';if(playing&&data.sections?.[active]){current=(data.sections[active].entries||[]).find(id=>{const x=clip(id);return x&&audio.currentTime>=x.start-.08&&audio.currentTime<x.end+.08})||''}else if(playing&&c?.physical)current=active;
  document.querySelectorAll('[data-reading-entry]').forEach(el=>el.classList.toggle('is-speaking',!!current&&el.dataset.readingEntry===current));
  if(current&&current!==lastHighlight&&data.sections?.[active]){lastHighlight=current;const el=document.querySelector('[data-reading-entry="'+CSS.escape(current)+'"]');if(el&&document.visibilityState==='visible'){const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-50)el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}}
 }
 function clearTimers(){clearTimeout(stopTimer);cancelAnimationFrame(raf)}
 function tick(){const c=activeSpan;if(!c||audio.paused)return;if(!c.physical&&audio.currentTime>=c.end-.015){audio.pause();audio.currentTime=c.end;emit();return}raf=requestAnimationFrame(tick)}
 function schedule(){clearTimers();const c=activeSpan,id=active,g=generation;if(!c||audio.paused)return;if(!c.physical)stopTimer=setTimeout(()=>{if(id!==active||g!==generation)return;if(audio.currentTime>=c.end-.04){audio.pause();emit()}else schedule()},Math.max(20,(c.end-audio.currentTime)*1000));raf=requestAnimationFrame(tick)}
 function cacheTrack(url){const message={type:'CACHE_AUDIO',url:new URL(url,location.href).href};if(navigator.serviceWorker?.controller)navigator.serviceWorker.controller.postMessage(message);else navigator.serviceWorker?.ready.then(r=>r.active?.postMessage(message)).catch(()=>{})}
 function stop(){generation++;clearTimers();audio.pause();active=null;activeSpan=null;loading=false;lastHighlight='';emit()}
 function play(id,sentenceOnly=false){
  const c=clip(id),track=c&&data.tracks?.[c.file];if(!c||!track)return;
  if(sentenceOnly&&(!c.clipUrl||c.includeChinese)){document.dispatchEvent(new CustomEvent('official-audio-error',{detail:'这句暂无对应的独立日语录音。'}));return}
  if(active===id&&!audio.paused){audio.pause();clearTimers();emit();return}
  if(active===id&&activeSpan&&audio.currentTime<activeSpan.end-.05){const g=generation;loading=true;emit();audio.play().then(()=>{if(g===generation){loading=false;schedule();emit()}}).catch(e=>{if(g===generation)failed(e)});return}
  clearTimers();audio.pause();active=id;loading=true;lastHighlight='';const g=++generation;
  activeSpan=c.clipUrl?{start:0,end:c.clipDuration,physical:true}:{start:c.start,end:c.end,physical:false};
  const source=c.clipUrl||track.url;audio.src=c.clipUrl?source:source+'#t='+c.start.toFixed(3)+','+c.end.toFixed(3);audio.playbackRate=1;audio.preservesPitch=true;
  audio.addEventListener('loadedmetadata',()=>{if(g===generation){if(activeSpan.physical){if(Number.isFinite(audio.duration))activeSpan.end=audio.duration}else audio.currentTime=c.start;emit()}},{once:true});
  emit();cacheTrack(source);
  const p=audio.play();if(p)p.then(()=>{if(g===generation){loading=false;schedule();emit()}}).catch(e=>{if(g===generation)failed(e)});
 }
 function failed(error){loading=false;clearTimers();emit();if(error?.name!=='AbortError'){console.warn('Audio playback:',error?.name||error?.code,error?.message||'Media load failed');document.dispatchEvent(new CustomEvent('official-audio-error',{detail:'音频未能载入，请联网后重试。'}))}}
 function seek(id,position){if(active!==id||!activeSpan)return;const c=activeSpan;audio.currentTime=Math.max(c.start,Math.min(c.end-.03,c.start+position));schedule();emit()}
 ['timeupdate','pause','playing','ended','seeked','loadedmetadata'].forEach(event=>audio.addEventListener(event,()=>{if(event==='playing'){loading=false;schedule()}if(event==='pause'||event==='ended')clearTimers();emit()}));
 audio.addEventListener('error',()=>{if(active)failed(audio.error)});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-action="audio-play"]');if(b)play(b.dataset.audioId,b.dataset.audioScope==='sentence')});
 document.addEventListener('input',e=>{if(e.target.dataset.voiceSeek)seek(e.target.dataset.voiceSeek,Number(e.target.value))});
 window.addEventListener('hashchange',stop);
 window.OfficialVoice={clip,textId:text=>data.byText?.[key(text)]||null,wordId:id=>clip('word:'+id)?'word:'+id:null,kanaId:s=>clip('kana:'+s)?'kana:'+s:null,play,stop,sync:emit,clock};
})();

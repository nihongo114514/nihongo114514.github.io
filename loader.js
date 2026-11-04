'use strict';
window.BOOKS={beginner:{label:'初级',sourceOffset:19},intermediate:{label:'中级',sourceOffset:16},advanced:{label:'高级（饭制）',sourceOffset:0}};
window.BOOK_ID=new URLSearchParams(location.search).get('book')||'beginner';
if(!window.BOOKS[window.BOOK_ID])window.BOOK_ID='beginner';
window.BOOK_CONFIG=window.BOOKS[window.BOOK_ID];
const bookSelect=document.querySelector('#book-select');bookSelect.value=window.BOOK_ID;
bookSelect.addEventListener('change',()=>{location.href='./?book='+encodeURIComponent(bookSelect.value)+'#lessons'});
document.title='新世纪日本语教程 · '+window.BOOK_CONFIG.label;
function script(src){return new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src;el.onload=resolve;el.onerror=reject;document.head.append(el)})}
(async()=>{try{for(const src of ['books/'+window.BOOK_ID+'/data.js?v=8','books/'+window.BOOK_ID+'/audio.js?v=8','books/'+window.BOOK_ID+'/reference.js?v=8','books/'+window.BOOK_ID+'/audio-extra.js?v=8','voice.js?v=8','reference-ui.js?v=8','app.js?v=8'])await script(src);if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.ready.then(r=>r.active?.postMessage({type:'CACHE_BOOK',book:window.BOOK_ID})).catch(()=>{})}catch{document.querySelector('#main').innerHTML='<p class="quiet">资料未能载入，请联网后刷新。</p>'}})();

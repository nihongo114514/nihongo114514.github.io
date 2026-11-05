'use strict';
const qualityAppliedV35=new WeakSet();
function applyStudyQualityV35(data,reference,book){
 if(qualityAppliedV35.has(data))return;qualityAppliedV35.add(data);
 const patch=window.STUDY_CONTENT_FIXES_V35?.[book]||{},units=new Map(),seen=new WeakSet();
 function walk(x,parent){if(!x||typeof x!=='object'||seen.has(x))return;seen.add(x);if(!Array.isArray(x)){
  if(x.formula&&patch.formulas?.[x.formula])Object.assign(x,JSON.parse(JSON.stringify(patch.formulas[x.formula])));
  if(x.id&&patch.units?.[x.id])Object.assign(x,JSON.parse(JSON.stringify(patch.units[x.id])));
  if(x.id&&x.ja&&!units.has(x.id))units.set(x.id,x);
  if(!x.ruby&&x.chunk&&parent?.ja&&parent.ruby){const a=parent.ja.indexOf(x.chunk);if(a>=0){let p=0,out=[],valid=true;for(const n of parent.ruby){const z=p+n.text.length,l=Math.max(a,p),r=Math.min(a+x.chunk.length,z);if(l<r){if(n.reading&&(l!==p||r!==z)){valid=false;break}out.push(n.reading?{...n}:{text:n.text.slice(l-p,r-p)})}p=z}if(valid&&out.map(n=>n.text).join('')===x.chunk)x.ruby=out}}
 }
 for(const [key,v]of Object.entries(x))if(!['ruby','annotations','titleRuby','formulaRuby','speakerRuby'].includes(key)){if(Array.isArray(v))for(const child of v)walk(child,x.ja?x:parent);else walk(v,x.ja?x:parent)}}
 walk(data,null);walk(reference,null);
 const aliases=patch.aliases||{};data.vocabAliases={...data.vocabAliases,...aliases};
 data.vocab=data.vocab.filter(w=>!aliases[w.id]);
 for(const w of data.vocab){if(patch.words?.[w.id])Object.assign(w,JSON.parse(JSON.stringify(patch.words[w.id])));const q=window.STUDY_LEXICAL_AUDIT_V35?.[book]?.[w.id];if(q){w.lesson=q.lesson;w.lessons=q.lessons;w.contexts=q.contexts.map(id=>units.get(id)).filter(Boolean);w.examGapsV35=q.gaps}}
}

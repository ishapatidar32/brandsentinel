import { brandKit, makeId, timestamp } from '../data/store.js';
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function allMatches(text,term){
  const out=[];const re=new RegExp(esc(term),'ig');let m;
  while((m=re.exec(text))!==null)out.push({start:m.index,end:m.index+m[0].length,matchedText:m[0]});
  return out;
}
export function analyzeText(text){
  const findings=[];
  for(const rule of brandKit.bannedTerms){
    for(const match of allMatches(text,rule.term)){
      findings.push({id:makeId(),kind:'term',title:`Avoid “${rule.term}”`,severity:'high',...match,reason:rule.reason,source:`Banned term: “${rule.term}”. ${rule.reason}`,confidence:0.99,suggestion:`Replace “${match.matchedText}” with a specific, supportable description that matches the brand voice.`,action:null,createdAt:timestamp()});
    }
  }
  for(const preferred of brandKit.preferredTerms){
    for(const match of allMatches(text,preferred.term)){
      findings.push({id:makeId(),kind:'preferred_term',title:`Prefer “${preferred.replacement}”`,severity:'low',...match,reason:`The brand prefers “${preferred.replacement}” instead of “${preferred.term}”.`,source:`Preferred term: “${preferred.term}” → “${preferred.replacement}”.`,confidence:0.96,suggestion:text.slice(0,match.start)+preferred.replacement+text.slice(match.end),action:null,createdAt:timestamp()});
    }
  }
  for(const disclaimer of brandKit.disclaimers){
    if(disclaimer.trim()&&!text.toLowerCase().includes(disclaimer.toLowerCase())){
      findings.push({id:makeId(),kind:'disclaimer',title:'Required disclaimer is missing',severity:'medium',start:text.length,end:text.length,matchedText:'(missing disclaimer)',reason:'The brand kit requires this disclaimer to be present in published content.',source:`Required disclaimer: “${disclaimer}”`,confidence:0.99,suggestion:`Add “${disclaimer}” where it is clearly visible.`,action:null,createdAt:timestamp()});
    }
  }
  // The sample fact check intentionally only flags explicit, common year mismatches against the demo fact.
  const yearFact=brandKit.facts.find(f=>/launched in \d{4}/i.test(f.text));
  const launched=yearFact?.text.match(/launched in (\d{4})/i);
  if(launched){
    const re=/launched in (\d{4})/ig;let m;
    while((m=re.exec(text))!==null){
      if(m[1]!==launched[1])findings.push({id:makeId(),kind:'claim',title:'Launch year conflicts with approved fact',severity:'high',start:m.index,end:m.index+m[0].length,matchedText:m[0],reason:'This launch year does not match the approved sample brand fact.',source:`Approved fact: “${yearFact.text}” (effective ${yearFact.effectiveDate}).`,confidence:0.92,suggestion:`Use the approved launch year (${launched[1]}) only if this fact applies to the content.`,action:null,createdAt:timestamp()});
    }
  }
  const tonePatterns=[{re:/\b(best in the world|miracle|flawless|perfect for everyone)\b/ig,why:'This phrase may sound exaggerated or make a broad promise.'}];
  for(const item of tonePatterns){let m;while((m=item.re.exec(text))!==null){if(!findings.some(f=>f.start===m.index&&f.end===m.index+m[0].length))findings.push({id:makeId(),kind:'tone',title:'Review tone of voice',severity:'medium',start:m.index,end:m.index+m[0].length,matchedText:m[0],reason:item.why,source:`Tone profile: ${brandKit.toneProfile}`,confidence:0.78,suggestion:'Use specific, measured language that avoids exaggerated promises.',action:null,createdAt:timestamp()});}}
  const order={high:0,medium:1,low:2};
  return findings.sort((a,b)=>a.start-b.start||order[a.severity]-order[b.severity]);
}

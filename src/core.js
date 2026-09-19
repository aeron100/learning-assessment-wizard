export const BLOOM = {
  Remember: ['define','list','label','recall','identify'],
  Understand: ['summarize','explain','classify','describe','interpret'],
  Apply: ['execute','implement','use','compute','perform'],
  Analyze: ['differentiate','compare','categorize','analyze','decompose'],
  Evaluate: ['justify','critique','validate','prioritize','evaluate'],
  Create: ['design','formulate','construct','develop','synthesize','compose'],
};
export const MODALITIES = {Visual:'Diagrams, maps, and relationships',Aural:'Discussion and spoken explanation','Read/write':'Written reasoning and annotated text',Kinesthetic:'Applied practice, cases, and simulations'};
export const VERBS = Object.values(BLOOM).flat();
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const wordCount = s => s.trim().split(/\s+/u).filter(Boolean).length;
export function safeText(value, max=40000) {
  if(typeof value !== 'string' || value.length > max) throw new Error(`Text must be no more than ${max.toLocaleString()} characters.`);
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(value)) throw new Error('This text contains hidden control characters. Paste a clean text copy.');
  if (/<\s*(script|iframe|object|embed|svg|html|body)\b|javascript\s*:|data\s*:\s*text\/html|<[^>]+\bon\w+\s*=/iu.test(value)) throw new Error('Active markup is not accepted. Paste plain course text without executable HTML.');
  return value.trim();
}
export function lines(text) {return text.split(/\r?\n/u).map(s=>s.replace(/^\s*(?:[-•*]|\d+[.)])\s*/u,'').trim()).filter(Boolean);}
export function readCourse({title,description,objectives,existing}) {
  const c={title:safeText(title,180),description:safeText(description,6000),objectives:lines(safeText(objectives,16000)),existing:lines(safeText(existing||'',8000))};
  if(!c.title || !c.description || !c.objectives.length) throw new Error('Add a course title, description, and at least one course objective.');
  if(c.objectives.length>30 || c.existing.length>12) throw new Error('Use up to 30 course objectives and 12 existing SLOs, one per line.');
  return c;
}
export function parseOutline(raw) {
  const text=safeText(raw); const result={title:'',description:'',objectives:'',existing:''}; let field=null;let detected=0;
  const headings=[['title',/^(?:course\s+)?title\s*[:：]?\s*(.*)$/i],['description',/^(?:course\s+)?description\s*[:：]?\s*(.*)$/i],['objectives',/^(?:course\s+)?objectives\s*[:：]?\s*(.*)$/i],['existing',/^(?:(?:course\s+)?student\s+learning\s+outcomes|(?:course\s+)?learning\s+outcomes|CSLOs?|SLOs?)\s*[:：]?\s*(.*)$/i]];
  for(const line of text.split(/\r?\n/u)) {
    let matched=false;
    for(const [key,re] of headings){const m=line.trim().match(re);if(m){field=key;result[key]+=(result[key]?'\n':'')+m[1];detected++;matched=true;break;}}
    if(!matched && /^(?:(?:course\s+)?content|methods of (?:instruction|evaluation)|textbooks?|required materials|prerequisites?|units|hours|assignments)\s*[:：]?\s*$/i.test(line.trim()))field=null;
    else if(!matched && field) result[field]+=(result[field]?'\n':'')+line;
  }
  for(const key of Object.keys(result))result[key]=result[key].trim();
  return {fields:result,detected,text};
}
export function outcomeIssues(o) {
  const errors=[];const sentence=o.sentence.trim();const n=wordCount(sentence);
  const first=sentence.replace(/^(?:students?\s+(?:(?:will\s+be\s+able\s+to|can)\s+)?|by the end of (?:this|the) course,?\s*(?:students?\s+(?:can|will be able to)\s+)?)/i,'').split(/\s+/u)[0]?.toLowerCase().replace(/[^a-z]/g,'');
  if(!VERBS.includes(first)) errors.push('Begin with a verb from the Bloom’s allowlist (e.g., analyze, explain, design).');
  if(n>=30) errors.push('Keep the SLO below 30 words.');
  if(!n)errors.push('Add an outcome sentence.');
  if(/\b(know|learn|appreciate|understand|be familiar with|be aware of|be exposed to|gain insight into)\b/i.test(sentence))errors.push('Replace non-measurable language with an observable action.');
  if(/\bwill\b/i.test(sentence))errors.push('Use the present tense.');
  if(/\b(and|including|with)\s+(?:to\s+)?(?:define|list|label|recall|identify|summarize|explain|classify|describe|interpret|execute|implement|use|compute|perform|differentiate|compare|categorize|analyze|decompose|justify|critique|validate|prioritize|evaluate|design|formulate|construct|develop|synthesize|compose)\b/i.test(sentence))errors.push('Use one assessable action per SLO; separate compound actions.');
  if(!o.objectiveIds?.length)errors.push('Link at least one course objective.');
  if(!BLOOM[o.level]) errors.push('Confirm a measurable Bloom’s level.');
  if(o.alignmentStatus==='pending') errors.push('Automatic alignment is pending. Retry or use Adjust alignment to override.');
  if(o.alignmentStatus==='stale') errors.push('The SLO changed. Realign it or use Adjust alignment to override.');
  if(BLOOM[o.level] && !BLOOM[o.level].includes(first))errors.push('The starting verb must match the selected Bloom’s level.');
  return errors;
}
function requireString(s,max=1400){safeText(s,max);if(!s.trim())throw new Error('The AI returned an empty field.');return s.trim();}
export function validateOutcome(raw,course) {
  if(!raw || !BLOOM[raw.level])throw new Error('The AI returned an unsupported Bloom’s level.');
  const o={sentence:requireString(raw.sentence,400),criteria:raw.criteria?requireString(raw.criteria,700):'',assessment:raw.assessment?requireString(raw.assessment,500):'',level:raw.level,objectiveIds:raw.objectiveIds};
  if(!Array.isArray(o.objectiveIds)||o.objectiveIds.some(id=>!Number.isInteger(id)||id<1||id>course.objectives.length))throw new Error('The AI returned an invalid objective reference.');
  o.objectiveIds=[...new Set(o.objectiveIds)];const issues=outcomeIssues(o);if(issues.length)throw new Error(issues.join(' '));return o;
}
export function validateAssignment(raw) {
  const a={};for(const k of ['title','context','materials','artifact','alignment','accessibility'])a[k]=requireString(raw?.[k]);
  if(!Array.isArray(raw.steps)||raw.steps.length<3||raw.steps.length>6)throw new Error('The assignment needs 3–6 practical steps.');
  a.steps=raw.steps.map(s=>requireString(s,900));
  if(!Array.isArray(raw.rubric)||raw.rubric.length!==3)throw new Error('The assignment needs three observable rubric criteria.');
  a.rubric=raw.rubric.map(r=>({name:requireString(r.name,150),meets:requireString(r.meets,700),developing:requireString(r.developing,700),exceeds:requireString(r.exceeds,700)}));
  return a;
}
export function inferLevel(sentence){const text=sentence.trim().replace(/^(?:by the end of (?:this|the) course,?\s*)?(?:students?\s+(?:(?:will be able to|can)\s+)?)?/i,'');const first=text.split(/\s/)[0].toLowerCase();return Object.keys(BLOOM).find(l=>BLOOM[l].includes(first))||'Needs review';}
export function providedOutcomes(text){const sentences=lines(safeText(text,8000));if(!sentences.length||sentences.length>12)throw new Error('Enter 1–12 SLOs, one per line.');return sentences.map(sentence=>({sentence:safeText(sentence,500),level:inferLevel(sentence),objectiveIds:[],criteria:'',assessment:'',alignmentRationale:'',alignmentStatus:'pending'}));}
export function validateAlignment(raw,course,sentence){
  if(!raw||(!BLOOM[raw.level]&&raw.level!=='Needs review'))throw new Error('The AI returned an unsupported Bloom’s level.');
  if(!Array.isArray(raw.objectiveIds)||raw.objectiveIds.some(id=>!Number.isInteger(id)||id<1||id>course.objectives.length))throw new Error('The AI returned an invalid objective reference.');
  return {sentence:safeText(sentence,500),level:raw.level,objectiveIds:[...new Set(raw.objectiveIds)],criteria:raw.criteria?requireString(raw.criteria,700):'',assessment:raw.assessment?requireString(raw.assessment,500):'',alignmentRationale:requireString(raw.alignmentRationale,1400),alignmentStatus:'complete'};
}
export function checkZipDirectory(buffer) {
  const v=new DataView(buffer);let end=-1;
  for(let i=buffer.byteLength-22;i>=Math.max(0,buffer.byteLength-65557);i--){if(v.getUint32(i,true)===0x06054b50){end=i;break;}}
  if(end<0)throw new Error('This is not a supported DOCX archive.');
  if(v.getUint16(end+4,true)||v.getUint16(end+6,true))throw new Error('Multipart documents are not supported.');
  const count=v.getUint16(end+10,true);let pos=v.getUint32(end+16,true),total=0;const names=[];
  if(count>500 || count===65535)throw new Error('The document contains too many parts.');
  for(let i=0;i<count;i++) {
    if(pos+46>buffer.byteLength||v.getUint32(pos,true)!==0x02014b50)throw new Error('Malformed document archive.');
    const flags=v.getUint16(pos+8,true),compressed=v.getUint32(pos+20,true),expanded=v.getUint32(pos+24,true),len=v.getUint16(pos+28,true),extra=v.getUint16(pos+30,true),comment=v.getUint16(pos+32,true);
    if(flags&1)throw new Error('Encrypted documents are not supported.');
    if(expanded===0xffffffff||expanded>8*1024*1024||(compressed>0&&expanded/compressed>150))throw new Error('The document expands beyond the safe import limit.');
    total+=expanded;if(total>20*1024*1024)throw new Error('The document expands beyond the safe import limit.');
    if(pos+46+len+extra+comment>buffer.byteLength)throw new Error('Malformed document archive.');
    const name=new TextDecoder().decode(new Uint8Array(buffer,pos+46,len));names.push(name);
    if(/(?:^|\/)\.\.(?:\/|$)|^[/\\]|vbaProject|activeX|embeddings\//i.test(name))throw new Error('Documents with embedded active content are not accepted.');
    pos+=46+len+extra+comment;
  }
  if(!names.includes('word/document.xml')||!names.includes('[Content_Types].xml'))throw new Error('Choose a genuine DOCX document.');
  return names;
}

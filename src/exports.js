import {escapeHTML as esc} from './core.js';
export function reportBlocks(state){
  const c=state.course;const blocks=[['h1',c.title],['p',state.goal==='slos'?'Student learning outcomes':state.goal==='assignments'?'Assignment plan':'Course outcomes & assessment plan'],['h2','Course description'],['p',c.description],['h2','Course objectives']];
  c.objectives.forEach((o,i)=>blocks.push(['p',`Objective ${i+1}. ${o}`]));
  blocks.push(['h2','Student learning outcomes']);
  state.outcomes.forEach((o,i)=>{blocks.push(['h3',`SLO ${i+1}. ${o.sentence}`],['p',`Bloom’s level: ${o.level} · Course objective(s): ${o.objectiveIds.join(', ')}`],['p',`Alignment rationale: ${o.alignmentRationale||'Review the objective links and Bloom’s level.'}`]);});
  blocks.push(['h2','Alignment crosswalk']);
  state.outcomes.forEach((o,i)=>blocks.push(['p',`SLO ${i+1} → Objective(s) ${o.objectiveIds.join(', ')} → ${o.level}`]));
  blocks.push(['p','Each outcome links an observable student action to the identified course objective(s). The wizard identifies the relevant objective links and Bloom’s level; faculty can override those selections when needed.']);
  const covered=new Set(state.outcomes.flatMap(o=>o.objectiveIds));const missing=c.objectives.map((_,i)=>i+1).filter(id=>!covered.has(id));
  if(missing.length)blocks.push(['p',`Coverage to review: objective(s) ${missing.join(', ')} are not mapped to a current SLO.`]);
  if(state.goal!=='slos'){
  blocks.push(['h2','Learning activities & assessments']);
  if(!state.assignments.length)blocks.push(['p','Detailed assignments have not been generated. Create assignments to define the learning activities and assessment rubrics.']);
  state.assignments.forEach((a,i)=>{
    const objectiveIds=a.objectiveIds||state.outcomes[a.sloIndex].objectiveIds;
    const s=a.settings;blocks.push(['h3',`${i+1}. ${a.title}`],['p',`Measures: ${(a.sloIndices||[a.sloIndex]).map(i=>`SLO ${i+1}: ${state.outcomes[i].sentence}`).join('\n')}`],['p',`Modalities: ${s.modalities.join(', ')} · Knowledge: ${s.knowledge} · Suggested time: ${s.duration} · AI-resilient: ${s.resilient?'Yes':'No'}`],['p',`Scenario: ${a.context}`],['p',`Materials: ${a.materials}`],['h4','Student instructions']);
    blocks.splice(blocks.length-1,0,['p',`Selected course objectives: ${objectiveIds.map(id=>`${id}. ${c.objectives[id-1]}`).join('; ')}`]);
    a.steps.forEach((step,j)=>blocks.push(['p',`${j+1}. ${step}`]));
    blocks.push(['p',`Submit: ${a.artifact}`],['p',`Alignment: ${a.alignment}`],['p',`Accessibility: ${a.accessibility}`],['h4','Direct assessment rubric'],['p','Score each criterion 0–4: 0 = no assessable evidence; 1 = emerging evidence below the developing descriptor; 2 = developing; 3 = meets; 4 = exceeds. Suggested mastery: 9/12, with no criterion below 2. Adjust before assigning.']);
    a.rubric.forEach(r=>blocks.push(['p',`${r.name}\n2 — Developing: ${r.developing}\n3 — Meets: ${r.meets}\n4 — Exceeds: ${r.exceeds}`]));
    if(s.resilient)blocks.push(['h4','AI-resilient evidence plan'],['p','Collect a planning checkpoint, a dated draft or process log, and the final artifact. Supply a course-specific case or dataset; students identify where it informs their decisions. Use a short individual follow-up explanation, with an equivalent accessible written, recorded, or live format. Ask students to disclose any permitted AI use and verify cited sources. Grade demonstrated learning rather than detector scores; these measures do not guarantee AI-proof work.']);
    if(a.notes)blocks.push(['p',`Faculty adaptations: ${a.notes}`]);
  });
  }
  blocks.push(['h2','Faculty review & framework notes'],['p',state.reviewed?'Faculty marked this plan reviewed for course fit, scope, accessibility, and criteria.':'Draft — faculty review is still required.'],['p','AI-generated drafts may contain errors. Check content accuracy, single-construct outcomes, term-level scope, objective coverage, assessment validity, and accessible alternatives. Thresholds are suggestions, not institutional requirements.'],['p','Framework: Anderson & Krathwohl’s revised Bloom’s taxonomy (2001), with factual, conceptual, procedural, and metacognitive knowledge. VARK describes selected activity modalities, not fixed learner types or a claim of improved outcomes through style matching.'],['p','Sources: https://assessment.ucdavis.edu/assessment/Bloom · https://vark-learn.com/about-vark/what-vark-is-and-isnt/'],['p','Prepared with Learning Assessment Wizard. Course text is processed locally. Exported files are saved at the faculty member’s request.']);
  return blocks;
}
export function blocksHTML(blocks){return blocks.map(([type,text])=>`<${type}>${esc(text).replace(/\n/g,'<br>')}</${type}>`).join('');}
export function blocksText(blocks){return blocks.map(([,text])=>text).join('\n\n');}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const xml=s=>esc(s).replace(/&#39;/g,'&apos;');
const fileStem=s=>(s.replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,70)||'course-plan');
export function htmlDocument(state){
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>${esc(state.course.title)} — ${state.goal==='assignments'?'Assignments':'Student learning outcomes'}</title>
<style>body{font-family:system-ui,sans-serif;color:#19171d;background:#fff;line-height:1.65;max-width:850px;margin:40px auto;padding:0 24px}h1,h2,h3,h4{line-height:1.3;break-after:avoid}h1{font-size:2rem}h2{margin-top:2rem;border-bottom:1px solid #ddd;padding-bottom:.5rem;color:#6232a0}h3{margin-top:1.5rem}p{overflow-wrap:anywhere}@media print{body{margin:0;max-width:none;padding:0}@page{margin:18mm}}</style>
</head><body><main>${blocksHTML(reportBlocks(state))}</main></body></html>`;
}
export function exportHtml(state){download(new Blob([htmlDocument(state)],{type:'text/html;charset=utf-8'}),fileStem(state.course.title)+'.html');}
export async function exportDocx(state){
  const zip=new window.JSZip();
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
  zip.file('word/styles.xml','<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'+[1,2,3,4].map(n=>`<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="140"/><w:outlineLvl w:val="${n-1}"/></w:pPr><w:rPr><w:b/><w:color w:val="6232A0"/><w:sz w:val="${[38,30,26,23][n-1]}"/></w:rPr></w:style>`).join('')+'</w:styles>');
  const body=reportBlocks(state).map(([type,t])=>`<w:p>${type[0]==='h'?`<w:pPr><w:pStyle w:val="Heading${type[1]}"/></w:pPr>`:''}<w:r>${t.split('\n').map((line,i)=>(i?'<w:br/>':'')+`<w:t xml:space="preserve">${xml(line)}</w:t>`).join('')}</w:r></w:p>`).join('');
  zip.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080"/></w:sectPr></w:body></w:document>`);
  download(await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'}),fileStem(state.course.title)+'.docx');
}
export async function exportEpub(state){
  const zip=new window.JSZip();zip.file('mimetype','application/epub+zip',{compression:'STORE'});
  zip.file('META-INF/container.xml','<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
  const title=xml(state.course.title);const id=crypto.randomUUID();
  zip.file('OEBPS/content.opf',`<?xml version="1.0" encoding="UTF-8"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="uid">urn:uuid:${id}</dc:identifier><dc:title>${title}</dc:title><dc:language>en</dc:language><meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/,'Z')}</meta></metadata><manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="report" href="report.xhtml" media-type="application/xhtml+xml"/><item id="css" href="style.css" media-type="text/css"/></manifest><spine><itemref idref="report"/></spine></package>`);
  zip.file('OEBPS/nav.xhtml',`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en" xml:lang="en"><head><title>Contents</title></head><body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol><li><a href="report.xhtml">${title}</a></li></ol></nav></body></html>`);
  const body=reportBlocks(state).map(([type,t])=>`<${type}>${xml(t).replace(/\n/g,'<br/>')}</${type}>`).join('');
  zip.file('OEBPS/report.xhtml',`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en"><head><title>${title}</title><link rel="stylesheet" type="text/css" href="style.css"/></head><body>${body}</body></html>`);
  zip.file('OEBPS/style.css','body{font-family:serif;line-height:1.6;margin:1em}h1,h2,h3,h4{line-height:1.25;break-after:avoid}p{margin:0.8em 0}h2{border-bottom:1px solid #888;padding-bottom:.3em}');
  download(await zip.generateAsync({type:'blob',mimeType:'application/epub+zip',compression:'DEFLATE'}),fileStem(state.course.title)+'.epub');
}

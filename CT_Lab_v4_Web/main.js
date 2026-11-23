/* CT-Lab v2.0 — offline-first teaching simulator. No external dependencies. */
'use strict';
const $=id=>document.getElementById(id);
const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
const fmt=n=>Number(n).toLocaleString('en-US');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const modules=['survival','books','house','routes','gcd','decomposition','searching','algorithms','flowcharts','challenge'];
const names={overview:'ภาพรวม',survival:'สถานการณ์ชวนคิด',books:'แนะนำหนังสือ',house:'บ้านตามพิกัด',routes:'ไปให้ครบทุกที่',gcd:'หา ห.ร.ม.',decomposition:'การย่อยปัญหา',searching:'การค้นหาข้อมูล',algorithms:'การออกแบบขั้นตอนวิธี',flowcharts:'เกมเรียงผังงาน',challenge:'แบบฝึกหัดพร้อมภาพประกอบ'};
let page='overview',toastTimer=null;
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2800);}
function getProgressKey(){try{const p=JSON.parse(localStorage.getItem('ctlab-student-profile-v1')||'{}');return p.student_id?('ctlab-progress-v1-'+p.student_id):'ctlab-progress-v1';}catch{return 'ctlab-progress-v1';}}
function loadProgress(){try{const x=JSON.parse(localStorage.getItem(getProgressKey())||'{}');return {completed:x.completed||{},attempts:x.attempts||{},last:x.last||{}};}catch{return {completed:{},attempts:{},last:{}};}}
const progress=loadProgress();
function saveProgress(){try{localStorage.setItem(getProgressKey(),JSON.stringify(progress));}catch{}}
window.reloadStudentProgress=function(){const next=loadProgress();progress.completed=next.completed;progress.attempts=next.attempts;progress.last=next.last;refreshProgress();};
function record(id,success=true){progress.attempts[id]=(progress.attempts[id]||0)+1;progress.last[id]=new Date().toISOString();if(success)progress.completed[id]=true;saveProgress();refreshProgress();}
function refreshProgress(){const done=modules.filter(m=>progress.completed[m]).length;const pct=Math.round(done/modules.length*100);$('side-percent').textContent=pct+'%';$('side-meter').style.width=pct+'%';$('side-completed').textContent=`สำเร็จ ${done} จาก ${modules.length} กิจกรรม`;$('overview-done').textContent=`${done}/${modules.length}`;modules.forEach(m=>{$('done-'+m).textContent=progress.completed[m]?'✓':'↗';const item=document.querySelector(`[data-target="${m}"]`);if(item)item.classList.toggle('finished',!!progress.completed[m]);});}
function download(filename,content,type='text/plain;charset=utf-8'){const blob=new Blob(['\ufeff',content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);}
function exportProgress(){const info={project:'CT-Lab Computational Thinking Interactive Simulator',exported_at:new Date().toISOString(),source:['01_ComputationalThinking.pptx','02_Decomposition.pdf','07_searching.pptx','04 การค้นข้อมูล.pdf','02 ขั้นตอนวิธี.pptx','โปรแกรมเรียงผังงาน ด่าน 2.xlsx'],completed:progress.completed,attempts:progress.attempts,last_attempt_at:progress.last,notice:'The browser stores only completion/attempt counts, not personal identifiers.'};download('CT_Lab_LearningProgress.json',JSON.stringify(info,null,2),'application/json;charset=utf-8');toast('ส่งออกผลการเรียน (.json) แล้ว');}
function view(id){if(!names[id])return;page=id;$$('.page').forEach(s=>s.classList.toggle('active',s.dataset.page===id));$$('.nav-item').forEach(s=>s.classList.toggle('is-active',s.dataset.target===id));$('page-crumb').textContent=names[id];$('sidebar').classList.remove('open');$('mobile-overlay').classList.remove('visible');if(gcdTimer && id!=='gcd')stopGcdTimer();if(routeFrame && id!=='routes')stopRouteAnimation();window.scrollTo({top:0,behavior:'instant'});}
$$('[data-target]').forEach(el=>el.addEventListener('click',()=>view(el.dataset.target)));
$$('[data-go]').forEach(el=>el.addEventListener('click',()=>view(el.dataset.go)));
$('menu-open').addEventListener('click',()=>{$('sidebar').classList.add('open');$('mobile-overlay').classList.add('visible');});
$('mobile-overlay').addEventListener('click',()=>{$('sidebar').classList.remove('open');$('mobile-overlay').classList.remove('visible');});
$('export-progress').addEventListener('click',exportProgress);
$('teacher-open').addEventListener('click',()=>$('teacher-dialog').showModal());
refreshProgress();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 01: decision scenario based on forest story in slide 2.
// This pedagogical simulation is intentionally not real-world bear safety guidance.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const survivalSteps=[
 {name:'ประเมินสถานการณ์',q:'ขณะเดินกับเพื่อนแล้วพบหมีอยู่ข้างหน้า ควรเริ่มแก้ปัญหาอย่างไร?',options:[
  {label:'รวมกลุ่ม สังเกตสภาพแวดล้อมและระยะห่าง',points:2,why:'เริ่มต้นด้วยการรวบรวมข้อมูลและรักษาการสื่อสารในกลุ่ม'},
  {label:'วิ่งแยกกันทันที โดยไม่วางแผน',points:0,why:'เพิ่มความไม่แน่นอน ไม่ได้อาศัยการประเมินสถานการณ์ร่วมกัน'},
  {label:'เดินเข้าไปสำรวจตัวหมีใกล้ ๆ',points:0,why:'เป็นการเพิ่มความเสี่ยงโดยไม่จำเป็น'}]},
 {name:'กำหนดทางเลือก',q:'มีไฟฉายและมีดติดตัว ควรนำข้อมูลนี้ไปใช้วางแผนอย่างไร?',options:[
  {label:'เลือกแนวทางที่หลีกเลี่ยงการเผชิญหน้าและกำหนดทิศทางถอย',points:2,why:'เลือกแผนที่ไม่ต้องใช้การเผชิญหน้าหรืออุปกรณ์เป็นอาวุธ'},
  {label:'ใช้มีดเข้าไปขู่สัตว์',points:0,why:'เป็นทางเลือกที่เพิ่มความเสี่ยง และไม่ใช่เป้าหมายของโจทย์ฝึกตรรกะ'},
  {label:'ทิ้งทุกอย่างและเปลี่ยนทิศโดยไม่ดูเส้นทาง',points:1,why:'ลดขั้นตอนการพิจารณาทางเลือกและข้อมูลแวดล้อม'}]},
 {name:'พิจารณาทรัพยากร',q:'ในเรื่องมีการเก็บกระต่ายและน้ำผึ้งจากรังผึ้งแล้ว ควรตัดสินใจเกี่ยวกับสิ่งของอย่างไร?',options:[
  {label:'คำนึงถึงความเสี่ยงของสิ่งของและเก็บให้เรียบร้อย โดยไม่เข้าใกล้สัตว์',points:2,why:'ระบุข้อจำกัดของทรัพยากร ไม่สมมติว่าทุกอย่างใช้ได้อย่างปลอดภัย'},
  {label:'ทดลองนำสิ่งของไปล่อหมีทันที',points:0,why:'ไม่อาจคาดเดาปฏิกิริยาของสัตว์ จึงไม่ใช่วิธีที่ควรใช้'},
  {label:'ตัดสินใจจากการสุ่มเพียงอย่างเดียว',points:0,why:'ไม่มีเงื่อนไขเชิงเหตุผลรองรับการตัดสินใจ'}]},
 {name:'ลงมือและประเมินผล',q:'เมื่อเลือกแนวทางหลีกเลี่ยงแล้ว จะทำอย่างไรให้ทุกคนออกจากสถานการณ์ได้ครบ?',options:[
  {label:'ทำตามลำดับที่ตกลงกัน ตรวจตำแหน่งทุกคนและทบทวนแผน',points:2,why:'มีขั้นตอนตรวจสอบผลและการทำงานร่วมกัน'},
  {label:'ให้ทุกคนเลือกทางเองโดยไม่บอกกัน',points:0,why:'ขาดขั้นตอนติดตามผลและตรวจเงื่อนไขการสำเร็จ'},
  {label:'หยุดแผนทั้งหมดโดยไม่ประเมินข้อมูลใหม่',points:1,why:'ยังขาดการประเมินผลและการตอบสนองต่อเงื่อนไข'}]}
];
let survivalIdx=0,survivalScore=0,survivalLog=[];
function renderSurvival(){const done=survivalIdx>=survivalSteps.length;$('survival-progress-num').textContent=`${survivalIdx}/4`;$('survival-score').textContent=`${survivalScore} / 8`;$('survival-score-meter').style.width=`${survivalScore/8*100}%`;
 $('forest-step-label').textContent=done?'ครบ 4 ขั้น · สรุปผลแล้ว':`ขั้นที่ ${survivalIdx+1} / 4 · ${survivalSteps[survivalIdx].name}`;
 const opts=$('survival-options');opts.replaceChildren();const q=$('survival-question');
 if(done){q.textContent=survivalScore>=6?'สรุป: ออกแบบลำดับการตัดสินใจอย่างมีเหตุผลได้ดี':'สรุป: ลองปรับปรุงเงื่อนไขและลำดับขั้นตอนอีกครั้ง';
   opts.innerHTML='<div class="empty-state" style="grid-column:1/-1">จบการจำลอง — ตรวจ Algorithm Trace ด้านล่าง หรือกด “เริ่มสถานการณ์ใหม่”</div>';
 }else{const step=survivalSteps[survivalIdx];q.textContent=step.q;step.options.forEach((o,j)=>{let b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="choice-index">ตัวเลือก ${j+1}</span><strong></strong>`;b.querySelector('strong').textContent=o.label;b.addEventListener('click',()=>chooseSurvival(j));opts.appendChild(b);});}
 const log=$('survival-log');log.replaceChildren();if(!survivalLog.length){log.innerHTML='<div class="empty-state">เลือกการตัดสินใจด้านบน เพื่อสร้าง Algorithm Trace</div>';}else survivalLog.forEach((l,i)=>{const d=document.createElement('div');d.className='timeline-entry '+(l.points===2?'good':l.points===0?'bad':'');const heading=document.createElement('b');heading.textContent=`${i+1}. ${l.step} · +${l.points} คะแนน`;const choice=document.createElement('span');choice.textContent=l.label;const reason=document.createElement('p');reason.textContent='เหตุผล: '+l.why;d.append(heading,choice,reason);log.appendChild(d);});}
function chooseSurvival(index){if(survivalIdx>=4)return;const st=survivalSteps[survivalIdx],o=st.options[index];survivalLog.push({step:st.name,...o});survivalScore+=o.points;survivalIdx++;renderSurvival();const fb=$('survival-feedback');fb.textContent=`เหตุผล: ${o.why}`;fb.className='feedback '+(o.points===2?'good':o.points===0?'bad':'');if(survivalIdx===4){record('survival',survivalScore>=6);toast('สถานการณ์สิ้นสุด — ทดลองเปลี่ยนทางเลือกเพื่อเปรียบเทียบผล');}}
$('survival-reset').addEventListener('click',()=>{survivalIdx=0;survivalScore=0;survivalLog=[];$('survival-feedback').textContent='';renderSurvival();});
renderSurvival();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 02: exact initial matrix from slide 5; 6 similarity fields,
// 3 candidate recommendation books. Deterministic tie reporting.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const bookDefaults=[
 {name:'สมชาย',data:[1,1,0,1,0,0,1,0,1]},
 {name:'สมหญิง',data:[0,1,1,0,0,1,0,1,0]},
 {name:'สมศักดิ์',data:[1,1,0,0,0,0,1,0,0]},
 {name:'สมฤดี',data:[1,1,0,1,1,1,1,1,0]},
 {name:'สมหมาย',data:[0,0,0,1,1,0,0,0,1]},
 {name:'นักเรียน',data:[1,1,0,0,0,1,null,null,null]}
];
function generateRandomBookRows(){
 const randBit=()=>Math.random()<0.5?1:0;
 const rows=bookDefaults.slice(0,5).map(r=>{
   const pref=Array.from({length:6},randBit);
   const rec=Array.from({length:3},randBit);
   if(rec.every(x=>x===0))rec[Math.floor(Math.random()*3)]=1;
   return {name:r.name,data:[...pref,...rec]};
 });
 rows.push({name:'นักเรียน',data:[...Array.from({length:6},randBit),null,null,null]});
 return rows;
}
let bookRows=generateRandomBookRows();
const bookTitles=['เวทย์มนต์พ่อมดวัยรุ่น','การปลูกมะม่วง','กลอนภาษาไทย'];
const bookPixarSvgs=[
 `<svg viewBox="0 0 110 140" class="pixar-book-svg" aria-label="หนังสือเวทย์มนต์พ่อมดวัยรุ่น"><defs><linearGradient id="pb1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1e3a8a"/></linearGradient></defs><rect x="10" y="8" width="90" height="124" rx="12" fill="url(#pb1)"/><rect x="10" y="8" width="14" height="124" rx="6" fill="#1d4ed8"/><rect x="28" y="16" width="64" height="108" rx="7" fill="#60a5fa" opacity="0.22"/><circle cx="60" cy="60" r="24" fill="#fde047" opacity="0.9"/><path d="M60 40 L65 54 L79 54 L68 63 L72 77 L60 68 L48 77 L52 63 L41 54 L55 54 Z" fill="#fff"/><circle cx="40" cy="30" r="3" fill="#fef08a"/><circle cx="82" cy="94" r="3.5" fill="#fef08a"/></svg>`,
 `<svg viewBox="0 0 110 140" class="pixar-book-svg" aria-label="หนังสือการปลูกมะม่วง"><defs><linearGradient id="pb2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#047857"/></linearGradient></defs><rect x="10" y="8" width="90" height="124" rx="12" fill="url(#pb2)"/><rect x="10" y="8" width="14" height="124" rx="6" fill="#065f46"/><rect x="28" y="16" width="64" height="108" rx="7" fill="#a7f3d0" opacity="0.25"/><ellipse cx="62" cy="70" rx="20" ry="26" transform="rotate(-18 62 70)" fill="#fbbf24"/><ellipse cx="56" cy="62" rx="6" ry="10" transform="rotate(-18 56 62)" fill="#fef08a" opacity="0.65"/><path d="M62 42 Q76 30 82 40 Q72 48 62 42Z" fill="#16a34a"/></svg>`,
 `<svg viewBox="0 0 110 140" class="pixar-book-svg" aria-label="หนังสือกลอนภาษาไทย"><defs><linearGradient id="pb3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#a78bfa"/><stop offset="100%" stop-color="#5b21b6"/></linearGradient></defs><rect x="10" y="8" width="90" height="124" rx="12" fill="url(#pb3)"/><rect x="10" y="8" width="14" height="124" rx="6" fill="#4c1d95"/><rect x="28" y="16" width="64" height="108" rx="7" fill="#ddd6fe" opacity="0.22"/><rect x="38" y="38" width="44" height="56" rx="6" fill="#fef3c7"/><path d="M46 52 H74 M46 62 H74 M46 72 H66" stroke="#b45309" stroke-width="3" stroke-linecap="round"/><path d="M70 84 L86 50 Q90 46 82 44 L66 78 Z" fill="#fbbf24"/></svg>`
];
function bookAnalysis(){const student=bookRows[5].data;const differences=bookRows.slice(0,5).map((r,i)=>({name:r.name,idx:i,d:r.data.slice(0,6).reduce((s,v,j)=>s+Math.abs(v-student[j]),0)}));const min=Math.min(...differences.map(x=>x.d));const closest=differences.filter(x=>x.d===min);const recIdx=bookTitles.map((_,j)=>j).filter(j=>closest.some(c=>bookRows[c.idx].data[j+6]===1));return {differences,min,closest,recIdx};}
function renderBooks(){const {differences,min,closest,recIdx}=bookAnalysis();const body=$('book-tbody');body.replaceChildren();bookRows.forEach((r,i)=>{const tr=document.createElement('tr'),th=document.createElement('td');th.textContent=r.name;tr.appendChild(th);r.data.forEach((v,j)=>{const td=document.createElement('td');if(v===null){td.innerHTML='<span class="unknown">?</span>';}else{const b=document.createElement('button');b.type='button';b.className='binary-btn'+(v?' on':'');b.textContent=v;b.setAttribute('aria-label',`${r.name} หนังสือคอลัมน์ ${j+1} ค่า ${v} คลิกเพื่อสลับ`);b.addEventListener('click',()=>{bookRows[i].data[j]=1-v;renderBooks();$('book-feedback').textContent='';});td.appendChild(b);}tr.appendChild(td);});const td=document.createElement('td');if(i<5){const d=differences[i].d;const badge=document.createElement('span');badge.className='matrix-distance'+(d===min?' best':'');badge.textContent=d;td.appendChild(badge);}else td.textContent='—';tr.appendChild(td);body.appendChild(tr);});
 const bars=$('books-bars');bars.replaceChildren();differences.forEach(r=>{const el=document.createElement('div');el.className='bar-row';el.innerHTML='<span></span><div class="bar-track"><span class="bar-fill"></span></div><b></b>';el.children[0].textContent=r.name;el.querySelector('.bar-fill').style.width=`${r.d/6*100}%`;el.querySelector('.bar-fill').classList.toggle('best',r.d===min);el.querySelector('b').textContent=r.d;bars.appendChild(el);});
 const result=$('book-result');result.replaceChildren();const name=document.createElement('div');name.className='recommend-name';name.textContent=closest.map(c=>c.name).join(' / ');const sub=document.createElement('p');sub.className='recommend-sub';sub.textContent=`ใกล้เคียงที่สุด · แตกต่างกัน ${min} ตำแหน่ง${closest.length>1?' (เสมอกัน: พิจารณาทุกคนที่คะแนนเท่ากัน)':''}`;const title=document.createElement('div');title.className='book-title';title.textContent=recIdx.length?recIdx.map(i=>bookTitles[i]).join(' / '):'ยังไม่มีหนังสือที่แนะนำ';const shelf=document.createElement('div');shelf.className='pixar-book-shelf';if(recIdx.length){recIdx.forEach(i=>{const item=document.createElement('div');item.className='pixar-book-card';item.innerHTML=`${bookPixarSvgs[i]}<span>${bookTitles[i]}</span>`;shelf.appendChild(item);});}const desc=document.createElement('p');desc.textContent=recIdx.length?'เลือกจากหนังสือ 3 รายการที่ลูกค้าที่คล้ายกันเคยซื้อ':'ลองปรับข้อมูล เพื่อให้เกิดหนังสือที่ตรงกับกลุ่มใกล้เคียง';result.append(name,sub,title,shelf,desc);}
const bookGuess=$('book-guess');bookDefaults.slice(0,5).forEach((r,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent=r.name;bookGuess.appendChild(o);});
$('book-check').addEventListener('click',()=>{const x=Number(bookGuess.value),fb=$('book-feedback');if(bookGuess.value===''){fb.className='feedback compact bad';fb.textContent='กรุณาเลือกชื่อก่อนตรวจคำตอบ';return;}const a=bookAnalysis();const valid=a.closest.some(c=>c.idx===x);fb.className='feedback compact '+(valid?'good':'bad');fb.textContent=valid?`ถูกต้อง! ${bookRows[x].name} มีระยะห่าง ${a.min} ช่อง${a.closest.length>1?' และมีผู้ได้คะแนนเท่ากัน':''}`:`ยังไม่ถูกต้อง: ทดลองนับช่องที่ต่างกันทั้ง 6 ตำแหน่ง`;record('books',valid);});
$('books-random').addEventListener('click',()=>{bookRows=generateRandomBookRows();$('book-feedback').textContent='';bookGuess.value='';renderBooks();toast('สุ่มข้อมูลตารางหนังสือชุดใหม่แล้ว');});
$('books-reset').addEventListener('click',()=>{bookRows=structuredClone(bookDefaults);$('book-feedback').textContent='';bookGuess.value='';renderBooks();toast('คืนค่าข้อมูลตารางจากสไลด์ 5 แล้ว');});
renderBooks();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 03: source slide 7 coordinate house. Text on the slide has a
// typographical artifact in final point; interpreted as (21,11).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const buggyHouseCode=`# ภารกิจแก้บั๊ก: มีพิกัดผิดอยู่ 3 จุด! เปิด "แสดงเส้นต้นแบบ" เพื่อเทียบและแก้ไขให้ถูกต้อง
RECT 5 0 15 10
LINE 5 10 10 16
LINE 10 14 15 10
LINE 15 0 23 1
LINE 21 1 21 11
LINE 21 11 15 10
LINE 10 14 16 12
LINE 16 15 21 11`;
const blankHouseCode=`# ภารกิจเติมพิกัด: แตะจุดบนกริดเพื่อหาค่า (x,y) แล้วเติมแทนเครื่องหมาย ?
RECT 5 0 15 10
LINE 5 10 ? ?
LINE ? ? 15 10
LINE 15 0 21 1
LINE 21 1 ? ?
LINE 21 11 15 10
LINE 10 14 16 15
LINE 16 15 ? ?`;
const houseReference=[[[5,0],[15,0]],[[15,0],[15,10]],[[15,10],[5,10]],[[5,10],[5,0]],[[5,10],[10,14]],[[10,14],[15,10]],[[15,0],[21,1]],[[21,1],[21,11]],[[21,11],[15,10]],[[10,14],[16,15]],[[16,15],[21,11]]];
const HX=38,HY=474,HS=23;
const houseSvg=$('house-svg');let houseMode='code',houseShown=0,houseFreeLines=[],houseAnchor=null,houseProbePt=null,housePredictPt=null,houseActiveLine=-1;
$('house-code').value=buggyHouseCode;
function parseHouse(){const txt=$('house-code').value;let commands=[],issues=[];txt.split(/\r?\n/).forEach((raw,i)=>{const line=raw.trim();if(!line||line.startsWith('#'))return;const tokens=line.split(/\s+/);const cmd=tokens.shift().toUpperCase();if(!['LINE','RECT'].includes(cmd)||tokens.length!==4){issues.push(`บรรทัด ${i+1}: ใช้ LINE หรือ RECT พร้อมพิกัด 4 ค่า`);return;}const a=tokens.map(Number);if(a.some((x,j)=>!Number.isFinite(x)||!Number.isInteger(x)||(j%2===0?(x<0||x>26):(x<0||x>18)))){issues.push(`บรรทัด ${i+1}: พิกัดต้องเป็นจำนวนเต็มในช่วง x=0..26, y=0..18`);return;}let segments;if(cmd==='RECT'){const [x1,y1,x2,y2]=a;if(x1===x2||y1===y2){issues.push(`บรรทัด ${i+1}: สี่เหลี่ยมต้องมีความกว้างและสูงมากกว่า 0`);return;}segments=[[[x1,y1],[x2,y1]],[[x2,y1],[x2,y2]],[[x2,y2],[x1,y2]],[[x1,y2],[x1,y1]]];}else{if(a[0]===a[2]&&a[1]===a[3]){issues.push(`บรรทัด ${i+1}: จุดเริ่มและจุดสิ้นสุดตรงกัน`);return;}segments=[[[a[0],a[1]],[a[2],a[3]]]];}commands.push({cmd,a,segments,source:line,line:i+1});});if(commands.length>80)issues.push('จำนวนคำสั่งต้องไม่เกิน 80 บรรทัด');return {commands,issues};}
function lineSvg(seg,color,width,dash='',opacity=1){const [[a,b],[c,d]]=seg;return `<line x1="${HX+a*HS}" y1="${HY-b*HS}" x2="${HX+c*HS}" y2="${HY-d*HS}" stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;}
function renderHouse(){let svg='';svg+='<rect width="700" height="520" fill="#fafcff"/>';for(let x=0;x<=26;x++){const px=HX+x*HS;svg+=`<line x1="${px}" y1="${HY-18*HS}" x2="${px}" y2="${HY}" stroke="${x%5===0?'#d6e0ee':'#e8eef6'}" stroke-width="${x%5===0?1.2:.8}"/>`;if(x%2===0)svg+=`<text x="${px}" y="${HY+22}" text-anchor="middle" font-size="11" fill="#8a9bb2">${x}</text>`;}for(let y=0;y<=18;y++){const py=HY-y*HS;svg+=`<line x1="${HX}" y1="${py}" x2="${HX+26*HS}" y2="${py}" stroke="${y%5===0?'#d6e0ee':'#e8eef6'}" stroke-width="${y%5===0?1.2:.8}"/>`;if(y%2===0)svg+=`<text x="${HX-16}" y="${py+4}" text-anchor="middle" font-size="11" fill="#8a9bb2">${y}</text>`;}svg+=`<line x1="${HX}" y1="${HY}" x2="${HX+26*HS+15}" y2="${HY}" stroke="#788aa8" stroke-width="2"/><line x1="${HX}" y1="${HY}" x2="${HX}" y2="${HY-18*HS-16}" stroke="#788aa8" stroke-width="2"/><text x="${HX+26*HS+20}" y="${HY+4}" fill="#657a9c" font-size="12">x</text><text x="${HX-4}" y="${HY-18*HS-22}" fill="#657a9c" font-size="12">y</text>`;
 if($('house-reference').checked)houseReference.forEach(s=>svg+=lineSvg(s,'#edab4a',4,'8 7',.65));
 if(houseMode==='code'){const parsed=parseHouse();parsed.commands.slice(0,houseShown).forEach(c=>{const isHL=c.line===houseActiveLine;c.segments.forEach(s=>svg+=lineSvg(s,isHL?'#f97316':'#326ae7',isHL?5:3.7,'',1));});if(houseActiveLine>0){const hlCmd=parsed.commands.find(c=>c.line===houseActiveLine);if(hlCmd){hlCmd.segments.forEach(s=>{s.forEach(([px,py])=>{svg+=`<circle cx="${HX+px*HS}" cy="${HY-py*HS}" r="5" fill="#f97316" stroke="#fff" stroke-width="1.5"/>`;});});}}const done=parsed.commands.slice(0,houseShown);if(done.length){const end=done[done.length-1].segments.at(-1)[1];svg+=`<circle cx="${HX+end[0]*HS}" cy="${HY-end[1]*HS}" r="6" fill="#326ae7" stroke="#fff" stroke-width="2"/>`;}}
 else{houseFreeLines.forEach(s=>svg+=lineSvg(s,'#16aa85',3.7));if(houseAnchor)svg+=`<circle cx="${HX+houseAnchor[0]*HS}" cy="${HY-houseAnchor[1]*HS}" r="6" fill="#16aa85" stroke="#fff" stroke-width="2"/>`;}
 if(houseProbePt&&houseMode==='code'){const [px,py]=houseProbePt;const cx=HX+px*HS,cy=HY-py*HS;svg+=`<circle cx="${cx}" cy="${cy}" r="7" fill="#7c3aed" stroke="#fff" stroke-width="2"/><rect x="${cx-26}" y="${cy-30}" width="52" height="20" rx="6" fill="#10243d"/><text x="${cx}" y="${cy-16}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">(${px},${py})</text>`;}
 if(housePredictPt&&$('house-predict-mode').checked){const [px,py]=housePredictPt;const cx=HX+px*HS,cy=HY-py*HS;svg+=`<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="#db2777" stroke-width="2.5" stroke-dasharray="3,2"/>`;}
 houseSvg.innerHTML=svg;const parsed=parseHouse();if(houseMode==='code'){$('house-status').textContent=`ทำแล้ว ${houseShown} / ${parsed.commands.length} คำสั่ง`;$('house-trace').textContent=houseShown?parsed.commands.slice(0,houseShown).map((c,i)=>`${i+1}. ${c.source}`).join('\n'):'รอการทำงาน...';}else{$('house-status').textContent=`วาด ${houseFreeLines.length} เส้น`;$('house-trace').textContent=houseFreeLines.slice(-8).map((l,i)=>`${i+1}. (${l[0]}) → (${l[1]})`).join('\n')||'รอการวาด...';}}
function showHouseError(message){const fb=$('house-feedback');fb.className='feedback compact bad';fb.textContent=message;toast('กรุณาตรวจสอบคำสั่งวาดบ้าน');}
function updateHouseActiveLine(){const ta=$('house-code');const pos=ta.selectionStart||0;houseActiveLine=ta.value.slice(0,pos).split(/\r?\n/).length;renderHouse();}
$('house-code').addEventListener('click',updateHouseActiveLine);
$('house-code').addEventListener('keyup',updateHouseActiveLine);
$('house-step').addEventListener('click',()=>{if(houseMode!=='code'){toast('เปลี่ยนเป็นโหมดใช้โค้ดเพื่อดูทีละคำสั่ง');return;}const p=parseHouse();if(p.issues.length){showHouseError(p.issues[0]);return;}if(houseShown>=p.commands.length)return;const nextCmd=p.commands[houseShown];if($('house-predict-mode').checked){if(!housePredictPt){toast('โหมดทายจุด: กรุณาแตะจุดปลายทางบนกริดก่อนกดทีละคำสั่ง');return;}const targetEnd=nextCmd.segments.at(-1)[1];const hit=housePredictPt[0]===targetEnd[0]&&housePredictPt[1]===targetEnd[1];const fb=$('house-feedback');fb.className='feedback compact '+(hit?'good':'bad');fb.textContent=hit?`ทายถูก! คำสั่ง "${nextCmd.source}" จบที่ (${targetEnd[0]}, ${targetEnd[1]})`:`ทายไว้ (${housePredictPt[0]}, ${housePredictPt[1]}) แต่คำสั่งจริงจบที่ (${targetEnd[0]}, ${targetEnd[1]})`;housePredictPt=null;}else{$('house-feedback').textContent='';}houseShown=Math.min(houseShown+1,p.commands.length);renderHouse();});
$('house-run').addEventListener('click',()=>{if(houseMode!=='code'){toast('เลือกโหมดใช้โค้ดก่อน');return;}const p=parseHouse();if(p.issues.length){showHouseError(p.issues[0]);return;}houseShown=p.commands.length;renderHouse();$('house-feedback').className='feedback compact';$('house-feedback').textContent=`วาดสำเร็จ ${p.commands.length} คำสั่ง (${p.commands.reduce((n,c)=>n+c.segments.length,0)} เส้น) — กดตรวจภาพเพื่อประเมินความถูกต้อง`;});
$('house-clear').addEventListener('click',()=>{houseShown=0;houseFreeLines=[];houseAnchor=null;houseProbePt=null;housePredictPt=null;$('house-feedback').textContent='';$('house-pointer').textContent='ยังไม่ได้เลือก';$('house-probe').style.display='none';$('house-insert-probe').disabled=true;renderHouse();});
$('house-clear-free').addEventListener('click',()=>{houseFreeLines=[];houseAnchor=null;$('house-pointer').textContent='ยังไม่ได้เลือก';renderHouse();});
$('house-load-buggy').addEventListener('click',()=>{$('house-code').value=buggyHouseCode;houseShown=0;$('house-feedback').textContent='';renderHouse();toast('โหลดโจทย์แก้บั๊ก 3 จุดแล้ว');});
$('house-load-blank').addEventListener('click',()=>{$('house-code').value=blankHouseCode;houseShown=0;$('house-feedback').textContent='';renderHouse();toast('โหลดโจทย์เติมพิกัด (?) แล้ว');});
$('house-insert-probe').addEventListener('click',()=>{if(!houseProbePt)return;const ta=$('house-code');const ins=`${houseProbePt[0]} ${houseProbePt[1]}`;const s=ta.selectionStart??ta.value.length,e=ta.selectionEnd??ta.value.length;ta.value=ta.value.slice(0,s)+ins+ta.value.slice(e);ta.focus();ta.selectionStart=ta.selectionEnd=s+ins.length;houseShown=0;renderHouse();toast(`แทรกพิกัด ${ins} แล้ว`);});
$('house-code').addEventListener('input',()=>{houseShown=0;$('house-feedback').textContent='';renderHouse();});
$('house-reference').addEventListener('change',renderHouse);
$('house-predict-mode').addEventListener('change',()=>{housePredictPt=null;renderHouse();});
$$('[data-house-mode]').forEach(btn=>btn.addEventListener('click',()=>{houseMode=btn.dataset.houseMode;$$('[data-house-mode]').forEach(x=>x.classList.toggle('selected',x===btn));$('house-code-box').hidden=houseMode!=='code';$('house-free-box').hidden=houseMode!=='free';houseSvg.classList.toggle('freehand',houseMode==='free');$('house-feedback').textContent='';renderHouse();}));
function lineKey(seg){return seg.map(p=>p.join(',')).sort().join('|');}
function evaluateHouse(lines){const result=new Set(lines.map(lineKey)),target=new Set(houseReference.map(lineKey));let same=0;target.forEach(key=>{if(result.has(key))same++;});return {same,expected:target.size,extra:[...result].filter(x=>!target.has(x)).length,complete:same===target.size&&result.size===target.size};}
$('house-check').addEventListener('click',()=>{const p=parseHouse();if(houseMode==='code'&&p.issues.length){showHouseError(p.issues[0]);return;}const lines=houseMode==='code'?p.commands.slice(0,houseShown).flatMap(c=>c.segments):houseFreeLines;const e=evaluateHouse(lines);const fb=$('house-feedback');fb.className='feedback compact '+(e.complete?'good':'bad');fb.textContent=e.complete?`ถูกต้อง! รูปบ้านตรงกับเส้นต้นแบบทั้ง ${e.expected} เส้น`:`ตรงต้นแบบ ${e.same}/${e.expected} เส้น มีเส้นเกินหรือผิดพิกัด ${e.extra} เส้น`;record('house',e.complete);});
houseSvg.addEventListener('pointerdown',ev=>{const pt=houseSvg.createSVGPoint();pt.x=ev.clientX;pt.y=ev.clientY;const ctm=houseSvg.getScreenCTM();if(!ctm)return;const p=pt.matrixTransform(ctm.inverse());const x=Math.round((p.x-HX)/HS),y=Math.round((HY-p.y)/HS);if(x<0||x>26||y<0||y>18)return;if(houseMode==='free'){const q=[x,y];if(houseAnchor&&!(q[0]===houseAnchor[0]&&q[1]===houseAnchor[1]))houseFreeLines.push([houseAnchor,q]);houseAnchor=q;$('house-pointer').textContent=`(${x}, ${y})`;}else{houseProbePt=[x,y];$('house-probe').style.display='inline-block';$('house-probe').textContent=`พิกัดที่แตะ: (${x}, ${y})`;$('house-insert-probe').disabled=false;if($('house-predict-mode').checked){housePredictPt=[x,y];}}renderHouse();});
renderHouse();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 04: purely synthetic route graph. Distance units are derived
// from schematic positions and MUST NOT be attributed to the slides.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const routePoints={S:{x:126,y:352,name:'จุดเริ่มต้น',color:'#2771d8'},A:{x:245,y:151,name:'ซื้ออุปกรณ์',color:'#ea6964'},B:{x:535,y:135,name:'ทำกิจกรรม',color:'#eda32d'},C:{x:480,y:357,name:'เก็บตัวอย่าง',color:'#9274d9'}};
const routeDest=['A','B','C'];let routeSelected=[],routeFrame=null,routeRevealed=false;
function randomizeRoutePoints(){
 const keys=['S','A','B','C'],placed=[];
 keys.forEach(k=>{
   let x=120,y=120,ok=false;
   for(let tries=0;tries<80;tries++){
     x=90+Math.floor(Math.random()*560);
     y=85+Math.floor(Math.random()*265);
     if(placed.every(p=>Math.hypot(p.x-x,p.y-y)>=155)){ok=true;break;}
   }
   placed.push({x,y});
   routePoints[k].x=x;routePoints[k].y=y;
 });
}
randomizeRoutePoints();
function routeDist(a,b){const p=routePoints[a],q=routePoints[b];return Math.round(Math.hypot(p.x-q.x,p.y-q.y)/6);}
function routePath(stops){return ['S',...stops,...($('route-return').checked&&stops.length===3?['S']:[])];}
function routeWeight(stops){const p=routePath(stops);return p.slice(1).reduce((acc,c,i)=>acc+routeDist(p[i],c),0);}
function permute(a){if(a.length<=1)return [a];return a.flatMap((x,i)=>permute([...a.slice(0,i),...a.slice(i+1)]).map(p=>[x,...p]));}
function getAllRoutes(){return permute(routeDest).map(stops=>({stops,weight:routeWeight(stops)})).sort((a,b)=>a.weight-b.weight||a.stops.join('').localeCompare(b.stops.join('')));}
function routeFeedback(message,type=''){const fb=$('route-feedback');fb.textContent=message;fb.className='feedback compact '+type;}
function routeSelectStop(stop){if(routeSelected.includes(stop)){toast(`จุดหมาย ${stop} ถูกเลือกแล้ว`);return;}if(routeSelected.length>=3)return;stopRouteAnimation();routeSelected.push(stop);if(routeSelected.length===3)routeRevealed=true;renderRoutes();if(routeSelected.length===3){const score=routeWeight(routeSelected),opt=getAllRoutes()[0].weight;record('routes',score===opt);routeFeedback(score===opt?'เยี่ยม! เส้นทางนี้สั้นที่สุดในกราฟจำลอง':`เดินทางครบแล้ว แต่ยังยาวกว่าค่าต่ำสุด ${score-opt} หน่วย ลองสลับลำดับ`,score===opt?'good':'');}}
function setRoute(stops,source){stopRouteAnimation();routeSelected=[...stops];routeRevealed=true;renderRoutes();const weight=routeWeight(stops),best=getAllRoutes()[0].weight;routeFeedback(weight===best?`${source}: ได้ระยะทางต่ำสุด ${best} หน่วย`:`${source}: ระยะทาง ${weight} หน่วย มากกว่าค่าต่ำสุด ${weight-best} หน่วย`,weight===best?'good':'');record('routes',weight===best);}
function renderRoutes(){const all=getAllRoutes(),best=all[0].weight;let s='<defs><pattern id="roads" width="88" height="88" patternUnits="userSpaceOnUse"><rect width="88" height="88" fill="#f1f7fd"/><path d="M0 47 H88 M43 0 V88" stroke="#dce6f2" stroke-width="14"/><path d="M0 47 H88 M43 0 V88" stroke="#fff" stroke-width="1" stroke-dasharray="6 10"/></pattern></defs>';s+='<rect width="740" height="450" rx="14" fill="url(#roads)"/><rect x="13" y="12" width="206" height="33" rx="8" fill="#ffffffdf"/><text x="27" y="34" fill="#496887" font-size="12" font-weight="700">กราฟเส้นทางจำลอง • 3 จุดหมาย</text>';
 const keys=['S',...routeDest];for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++){const a=keys[i],b=keys[j],p=routePoints[a],q=routePoints[b],w=routeDist(a,b);s+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#b7cbdd" stroke-width="3" stroke-dasharray="7 8"/><text x="${(p.x+q.x)/2}" y="${(p.y+q.y)/2-5}" text-anchor="middle" font-size="12" font-weight="700" fill="#7992af" paint-order="stroke" stroke="#f1f7fd" stroke-width="6">${w}</text>`;}
 const path=routePath(routeSelected);for(let i=1;i<path.length;i++){const a=routePoints[path[i-1]],b=routePoints[path[i]];s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#ffffff" stroke-width="11" stroke-linecap="round"/><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#246af0" stroke-width="5" stroke-linecap="round"/>`;}if(path.length>1){const dest=routePoints[path[path.length-1]];s+=`<circle cx="${dest.x}" cy="${dest.y}" r="10" fill="#2ae0ba" stroke="#fff" stroke-width="3"/>`;}
 Object.entries(routePoints).forEach(([key,p])=>{const selected=routeSelected.includes(key);s+=`<g class="route-node" data-stop="${key}" role="button" tabindex="0" aria-label="${key} ${p.name}"><circle cx="${p.x}" cy="${p.y}" r="29" fill="${p.color}" stroke="${selected?'#8de9d2':'#fff'}" stroke-width="${selected?6:4}"/><text x="${p.x}" y="${p.y+8}" text-anchor="middle" font-size="24" font-weight="900" fill="#fff" pointer-events="none">${key}</text><rect x="${p.x-50}" y="${p.y+36}" width="100" height="25" rx="9" fill="#ffffffed"/><text x="${p.x}" y="${p.y+53}" font-size="12" text-anchor="middle" fill="#415975" font-weight="700" pointer-events="none">${p.name}</text></g>`;});s+='<circle id="route-traveler" r="10" cx="-100" cy="-100" fill="#00c8b4" stroke="#fff" stroke-width="4" style="display:none;filter:drop-shadow(0 2px 5px #233c6177)"/>';$('route-svg').innerHTML=s;
 $('route-order').textContent=routeSelected.length?'S → '+routeSelected.join(' → ')+($('route-return').checked?' → S':''):'S → เลือกจุดหมาย A, B, C';$('route-total').textContent=routeSelected.length?fmt(routeWeight(routeSelected)):'—';const legs=$('route-leg-list');legs.replaceChildren();routePath(routeSelected).slice(1).forEach((to,i)=>{const from=routePath(routeSelected)[i];const d=document.createElement('div');d.innerHTML=`<span>${from} → ${to}</span><b>${routeDist(from,to)} หน่วย</b>`;legs.appendChild(d);});
 $('route-animate').disabled=routeSelected.length!==3;
 const compare=$('route-comparison');compare.replaceChildren();all.forEach((o,i)=>{const b=document.createElement('button');b.className='route-plan'+((routeRevealed&&o.weight===best)?' best':'');const label=document.createElement('strong');label.textContent=`${o.stops.join(' → ')}`;const hint=document.createElement('span');hint.textContent=routeRevealed?(o.weight===best?'เส้นทางสั้นที่สุด':'รูปแบบที่ '+(i+1)):'ลองคำนวณเองก่อน';const amount=document.createElement('b');amount.textContent=routeRevealed?(fmt(o.weight)+' หน่วย'):'? หน่วย';b.append(label,hint,amount);b.addEventListener('click',()=>setRoute(o.stops,'เลือกแผน'));compare.appendChild(b);});}
$('route-svg').addEventListener('click',e=>{const node=e.target.closest('[data-stop]');if(node&&node.dataset.stop!=='S')routeSelectStop(node.dataset.stop);});
$('route-svg').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const node=e.target.closest('[data-stop]');if(node&&node.dataset.stop!=='S'){e.preventDefault();routeSelectStop(node.dataset.stop);}}});
$('route-random').addEventListener('click',()=>{stopRouteAnimation();routeSelected=[];routeRevealed=false;randomizeRoutePoints();routeFeedback('สุ่มตำแหน่งสถานที่ใหม่แล้ว — ลองคำนวณเส้นทางที่สั้นที่สุด');renderRoutes();});
$('route-reset').addEventListener('click',()=>{stopRouteAnimation();routeSelected=[];routeRevealed=false;routeFeedback('');renderRoutes();});
$('route-optimize').addEventListener('click',()=>{setRoute(getAllRoutes()[0].stops,'โปรแกรมตรวจครบทั้ง 6 ลำดับ');});
$('route-return').addEventListener('change',()=>{stopRouteAnimation();renderRoutes();routeFeedback('เปลี่ยนเงื่อนไขเดินทาง: ระบบคำนวณระยะทางใหม่แล้ว');});
function stopRouteAnimation(){if(routeFrame!==null)cancelAnimationFrame(routeFrame);routeFrame=null;const dot=$('route-traveler');if(dot)dot.style.display='none';}
$('route-animate').addEventListener('click',()=>{if(routeSelected.length!==3)return;stopRouteAnimation();const path=routePath(routeSelected).map(key=>routePoints[key]);const lengths=path.slice(1).map((p,i)=>Math.hypot(p.x-path[i].x,p.y-path[i].y));const total=lengths.reduce((a,b)=>a+b,0);const duration=4000;let start=null;function frame(ts){if(start===null)start=ts;let left=clamp((ts-start)/duration,0,1)*total;let idx=0;while(idx<lengths.length-1&&left>lengths[idx]){left-=lengths[idx];idx++;}const u=lengths[idx]?left/lengths[idx]:0;const a=path[idx],b=path[idx+1]||a;const dot=$('route-traveler');if(!dot)return;dot.style.display='';dot.setAttribute('cx',String(a.x+(b.x-a.x)*u));dot.setAttribute('cy',String(a.y+(b.y-a.y)*u));if(ts-start<duration)routeFrame=requestAnimationFrame(frame);else routeFrame=null;}routeFrame=requestAnimationFrame(frame);});
renderRoutes();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODULE 05: Euclidean Algorithm, including three source examples.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let gcdStage=0,gcdTimer=null,gcdRecorded=false;
function getGcdRows(){const a=Number($('gcd-a').value),b=Number($('gcd-b').value);if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b)||a<1||b<1||a>1e9||b>1e9)return {error:'กรุณาใส่จำนวนเต็มบวกตั้งแต่ 1 ถึง 1,000,000,000 ทั้งสองช่อง'};let x=Math.max(a,b),y=Math.min(a,b),rows=[];while(y!==0&&rows.length<60){const q=Math.floor(x/y),r=x%y;rows.push({a:x,b:y,q,r,nextA:y,nextB:r});x=y;y=r;}return {rows,gcd:x,inputs:[a,b]};}
function renderGcd(){const g=getGcdRows();if(g.error){$('gcd-current').classList.remove('finished');$('gcd-current').textContent=g.error;$('gcd-meter').style.width='0%';$('gcd-tbody').innerHTML='<tr><td colspan="6" class="muted-cell">ข้อมูลไม่ถูกต้อง</td></tr>';$('gcd-result').textContent='—';$('gcd-steps').textContent='—';$('gcd-stage-label').textContent='0 / 0 ขั้น';$('gcd-state').textContent='กรอกข้อมูลใหม่';$('gcd-play').disabled=true;$('gcd-step').disabled=true;$('gcd-all').disabled=true;return;}
 const {rows,gcd}=g;gcdStage=clamp(gcdStage,0,rows.length);const done=gcdStage===rows.length;$('gcd-play').disabled=done;$('gcd-step').disabled=done;$('gcd-all').disabled=done;$('gcd-steps').textContent=rows.length;$('gcd-result').textContent=done?fmt(gcd):'—';$('gcd-state').textContent=done?'เสร็จสิ้น: เศษเป็น 0':gcdStage?'กำลังทำงาน':'พร้อมทดลอง';$('gcd-current').classList.toggle('finished',done);$('gcd-meter').style.width=(gcdStage/rows.length*100)+'%';$('gcd-stage-label').textContent=`${gcdStage} / ${rows.length} ขั้น`;
 if(!gcdStage){$('gcd-current').innerHTML='<span>กด “ขั้นถัดไป” เพื่อดูการแบ่งบล็อก 3 มิติทีละรอบ</span>'; if($('gcd-3d-visual'))$('gcd-3d-visual').innerHTML=''; }else{const r=rows[gcdStage-1],label=done?'เงื่อนไขหยุด: r = 0':`รอบที่ ${gcdStage} / ${rows.length}`;$('gcd-current').replaceChildren();const eq=document.createElement('div');eq.className='equation';eq.textContent=`${fmt(r.a)} = ${fmt(r.b)} × ${fmt(r.q)} + ${fmt(r.r)}`;const sub=document.createElement('small');sub.textContent=done?`ห.ร.ม. = ${fmt(gcd)} (ลงตัวพอดี ไม่มีเศษเหลือ!)`:`แบ่งออกเป็น ${fmt(r.q)} ก้อน (ก้อนละ ${fmt(r.b)}) เหลือเศษ ${fmt(r.r)} → รอบถัดไปนำ ${fmt(r.r)} ไปแบ่ง ${fmt(r.b)}`;$('gcd-current').append(eq,sub);renderGcd3D(r,done);}
 const tbody=$('gcd-tbody');tbody.replaceChildren();if(!gcdStage){tbody.innerHTML='<tr><td colspan="6" class="muted-cell">กดขั้นถัดไปเพื่อเริ่มการคำนวณ</td></tr>';}else rows.slice(0,gcdStage).forEach((r,i)=>{const tr=document.createElement('tr');[i+1,fmt(r.a),fmt(r.b),`${fmt(r.a)} ÷ ${fmt(r.b)} = ${fmt(r.q)}`,fmt(r.r),`(${fmt(r.nextA)}, ${fmt(r.nextB)})`].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.appendChild(td);});tbody.appendChild(tr);});
 if(done){$('gcd-feedback').className='feedback compact good';$('gcd-feedback').textContent=`สิ้นสุดใน ${rows.length} รอบ เพราะเศษเป็น 0 • ห.ร.ม. = ${fmt(gcd)}`;if(!gcdRecorded){record('gcd',true);gcdRecorded=true;}}}
function renderGcd3D(r,done){
 const box=$('gcd-3d-visual');if(!box)return;
 const W=640,barW=560,startX=40;
 const qShow=Math.min(r.q,8);
 const unitW=barW/r.a;
 const bW=Math.max(18,r.b*unitW);
 const rW=r.r>0?Math.max(18,barW-qShow*bW):0;
 let blocks='';
 for(let i=0;i<qShow;i++){
   const bx=startX+i*bW;
   const bw=Math.max(12,bW-4);
   blocks+=`<g><rect x="${bx}" y="24" width="${bw}" height="34" rx="7" fill="url(#g3d-blue)"/><rect x="${bx+2}" y="26" width="${Math.max(4,bw-4)}" height="8" rx="4" fill="#fff" opacity="0.28"/><text x="${bx+bw/2}" y="46" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${r.q>8&&i===qShow-1?'...':fmt(r.b)}</text></g>`;
 }
 if(r.r>0){
   const rx=startX+qShow*bW;
   const rw=Math.max(26,barW-qShow*bW);
   blocks+=`<g><rect x="${rx}" y="24" width="${rw}" height="34" rx="7" fill="url(#g3d-orange)"/><rect x="${rx+2}" y="26" width="${Math.max(4,rw-4)}" height="8" rx="4" fill="#fff" opacity="0.32"/><text x="${rx+rw/2}" y="46" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">เศษ ${fmt(r.r)}</text></g>`;
 }
 const nextDivW=Math.max(36,Math.min(barW*0.55,bW));
 box.innerHTML=`<svg viewBox="0 0 ${W} 134" role="img" aria-label="ภาพจำลอง 3 มิติการแบ่งบล็อกยูคลิด">
   <defs>
     <linearGradient id="g3d-blue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient>
     <linearGradient id="g3d-orange" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
     <linearGradient id="g3d-green" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#059669"/></linearGradient>
   </defs>
   <text x="${startX}" y="16" font-size="11" font-weight="800" fill="#334155">ตัวตั้ง a = ${fmt(r.a)} (แบ่งทีละ b = ${fmt(r.b)} ได้ ${fmt(r.q)} ก้อน)</text>
   ${blocks}
   <text x="${startX}" y="80" font-size="11" font-weight="800" fill="#065f46">${done?`✓ ลงตัวพอดี! ขนาดก้อนที่แบ่งได้ลงตัวคือ ${fmt(r.b)}`:`ตัวหาร b = ${fmt(r.b)} (รอบต่อไปจะถูกแบ่งด้วยเศษ ${fmt(r.r)})`}</text>
   <rect x="${startX}" y="88" width="${nextDivW}" height="30" rx="7" fill="url(#g3d-green)"/>
   <rect x="${startX+2}" y="90" width="${Math.max(4,nextDivW-4)}" height="7" rx="3" fill="#fff" opacity="0.28"/>
   <text x="${startX+nextDivW/2}" y="108" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${fmt(r.b)}</text>
 </svg>`;
}
function stopGcdTimer(){if(gcdTimer){clearInterval(gcdTimer);gcdTimer=null;}$('gcd-play').textContent='▶ เล่นอัตโนมัติ';}
function gcdReset(){stopGcdTimer();gcdStage=0;gcdRecorded=false;$('gcd-feedback').textContent='';$('gcd-guess-feedback').textContent='';renderGcd();}
$('gcd-step').addEventListener('click',()=>{const g=getGcdRows();if(g.error)return;gcdStage=Math.min(gcdStage+1,g.rows.length);renderGcd();});
$('gcd-all').addEventListener('click',()=>{stopGcdTimer();const g=getGcdRows();if(g.error)return;gcdStage=g.rows.length;renderGcd();});
$('gcd-play').addEventListener('click',()=>{if(gcdTimer){stopGcdTimer();return;}const g=getGcdRows();if(g.error)return;gcdStage=Math.min(gcdStage+1,g.rows.length);renderGcd();if(gcdStage>=g.rows.length)return;$('gcd-play').textContent='Ⅱ หยุดชั่วคราว';gcdTimer=setInterval(()=>{const next=getGcdRows();if(next.error){stopGcdTimer();return;}gcdStage=Math.min(gcdStage+1,next.rows.length);renderGcd();if(gcdStage>=next.rows.length)stopGcdTimer();},Number($('gcd-speed').value));});
$('gcd-reset').addEventListener('click',gcdReset);$('gcd-a').addEventListener('input',gcdReset);$('gcd-b').addEventListener('input',gcdReset);
$('gcd-speed').addEventListener('change',()=>{if(gcdTimer)stopGcdTimer();});
$$('[data-gcd-preset]').forEach(b=>b.addEventListener('click',()=>{const [a,c]=b.dataset.gcdPreset.split(',');$('gcd-a').value=a;$('gcd-b').value=c;$('gcd-guess').value='';if($('gcd-story-box')&&b.dataset.gcdStory)$('gcd-story-box').textContent=b.dataset.gcdStory;gcdReset();}));
$('gcd-check').addEventListener('click',()=>{const g=getGcdRows(),fb=$('gcd-guess-feedback');if(g.error){fb.className='feedback compact bad';fb.textContent=g.error;return;}const val=Number($('gcd-guess').value);if(!$('gcd-guess').value||!Number.isSafeInteger(val)||val<1){fb.className='feedback compact bad';fb.textContent='กรอกคำตอบที่เป็นจำนวนเต็มบวกก่อน';return;}const correct=val===g.gcd;fb.className='feedback compact '+(correct?'good':'bad');fb.textContent=correct?`ถูกต้อง! ห.ร.ม. = ${fmt(g.gcd)}`:'ยังไม่ตรง ลองกด Step เพื่อดูว่าค่าเศษเปลี่ยนอย่างไร';record('gcd',correct);});
$('gcd-export').addEventListener('click',()=>{const g=getGcdRows();if(g.error){toast(g.error);return;}const arr=[`CT-Lab — Euclidean Algorithm Trace`, `Input: ${g.inputs.join(', ')}`,`Executed steps: ${gcdStage} / ${g.rows.length}`,''];g.rows.slice(0,gcdStage).forEach((r,i)=>arr.push(`${i+1}. ${r.a} = ${r.b} × ${r.q} + ${r.r}; next=(${r.nextA},${r.nextB})`));if(gcdStage===g.rows.length)arr.push(`GCD = ${g.gcd}`);download('CT_Lab_GCD_Trace.txt',arr.join('\n'));toast('บันทึกขั้นตอนที่แสดงอยู่เป็นไฟล์ TXT แล้ว');});
renderGcd();
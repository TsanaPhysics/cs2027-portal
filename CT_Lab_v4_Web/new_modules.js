/* CT-Lab v4.0 extension: algorithm design and interactive flowchart ordering.
   Source content: 02 ขั้นตอนวิธี.pptx and โปรแกรมเรียงผังงาน ด่าน 2.xlsx.
   Engine, example numeric inputs, canonical ordering interpretations are original teaching adaptations.
*/
'use strict';
(() => {
 const E=id=>document.getElementById(id);
 const S=(sel,ctx=document)=>Array.from(ctx.querySelectorAll(sel));
 const algTouched=new Set();
 function doneAlg(tab){algTouched.add(tab); if(algTouched.size>=2&&!progress.completed.algorithms){record('algorithms',true);toast('ผ่านกิจกรรมขั้นตอนวิธีอย่างน้อยสองห้องทดลองแล้ว ✓');}}
 const algorithmTabs=['water','minimum','logic','budget'];
 S('[data-alg-tab]').forEach(btn=>btn.addEventListener('click',()=>{
  const tab=btn.dataset.algTab;
  if(!algorithmTabs.includes(tab))return;
  S('[data-alg-tab]').forEach(b=>{const on=b===btn;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});
  S('[data-alg-panel]').forEach(el=>{const on=el.dataset.algPanel===tab;el.classList.toggle('active',on);el.hidden=!on;});
 }));
 // Watering flow: exact decision H < 0.1, one check per tick; numerical moisture evolution is added for demonstration.
 let moisture=.08,waterThresh=.1,wateringTicks=0,waterTimer=null,waterLog=[];
 function waterDecision(){return moisture<waterThresh;}
 function renderWater(){
  E('alg-water-slider').value=moisture.toFixed(2);
  E('alg-water-h').textContent=moisture.toFixed(2);
  E('alg-water-hint').textContent=moisture.toFixed(2);
  const on=waterDecision();
  const pill=E('alg-water-state');pill.textContent=on?`เปิดน้ำ · H < ${waterThresh.toFixed(2)}`:`ปิดน้ำ · H ≥ ${waterThresh.toFixed(2)}`;pill.classList.toggle('off',!on);
  E('alg-water-drop').classList.toggle('off',!on);
  E('alg-water-explain').textContent=on?`ความชื้นต่ำกว่าเกณฑ์ ${waterThresh.toFixed(2)} จึงเปิดระบบรดน้ำ`:`ความชื้นไม่ต่ำกว่าเกณฑ์ ${waterThresh.toFixed(2)} จึงปิดระบบรดน้ำ`;
  E('alg-water-trace').replaceChildren();
  waterLog.slice(-7).forEach(l=>{const row=document.createElement('div');row.className='v4-trace-entry';row.textContent=`รอบ ${l.n}: H = ${l.h.toFixed(2)} → ${l.on?'เปิดน้ำ':'ปิดน้ำ'} → ${l.next.toFixed(2)} (จำลองค่ารอบถัดไป)`;E('alg-water-trace').appendChild(row);});
 }
 function stopWater(){if(waterTimer!==null){clearInterval(waterTimer);waterTimer=null;}E('alg-water-auto').textContent='▶ จำลองอัตโนมัติ';}
 function waterStep(){let h=moisture,on=waterDecision();moisture=Math.max(0,Math.min(1,Number((moisture+(on?.04:-.02)).toFixed(2))));wateringTicks++;
  waterLog.push({n:wateringTicks,h,on,next:moisture});E('alg-water-feedback').className='feedback compact good';E('alg-water-feedback').textContent=`ตรวจ H = ${h.toFixed(2)} → ${on?'เปิดน้ำ':'ปิดน้ำ'} · รอบถัดไป H = ${moisture.toFixed(2)} (สมมติความชื้นเพิ่ม 0.04 เมื่อเปิดน้ำ และลด 0.02 เมื่อปิดน้ำ)`;
  renderWater();doneAlg('water');
 }
 E('alg-water-slider').addEventListener('input',e=>{stopWater();moisture=Number(e.target.value);renderWater();});
 E('alg-water-step').addEventListener('click',waterStep);
 E('alg-water-auto').addEventListener('click',()=>{if(waterTimer!==null){stopWater();return;}waterTimer=setInterval(()=>{if(document.querySelector('[data-page="algorithms"].active')&&document.querySelector('[data-alg-panel="water"].active'))waterStep();else stopWater();},1000);E('alg-water-auto').textContent='⏸ หยุดการจำลอง';});
 E('alg-water-reset').addEventListener('click',()=>{stopWater();moisture=.08;wateringTicks=0;waterLog=[];E('alg-water-feedback').textContent='';renderWater();});
 renderWater();
 // Reusable numerical list parser - safe finite values, no empty entries.
 function parseValues(raw,max,allowFloat=true){const ss=raw.split(/[,;\s]+/).filter(Boolean);if(!ss.length||ss.length>max)return null;const nums=ss.map(Number);if(nums.some(x=>!Number.isFinite(x)||Math.abs(x)>100000000||(!allowFloat&&!Number.isSafeInteger(x))))return null;return nums;}
 // Minimum finder.
 let minArray=[],minIdx=0,minTrace=[],minError='';
 function minInit(){minArray=parseValues(E('alg-min-data').value,24,true)||[];minIdx=0;minTrace=[];minError=minArray.length?'':'กรุณาใส่จำนวนจริง 1–24 ค่า และคั่นด้วยจุลภาค';minRender();}
 function minStep(){if(!minArray.length||minIdx>=minArray.length)return;const x=minArray[minIdx];const before=minIdx?minTrace[minTrace.length-1].after:null;const after=before===null?x:Math.min(before,x);
  minTrace.push({x,before,after});minIdx++;minRender();if(minIdx===minArray.length)doneAlg('minimum');}
 function minRender(){const tiles=E('alg-min-tiles');tiles.replaceChildren();const current=minTrace.length?minTrace[minTrace.length-1].after:null;
  minArray.forEach((v,i)=>{const el=document.createElement('div');el.className='v4-tile'+(i<minIdx?' seen':'')+(i===minIdx-1?' current':'')+(i<minIdx&&v===current?' winner':'');el.innerHTML=`<small>#${i+1}</small>`;el.appendChild(document.createTextNode(String(v)));tiles.appendChild(el);});
  E('alg-min-result').textContent=current===null?'—':String(current);
  E('alg-min-progress').textContent=minError||(minIdx===minArray.length?`ตรวจครบ ${minIdx} ค่า · ค่าต่ำสุดคือ ${current}`:`ตรวจแล้ว ${minIdx}/${minArray.length} ค่า`);
  const tbody=E('alg-min-trace');tbody.replaceChildren();minTrace.forEach((r,i)=>{const tr=document.createElement('tr');if(r.before!==null&&r.x<r.before)tr.className='highlight';for(const txt of [i+1,r.x,r.before===null?'เริ่มต้น':r.before,r.before===null?'กำหนด Min':r.x<r.before?'จริง':'เท็จ',r.after]){const td=document.createElement('td');td.textContent=txt;tr.appendChild(td);}tbody.appendChild(tr);});
  E('alg-min-feedback').textContent=minError||(minIdx===minArray.length?`✓ สำเร็จ: Min = ${current}`:minIdx?`รอบ ${minIdx} → Min = ${current}`:'กดตรวจค่าถัดไปเพื่อเริ่ม');E('alg-min-feedback').className='feedback compact'+(minIdx===minArray.length&&minArray.length?' good':minError?' bad':'');
  E('alg-min-next').disabled=minIdx===minArray.length;E('alg-min-all').disabled=minIdx===minArray.length;
 }
 E('alg-min-data').addEventListener('input',minInit);E('alg-min-next').addEventListener('click',minStep);E('alg-min-all').addEventListener('click',()=>{while(minIdx<minArray.length)minStep();});E('alg-min-reset').addEventListener('click',minInit);minInit();
 // Truth table, OR quiz.
 let logicDone=false;
 function renderLogic(){const a=E('alg-logic-a').checked,b=E('alg-logic-b').checked;
  E('alg-logic-a-label').textContent=a?'จริง':'เท็จ';E('alg-logic-b-label').textContent=b?'จริง':'เท็จ';E('alg-and').textContent=a&&b?'จริง':'เท็จ';E('alg-or').textContent=a||b?'จริง':'เท็จ';E('alg-not').textContent=!a?'จริง':'เท็จ';
  const body=E('alg-truth-rows');body.replaceChildren();for(const x of [true,false])for(const y of [true,false]){const tr=document.createElement('tr');if(x===a&&y===b)tr.className='highlight';for(const z of [x,y,x&&y,x||y,!x]){const td=document.createElement('td');td.textContent=z?'จริง':'เท็จ';tr.appendChild(td);}body.appendChild(tr);}
 }
 E('alg-logic-a').addEventListener('change',renderLogic);E('alg-logic-b').addEventListener('change',renderLogic);
 S('[data-logic-answer]').forEach(btn=>btn.addEventListener('click',()=>{const good=btn.dataset.logicAnswer==='OR';const fb=E('alg-logic-feedback');fb.textContent=good?'ถูกต้อง ✓ OR เป็นจริงเมื่อ A หรือ B อย่างน้อยหนึ่งค่าเป็นจริง':'ลองใหม่: เงื่อนไขต้องผ่านเมื่อ A หรือ B เป็นจริง ไม่จำเป็นต้องจริงพร้อมกัน';fb.className='feedback compact '+(good?'good':'bad');if(good){logicDone=true;doneAlg('logic');}}));renderLogic();
 // Budget price filter, condition x <= M.
 let priceArray=[],budgetMoney=100,budgetIdx=0,budgetTrace=[],budgetError='';
 function budgetInit(){const money=Number(E('alg-budget-money').value);const prices=parseValues(E('alg-budget-data').value,30,false);budgetIdx=0;budgetTrace=[];
  budgetError=!Number.isSafeInteger(money)||money<0||money>1000000||E('alg-budget-money').value.trim()===''?'กรุณาระบุเงิน M เป็นจำนวนเต็มตั้งแต่ 0–1,000,000':!prices||prices.some(v=>v<0)?'กรุณาระบุราคาสินค้าเป็นจำนวนเต็มไม่ติดลบ 1–30 ค่า':'';
  priceArray=budgetError?[]:prices;budgetMoney=money;budgetRender();}
 function budgetStep(){if(!priceArray.length||budgetIdx>=priceArray.length)return;const x=priceArray[budgetIdx];const previous=budgetIdx?budgetTrace[budgetIdx-1].count:0;budgetTrace.push({x,ok:x<=budgetMoney,count:previous+(x<=budgetMoney?1:0)});budgetIdx++;budgetRender();if(budgetIdx===priceArray.length)doneAlg('budget');}
 function budgetRender(){const tiles=E('alg-budget-tiles');tiles.replaceChildren();priceArray.forEach((v,i)=>{const el=document.createElement('div');el.className='v4-tile'+(i<budgetIdx?' seen':'')+(i===budgetIdx-1?' current':'')+(i<budgetIdx&&v<=budgetMoney?' winner':'');el.innerHTML=`<small>#${i+1}</small>`;el.appendChild(document.createTextNode(String(v)));tiles.appendChild(el);});
  const count=budgetTrace.length?budgetTrace[budgetTrace.length-1].count:0;E('alg-budget-result').textContent=String(count);E('alg-budget-progress').textContent=budgetError||`ตรวจแล้ว ${budgetIdx}/${priceArray.length} รายการ (M = ${budgetMoney})`;
  const tbody=E('alg-budget-trace');tbody.replaceChildren();budgetTrace.forEach((r,i)=>{const tr=document.createElement('tr');if(r.ok)tr.className='highlight';for(const txt of [i+1,r.x,r.ok?'จริง ✓':'เท็จ',r.count]){const td=document.createElement('td');td.textContent=txt;tr.appendChild(td);}tbody.appendChild(tr);});
  E('alg-budget-feedback').className='feedback compact '+(budgetError?'bad':budgetIdx===priceArray.length&&priceArray.length?'good':'');E('alg-budget-feedback').textContent=budgetError||(budgetIdx===priceArray.length?`✓ สำเร็จ: มีสินค้า ${count} รายการที่ราคาไม่เกิน ${budgetMoney} บาท`:`ตรวจสินค้าแล้ว ${budgetIdx} รายการ`);
  E('alg-budget-next').disabled=budgetIdx===priceArray.length;E('alg-budget-all').disabled=budgetIdx===priceArray.length;
 }
 E('alg-budget-money').addEventListener('input',budgetInit);E('alg-budget-data').addEventListener('input',budgetInit);E('alg-budget-next').addEventListener('click',budgetStep);E('alg-budget-all').addEventListener('click',()=>{while(budgetIdx<priceArray.length)budgetStep();});E('alg-budget-reset').addEventListener('click',budgetInit);budgetInit();
 // Flowchart puzzle: source workbook is shape-only; node labels are adapted with unique identifiers.
 const PUZZLES={
  teeth:{title:'🪥 การแปรงฟัน',about:'8 บล็อกจากแผ่นงาน “การแปรงฟัน” · มีบล็อกบ้วนปาก 2 ครั้ง',nodes:[
   ['t0','เริ่มต้น','terminal'],['t1','เตรียมอุปกรณ์: แปรง ยาสีฟัน แก้วน้ำ และน้ำ','process'],['t2','บ้วนปาก (ครั้งแรก)','process'],['t3','บีบยาสีฟันลงบนแปรงสีฟัน','process'],['t4','แปรงฟันให้ทั่ว','process'],['t5','บ้วนปาก (ครั้งหลัง)','process'],['t6','ล้างแปรงสีฟัน','process'],['t7','จบ','terminal']],
   note:'จัด “บ้วนปาก” สองบล็อกให้ต่างกันเพื่อการประเมิน ส่วนลำดับการแปรงฟันเป็นแนวทางตัวอย่างที่พัฒนาเพิ่มเติม',trace:[0,1,2,3,4,5,6,7]},
  shirt:{title:'👔 การใส่เสื้อเชิ้ต',about:'6 บล็อก · สวมแขนซ้ายหรือแขนขวาก่อนก็ได้ (ตามข้อความต้นฉบับ)',nodes:[
   ['s0','เริ่มต้น','terminal'],['s1','หยิบเสื้อ','process'],['s2','สวมแขนซ้าย','process'],['s3','สวมแขนขวา','process'],['s4','ติดกระดุม','process'],['s5','จบ','terminal']],
   altOrders:[['s0','s1','s3','s2','s4','s5']],note:'การสวมแขนซ้ายและแขนขวาสลับกันได้ตามหมายเหตุใน Excel',trace:[0,1,2,3,4,5]},
  commute:{title:'🚌 การเดินทางมาโรงเรียน',about:'9 บล็อก · เงื่อนไข “มีรถโดยสารประจำทางหรือไม่” และทางเลือกโบกรถรับจ้าง',nodes:[
   ['c0','เริ่มต้น','terminal'],['c1','ยืนรอรถโดยสารประจำทาง','process'],['c2','มีรถโดยสารประจำทางหรือไม่?','decision'],['c3','โบกรถโดยสารประจำทาง (ใช่)','process'],['c4','โบกรถรับจ้าง (ไม่ใช่)','process'],['c5','ขึ้นรถ','process'],['c6','จ่ายค่ารถ','process'],['c7','ถึงโรงเรียนแล้วลงจากรถ','process'],['c8','จบ','terminal']],
   note:'เกมวางกิ่งทางเลือก “ใช่/ไม่ใช่” ต่อจากเงื่อนไขในลำดับการอ่านบล็อก ไม่ได้แปลว่าต้องนั่งรถสองประเภทต่อกัน',trace:[0,1,2,3,5,6,7,8],altTrace:[0,1,2,4,5,6,7,8]},
  egg:{title:'🍳 การทอดไข่',about:'13 บล็อก · มีสองเงื่อนไข “น้ำมันร้อนหรือไม่” และ “ไข่สุกหรือไม่”',nodes:[
   ['e0','เริ่มต้น','terminal'],['e1','เตรียมอุปกรณ์การทอดไข่','process'],['e2','ตอกไข่ใส่ถ้วย','process'],['e3','ใส่เครื่องปรุงแล้วตีไข่','process'],['e4','ตั้งกระทะแล้วใส่น้ำมัน','process'],['e5','เปิดเตาไฟ','process'],['e6','น้ำมันร้อนหรือไม่?','decision'],['e7','เทไข่ใส่ในกระทะ','process'],['e8','ใช้ตะหลิวกลับด้านไข่','process'],['e9','ไข่สุกหรือไม่?','decision'],['e10','ปิดเตาไฟ','process'],['e11','ตักไข่ใส่จาน','process'],['e12','จบ','terminal']],
   note:'“ไม่ใช่” ที่น้ำมันร้อน/ไข่สุกให้วนตรวจซ้ำ แผนผังนี้เป็นแบบฝึกตรรกะ ไม่ใช่คำแนะนำเรื่องความปลอดภัยในการประกอบอาหาร',trace:[0,1,2,3,4,5,6,7,8,9,10,11,12]},
  dishes:{title:'🍽️ การล้างจาน',about:'8 บล็อก · ล้างจานด้วยน้ำสะอาด 2 ครั้ง และมีเงื่อนไขจานสะอาดหรือไม่',nodes:[
   ['d0','เริ่มต้น','terminal'],['d1','เทเศษอาหารลงถังขยะ','process'],['d2','ล้างจานด้วยน้ำสะอาด (ครั้งแรก)','process'],['d3','ล้างจานด้วยน้ำยาล้างจาน','process'],['d4','ล้างจานด้วยน้ำสะอาด (ครั้งหลัง)','process'],['d5','จานสะอาดหรือไม่?','decision'],['d6','คว่ำภาชนะให้แห้ง','process'],['d7','จบ','terminal']],
   note:'เงื่อนไข “ไม่ใช่” สามารถวนกลับไปล้างใหม่ แบ่งการล้างน้ำสองครั้งเพื่อแยกบล็อกที่ข้อความซ้ำกัน',trace:[0,1,2,3,4,5,6,7]}
 };
 const FC_KEYS=Object.keys(PUZZLES);let fcCase='teeth',fcSeq=[],fcPassed=new Set(),fcDrag=null,fcHintStep=0,fcTraceIndex=0;
 try{const raw=JSON.parse(localStorage.getItem('ctlab-flowcharts-v4')||'{}');fcPassed=new Set((raw.passed||[]).filter(x=>FC_KEYS.includes(x)));}catch{}
 const currentP=()=>PUZZLES[fcCase];const getN=id=>currentP().nodes.find(n=>n[0]===id);
 function fcSave(){try{localStorage.setItem('ctlab-flowcharts-v4',JSON.stringify({passed:[...fcPassed]}));}catch{}}
 function fcScore(){const p=currentP(),variants=[p.nodes.map(n=>n[0]),...(p.altOrders||[])];return Math.max(...variants.map(order=>fcSeq.reduce((n,x,i)=>n+(x===order[i]?1:0),0)));}
 function fcPassedNow(){return fcSeq.length===currentP().nodes.length&&fcScore()===currentP().nodes.length;}
 function fcFeedback(msg,type=''){const box=E('fc-feedback');box.textContent=msg;box.className='feedback compact'+(type?' '+type:'');}
 function fcAdd(id,pos){if(fcSeq.includes(id))return;if(pos==null||pos<0||pos>fcSeq.length)fcSeq.push(id);else fcSeq.splice(pos,0,id);fcRender();}
 function fcMove(from,to){if(from<0||from>=fcSeq.length||to<0||to>=fcSeq.length||from===to)return;fcSeq.splice(to,0,fcSeq.splice(from,1)[0]);fcRender();}
 function fcRemove(idx){fcSeq.splice(idx,1);fcRender();}
 function fcRender(){const p=currentP(),chart=E('fc-chart'),bank=E('fc-bank');chart.replaceChildren();bank.replaceChildren();
  const headline=E('fc-count');headline.textContent=`${fcSeq.length} / ${p.nodes.length}`;
  E('fc-score').textContent=fcSeq.length?'รอตรวจ':'—';E('fc-passed').textContent=`${fcPassed.size} / ${FC_KEYS.length}`;
  E('fc-status').textContent=fcPassed.has(fcCase)?'✓ ผ่านด่านนี้แล้ว':'ยังไม่ได้ผ่านด่าน';E('fc-status').classList.toggle('complete',fcPassed.has(fcCase));
  if(!fcSeq.length){const empty=document.createElement('div');empty.className='v4-flow-empty';empty.textContent='↓ คลิกบล็อกจากคลังทางขวา แล้วสร้างผังงานของตัวเอง';chart.appendChild(empty);}
  fcSeq.forEach((id,i)=>{const node=getN(id);if(i>0){const arrow=document.createElement('div');arrow.className='v4-flow-connector';arrow.textContent='↓';chart.appendChild(arrow);}
   const row=document.createElement('div');row.className='v4-flow-block '+(node[2]==='decision'?'decision':node[2]==='terminal'?'terminal':'');row.draggable=true;row.dataset.position=i;row.dataset.nodeId=id;
   const text=document.createElement('span');text.textContent=`${i+1}. ${node[1]}`;row.appendChild(text);
   const actions=document.createElement('span');actions.className='v4-flow-block-actions';
   const ctrls=[['↑',()=>fcMove(i,i-1),i===0,'เลื่อนขึ้น'],['↓',()=>fcMove(i,i+1),i===fcSeq.length-1,'เลื่อนลง'],['×',()=>fcRemove(i),false,'นำออก']];
   ctrls.forEach(([label,action,disabled,title])=>{const btn=document.createElement('button');btn.type='button';btn.textContent=label;btn.disabled=disabled;btn.setAttribute('aria-label',`${title}: ${node[1]}`);btn.addEventListener('click',action);actions.appendChild(btn);});row.appendChild(actions);chart.appendChild(row);
   if(node[2]==='decision'){const tags=document.createElement('div');tags.className='v4-flow-branches';tags.innerHTML='<span>✓ ใช่ → ไปขั้นที่เข้าเงื่อนไข</span><span>✕ ไม่ใช่ → เส้นทางทางเลือก / วนซ้ำ</span>';chart.appendChild(tags);}
   row.addEventListener('dragstart',ev=>{fcDrag={source:'chart',from:i,id};ev.dataTransfer.setData('text/plain',id);ev.dataTransfer.effectAllowed='move';row.classList.add('dragging');});
   row.addEventListener('dragend',()=>{fcDrag=null;row.classList.remove('dragging');});
   row.addEventListener('dragover',ev=>{ev.preventDefault();row.classList.add('drop-target');});row.addEventListener('dragleave',()=>row.classList.remove('drop-target'));
   row.addEventListener('drop',ev=>{ev.preventDefault();row.classList.remove('drop-target');if(!fcDrag)return;if(fcDrag.source==='chart')fcMove(fcDrag.from,i);else fcAdd(fcDrag.id,i);fcDrag=null;});
  });
  const remaining=p.nodes.filter(n=>!fcSeq.includes(n[0])).sort((a,b)=>{const rank=id=>((id.charCodeAt(0)*17+Number(id.slice(1))*13+5)%19);return rank(a[0])-rank(b[0]);});
  if(!remaining.length){const msg=document.createElement('p');msg.className='v4-flow-empty';msg.textContent='นำบล็อกมาวางครบแล้ว · กดตรวจผังงานได้เลย';bank.appendChild(msg);}
  remaining.forEach(node=>{const btn=document.createElement('button');btn.type='button';btn.className='v4-bank-item '+(node[2]==='decision'?'decision':node[2]==='terminal'?'terminal':'');const text=document.createElement('span');text.textContent=node[1];const small=document.createElement('small');small.textContent=node[2]==='decision'?'◇ เงื่อนไข':node[2]==='terminal'?'◉ เริ่ม/จบ':'+ เพิ่ม';btn.append(text,small);btn.draggable=true;btn.addEventListener('click',()=>fcAdd(node[0]));btn.addEventListener('dragstart',ev=>{fcDrag={source:'bank',id:node[0]};ev.dataTransfer.setData('text/plain',node[0]);});btn.addEventListener('dragend',()=>fcDrag=null);bank.appendChild(btn);});
  chart.ondragover=ev=>ev.preventDefault();chart.ondrop=ev=>{if(ev.target===chart&&fcDrag){ev.preventDefault();if(fcDrag.source==='bank')fcAdd(fcDrag.id);else fcMove(fcDrag.from,fcSeq.length-1);fcDrag=null;}};
 }
 function fcSetCase(name){if(!PUZZLES[name])return;fcCase=name;fcSeq=[];fcHintStep=0;fcTraceIndex=0;E('fc-title').textContent=currentP().title;E('fc-description').textContent=currentP().about;E('fc-simulation').hidden=true;fcFeedback('เลือกบล็อกทีละอันจากคลัง แล้วกดตรวจผังงาน');fcRender();}
 E('alg-water-thresh')?.addEventListener('change',e=>{waterThresh=Number(e.target.value)||.1;renderWater();doneAlg('water');});
 E('alg-min-random')?.addEventListener('click',()=>{
  const arr=Array.from({length:7},()=>Math.floor(Math.random()*40)-5);
  E('alg-min-data').value=arr.join(', ');
  E('alg-min-reset')?.click();
  doneAlg('minimum');
 });
 E('fc-case').addEventListener('change',e=>fcSetCase(e.target.value));
 E('fc-reset').addEventListener('click',()=>{fcSetCase(fcCase);});
 E('fc-hint').addEventListener('click',()=>{const p=currentP();const idx=Math.min(fcHintStep++,p.nodes.length-1);fcFeedback(`คำใบ้ ${idx+1}: ลองพิจารณาบล็อก “${p.nodes[idx][1]}” ที่อยู่ในลำดับตัวอย่าง หรือสังเกตว่าเงื่อนไขควรมาก่อนขั้นตอนที่ต้องตัดสินใจ`);});
 E('fc-check').addEventListener('click',()=>{const p=currentP(),n=p.nodes.length,score=fcScore();E('fc-score').textContent=`${score} / ${n}`;
  if(fcPassedNow()){fcPassed.add(fcCase);fcSave();fcFeedback(`ยอดเยี่ยม! จัดลำดับครบ ${n} บล็อกถูกต้องตามแบบฝึกที่กำหนด ✓ · ${p.note}`,'good');if(!progress.completed.flowcharts){record('flowcharts',true);toast('ผ่านโมดูลเกมเรียงผังงานแล้ว ✓');}}
  else{const firstOk=fcSeq[0]===p.nodes[0][0],lastOk=fcSeq[fcSeq.length-1]===p.nodes[n-1][0];let tip='';if(!firstOk)tip=' · ตรวจดูว่าจุด "เริ่มต้น" อยู่บนสุดหรือยัง';else if(fcSeq.length===n&&!lastOk)tip=' · ตรวจดูว่าจุด "จบ" อยู่ล่างสุดหรือยัง';fcFeedback(fcSeq.length<n?`จัดไปแล้ว ${fcSeq.length}/${n} บล็อก · ยังขาด ${n-fcSeq.length} บล็อก`:`ตรงตามลำดับตัวอย่าง ${score}/${n} บล็อก${tip} · ลองใช้ปุ่ม ↑ ↓ ปรับตำแหน่ง`, 'bad');}
  E('fc-passed').textContent=`${fcPassed.size} / ${FC_KEYS.length}`;E('fc-status').textContent=fcPassed.has(fcCase)?'✓ ผ่านด่านนี้แล้ว':'ยังไม่ได้ผ่านด่าน';E('fc-status').classList.toggle('complete',fcPassed.has(fcCase));
 });
 E('fc-example').addEventListener('click',()=>{fcTraceIndex=0;E('fc-simulation').hidden=false;fcShowTrace();E('fc-simulation').scrollIntoView({behavior:'smooth',block:'nearest'});});
 function fcShowTrace(){const p=currentP(),box=E('fc-sim-steps');box.replaceChildren();const trace=p.trace.map(i=>p.nodes[i]);trace.forEach((n,i)=>{const row=document.createElement('div');row.className='v4-sim-row'+(i<fcTraceIndex?' done':i===fcTraceIndex?' now':'');row.textContent=`${i+1}. ${n[1]}`;box.appendChild(row);});E('fc-sim-next').disabled=fcTraceIndex>=trace.length;E('fc-sim-next').textContent=fcTraceIndex>=trace.length?'✓ จบการจำลอง':'▷ ขั้นถัดไป';}
 E('fc-sim-next').addEventListener('click',()=>{fcTraceIndex=Math.min(fcTraceIndex+1,currentP().trace.length);fcShowTrace();});
 fcSetCase('teeth');
})();

/* CT-Lab v2.0: Decomposition — exercises based on 02_Decomposition.pdf (IPST, 10 pages).
 * All artwork, components, exemplars, categorization rules, and interactions are created for this lab.
 * No external libraries, services, or network connections.
 */
'use strict';
(() => {
  const labNames={bike:'จักรยาน',innovate:'นวัตกรรม',commute:'การเดินทาง',investigate:'การแยกหลักฐาน',daily:'ภารกิจประจำวัน'};
  let completed=new Set();
  try {const prior=JSON.parse(localStorage.getItem('ctlab-decomposition-v2')||'[]');if(Array.isArray(prior))completed=new Set(prior.filter(x=>labNames[x]));}catch{}
  function finishLab(id){
    if(!completed.has(id)){completed.add(id);try{localStorage.setItem('ctlab-decomposition-v2',JSON.stringify([...completed]));}catch{}
      toast('ผ่านกิจกรรม '+labNames[id]+' ✓');}
    refreshLabTabs();
    // The sixth module is complete after the learner passes any three of its five sublabs.
    if(completed.size>=3&&!progress.completed.decomposition){record('decomposition',true);toast('สำเร็จโมดูลการย่อยปัญหา — ผ่านอย่างน้อย 3 จาก 5 ห้องย่อย');}
  }
  function refreshLabTabs(){document.querySelectorAll('[data-decomp-tab]').forEach(b=>b.classList.toggle('completed',completed.has(b.dataset.decompTab)));}
  function feedback(id,message,type=''){const node=$(id);node.className='feedback compact'+(type?' '+type:'');node.textContent=message;}
  function openTab(id){if(!labNames[id])return;$$('[data-decomp-tab]').forEach(b=>{const on=b.dataset.decompTab===id;b.classList.toggle('selected',on);b.setAttribute('aria-selected',String(on));});$$('[data-decomp-panel]').forEach(p=>{const on=p.dataset.decompPanel===id;p.classList.toggle('active',on);p.hidden=!on;});}
  $$('[data-decomp-tab]').forEach(b=>b.addEventListener('click',()=>openTab(b.dataset.decompTab)));
  refreshLabTabs();
  
  // ---- 6.1: Disassemble and reassemble a bicycle. Drawing is original SVG. ----
  const parts=[
   {id:'wheels',icon:'🛞',name:'ชุดล้อ',from:'การเคลื่อนที่',explain:'ล้อหน้าและหลังรองรับน้ำหนักและช่วยให้จักรยานเคลื่อนที่ การทำงานอาศัยโครงและชุดส่งกำลัง'},
   {id:'frame',icon:'🔺',name:'โครงจักรยาน',from:'โครงสร้างหลัก',explain:'โครงทำหน้าที่เชื่อมล้อ อาน ชุดบังคับเลี้ยว และระบบถีบ ให้เกิดเป็นโครงสร้างที่รับแรงได้'},
   {id:'handle',icon:'↪️',name:'แฮนด์และตะเกียบ',from:'การควบคุมทิศทาง',explain:'แฮนด์และตะเกียบช่วยกำหนดทิศทางของล้อหน้า เป็นอีกระบบที่ต้องทำงานร่วมกับล้อและโครง'},
   {id:'seat',icon:'🪑',name:'อาน',from:'รองรับผู้ขับขี่',explain:'อานรองรับท่านั่งของผู้ขับขี่และติดตั้งบนหลักอานที่เชื่อมกับโครงจักรยาน'},
   {id:'drive',icon:'⚙️',name:'บันไดและโซ่',from:'ส่งกำลัง',explain:'แรงถีบจากบันไดส่งผ่านชุดจานหน้าและโซ่ไปยังล้อหลัง สำหรับจักรยานชนิดใช้โซ่'},
   {id:'brake',icon:'🛑',name:'ชุดเบรก',from:'ชะลอหรือหยุด',explain:'ชุดเบรกทำหน้าที่ลดความเร็ว ควรพิจารณาเป็นระบบที่สำคัญต่อการควบคุมและความปลอดภัย'}
  ];
  let bikeSelected=new Set();
  const BIKE_GHOST=`<g opacity=".13" stroke="#6a94b5" stroke-width="6" fill="none"><circle cx="185" cy="258" r="79"/><circle cx="610" cy="258" r="79"/><path d="M185 258L298 118L400 258L185 258L333 258L298 118L465 118L610 258M465 118L512 70"/><path d="M288 107h-57M508 70h62"/></g>`;
  function bikePiece(id){const attr='class="bike-piece" fill="none" stroke-linecap="round" stroke-linejoin="round"';
   const spinning=bikeSelected.has('wheels')&&bikeSelected.has('drive');
   const wCls=spinning?'bike-wheel-spin':'';
   const dCls=spinning?'bike-drive-spin':'';
   switch(id){
   case 'wheels':return `
     <g class="bike-piece" filter="url(#bike-shadow)">
       <ellipse cx="185" cy="340" rx="68" ry="9" fill="#0f172a" opacity="0.22"/>
       <ellipse cx="610" cy="340" rx="68" ry="9" fill="#0f172a" opacity="0.22"/>
       <g class="${wCls}" style="transform-origin:185px 258px">
         <circle cx="185" cy="258" r="79" fill="none" stroke="url(#tire-grad)" stroke-width="16"/>
         <circle cx="185" cy="258" r="69" fill="none" stroke="#94a3b8" stroke-width="4"/>
         <g stroke="#cbd5e1" stroke-width="2.4" opacity="0.9">
           <path d="M185 189v138m-69-69h138m-20-49L136 307m98 0L136 209m16-36L218 326m-66 0L218 190"/>
         </g>
         <circle cx="185" cy="258" r="13" fill="url(#metal-grad)" stroke="#334155" stroke-width="2"/>
         <circle cx="185" cy="258" r="4" fill="#fff"/>
       </g>
       <g class="${wCls}" style="transform-origin:610px 258px">
         <circle cx="610" cy="258" r="79" fill="none" stroke="url(#tire-grad)" stroke-width="16"/>
         <circle cx="610" cy="258" r="69" fill="none" stroke="#94a3b8" stroke-width="4"/>
         <g stroke="#cbd5e1" stroke-width="2.4" opacity="0.9">
           <path d="M610 189v138m-69-69h138m-20-49L561 307m98 0L561 209m16-36L643 326m-66 0L643 190"/>
         </g>
         <circle cx="610" cy="258" r="13" fill="url(#metal-grad)" stroke="#334155" stroke-width="2"/>
         <circle cx="610" cy="258" r="4" fill="#fff"/>
       </g>
     </g>`;
   case 'frame':return `
     <g filter="url(#bike-shadow)">
       <g ${attr} stroke="url(#frame-grad)" stroke-width="16">
         <path d="M185 258L298 118L400 258L185 258L333 258L298 118L465 118L610 258"/>
       </g>
       <g ${attr} stroke="#99f6e4" stroke-width="3" opacity="0.55">
         <path d="M190 254L298 115L463 115M298 118L398 254"/>
       </g>
       <g fill="#0f766e"><circle cx="298" cy="118" r="10"/><circle cx="400" cy="258" r="11"/></g>
     </g>`;
   case 'handle':return `
     <g filter="url(#bike-shadow)">
       <g ${attr} stroke="url(#handle-grad)" stroke-width="12">
         <path d="M465 118L515 69L610 258M514 69L562 69"/>
       </g>
       <rect x="546" y="61" width="26" height="15" rx="6" fill="#0f172a" class="bike-piece"/>
       <circle cx="515" cy="69" r="7" fill="#cbd5e1" class="bike-piece"/>
       <rect x="518" y="54" width="12" height="8" rx="4" fill="#fbbf24" class="bike-piece"/>
     </g>`;
   case 'seat':return `
     <g filter="url(#bike-shadow)">
       <g ${attr} stroke="#64748b" stroke-width="10"><path d="M298 118L279 83"/></g>
       <path d="M224 81q28 -20 90 0q-5 18 -43 17h-38z" fill="url(#seat-grad)" class="bike-piece"/>
       <path d="M235 76q24 -9 66 -2" fill="none" stroke="#94a3b8" stroke-width="2" opacity="0.6"/>
     </g>`;
   case 'drive':return `
     <g filter="url(#bike-shadow)">
       <g ${attr} stroke="#475569" stroke-width="4" stroke-dasharray="6,4">
         <path d="M398 231L185 241M398 285L185 275"/>
       </g>
       <g class="${dCls}" style="transform-origin:185px 258px">
         <circle cx="185" cy="258" r="17" fill="url(#gold-grad)" stroke="#92400e" stroke-width="2"/>
       </g>
       <g class="${dCls}" style="transform-origin:400px 258px">
         <circle cx="400" cy="258" r="28" fill="url(#gold-grad)" stroke="#92400e" stroke-width="3"/>
         <circle cx="400" cy="258" r="18" fill="#1e293b"/>
         <path d="M400 258L440 282M400 258L368 232" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/>
         <rect x="434" y="275" width="24" height="11" rx="4" fill="#0f172a"/>
         <rect x="352" y="225" width="24" height="11" rx="4" fill="#0f172a"/>
       </g>
     </g>`;
   case 'brake':return `
     <g filter="url(#bike-shadow)">
       <path d="M533 73q25 14 26 35M465 118Q420 140 185 188" fill="none" stroke="#334155" stroke-width="2.5" stroke-dasharray="4,2"/>
       <g ${attr} stroke="#ef4444" stroke-width="7">
         <path d="M171 193L187 181L200 193M597 193L611 180L624 194"/>
       </g>
       <g fill="#dc2626" class="bike-piece">
         <rect x="167" y="184" width="10" height="26" rx="4"/><rect x="602" y="181" width="10" height="27" rx="4"/>
       </g>
     </g>`;
   default:return '';
   }
  }
  function drawBike(){const svg=$('decomp-bike-svg');const order=['wheels','frame','handle','seat','drive','brake'];const moving=bikeSelected.has('wheels')&&bikeSelected.has('drive');svg.innerHTML=`<defs>
    <linearGradient id="decomp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#dbeafe"/><stop offset="68%" stop-color="#f0f9ff"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient>
    <linearGradient id="tire-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>
    <linearGradient id="metal-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#64748b"/></linearGradient>
    <linearGradient id="frame-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2dd4bf"/><stop offset="100%" stop-color="#0f766e"/></linearGradient>
    <linearGradient id="handle-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#1e40af"/></linearGradient>
    <linearGradient id="seat-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#334155"/><stop offset="100%" stop-color="#0f172a"/></linearGradient>
    <linearGradient id="gold-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#b45309"/></linearGradient>
    <filter id="bike-shadow" x="-15%" y="-15%" width="130%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.22"/></filter>
  </defs>
  <rect width="790" height="370" fill="url(#decomp-sky)"/>
  <rect x="0" y="334" width="790" height="36" fill="#cbd5e1"/>
  <path d="M0 334H790" stroke="#94a3b8" stroke-width="3"/>
  <path class="${moving?'bike-road-move':''}" d="M20 352H110 M180 352H270 M340 352H430 M500 352H590 M660 352H750" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
  ${BIKE_GHOST}${order.filter(x=>bikeSelected.has(x)).map(bikePiece).join('')}
  <text x="27" y="35" fill="#475569" font-size="14" font-weight="800">3D ASSEMBLY VIEW • ${bikeSelected.size} / 6 COMPONENT GROUPS${moving?' · ⚙️ MOVING':''}</text>`;
   $('decomp-bike-meter').style.width=(bikeSelected.size/parts.length*100)+'%';$('decomp-bike-count').textContent=`${bikeSelected.size} / ${parts.length} ส่วน`;$('decomp-bike-pct').textContent=Math.round(bikeSelected.size/parts.length*100)+'%';
   if(bikeSelected.size===parts.length){feedback('decomp-bike-feedback','ประกอบภาพครบทุกระบบแล้ว! อธิบายความสัมพันธ์ระหว่างส่วนต่าง ๆ เพื่อให้เห็นภาพของระบบทั้งคัน','good');finishLab('bike');}
   else feedback('decomp-bike-feedback',bikeSelected.size?'ชิ้นส่วนที่เลือกปรากฏบนภาพจักรยานทันที — เลือกเพิ่มเพื่อดูการทำงานร่วมกัน':'เลือกชิ้นส่วนด้านล่างเพื่อประกอบภาพขึ้นทีละส่วน');
   $('decomp-bike-buttons').querySelectorAll('[data-bike-part]').forEach(b=>{const selected=bikeSelected.has(b.dataset.bikePart);b.classList.toggle('chosen',selected);b.setAttribute('aria-pressed',String(selected));});
  }
  parts.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='decomp-part';b.dataset.bikePart=p.id;b.setAttribute('aria-pressed','false');b.innerHTML=`<span class="part-emoji">${p.icon}</span><strong>${p.name}</strong><small>${p.from}</small>`;b.addEventListener('click',()=>{if(bikeSelected.has(p.id))bikeSelected.delete(p.id);else bikeSelected.add(p.id);$('decomp-bike-insight').textContent=p.name+' — '+p.explain;drawBike();});$('decomp-bike-buttons').appendChild(b);});
  $('decomp-bike-clear').addEventListener('click',()=>{bikeSelected.clear();$('decomp-bike-insight').textContent='เลือกชิ้นส่วนเพื่อดูหน้าที่และความสัมพันธ์กับชิ้นส่วนอื่น';drawBike();});
  $('decomp-bike-all').addEventListener('click',()=>{bikeSelected=new Set(parts.map(x=>x.id));$('decomp-bike-insight').textContent='จักรยานเป็นระบบที่ประกอบด้วยหลายองค์ประกอบ ซึ่งต้องประสานกันเพื่อให้สามารถขับขี่และควบคุมได้';drawBike();});
  drawBike();

  // ---- 6.2: Components innovation. Source objects: phone, torch, RC car, pencil case. ----
  const innovationParts=[
   {id:'camera',emoji:'📷',name:'กล้อง',from:'โทรศัพท์'},
   {id:'screen',emoji:'📱',name:'ระบบแสดงผล',from:'โทรศัพท์'},
   {id:'led',emoji:'🔦',name:'แหล่งกำเนิดแสง',from:'ไฟฉาย'},
   {id:'motor',emoji:'⚙️',name:'มอเตอร์',from:'รถบังคับ'},
   {id:'wheels',emoji:'🛞',name:'ชุดล้อ',from:'รถบังคับ'},
   {id:'case',emoji:'🧰',name:'กล่องบรรจุ',from:'กล่องดินสอ'}
  ];
  const innovationGoals={
    night:{title:'อุปกรณ์สำรวจพื้นที่แสงน้อย',need:['led'],suggest:'ต้องมีไฟส่องสว่าง เพื่อให้สังเกตสิ่งของในพื้นที่แสงน้อยได้'},
    move:{title:'รถขนส่งอุปกรณ์ขนาดเล็ก',need:['motor','wheels'],suggest:'ต้องมีทั้งแหล่งขับเคลื่อนและชุดล้อเพื่อเคลื่อนที่'},
    record:{title:'ชุดบันทึกภาพและข้อมูลเคลื่อนที่',need:['camera','screen'],suggest:'ต้องมีกล้องรับภาพและระบบแสดงผลหรืออ่านข้อมูล'}
  };
  let innovationSelected=new Set();
  innovationParts.forEach(p=>{const b=document.createElement('button');b.className='decomp-part';b.dataset.innoPart=p.id;b.setAttribute('aria-pressed','false');b.innerHTML=`<span class="part-emoji">${p.emoji}</span><strong>${p.name}</strong><small>จาก: ${p.from}</small>`;b.addEventListener('click',()=>{if(innovationSelected.has(p.id))innovationSelected.delete(p.id);else innovationSelected.add(p.id);renderInnovation();});$('decomp-inno-parts').appendChild(b);});
  function renderInnovation(){const goal=innovationGoals[$('decomp-inno-goal').value],picked=innovationParts.filter(p=>innovationSelected.has(p.id));$('decomp-inno-count').textContent=picked.length;
    $('decomp-inno-visual').textContent=picked.length?picked.map(p=>p.emoji).slice(0,4).join(' '):'⚙️';$('decomp-inno-title').textContent=picked.length?goal.title:'เลือกชิ้นส่วนเพื่อเริ่มต้น';$('decomp-inno-subtitle').textContent=picked.length?`แนวคิดจาก ${picked.length} องค์ประกอบ / ชุดต้นแบบเสมือนจริง`:'การผสมองค์ประกอบเป็นแบบจำลองแนวคิด มิใช่แบบแปลนวิศวกรรม';
    $('decomp-inno-tags').replaceChildren();picked.forEach(p=>{const span=document.createElement('span');span.textContent=p.name;$('decomp-inno-tags').appendChild(span);});
    $$('[data-inno-part]').forEach(b=>{const selected=innovationSelected.has(b.dataset.innoPart);b.classList.toggle('chosen',selected);b.setAttribute('aria-pressed',String(selected));});
    $('decomp-inno-insight').textContent=goal.suggest;
    const needs=goal.need.filter(k=>!innovationSelected.has(k));
    if(picked.length<2)feedback('decomp-inno-feedback','เลือกอย่างน้อย 2 ชิ้นส่วน จากนั้นประเมินว่าองค์ประกอบสอดคล้องกับเป้าหมายหรือไม่');
    else if(needs.length)feedback('decomp-inno-feedback',`ยังขาดองค์ประกอบเพื่อรองรับเป้าหมาย: ${needs.map(k=>innovationParts.find(p=>p.id===k).name).join(', ')}`,'bad');
    else feedback('decomp-inno-feedback','ต้นแบบมีองค์ประกอบหลักที่ตอบโจทย์แล้ว ลองอธิบายว่าชิ้นส่วนจะเชื่อมกันอย่างไร','good');
  }
  $('decomp-inno-goal').addEventListener('change',renderInnovation);
  $('decomp-inno-check').addEventListener('click',()=>{const goal=innovationGoals[$('decomp-inno-goal').value];if(innovationSelected.size<2||goal.need.some(k=>!innovationSelected.has(k))){feedback('decomp-inno-feedback','ยังไม่ผ่าน: เลือกอย่างน้อย 2 ชิ้นส่วน และมีองค์ประกอบจำเป็นครบตามเป้าหมาย','bad');return;}feedback('decomp-inno-feedback','ผ่าน! แนวคิดมีส่วนประกอบที่ตรงวัตถุประสงค์ ขั้นถัดไปคือทดลองความเป็นไปได้ด้านพลังงาน ขนาด การเชื่อมต่อ และความปลอดภัย','good');finishLab('innovate');});
  $('decomp-inno-reset').addEventListener('click',()=>{innovationSelected.clear();$('decomp-inno-goal').value='night';renderInnovation();});renderInnovation();

  // ---- 6.3: Travel-to-school hierarchical step decomposition. ----
  const journeyGroups=[
   {title:'1. จากบ้านไปป้ายรถประจำทาง',steps:[
      ['1.1','เดินจากห้องไปยังประตูบ้าน'],['1.2','เปิดประตูบ้าน'],['1.3','เดินออกจากรั้วบ้าน'],['1.4','เดินไปยังป้ายรถประจำทาง'],['1.5','รอรถประจำทาง'],['1.6','เมื่อรถสายที่ต้องการมาถึง ให้ขึ้นรถประจำทาง']]},
   {title:'2. โดยสารรถไปยังบริเวณโรงเรียน',steps:[
      ['2.1','หาที่นั่งหรือหาตำแหน่งยืนอย่างเหมาะสม'],['2.2','ชำระค่าโดยสาร'],['2.3','อยู่บนรถจนถึงบริเวณโรงเรียนแล้วลงจากรถ']]},
   {title:'3. จากป้ายรถถึงโรงเรียน',steps:[
      ['3.1','สำรวจเส้นทางจากป้ายไปทางเข้าโรงเรียน'],['3.2','เดินตามทางที่ปลอดภัยไปถึงประตูโรงเรียน'],['3.3','เข้าพื้นที่โรงเรียนและตรวจว่าเดินทางถึงเป้าหมายแล้ว']]}
  ];
  const journeySteps=journeyGroups.flatMap(g=>g.steps);let journeyDone=new Set(),journeyExpanded=new Set([0]);
  function renderJourney(){const tree=$('decomp-tree');tree.replaceChildren();journeyGroups.forEach((g,i)=>{
    const group=document.createElement('div');group.className='decomp-tree-group';const head=document.createElement('button');head.type='button';head.className='decomp-tree-head';const count=g.steps.filter(s=>journeyDone.has(s[0])).length;head.innerHTML=`<span>${journeyExpanded.has(i)?'▾':'▸'} &nbsp;${g.title}</span><span class="count">${count}/${g.steps.length} ขั้น</span>`;head.setAttribute('aria-expanded',String(journeyExpanded.has(i)));head.addEventListener('click',()=>{if(journeyExpanded.has(i))journeyExpanded.delete(i);else journeyExpanded.add(i);renderJourney();});group.appendChild(head);
    if(journeyExpanded.has(i)){const list=document.createElement('div');list.className='decomp-tree-items';g.steps.forEach(([id,text])=>{const label=document.createElement('label');const check=document.createElement('input');check.type='checkbox';check.checked=journeyDone.has(id);check.addEventListener('change',()=>{check.checked?journeyDone.add(id):journeyDone.delete(id);renderJourney();});const idx=document.createElement('span');idx.className='step-id';idx.textContent=id;const title=document.createElement('span');title.textContent=text;title.className=check.checked?'checked':'';label.append(check,idx,title);if(i===2){const badge=document.createElement('small');badge.className='added-note';badge.textContent='* เว็บขยายตัวอย่าง';label.appendChild(badge);}list.appendChild(label);});group.appendChild(list);}tree.appendChild(group);
  });
  const done=journeyDone.size,total=journeySteps.length;$('decomp-commute-meter').style.width=(done/total*100)+'%';$('decomp-commute-count').textContent=`${done} / ${total} ขั้น`;$('decomp-commute-pct').textContent=Math.round(done/total*100)+'%';$('decomp-bus-marker').style.left=(done/total*100)+'%';$('decomp-commute-run').disabled=done===total;
  const next=journeySteps.find(s=>!journeyDone.has(s[0]));$('decomp-commute-current').textContent=next?`ขั้นถัดไป: ${next[0]} ${next[1]}`:'สำเร็จ! เดินทางจากบ้านถึงโรงเรียนครบทุกขั้นในแบบจำลอง';
  if(done===total){feedback('decomp-commute-feedback','ผ่าน! ย่อยการเดินทางหนึ่งภารกิจเป็น 3 กลุ่มหลัก และ 12 ขั้นตอนย่อยที่ติดตามได้','good');finishLab('commute');}
  else feedback('decomp-commute-feedback',done?`ทำแล้ว ${done} ขั้น แผนงานยังเหลือ ${total-done} ขั้น`:'กดชื่อกลุ่มเพื่อขยาย หรือกด “ทำขั้นตอนถัดไป” เพื่อเริ่มเดินทาง');
  }
  $('decomp-commute-expand').addEventListener('click',()=>{journeyExpanded=new Set([0,1,2]);renderJourney();});
  $('decomp-commute-run').addEventListener('click',()=>{const next=journeySteps.find(s=>!journeyDone.has(s[0]));if(!next)return;journeyDone.add(next[0]);journeyExpanded.add(Number(next[0].split('.')[0])-1);renderJourney();});
  $('decomp-commute-reset').addEventListener('click',()=>{journeyDone.clear();journeyExpanded=new Set([0]);renderJourney();});renderJourney();

  // ---- 6.4: Fictional investigative scenario, data vs verification vs hypothesis. ----
  const CASES={
    1:{desc:'ชายผู้ร่ำรวยในเรื่องถูกพบเสียชีวิตในกระท่อม ขณะที่มีจดหมาย หนังสือพิมพ์ และอาหารอยู่ในสถานที่ ให้แยกข้อมูลจากเรื่องที่เห็นหรือบอกเล่า ออกจากสิ่งที่ยังต้องตรวจสอบและข้อสรุปที่ยังพิสูจน์ไม่ได้',cards:[
       {text:'มีผู้พบชายเสียชีวิตอยู่ภายในกระท่อม',kind:'fact'},
       {text:'ประตูกระท่อมเปิดอยู่เมื่อมีผู้มาถึง',kind:'fact'},
       {text:'พบหนังสือพิมพ์ฉบับวันจันทร์และจดหมายที่ยังไม่ได้เปิด',kind:'fact'},
       {text:'ตรวจสอบช่วงเวลาที่หนังสือพิมพ์หรือจดหมายถูกนำมาส่ง',kind:'verify'},
       {text:'คนส่งอาหารเป็นผู้กระทำผิดแน่นอน',kind:'hyp'},
       {text:'ตรวจสอบผู้เห็นเหตุการณ์และข้อมูลเวลาเข้าออกกระท่อม',kind:'verify'}
      ]},
    2:{desc:'ตามสถานการณ์ชวนคิดในเอกสาร มีชายวัยกลางคนเดินทางกับครอบครัว 4 คน พบกลุ่มวัยรุ่น 10 คน เกิดการเผชิญหน้าและมีการยิงปืนจนมีผู้เสียชีวิตหนึ่งคน ให้แยกปัญหาเป็นข้อมูลที่ระบุ เหตุที่ควรตรวจสอบ และความเห็นที่ยังพิสูจน์ไม่ได้',cards:[
       {text:'เรื่องเล่าระบุว่าชายวัยกลางคนเดินทางกับครอบครัว 4 คน',kind:'fact'},
       {text:'เรื่องเล่าระบุว่ามีกลุ่มวัยรุ่น 10 คนเข้ามาเกี่ยวข้อง',kind:'fact'},
       {text:'เรื่องเล่าระบุว่ามีการยิงปืนและมีผู้เสียชีวิตหนึ่งคน',kind:'fact'},
       {text:'สอบถามพยานหลายฝ่ายเพื่อตรวจสอบลำดับเหตุการณ์',kind:'verify'},
       {text:'การกระทำนี้เป็นการป้องกันตัวตามกฎหมายอย่างแน่นอน',kind:'hyp'},
       {text:'ตรวจสอบหลักฐานทางกายภาพและข้อเท็จจริงจากเจ้าหน้าที่',kind:'verify'}
      ]}
  };
  let caseAnswers={},selectedCaseCard=0;
  const kindText={fact:'ข้อเท็จจริงในโจทย์',verify:'ต้องตรวจสอบเพิ่ม',hyp:'ข้อสันนิษฐาน'};
  function renderCase(){const item=CASES[$('decomp-case').value];$('decomp-case-desc').textContent=item.desc;const cards=$('decomp-evidence-cards');cards.replaceChildren();item.cards.forEach((card,i)=>{const b=document.createElement('button');b.type='button';b.className='decomp-evidence-card'+(selectedCaseCard===i?' active':'');b.setAttribute('aria-pressed',String(selectedCaseCard===i));b.textContent=(i+1)+'. '+card.text;const label=document.createElement('span');label.textContent=caseAnswers[i]?'จัดเป็น: '+kindText[caseAnswers[i]]:'ยังไม่ได้จัดหมวด';b.appendChild(label);b.addEventListener('click',()=>{selectedCaseCard=i;renderCase();});cards.appendChild(b);});$('decomp-case-count').textContent=`${Object.keys(caseAnswers).length} / ${item.cards.length}`;$('decomp-case-breakdown').textContent=`ข้อมูลในโจทย์: ${Object.values(caseAnswers).filter(v=>v==='fact').length} · ต้องตรวจสอบเพิ่ม: ${Object.values(caseAnswers).filter(v=>v==='verify').length} · ข้อสันนิษฐาน: ${Object.values(caseAnswers).filter(v=>v==='hyp').length}`;}
  $('decomp-case').addEventListener('change',()=>{caseAnswers={};selectedCaseCard=0;feedback('decomp-case-feedback','เลือกบัตรแล้วกดหมวดหมู่เพื่อจำแนกข้อมูล');renderCase();});
  $$('[data-sort]').forEach(b=>b.addEventListener('click',()=>{caseAnswers[selectedCaseCard]=b.dataset.sort;const items=CASES[$('decomp-case').value].cards;if(Object.keys(caseAnswers).length<items.length){let next=items.findIndex((_,i)=>caseAnswers[i]===undefined);if(next>=0)selectedCaseCard=next;}renderCase();}));
  $('decomp-case-check').addEventListener('click',()=>{const cards=CASES[$('decomp-case').value].cards;const filled=Object.keys(caseAnswers).length;if(filled<cards.length){feedback('decomp-case-feedback',`กรุณาจำแนกให้ครบ 6 บัตร (ปัจจุบัน ${filled}/6)`,'bad');return;}const matched=cards.filter((c,i)=>caseAnswers[i]===c.kind).length;if(matched===cards.length){feedback('decomp-case-feedback','ถูกต้องครบ 6/6! คุณแยกข้อมูลที่ระบุไว้ สิ่งที่ต้องตรวจสอบ และข้อสันนิษฐานออกจากกันได้','good');finishLab('investigate');}else feedback('decomp-case-feedback',`ถูก ${matched}/6 บัตร ลองทบทวนว่า “โจทย์บอกว่าเกิดขึ้น” ต่างจาก “ต้องตรวจสอบ” และ “สรุปโดยไม่มีหลักฐาน” อย่างไร`,'bad');});
  $('decomp-case-reset').addEventListener('click',()=>{caseAnswers={};selectedCaseCard=0;feedback('decomp-case-feedback','ล้างการจัดประเภทแล้ว');renderCase();});renderCase();

  // ---- 6.5: Fully editable everyday breakdown + downloadable trace. ----
  const dailyPresets={
    quiz:{name:'ทำข้อสอบแบบเลือกตอบให้ครบและตรวจคำตอบ',steps:['อ่านคำชี้แจงและกำหนดเวลาที่มี','อ่านคำถามและระบุสิ่งที่โจทย์ต้องการ','พิจารณาตัวเลือกและเลือกคำตอบ','ทบทวนข้อที่ไม่แน่ใจ','ตรวจว่าตอบครบแล้วส่งข้อสอบ']},
    lunch:{name:'รับประทานอาหารกลางวันที่โรงเรียน',steps:['ตรวจเวลาและเลือกอาหารที่เหมาะสม','ล้างมือก่อนรับประทานอาหาร','ต่อแถวและรับอาหาร','รับประทานอาหารอย่างเหมาะสม','เก็บภาชนะและทิ้งขยะให้ถูกที่']},
    university:{name:'วางแผนไปทัศนศึกษา',steps:['กำหนดวัตถุประสงค์และสถานที่','สำรวจจำนวนผู้ร่วมกิจกรรมและงบประมาณ','กำหนดเส้นทางและยานพาหนะ','จัดทำกำหนดการและเอกสารที่จำเป็น','เตรียมอุปกรณ์และตรวจความพร้อมก่อนเดินทาง']},
    online:{name:'ขายสินค้าออนไลน์อย่างเป็นระบบ',steps:['เลือกสินค้าและตรวจจำนวนคงเหลือ','ถ่ายภาพและจัดทำรายละเอียดสินค้า','กำหนดราคาและช่องทางการขาย','ตอบคำถามและยืนยันคำสั่งซื้อ','บรรจุสินค้าและจัดส่ง','ติดตามผลและบันทึกข้อมูลการขาย']},
    sports:{name:'เตรียมเสื้อกีฬาสีให้ครบตามความต้องการ',steps:['สำรวจจำนวนผู้ใช้และสีของแต่ละกลุ่ม','รวบรวมขนาดเสื้อและกำหนดจำนวน','ตรวจงบประมาณและเลือกรูปแบบ','สั่งผลิตและกำหนดวันรับสินค้า','ตรวจคุณภาพและแจกจ่ายให้ครบ']},
    custom:{name:'ภารกิจของฉัน',steps:[]}
  };
  let dailySteps=[];
  function setPreset(){const x=dailyPresets[$('decomp-daily-preset').value];$('decomp-daily-title').value=x.name;dailySteps=x.steps.map((t,i)=>({id:Date.now()+i,text:t,done:false}));feedback('decomp-daily-feedback','เพิ่ม ลบ หรือจัดลำดับขั้นตอนย่อยตามความต้องการ จากนั้นตรวจสอบความสมบูรณ์ของแผน');renderDaily();}
  function renderDaily(){const root=$('decomp-daily-list');root.replaceChildren();dailySteps.forEach((s,i)=>{const row=document.createElement('div');row.className='decomp-daily-item'+(s.done?' done':'');const cb=document.createElement('input');cb.type='checkbox';cb.className='daily-check';cb.checked=s.done;cb.setAttribute('aria-label',`ทำขั้นตอนที่ ${i+1} เสร็จแล้ว`);cb.addEventListener('change',()=>{s.done=cb.checked;renderDaily();});
   const idx=document.createElement('b');idx.className='daily-index';idx.textContent=String(i+1).padStart(2,'0');const inp=document.createElement('input');inp.type='text';inp.value=s.text;inp.maxLength=140;inp.setAttribute('aria-label',`ข้อความขั้นตอนที่ ${i+1}`);inp.addEventListener('input',()=>{s.text=inp.value;});
   const up=document.createElement('button');up.type='button';up.textContent='↑';up.title='เลื่อนขึ้น';up.setAttribute('aria-label',`เลื่อนขั้นตอนที่ ${i+1} ขึ้น`);up.disabled=i===0;up.addEventListener('click',()=>{[dailySteps[i-1],dailySteps[i]]=[dailySteps[i],dailySteps[i-1]];renderDaily();});
   const down=document.createElement('button');down.type='button';down.textContent='↓';down.title='เลื่อนลง';down.setAttribute('aria-label',`เลื่อนขั้นตอนที่ ${i+1} ลง`);down.disabled=i===dailySteps.length-1;down.addEventListener('click',()=>{[dailySteps[i+1],dailySteps[i]]=[dailySteps[i],dailySteps[i+1]];renderDaily();});
   const del=document.createElement('button');del.type='button';del.textContent='✕';del.title='ลบขั้นตอน';del.setAttribute('aria-label',`ลบขั้นตอนที่ ${i+1}`);del.addEventListener('click',()=>{dailySteps.splice(i,1);renderDaily();});row.append(cb,idx,inp,up,down,del);root.appendChild(row);});
   if(!dailySteps.length){const e=document.createElement('div');e.className='empty-state';e.textContent='ยังไม่มีขั้นตอน เพิ่มขั้นตอนใหม่อย่างน้อย 3 ขั้น';root.appendChild(e);}
   const done=dailySteps.filter(x=>x.done).length;$('decomp-daily-count').textContent=`${done} / ${dailySteps.length} ขั้น`;$('decomp-daily-total').textContent=dailySteps.length;$('decomp-daily-meter').style.width=(dailySteps.length?done/dailySteps.length*100:0)+'%';
  }
  function addDaily(){const inp=$('decomp-daily-new');const text=inp.value.trim();if(!text){toast('กรุณาพิมพ์ขั้นตอนที่ต้องการเพิ่ม');return;}dailySteps.push({id:Date.now()+Math.random(),text,done:false});inp.value='';renderDaily();}
  $('decomp-daily-preset').addEventListener('change',setPreset);$('decomp-daily-reset').addEventListener('click',setPreset);$('decomp-daily-add').addEventListener('click',addDaily);$('decomp-daily-new').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addDaily();}});
  function validateDaily(){const name=$('decomp-daily-title').value.trim(),steps=dailySteps.map(s=>s.text.trim()),normalized=steps.map(s=>s.toLowerCase().replace(/\s+/g,''));if(name.length<5)return 'โปรดกำหนดเป้าหมายให้ชัดเจนอย่างน้อย 5 ตัวอักษร';if(steps.length<3)return 'ควรย่อยงานให้มีอย่างน้อย 3 ขั้นตอน';if(steps.some(s=>s.length<4))return 'แต่ละขั้นตอนควรเขียนให้ชัดเจนอย่างน้อย 4 ตัวอักษร';if(new Set(normalized).size!==steps.length)return 'พบขั้นตอนที่ซ้ำกัน กรุณารวมหรือแก้ไข';return '';}
  $('decomp-daily-check').addEventListener('click',()=>{const err=validateDaily();if(err){feedback('decomp-daily-feedback',err,'bad');return;}feedback('decomp-daily-feedback',`ผ่านเกณฑ์เบื้องต้น! เป้าหมายและ ${dailySteps.length} ขั้นตอนมีความชัดเจนพอสำหรับนำไปอภิปรายหรือทดลองปฏิบัติจริง`,'good');finishLab('daily');});
  $('decomp-daily-export').addEventListener('click',()=>{const payload={title:$('decomp-daily-title').value.trim(),source:'02_Decomposition.pdf, p.10; learner-authored plan',created_at:new Date().toISOString(),preset:$('decomp-daily-preset').value,steps:dailySteps.map((s,i)=>({order:i+1,text:s.text,completed:s.done})),validation_error:validateDaily()||null};download('CT_Lab_Decomposition_TaskPlan.json',JSON.stringify(payload,null,2),'application/json;charset=utf-8');toast('ดาวน์โหลดแผนงาน JSON แล้ว');});
  setPreset();
})();
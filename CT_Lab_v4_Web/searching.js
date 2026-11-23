/* CT-Lab v3.0 | 07_searching.pptx (6 slides). No third-party dependencies. */
'use strict';
(() => {
  const original=[8,9,13,35,42,44,50,54,58,60,61,62,77,84,86,90,92,96];
  let nums=original.slice(), key=62, rule='slide', tab='bottles', runTimer=null;
  const bottleSets={ordered:[45,54,62,70,78,88,98,112],mixed:[88,45,98,62,112,54,78,70]};
  let bottleSeen=new Set(), bottleChoice=null, bottleChecked=false;
  let challengeStep=0,challengeRight=0,challengeWrong=0;
  let groupDefaults=[];
  let seenModes={linear:false,binary:false};
  try {const store=JSON.parse(localStorage.getItem('ctlab-searching-v3')||'{}');seenModes={linear:!!store.linear,binary:!!store.binary};}catch{}
  const traces={linear:[],binary:[]};
  const state={linear:0,binary:0};
  const completed=()=>seenModes.linear&&seenModes.binary;
  const q=id=>document.getElementById(id);
  const escNum=v=>String(v);
  function setNote(message,bad=false){const el=q('search-setup-note');el.textContent=message;el.style.color=bad?'#c14a53':'#8796a7';}
  function notify(id,message,type=''){const el=q(id);el.textContent=message;el.className='search-feedback'+(type?' '+type:'');}
  function getTrace(method,target=key,data=nums,midRule=rule){
    const steps=[];
    if(method==='linear'){
      for(let i=0;i<data.length;i++){
        const found=data[i]===target;
        steps.push({idx:i,value:data[i],lo:0,hi:data.length-1,decision:found?'พบ Key':'ตรวจใบถัดไป',found});
        if(found)break;
      }
    }else{
      let lo=0,hi=data.length-1;
      while(lo<=hi&&steps.length<=data.length+2){
        const midpoint=(lo+hi)/2;
        // IPST example: first even-length interval uses lower middle;
        // subsequent even-length intervals use upper middle. This is a valid
        // tie-break rule, and matches the slide's 58 -> 84 -> 62 trace.
        const idx=(midRule==='slide'&&steps.length>0)?Math.ceil(midpoint):Math.floor(midpoint);
        const value=data[idx],found=value===target;
        const decision=found?'พบ Key':value<target?'ไปครึ่งขวา':'ไปครึ่งซ้าย';
        steps.push({idx,value,lo,hi,decision,found});
        if(found)break;
        if(value<target)lo=idx+1;else hi=idx-1;
      }
    }
    return steps;
  }
  function stopAuto(){if(runTimer){clearInterval(runTimer);runTimer=null;}q('search-linear-play').textContent='▶ เล่นอัตโนมัติ';q('search-binary-play').textContent='▶ เล่นอัตโนมัติ';}
  function resetRuns(){stopAuto();traces.linear=getTrace('linear');traces.binary=getTrace('binary');state.linear=0;state.binary=0;renderPlayer('linear');renderPlayer('binary');resetChallenge();renderComparison();}
  function setTab(id){
    if(!['bottles','linear','binary','compare','challenge'].includes(id))return;
    stopAuto();tab=id;
    document.querySelectorAll('[data-search-tab]').forEach(btn=>{const active=btn.dataset.searchTab===id;btn.classList.toggle('selected',active);btn.setAttribute('aria-selected',String(active));});
    document.querySelectorAll('[data-search-panel]').forEach(panel=>{const active=panel.dataset.searchPanel===id;panel.classList.toggle('active',active);panel.hidden=!active;});
    if(id==='compare')renderComparison();
  }
  document.querySelectorAll('[data-search-tab]').forEach(btn=>btn.addEventListener('click',()=>setTab(btn.dataset.searchTab)));
  function applyData(raw){
    const parts=raw.trim().split(/[\s,;]+/).filter(Boolean);
    const array=parts.map(Number);
    if(array.length<4||array.length>36||array.some(v=>!Number.isSafeInteger(v)||Math.abs(v)>99999999)){
      setNote('กรุณาใส่จำนวนเต็มปลอดภัยอย่างน้อย 4 ค่า แต่ไม่เกิน 36 ค่า',true);return false;
    }
    if(!array.every((v,i)=>i===0||v>array[i-1])){
      setNote('ข้อมูลต้องเรียงจากน้อยไปมากอย่างเคร่งครัด และไม่มีตัวเลขซ้ำ (เพื่อใช้ Binary Search)',true);return false;
    }
    const rawKey=Number(q('search-target').value);
    if(!Number.isSafeInteger(rawKey)||q('search-target').value.trim()===''){
      setNote('กรุณาใส่ Key เป็นจำนวนเต็มที่ถูกต้อง',true);return false;
    }
    nums=array;key=rawKey;rule=q('search-middle-rule').value;
    q('search-data').value=nums.join(', ');
    setNote(`ข้อมูลพร้อมใช้งาน ${nums.length} ค่า · Key = ${key} · กด Step เพื่อค้นหาทีละใบ`);
    resetRuns();return true;
  }
  q('search-apply').addEventListener('click',()=>applyData(q('search-data').value));
  q('search-default').addEventListener('click',()=>{q('search-data').value=original.join(', ');q('search-target').value='62';q('search-middle-rule').value='slide';applyData(q('search-data').value);});
  q('search-random').addEventListener('click',()=>{const set=new Set();while(set.size<18)set.add(Math.floor(Math.random()*95)+5);const arr=[...set].sort((a,b)=>a-b);q('search-data').value=arr.join(', ');q('search-target').value=String(arr[Math.floor(Math.random()*arr.length)]);applyData(q('search-data').value);});
  q('search-target').addEventListener('change',()=>applyData(q('search-data').value));
  q('search-middle-rule').addEventListener('change',()=>applyData(q('search-data').value));

  // ----- Activity 0: bottle inspection. Original reconstructed dataset, not slide measurements. -----
  function renderBottles(){
    const vals=bottleSets[q('search-bottle-set').value],mission=q('search-bottle-mission').value;
    const grid=q('search-bottle-grid');grid.innerHTML='';
    vals.forEach((height,index)=>{
      const removed=mission==='aftertwo'&&index<2;
      const btn=document.createElement('button');btn.type='button';btn.className='search-bottle'+(bottleChoice===index?' selected':'')+(removed?' removed':'')+(bottleChecked&&bottleChoice===index?' checked':'');btn.disabled=removed;
      btn.setAttribute('aria-label',`ขวด ${index+1}`);btn.style.setProperty('--vessel-height',Math.round(height*1.2)+'px');btn.style.setProperty('--liquid-fill',Math.round(height*.55)+'px');
      btn.innerHTML=`<b>ขวด ${index+1}</b><span class="vessel" aria-hidden="true"></span><span class="bottle-reveal">${bottleSeen.has(index)?height+' cm':'?? cm'}</span>`;
      btn.addEventListener('click',()=>{bottleSeen.add(index);bottleChoice=index;bottleChecked=false;renderBottles();notify('search-bottle-feedback',`เปิดขวด ${index+1}: สูง ${height} ซม. · เปรียบเทียบกับขวดอื่นแล้วกดตรวจคำตอบ`);});
      grid.appendChild(btn);
    });
    q('search-bottle-views').textContent=bottleSeen.size;q('search-bottle-choice').textContent=bottleChoice===null?'—':String(bottleChoice+1);
  }
  function resetBottles(){bottleSeen.clear();bottleChoice=null;bottleChecked=false;renderBottles();notify('search-bottle-feedback','คลิกดูขวดที่ยังไม่ถูกนำออก แล้วเลือกคำตอบตามภารกิจ');}
  q('search-bottle-set').addEventListener('change',resetBottles);
  q('search-bottle-mission').addEventListener('change',resetBottles);
  q('search-bottle-reset').addEventListener('click',resetBottles);
  q('search-bottle-check').addEventListener('click',()=>{
    if(bottleChoice===null){notify('search-bottle-feedback','กรุณาคลิกเปิดดูและเลือกขวดก่อน','bad');return;}
    const vals=bottleSets[q('search-bottle-set').value],mission=q('search-bottle-mission').value;
    const allowed=vals.map((_,i)=>i).filter(i=>mission!=='aftertwo'||i>=2);
    const goal=mission==='lowest'?Math.min(...allowed.map(i=>vals[i])):Math.max(...allowed.map(i=>vals[i]));
    const expected=allowed.find(i=>vals[i]===goal),right=vals[bottleChoice]===goal;
    bottleChecked=right;renderBottles();
    notify('search-bottle-feedback',right?`ถูกต้อง ✓ ขวด ${expected+1} สูง ${goal} ซม. · เปิดดู ${bottleSeen.size} ขวด ลองอีกชุดเพื่อสังเกตผล`:`ยังไม่ตรง: ขวด ${bottleChoice+1} สูง ${vals[bottleChoice]} ซม. ลองเปิดดูขวดอื่นแล้วเปรียบเทียบใหม่`,right?'good':'bad');
  });

  // ----- Algorithm players -----
  function visitedSet(method){return new Set(traces[method].slice(0,state[method]).map(s=>s.idx));}
  function renderPlayer(method){
    const steps=traces[method],shown=state[method],seen=visitedSet(method),last=shown?steps[shown-1]:null;
    const finished=shown===steps.length&&shown>0,found=finished&&last.found;
    const grid=q('search-'+method+'-grid');grid.innerHTML='';
    let liveLo=0,liveHi=nums.length-1;
    if(method==='binary'&&shown>0&&!found){
      if(last.value<key)liveLo=last.idx+1;else liveHi=last.idx-1;
    }
    nums.forEach((v,i)=>{
      const isSeen=seen.has(i),isCurrent=last&&last.idx===i,isFound=isCurrent&&last.found;
      const isOut=method==='binary'&&!isSeen&&(i<liveLo||i>liveHi);
      const btn=document.createElement('div');btn.className='search-number'+(!isSeen?' is-hidden':'')+(isSeen?' is-done':'')+(isCurrent?' is-current':'')+(isFound?' is-found':'')+(isOut?' is-out':'');
      btn.setAttribute('aria-label',`ดัชนี ${i+1} ${isSeen?'ค่า '+v:'ยังไม่เปิด'}`);
      btn.innerHTML=`<small>#${i+1}</small><span class="search-face">${isSeen?escNum(v):'?'}</span>`;grid.appendChild(btn);
    });
    q('search-'+method+'-key').textContent=key;
    q('search-'+method+'-count').textContent=shown;
    q('search-'+method+'-result').textContent=finished?(found?'#'+(last.idx+1):'ไม่พบ'):'—';
    if(method==='linear')q('search-linear-progress').textContent=`${shown} / ${nums.length}`;
    else {q('search-binary-bounds').textContent=(liveLo<=liveHi&&!found)?`${liveLo+1}–${liveHi+1}`:(found?'พบที่ '+(last.idx+1):'ไม่มีช่วงที่เหลือ');q('search-binary-mode-note').textContent=rule==='slide'?'โหมดตามตัวอย่างสไลด์: กรณีมีค่ากลาง 2 ตำแหน่ง ใช้ค่ากลางล่างในรอบแรก แล้วใช้ค่ากลางบนในรอบถัดไป (ได้ 58 → 84 → 62 เมื่อ Key = 62)':'โหมดค่ากลางล่าง: ถ้ามีตำแหน่งกึ่งกลาง 2 ค่า ให้ใช้ตำแหน่งล่างเสมอ (Key = 62 จะใช้ 4 ครั้งกับข้อมูลเดิม)';}
    q('search-'+method+'-next').disabled=finished;
    q('search-'+method+'-all').disabled=finished;
    const tbody=q('search-'+method+'-trace');tbody.innerHTML='';
    steps.slice(0,shown).forEach((s,i)=>{
      const tr=document.createElement('tr');
      if(method==='linear')tr.innerHTML=`<td>${i+1}</td><td>${s.idx+1}</td><td>${s.value}</td><td>${s.found?'✓ พบ Key':'≠ Key'}</td>`;
      else tr.innerHTML=`<td>${i+1}</td><td>${s.lo+1}</td><td>${s.idx+1}</td><td>${s.hi+1}</td><td>${s.value}</td><td>${s.decision}</td>`;
      tbody.appendChild(tr);
    });
    if(finished){
      notify('search-'+method+'-feedback',found?`พบ ${key} ที่ดัชนี ${last.idx+1} หลังเปรียบเทียบ ${shown} ครั้ง ✓`:`ไม่พบ ${key} ในชุดข้อมูลหลังเปรียบเทียบ ${shown} ครั้ง ✓`, 'good');
    }else if(last){
      notify('search-'+method+'-feedback',method==='linear'?`ตรวจดัชนี ${last.idx+1}: ${last.value} ≠ ${key} → ไปใบถัดไป`:`รอบ ${shown}: mid = ${last.idx+1}, ค่า ${last.value} ${last.value<key?'<': '>'} ${key} → ${last.decision}`);
    }else notify('search-'+method+'-feedback',method==='linear'?'เริ่มจากซ้ายไปขวาทีละใบ · กด “เปิดใบถัดไป”':'เริ่มค้นหาจากช่วงทั้งหมด · กด “ตรวจค่ากลาง”');
  }
  function maybeCompleteModule(method){
    if(!seenModes[method]){
      seenModes[method]=true;
      try{localStorage.setItem('ctlab-searching-v3',JSON.stringify(seenModes));}catch{}
      if(completed()&&!progress.completed.searching){record('searching',true);toast('สำเร็จโมดูลการค้นหาข้อมูลแล้ว ✓');}
    }
  }
  function nextStep(method){
    if(state[method]>=traces[method].length){stopAuto();return;}
    state[method]++;renderPlayer(method);
    if(state[method]===traces[method].length){stopAuto();maybeCompleteModule(method);}
  }
  function runAll(method){stopAuto();while(state[method]<traces[method].length)nextStep(method);}
  for(const method of ['linear','binary']){
    q('search-'+method+'-next').addEventListener('click',()=>{stopAuto();nextStep(method);});
    q('search-'+method+'-all').addEventListener('click',()=>runAll(method));
    q('search-'+method+'-reset').addEventListener('click',()=>{stopAuto();state[method]=0;renderPlayer(method);});
    q('search-'+method+'-play').addEventListener('click',()=>{
      if(runTimer){stopAuto();return;}
      if(state[method]>=traces[method].length){state[method]=0;renderPlayer(method);}
      q('search-'+method+'-play').textContent='Ⅱ หยุดชั่วคราว';
      runTimer=setInterval(()=>nextStep(method),440);
      nextStep(method);
    });
  }

  // ----- Five-group comparison of the same keys, slides 3–5 -----
  function mean(a){return a.length?a.reduce((total,x)=>total+x,0)/a.length:0;}
  function d2(x){return x.toFixed(2);}
  function groupInputMean(){
    const values=[...document.querySelectorAll('[data-search-mean]')];
    const groupValues={linear:[],binary:[]};
    for(const inp of values){const v=Number(inp.value);if(!Number.isFinite(v)||v<0){q('search-group-note').textContent='กรุณาใส่ค่าเฉลี่ยของแต่ละกลุ่มเป็นจำนวนที่ไม่ติดลบ';return;}groupValues[inp.dataset.method].push(v);}
    q('search-group-linear').textContent=d2(mean(groupValues.linear));
    q('search-group-binary').textContent=d2(mean(groupValues.binary));
    q('search-group-note').textContent='ค่าในตารางแก้ไขได้สำหรับบันทึกผลจริงของนักศึกษา · ตารางสร้างจากการแบ่ง Key สลับกลุ่ม 1–5';
  }
  function renderGroups(){
    const groups=Array.from({length:5},()=>({linear:[],binary:[],keys:[]}));
    nums.forEach((value,i)=>{const g=groups[i%5];g.keys.push(value);g.linear.push(getTrace('linear',value).length);g.binary.push(getTrace('binary',value).length);});
    groupDefaults=groups.map(g=>({count:g.keys.length,linear:mean(g.linear),binary:mean(g.binary)}));
    const tbody=q('search-groups-body');tbody.innerHTML='';
    groupDefaults.forEach((g,i)=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td>กลุ่ม ${i+1}</td><td>${g.count}</td><td><input type="number" min="0" step="0.01" data-search-mean="${i}" data-method="linear" aria-label="กลุ่ม ${i+1} เฉลี่ย Linear" value="${d2(g.linear)}"></td><td><input type="number" min="0" step="0.01" data-search-mean="${i}" data-method="binary" aria-label="กลุ่ม ${i+1} เฉลี่ย Binary" value="${d2(g.binary)}"></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('input').forEach(x=>x.addEventListener('input',groupInputMean));
    groupInputMean();
  }
  function renderComparison(){
    const records=nums.map(value=>({value,linear:getTrace('linear',value).length,binary:getTrace('binary',value).length}));
    const avgL=mean(records.map(r=>r.linear)),avgB=mean(records.map(r=>r.binary));
    q('search-average-linear').textContent=d2(avgL);
    q('search-average-binary').textContent=d2(avgB);
    q('search-average-saving').textContent=(100*(1-avgB/avgL)).toFixed(1)+'%';
    const chart=q('search-compare-chart');chart.innerHTML='';
    records.forEach(r=>{
      const div=document.createElement('div');div.className='search-compare-row';
      div.title=`Key ${r.value}: Linear ${r.linear} ครั้ง / Binary ${r.binary} ครั้ง`;
      const max=nums.length;
      div.innerHTML=`<strong>${r.value}</strong><div class="bars"><div class="bar linear" style="width:${100*r.linear/max}%"></div><div class="bar binary" style="width:${100*r.binary/max}%"></div></div><span>${r.linear}/${r.binary}</span>`;
      chart.appendChild(div);
    });
    renderGroups();
  }
  q('search-group-reset').addEventListener('click',renderGroups);
  q('search-compare-csv').addEventListener('click',()=>{
    const rows=[['key','linear_comparisons','binary_comparisons','binary_middle_rule'],...nums.map(v=>[v,getTrace('linear',v).length,getTrace('binary',v).length,rule])];
    download('CT_Lab_SearchComparison.csv',rows.map(row=>row.join(',')).join('\r\n'),'text/csv;charset=utf-8');
    toast('ดาวน์โหลดตารางผลการค้นหา CSV แล้ว');
  });

  // ----- Click-the-next-position challenge -----
  function challengeMethod(){return q('search-challenge-algorithm').value;}
  function challengeSteps(){return getTrace(challengeMethod());}
  function resetChallenge(){challengeStep=0;challengeRight=0;challengeWrong=0;renderChallenge();notify('search-challenge-feedback','คลิกบัตรที่ควรตรวจเป็นอันดับแรกตามวิธีที่เลือก');}
  function renderChallenge(){
    const mode=challengeMethod(),steps=challengeSteps(),last=challengeStep?steps[challengeStep-1]:null,done=challengeStep>=steps.length;
    const next=!done?steps[challengeStep]:null;
    q('search-challenge-round').textContent=done?'จบ':challengeStep+1;
    q('search-challenge-key').textContent=key;
    q('search-challenge-right').textContent=challengeRight;
    q('search-challenge-wrong').textContent=challengeWrong;
    const text=done?(last&&last.found?`สำเร็จ! พบ Key ${key} ที่ดัชนี ${last.idx+1} ใช้ ${challengeStep} ครั้ง`:`ทำครบแล้ว: ไม่พบ Key ${key} · ตรวจ ${challengeStep} ครั้ง`):(mode==='linear'?'Linear Search: ตรวจบัตรถัดไปจากซ้ายไปขวา':`Binary Search: ${q('search-challenge-help').value==='show'?`ขอบเขตดัชนี ${next.lo+1}–${next.hi+1}`:'เลือกค่ากลางของช่วงที่เหลือ'}`);
    q('search-challenge-prompt').textContent=text;
    const progress=q('search-challenge-checkpoints');progress.innerHTML='';
    steps.forEach((s,i)=>{const pill=document.createElement('span');pill.className=i<challengeStep?'ok':'';pill.textContent=`${i+1}${i<challengeStep?' ✓':''}`;progress.appendChild(pill);});
    const seen=new Set(steps.slice(0,challengeStep).map(s=>s.idx));
    const grid=q('search-challenge-grid');grid.innerHTML='';
    nums.forEach((value,i)=>{
      const selected=seen.has(i),isLast=last&&last.idx===i;
      const out=(mode==='binary'&&next&&(i<next.lo||i>next.hi));
      const b=document.createElement('button');b.type='button';b.disabled=done||selected;
      b.className='search-number is-guess'+(selected?' is-done':'')+(out&&q('search-challenge-help').value==='show'?' is-out':'')+(isLast?' is-current':'')+(isLast&&last.found?' is-found':'');
      b.innerHTML=`<small>#${i+1}</small><span class="search-face">${selected?value:'?'}</span>`;
      b.setAttribute('aria-label',`เลือกดัชนี ${i+1}`);
      b.addEventListener('click',()=>guessChallenge(i));grid.appendChild(b);
    });
  }
  function guessChallenge(idx){
    const steps=challengeSteps(),expected=steps[challengeStep];if(!expected)return;
    if(idx!==expected.idx){challengeWrong++;notify('search-challenge-feedback',`ยังไม่ถูก: ดัชนี ${idx+1} ไม่ใช่ตำแหน่งที่อัลกอริทึมจะตรวจในรอบนี้ · ลองอีกครั้ง`,'bad');renderChallenge();return;}
    challengeRight++;challengeStep++;
    if(challengeStep>=steps.length)notify('search-challenge-feedback',`ทำโจทย์สำเร็จ ✓ ใช้ ${challengeStep} การเปรียบเทียบ · ตอบถูก ${challengeRight} ครั้ง ผิด ${challengeWrong} ครั้ง`,'good');
    else notify('search-challenge-feedback',`ถูกต้อง ✓ ดัชนี ${idx+1} มีค่า ${expected.value} · ${expected.decision} · เลือกขั้นต่อไป`,'good');
    renderChallenge();
  }
  q('search-challenge-algorithm').addEventListener('change',resetChallenge);
  q('search-challenge-help').addEventListener('change',renderChallenge);
  q('search-challenge-reset').addEventListener('click',resetChallenge);
  q('search-challenge-hint').addEventListener('click',()=>{
    const step=challengeSteps()[challengeStep];
    notify('search-challenge-feedback',step?`คำใบ้: พิจารณาตำแหน่งกึ่งกลางระหว่างดัชนี ${step.lo+1} กับ ${step.hi+1}${challengeMethod()==='linear'?' และเริ่มจากซ้ายสุด':' ตามเกณฑ์ค่ากลางที่เลือกไว้'}`:'โจทย์นี้สิ้นสุดแล้ว กดเริ่มใหม่เพื่อฝึกอีกครั้ง');
  });
  resetBottles();resetRuns();
  // Avoid hidden module completion status after prior exercise saves.
  if(completed()&&!progress.completed.searching){record('searching',true);}
})();

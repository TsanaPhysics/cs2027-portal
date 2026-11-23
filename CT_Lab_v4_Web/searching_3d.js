/**
 * CT-Lab v4.0 — Searching Lab: 3D Flip Race & Interactive Swap/Sort Sandbox
 */
(function () {
  const DEFAULT_DECK = [12, 19, 25, 34, 41, 48, 55, 62, 71, 80, 88, 95];
  let deck = DEFAULT_DECK.slice();
  let targetKey = 62;
  let swapFirstIdx = null;
  let raceTimer = null;

  let linSteps = [];
  let binSteps = [];
  let raceTick = 0;

  function el(id) {
    return document.getElementById(id);
  }

  function isDeckSorted(arr) {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < arr[i - 1]) return false;
    }
    return true;
  }

  function computeTraces() {
    linSteps = [];
    for (let i = 0; i < deck.length; i++) {
      const found = deck[i] === targetKey;
      linSteps.push({
        idx: i,
        val: deck[i],
        found,
        note: found
          ? `พบ ${targetKey} ที่ตำแหน่ง #${i + 1} (ตรวจไป ${i + 1} ครั้ง)`
          : `ตรวจ #${i + 1} (ค่า ${deck[i]}) ≠ ${targetKey} → ขยับไปช่องถัดไป`
      });
      if (found) break;
    }

    binSteps = [];
    let lo = 0;
    let hi = deck.length - 1;
    while (lo <= hi && binSteps.length < deck.length + 2) {
      const mid = Math.floor((lo + hi) / 2);
      const val = deck[mid];
      const found = val === targetKey;
      let note = '';
      if (found) {
        note = `พบ ${targetKey} ที่กึ่งกลาง #${mid + 1}! (ตรวจเพียง ${binSteps.length + 1} ครั้ง)`;
      } else if (val < targetKey) {
        note = `กึ่งกลาง #${mid + 1} (${val}) < ${targetKey} → ตัดซ้ายทิ้ง เลื่อน low เป็น #${mid + 2}`;
      } else {
        note = `กึ่งกลาง #${mid + 1} (${val}) > ${targetKey} → ตัดขวาทิ้ง เลื่อน high เป็น #${mid}`;
      }
      binSteps.push({ lo, hi, mid, val, found, note });
      if (found) break;
      if (val < targetKey) lo = mid + 1;
      else hi = mid - 1;
    }
  }

  function renderDeckEditor() {
    const box = el('race-deck-grid');
    if (!box) return;
    box.replaceChildren();
    const sorted = isDeckSorted(deck);
    const statusEl = el('race-sort-status');
    if (statusEl) {
      statusEl.textContent = sorted ? '✓ ข้อมูลเรียงจากน้อยไปมากแล้ว' : '⚠️ ข้อมูลยังไม่เรียงลำดับ (ลองแข่งดูผล Binary!)';
      statusEl.className = 'tag ' + (sorted ? '' : 'soft');
      statusEl.style.color = sorted ? '#137855' : '#b45309';
    }

    const keySel = el('race-key-select');
    if (keySel) {
      keySel.replaceChildren();
      deck.forEach((v) => {
        const o = document.createElement('option');
        o.value = String(v);
        o.textContent = `Key = ${v}`;
        keySel.appendChild(o);
      });
      if (deck.indexOf(targetKey) === -1) targetKey = deck[Math.floor(deck.length * 0.6)] || deck[0];
      keySel.value = String(targetKey);
    }

    deck.forEach((val, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'race-card-3d' + (swapFirstIdx === idx ? ' swap-selected' : '') + (val === targetKey ? ' is-target' : '');
      btn.innerHTML = `<small>#${idx + 1}</small><b>${val}</b>`;
      btn.title = 'แตะ 2 ใบเพื่อสลับตำแหน่ง';
      btn.addEventListener('click', () => {
        stopRace();
        if (swapFirstIdx === null) {
          swapFirstIdx = idx;
          renderDeckEditor();
        } else if (swapFirstIdx === idx) {
          swapFirstIdx = null;
          renderDeckEditor();
        } else {
          const tmp = deck[swapFirstIdx];
          deck[swapFirstIdx] = deck[idx];
          deck[idx] = tmp;
          swapFirstIdx = null;
          resetRace();
        }
      });
      box.appendChild(btn);
    });
  }

  function renderRaceTracks() {
    const linBox = el('race-lin-track');
    const binBox = el('race-bin-track');
    if (!linBox || !binBox) return;

    const linSlice = linSteps.slice(0, raceTick);
    const binSlice = binSteps.slice(0, raceTick);
    const linSeen = new Set(linSlice.map((s) => s.idx));
    const binSeen = new Set(binSlice.map((s) => s.mid));
    const linLast = linSlice[linSlice.length - 1] || null;
    const binLast = binSlice[binSlice.length - 1] || null;
    const binNext = binSteps[raceTick] || null;

    linBox.replaceChildren();
    deck.forEach((val, idx) => {
      const card = document.createElement('div');
      const seen = linSeen.has(idx);
      const isCur = linLast && linLast.idx === idx;
      const isFound = isCur && linLast.found;
      card.className = 'race-mini-card' + (seen ? ' flipped' : '') + (isCur ? ' current' : '') + (isFound ? ' found' : '');
      card.innerHTML = `<small>#${idx + 1}</small><span>${seen ? val : '?'}</span>`;
      linBox.appendChild(card);
    });

    binBox.replaceChildren();
    deck.forEach((val, idx) => {
      const card = document.createElement('div');
      const seen = binSeen.has(idx);
      const isCur = binLast && binLast.mid === idx;
      const isFound = isCur && binLast.found;
      const out = binNext && (idx < binNext.lo || idx > binNext.hi);
      card.className = 'race-mini-card' + (seen ? ' flipped' : '') + (out ? ' eliminated' : '') + (isCur ? ' current' : '') + (isFound ? ' found' : '');
      let flag = '';
      if (binNext) {
        if (idx === binNext.lo && idx === binNext.hi) flag = 'L/R';
        else if (idx === binNext.lo) flag = 'L';
        else if (idx === binNext.hi) flag = 'R';
      }
      card.innerHTML = `<small>#${idx + 1}${flag ? ' · ' + flag : ''}</small><span>${seen ? val : '?'}</span>`;
      binBox.appendChild(card);
    });

    el('race-lin-count').textContent = `${linSlice.length} ครั้ง`;
    el('race-bin-count').textContent = `${binSlice.length} ครั้ง`;
    el('race-lin-note').textContent = linLast ? linLast.note : 'พร้อมเริ่มแข่งขัน Linear Search';

    const binDoneNoHit = binSlice.length === binSteps.length && binLast && !binLast.found;
    if (binDoneNoHit && !isDeckSorted(deck)) {
      el('race-bin-note').textContent = `⚠️ ไม่พบ ${targetKey} เพราะข้อมูลยังไม่เรียงลำดับ! กด "✨ เรียงข้อมูล" แล้วลองใหม่`;
    } else {
      el('race-bin-note').textContent = binLast ? binLast.note : 'พร้อมเริ่มแข่งขัน Binary Search';
    }
  }

  function stopRace() {
    if (raceTimer) {
      clearInterval(raceTimer);
      raceTimer = null;
    }
    const btn = el('race-start-btn');
    if (btn) btn.textContent = '🏁 แข่งขันความเร็วอัตโนมัติ';
  }

  function resetRace() {
    stopRace();
    raceTick = 0;
    computeTraces();
    renderDeckEditor();
    renderRaceTracks();
  }

  function stepRace() {
    const maxLen = Math.max(linSteps.length, binSteps.length);
    if (raceTick >= maxLen) {
      stopRace();
      return;
    }
    raceTick++;
    renderRaceTracks();
    if (raceTick >= maxLen) {
      stopRace();
    }
  }

  function init() {
    if (!el('race-deck-grid')) return;

    el('race-shuffle-btn')?.addEventListener('click', () => {
      stopRace();
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = deck[i];
        deck[i] = deck[j];
        deck[j] = tmp;
      }
      swapFirstIdx = null;
      resetRace();
    });

    el('race-sort-btn')?.addEventListener('click', () => {
      stopRace();
      deck.sort((a, b) => a - b);
      swapFirstIdx = null;
      resetRace();
    });

    el('race-key-select')?.addEventListener('change', (e) => {
      targetKey = Number(e.target.value);
      resetRace();
    });

    el('race-step-btn')?.addEventListener('click', stepRace);
    el('race-reset-btn')?.addEventListener('click', resetRace);

    el('race-start-btn')?.addEventListener('click', () => {
      if (raceTimer) {
        stopRace();
        return;
      }
      const maxLen = Math.max(linSteps.length, binSteps.length);
      if (raceTick >= maxLen) {
        raceTick = 0;
        renderRaceTracks();
      }
      el('race-start-btn').textContent = '⏸ หยุดชั่วคราว';
      raceTimer = setInterval(stepRace, 700);
      stepRace();
    });

    resetRace();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

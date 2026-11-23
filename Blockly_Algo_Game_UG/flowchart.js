// Live Blockly-to-ISO 5807 SVG Flowchart Generator
// Converts Blockly workspace blocks into a clean, real-time ISO 5807 Flowchart SVG

(function () {
  const NODE_W = 190;
  const NODE_H = 44;
  const DIAMOND_W = 190;
  const DIAMOND_H = 64;
  const V_GAP = 28;
  const H_GAP = 42;

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function trunc(str, max = 24) {
    const s = String(str || '').replace(/\s+/g, ' ').trim();
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }

  // Extract concise human-readable expression from a value input block
  function exprText(block, inputName) {
    if (!block) return '?';
    const target = block.getInputTargetBlock(inputName);
    if (!target) return '?';
    const t = target.type;
    if (t === 'math_number') return String(target.getFieldValue('NUM'));
    if (t === 'text') return `"${target.getFieldValue('TEXT')}"`;
    if (t === 'variables_get') {
      const id = target.getFieldValue('VAR');
      const v = target.workspace.getVariableById(id);
      return v ? v.name : 'var';
    }
    if (t === 'algo_height') return 'height';
    if (t === 'algo_moisture') return 'moisture';
    if (t === 'algo_target') return 'target';
    if (t === 'algo_list_length') return 'N (len)';
    if (t === 'algo_list_get') return `list[${exprText(target, 'INDEX')}]`;
    if (t === 'algo_floor_div') return `(${exprText(target, 'A')} // ${exprText(target, 'B')})`;
    if (t === 'algo_guess_check') return `guess(${exprText(target, 'NUM')})`;
    if (t === 'logic_compare') {
      const ops = { EQ: '==', NEQ: '!=', LT: '<', LTE: '<=', GT: '>', GTE: '>=' };
      const op = ops[target.getFieldValue('OP')] || '?';
      return `${exprText(target, 'A')} ${op} ${exprText(target, 'B')}`;
    }
    if (t === 'math_arithmetic') {
      const ops = { ADD: '+', MINUS: '-', MULTIPLY: '×', DIVIDE: '÷', POWER: '^' };
      const op = ops[target.getFieldValue('OP')] || '?';
      return `${exprText(target, 'A')} ${op} ${exprText(target, 'B')}`;
    }
    if (t === 'math_single') {
      return `abs(${exprText(target, 'NUM')})`;
    }
    return t;
  }

  function varName(block, fieldName = 'VAR') {
    const id = block.getFieldValue(fieldName);
    const v = block.workspace.getVariableById(id);
    return v ? v.name : 'v';
  }

  // Build AST list from a Blockly statement chain
  function parseChain(startBlock) {
    const items = [];
    let cur = startBlock;
    while (cur) {
      const t = cur.type;
      if (t === 'algo_print') {
        items.push({ kind: 'io', label: `พิมพ์ ${exprText(cur, 'VALUE')}` });
      } else if (t === 'algo_list_print_all') {
        items.push({ kind: 'io', label: 'พิมพ์รายการทั้งหมด' });
      } else if (t === 'algo_list_swap') {
        items.push({ kind: 'process', label: `สลับ list[${exprText(cur, 'I')}] ↔ list[${exprText(cur, 'J')}]` });
      } else if (t === 'algo_water_plant') {
        items.push({ kind: 'process', label: 'รดน้ำต้นไม้ (+15%)' });
      } else if (t === 'algo_break') {
        items.push({ kind: 'process', label: 'break (หยุดลูป)' });
      } else if (t === 'variables_set') {
        items.push({ kind: 'process', label: `${varName(cur)} = ${exprText(cur, 'VALUE')}` });
      } else if (t === 'controls_if' || t === 'controls_ifelse') {
        const cond = exprText(cur, 'IF0');
        const thenBranch = parseChain(cur.getInputTargetBlock('DO0'));
        const elseBranch = cur.getInput('ELSE') ? parseChain(cur.getInputTargetBlock('ELSE')) : [];
        items.push({ kind: 'if', label: cond, thenBranch, elseBranch });
      } else if (t === 'controls_whileUntil') {
        const mode = cur.getFieldValue('MODE');
        const cond = exprText(cur, 'BOOL');
        const body = parseChain(cur.getInputTargetBlock('DO'));
        items.push({
          kind: 'loop',
          label: mode === 'UNTIL' ? `จนกว่า ${cond}` : `ขณะที่ ${cond}`,
          body
        });
      } else if (t === 'algo_for_each') {
        const v = varName(cur);
        const body = parseChain(cur.getInputTargetBlock('DO'));
        items.push({ kind: 'loop', label: `สำหรับ ${v} ใน list`, body });
      } else if (t === 'algo_for_range') {
        const v = varName(cur);
        const f = exprText(cur, 'FROM');
        const to = exprText(cur, 'TO');
        const body = parseChain(cur.getInputTargetBlock('DO'));
        items.push({ kind: 'loop', label: `${v} = ${f} .. ${to}`, body });
      } else {
        items.push({ kind: 'process', label: t });
      }
      cur = cur.getNextBlock();
    }
    return items;
  }

  // Recursive layout engine returning { svgParts, width, height, entryX }
  function layoutSequence(astList, cx, startY) {
    let parts = [];
    let y = startY;
    let maxRight = cx + NODE_W / 2 + 20;
    let minLeft = cx - NODE_W / 2 - 20;

    function drawArrow(x1, y1, x2, y2, label = '') {
      let s = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#64748b" stroke-width="2" marker-end="url(#fc-arrow)"/>`;
      if (label) {
        s += `<text x="${(x1 + x2) / 2 + 6}" y="${(y1 + y2) / 2 - 4}" fill="#94a3b8" font-size="11" font-weight="600">${esc(label)}</text>`;
      }
      return s;
    }

    function drawNode(kind, x, topY, label) {
      const txt = esc(trunc(label, 22));
      if (kind === 'term') {
        return `
          <rect x="${x - 70}" y="${topY}" width="140" height="36" rx="18" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
          <text x="${x}" y="${topY + 22}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="700">${txt}</text>
        `;
      }
      if (kind === 'io') {
        const hw = NODE_W / 2;
        const pts = `${x - hw + 14},${topY} ${x + hw},${topY} ${x + hw - 14},${topY + NODE_H} ${x - hw},${topY + NODE_H}`;
        return `
          <polygon points="${pts}" fill="#064e3b" stroke="#34d399" stroke-width="2"/>
          <text x="${x}" y="${topY + 26}" text-anchor="middle" fill="#ecfdf5" font-size="12" font-weight="600">${txt}</text>
        `;
      }
      if (kind === 'decision') {
        const hw = DIAMOND_W / 2;
        const hh = DIAMOND_H / 2;
        const pts = `${x},${topY} ${x + hw},${topY + hh} ${x},${topY + DIAMOND_H} ${x - hw},${topY + hh}`;
        return `
          <polygon points="${pts}" fill="#451a03" stroke="#f59e0b" stroke-width="2"/>
          <text x="${x}" y="${topY + hh + 4}" text-anchor="middle" fill="#fef3c7" font-size="11" font-weight="700">${txt}</text>
        `;
      }
      // process
      return `
        <rect x="${x - NODE_W / 2}" y="${topY}" width="${NODE_W}" height="${NODE_H}" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
        <text x="${x}" y="${topY + 26}" text-anchor="middle" fill="#f1f5f9" font-size="12" font-weight="600">${txt}</text>
      `;
    }

    astList.forEach((node, idx) => {
      if (node.kind === 'term' || node.kind === 'io' || node.kind === 'process') {
        const h = node.kind === 'term' ? 36 : NODE_H;
        parts.push(drawNode(node.kind, cx, y, node.label));
        y += h;
        if (idx < astList.length - 1) {
          parts.push(drawArrow(cx, y, cx, y + V_GAP));
          y += V_GAP;
        }
      } else if (node.kind === 'if') {
        parts.push(drawNode('decision', cx, y, node.label));
        const dBottom = y + DIAMOND_H;
        const dMidY = y + DIAMOND_H / 2;

        // True branch goes straight down; False branch goes right
        const rightX = cx + DIAMOND_W / 2 + H_GAP + NODE_W / 2;
        maxRight = Math.max(maxRight, rightX + NODE_W / 2 + 24);

        const thenLayout = layoutSequence(
          node.thenBranch.length ? node.thenBranch : [{ kind: 'process', label: '(ว่าง)' }],
          cx,
          dBottom + V_GAP
        );
        parts.push(drawArrow(cx, dBottom, cx, dBottom + V_GAP, 'จริง'));
        parts = parts.concat(thenLayout.parts);
        maxRight = Math.max(maxRight, thenLayout.maxRight);
        minLeft = Math.min(minLeft, thenLayout.minLeft);

        let mergeY = thenLayout.endY + V_GAP;
        if (node.elseBranch && node.elseBranch.length > 0) {
          const elseLayout = layoutSequence(node.elseBranch, rightX, dBottom + V_GAP);
          // Elbow from right of diamond to top of elseBranch
          parts.push(`<polyline points="${cx + DIAMOND_W / 2},${dMidY} ${rightX},${dMidY} ${rightX},${dBottom + V_GAP}" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#fc-arrow)"/>`);
          parts.push(`<text x="${cx + DIAMOND_W / 2 + 8}" y="${dMidY - 5}" fill="#f87171" font-size="11" font-weight="600">เท็จ</text>`);
          parts = parts.concat(elseLayout.parts);
          maxRight = Math.max(maxRight, elseLayout.maxRight);
          mergeY = Math.max(thenLayout.endY, elseLayout.endY) + V_GAP;

          // Merge lines back to center
          parts.push(`<line x1="${cx}" y1="${thenLayout.endY}" x2="${cx}" y2="${mergeY}" stroke="#64748b" stroke-width="2"/>`);
          parts.push(`<polyline points="${rightX},${elseLayout.endY} ${rightX},${mergeY} ${cx},${mergeY}" fill="none" stroke="#64748b" stroke-width="2"/>`);
        } else {
          // False bypasses down to mergeY
          parts.push(`<polyline points="${cx + DIAMOND_W / 2},${dMidY} ${rightX},${dMidY} ${rightX},${mergeY} ${cx},${mergeY}" fill="none" stroke="#64748b" stroke-width="2"/>`);
          parts.push(`<text x="${cx + DIAMOND_W / 2 + 8}" y="${dMidY - 5}" fill="#f87171" font-size="11" font-weight="600">เท็จ</text>`);
          parts.push(`<line x1="${cx}" y1="${thenLayout.endY}" x2="${cx}" y2="${mergeY}" stroke="#64748b" stroke-width="2"/>`);
        }

        y = mergeY;
        if (idx < astList.length - 1) {
          parts.push(drawArrow(cx, y, cx, y + V_GAP));
          y += V_GAP;
        }
      } else if (node.kind === 'loop') {
        parts.push(drawNode('decision', cx, y, node.label));
        const dTop = y;
        const dBottom = y + DIAMOND_H;
        const dMidY = y + DIAMOND_H / 2;

        const bodyLayout = layoutSequence(
          node.body.length ? node.body : [{ kind: 'process', label: '(วนซ้ำ)' }],
          cx,
          dBottom + V_GAP
        );
        parts.push(drawArrow(cx, dBottom, cx, dBottom + V_GAP, 'จริง'));
        parts = parts.concat(bodyLayout.parts);

        // Loop back line on the left
        const loopBackX = Math.min(minLeft, bodyLayout.minLeft) - 18;
        minLeft = Math.min(minLeft, loopBackX - 18);
        const loopBottomY = bodyLayout.endY + 14;
        parts.push(`<polyline points="${cx},${bodyLayout.endY} ${cx},${loopBottomY} ${loopBackX},${loopBottomY} ${loopBackX},${dMidY} ${cx - DIAMOND_W / 2},${dMidY}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#fc-arrow)"/>`);

        // Exit line on the right
        const exitX = Math.max(maxRight, bodyLayout.maxRight) + 12;
        maxRight = Math.max(maxRight, exitX + 20);
        const exitY = loopBottomY + 20;
        parts.push(`<polyline points="${cx + DIAMOND_W / 2},${dMidY} ${exitX},${dMidY} ${exitX},${exitY} ${cx},${exitY}" fill="none" stroke="#64748b" stroke-width="2"/>`);
        parts.push(`<text x="${cx + DIAMOND_W / 2 + 8}" y="${dMidY - 5}" fill="#f87171" font-size="11" font-weight="600">จบ</text>`);

        y = exitY;
        if (idx < astList.length - 1) {
          parts.push(drawArrow(cx, y, cx, y + V_GAP));
          y += V_GAP;
        }
      }
    });

    return { parts, endY: y, maxRight, minLeft };
  }

  window.renderBlocklyFlowchart = function (workspace, containerEl, level) {
    if (!workspace || !containerEl) return;
    const topBlocks = workspace.getTopBlocks(true);
    const stmtBlocks = topBlocks.filter((b) => !b.outputConnection);
    if (!stmtBlocks.length) {
      const titleHint = level ? ` (${esc(level.shortTitle)})` : '';
      containerEl.innerHTML = `<div class="muted" style="padding:16px;text-align:center;">ยังไม่มีบล็อกคำสั่งใน Workspace${titleHint}</div>`;
      return;
    }

    // Pick the largest statement stack as the main algorithm
    let rootBlock = stmtBlocks[0];
    let bestSize = rootBlock.getDescendants(false).length;
    for (let i = 1; i < stmtBlocks.length; i++) {
      const sz = stmtBlocks[i].getDescendants(false).length;
      if (sz > bestSize) {
        bestSize = sz;
        rootBlock = stmtBlocks[i];
      }
    }

    const startLabel = level ? `START: ${level.shortTitle}` : 'เริ่มต้น (START)';
    const mainAst = [
      { kind: 'term', label: startLabel },
      ...parseChain(rootBlock),
      { kind: 'term', label: 'สิ้นสุด (END)' }
    ];

    const centerX = 220;
    const laid = layoutSequence(mainAst, centerX, 20);
    const minX = Math.min(0, laid.minLeft - 16);
    const maxX = Math.max(440, laid.maxRight + 16);
    const totalW = maxX - minX;
    const totalH = laid.endY + 28;

    containerEl.innerHTML = `
      <svg id="flowchart-svg" viewBox="${minX} 0 ${totalW} ${totalH}" width="100%" height="${Math.max(220, Math.round(totalH * 0.85))}" style="display:block;background:#0b1120;border-radius:8px;border:1px solid #334155;" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <marker id="fc-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b"/>
          </marker>
        </defs>
        ${laid.parts.join('\n')}
      </svg>
    `;
  };
})();

// Custom Blockly Blocks & 9 Undergraduate Algorithm Challenges
// Inspired by blockly.programming.in.th, upgraded for Undergraduate CS (Automated Judge, Edge Cases, Big-O Efficiency)

function registerCustomBlocks() {
  const jsGen = (window.javascript && window.javascript.javascriptGenerator) || Blockly.JavaScript;
  const pyGen = (window.python && window.python.pythonGenerator) || Blockly.Python;

  // Helper for Blockly v10+ Order constants
  const JS_ATOMIC = (jsGen && jsGen.ORDER_ATOMIC) ?? 0;
  const JS_NONE = (jsGen && jsGen.ORDER_NONE) ?? 99;
  const PY_ATOMIC = (pyGen && pyGen.ORDER_ATOMIC) ?? 0;
  const PY_NONE = (pyGen && pyGen.ORDER_NONE) ?? 99;

  function addGen(type, jsFn, pyFn) {
    if (jsGen) {
      if (jsGen.forBlock) jsGen.forBlock[type] = jsFn;
      else jsGen[type] = jsFn;
    }
    if (pyGen) {
      if (pyGen.forBlock) pyGen.forBlock[type] = pyFn;
      else pyGen[type] = pyFn;
    }
  }

  Blockly.defineBlocksWithJsonArray([
    {
      type: 'algo_print',
      message0: 'พิมพ์ %1',
      args0: [{ type: 'input_value', name: 'VALUE' }],
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: 'แสดงผลลัพธ์ออกทาง Console และส่งตรวจคำตอบ'
    },
    {
      type: 'algo_height',
      message0: 'ความสูง (ซม.)',
      output: 'Number',
      colour: 230,
      tooltip: 'อ่านค่าความสูงของผู้เข้าชมสวนสัตว์'
    },
    {
      type: 'algo_moisture',
      message0: 'ความชื้นในดิน (%)',
      output: 'Number',
      colour: 230,
      tooltip: 'อ่านค่าความชื้นปัจจุบันจากเซนเซอร์'
    },
    {
      type: 'algo_water_plant',
      message0: 'รดน้ำต้นไม้ (+15%)',
      previousStatement: null,
      nextStatement: null,
      colour: 195,
      tooltip: 'สั่งวาล์วรดน้ำต้นไม้ 1 ครั้ง (ความชื้นเพิ่ม 15%)'
    },
    {
      type: 'algo_target',
      message0: 'ค่าเป้าหมาย (Target / M)',
      output: 'Number',
      colour: 230,
      tooltip: 'ค่าเป้าหมายของโจทย์ (เช่น งบประมาณ M หรือคะแนนของเพื่อน)'
    },
    {
      type: 'algo_list_length',
      message0: 'จำนวนข้อมูลในรายการ',
      output: 'Number',
      colour: 210,
      tooltip: 'คืนค่าจำนวนสมาชิกทั้งหมด N ในรายการ'
    },
    {
      type: 'algo_list_get',
      message0: 'ข้อมูลในรายการตัวที่ %1',
      args0: [{ type: 'input_value', name: 'INDEX', check: 'Number' }],
      output: 'Number',
      colour: 210,
      tooltip: 'เข้าถึงข้อมูลลำดับที่ 1 ถึง N (1-based index)'
    },
    {
      type: 'algo_for_each',
      message0: 'พิจารณาข้อมูลในรายการ ใช้ตัวแปร %1 แทนข้อมูล',
      args0: [{ type: 'field_variable', name: 'VAR', variable: 'x' }],
      message1: 'ทำ %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
      tooltip: 'วนซ้ำข้อมูลทุกตัวในรายการทีละตัว (O(N))'
    },
    {
      type: 'algo_for_range',
      message0: 'นับ %1 จาก %2 ถึง %3 ทำ',
      args0: [
        { type: 'field_variable', name: 'VAR', variable: 'i' },
        { type: 'input_value', name: 'FROM', check: 'Number' },
        { type: 'input_value', name: 'TO', check: 'Number' }
      ],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 120,
      tooltip: 'วนลูปตัวแปรนับตั้งแต่ค่าเริ่มต้นถึงค่าสิ้นสุด (รวมปลาย)'
    },
    {
      type: 'algo_break',
      message0: 'หยุดลูปทันที (break)',
      previousStatement: null,
      colour: 120,
      tooltip: 'ออกจากลูปที่กำลังทำงานอยู่ทันที เพื่อประหยัดเวลาประมวลผล'
    },
    {
      type: 'algo_floor_div',
      message0: 'หารปัดเศษลง %1 ÷ %2',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        { type: 'input_value', name: 'B', check: 'Number' }
      ],
      inputsInline: true,
      output: 'Number',
      colour: 230,
      tooltip: 'คำนวณ Math.floor(A / B) สำหรับ Binary Search'
    },
    {
      type: 'algo_guess_check',
      message0: 'ทายตัวเลข %1 แล้วได้ผลลัพธ์',
      args0: [{ type: 'input_value', name: 'NUM', check: 'Number' }],
      output: 'String',
      colour: 290,
      tooltip: 'ส่งตัวเลขไปทาย คืนค่า "มากไป", "น้อยไป", หรือ "ถูกต้อง"'
    },
    {
      type: 'algo_list_swap',
      message0: 'สลับข้อมูลตำแหน่ง %1 กับ %2',
      args0: [
        { type: 'input_value', name: 'I', check: 'Number' },
        { type: 'input_value', name: 'J', check: 'Number' }
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 210,
      tooltip: 'สลับค่าในรายการระหว่างตำแหน่ง I และ J (1-based index)'
    },
    {
      type: 'algo_list_print_all',
      message0: 'พิมพ์ข้อมูลทั้งหมดในรายการ',
      previousStatement: null,
      nextStatement: null,
      colour: 160,
      tooltip: 'พิมพ์สมาชิกทุกตัวในรายการเรียงคั่นด้วย ", "'
    }
  ]);

  // Generators
  addGen(
    'algo_print',
    (block, gen) => {
      const val = gen.valueToCode(block, 'VALUE', JS_NONE) || '""';
      return `__rt.print(${val});\n`;
    },
    (block, gen) => {
      const val = gen.valueToCode(block, 'VALUE', PY_NONE) || '""';
      return `print(${val})\n`;
    }
  );

  addGen(
    'algo_height',
    () => ['__rt.getInput("height")', JS_ATOMIC],
    () => ['height', PY_ATOMIC]
  );

  addGen(
    'algo_moisture',
    () => ['__rt.getInput("moisture")', JS_ATOMIC],
    () => ['moisture', PY_ATOMIC]
  );

  addGen(
    'algo_water_plant',
    () => '__rt.waterPlant();\n',
    () => 'water_plant()\n'
  );

  addGen(
    'algo_target',
    () => ['__rt.getInput("target")', JS_ATOMIC],
    () => ['target', PY_ATOMIC]
  );

  addGen(
    'algo_list_length',
    () => ['__rt.listLength()', JS_ATOMIC],
    () => ['len(data)', PY_ATOMIC]
  );

  addGen(
    'algo_list_get',
    (block, gen) => {
      const idx = gen.valueToCode(block, 'INDEX', JS_NONE) || '1';
      return [`__rt.listGet(${idx})`, JS_ATOMIC];
    },
    (block, gen) => {
      const idx = gen.valueToCode(block, 'INDEX', PY_NONE) || '1';
      return [`data[(${idx}) - 1]`, PY_ATOMIC];
    }
  );

  addGen(
    'algo_for_each',
    (block, gen) => {
      const varName = gen.getVariableName(block.getFieldValue('VAR'));
      const branch = gen.statementToCode(block, 'DO');
      return `for (let __idx = 1; __idx <= __rt.listLength(); __idx++) {\n  __rt.step();\n  ${varName} = __rt.listGet(__idx);\n  __rt.watch("${varName}", ${varName});\n${branch}}\n`;
    },
    (block, gen) => {
      const varName = gen.getVariableName(block.getFieldValue('VAR'));
      const branch = gen.statementToCode(block, 'DO') || '  pass\n';
      return `for ${varName} in data:\n${branch}`;
    }
  );

  addGen(
    'algo_for_range',
    (block, gen) => {
      const varName = gen.getVariableName(block.getFieldValue('VAR'));
      const fromVal = gen.valueToCode(block, 'FROM', JS_NONE) || '1';
      const toVal = gen.valueToCode(block, 'TO', JS_NONE) || '10';
      const branch = gen.statementToCode(block, 'DO');
      return `for (${varName} = (${fromVal}); ${varName} <= (${toVal}); ${varName}++) {\n  __rt.step();\n  __rt.watch("${varName}", ${varName});\n${branch}}\n`;
    },
    (block, gen) => {
      const varName = gen.getVariableName(block.getFieldValue('VAR'));
      const fromVal = gen.valueToCode(block, 'FROM', PY_NONE) || '1';
      const toVal = gen.valueToCode(block, 'TO', PY_NONE) || '10';
      const branch = gen.statementToCode(block, 'DO') || '  pass\n';
      return `for ${varName} in range(${fromVal}, (${toVal}) + 1):\n${branch}`;
    }
  );

  addGen(
    'algo_break',
    () => 'break;\n',
    () => 'break\n'
  );

  addGen(
    'algo_floor_div',
    (block, gen) => {
      const a = gen.valueToCode(block, 'A', JS_NONE) || '0';
      const b = gen.valueToCode(block, 'B', JS_NONE) || '1';
      return [`Math.floor((${a}) / (${b}))`, JS_ATOMIC];
    },
    (block, gen) => {
      const a = gen.valueToCode(block, 'A', PY_NONE) || '0';
      const b = gen.valueToCode(block, 'B', PY_NONE) || '1';
      return [`(${a}) // (${b})`, PY_ATOMIC];
    }
  );

  addGen(
    'algo_guess_check',
    (block, gen) => {
      const num = gen.valueToCode(block, 'NUM', JS_NONE) || '0';
      return [`__rt.guess(${num})`, JS_ATOMIC];
    },
    (block, gen) => {
      const num = gen.valueToCode(block, 'NUM', PY_NONE) || '0';
      return [`check_guess(${num})`, PY_ATOMIC];
    }
  );

  addGen(
    'algo_list_swap',
    (block, gen) => {
      const i = gen.valueToCode(block, 'I', JS_NONE) || '1';
      const j = gen.valueToCode(block, 'J', JS_NONE) || '1';
      return `__rt.listSwap(${i}, ${j});\n`;
    },
    (block, gen) => {
      const i = gen.valueToCode(block, 'I', PY_NONE) || '1';
      const j = gen.valueToCode(block, 'J', PY_NONE) || '1';
      return `data[(${i})-1], data[(${j})-1] = data[(${j})-1], data[(${i})-1]\n`;
    }
  );

  addGen(
    'algo_list_print_all',
    () => '__rt.printAll();\n',
    () => 'print(", ".join(map(str, data)))\n'
  );
}

// 9 Undergraduate Challenges
const CHALLENGES = [
  {
    id: 'zoo',
    tier: 'TIER 1 • CONDITIONAL',
    title: '1. Smart Zoo Ticketing (เงื่อนไขราคาบัตร)',
    shortTitle: '1. ลดราคาเข้าสวนสัตว์',
    complexity: 'O(1)',
    parBlocks: 9,
    maxSteps: 20,
    xp: 100,
    hasArrayViz: false,
    description:
      'ระบบขายบัตรอัตโนมัติ: ถ้านักท่องเที่ยวมีความสูงน้อยกว่า 100 ซม. (< 100) ให้พิมพ์คำว่า "ได้ส่วนลด" นอกเหนือจากนั้น (รวมถึง 100 ซม. พอดี) ให้พิมพ์คำว่า "ราคาเต็ม" (ทดสอบ Boundary Cases: 99, 100, 0)',
    hint: 'ระวัง Boundary Case! โจทย์ระบุว่า "น้อยกว่า 100" ไม่ใช่ "น้อยกว่าหรือเท่ากับ" ดังนั้นความสูง 100 ซม. ต้องได้ผลลัพธ์เป็น "ราคาเต็ม"',
    sandboxConfig: [
      { key: 'height', label: 'ความสูง (ซม.)', type: 'range', min: 0, max: 200, default: 100 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 160,
          contents: [
            { kind: 'block', type: 'algo_height' },
            { kind: 'block', type: 'algo_print' },
            { kind: 'block', type: 'text', fields: { TEXT: 'ได้ส่วนลด' } },
            { kind: 'block', type: 'text', fields: { TEXT: 'ราคาเต็ม' } }
          ]
        },
        {
          kind: 'category', name: 'เงื่อนไข', colour: 210,
          contents: [
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'controls_ifelse' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'math_number', fields: { NUM: 100 } }
          ]
        }
      ]
    },
    tests: [
      { name: 'เด็กเล็ก (height = 85)', inputs: { height: 85 }, expected: ['ได้ส่วนลด'] },
      { name: 'Boundary 99 (height = 99)', inputs: { height: 99 }, expected: ['ได้ส่วนลด'] },
      { name: 'Boundary 100 (height = 100)', inputs: { height: 100 }, expected: ['ราคาเต็ม'] },
      { name: 'ผู้ใหญ่ (height = 175)', inputs: { height: 175 }, expected: ['ราคาเต็ม'] },
      { name: 'Edge Case 0 (height = 0)', inputs: { height: 0 }, expected: ['ได้ส่วนลด'] }
    ]
  },
  {
    id: 'plant',
    tier: 'TIER 1 • LOOP CONTROL',
    title: '2. Automated Irrigation (ควบคุมการรดน้ำ)',
    shortTitle: '2. รดน้ำต้นไม้อัตโนมัติ',
    complexity: 'O(k)',
    parBlocks: 10,
    maxSteps: 30,
    xp: 120,
    hasArrayViz: false,
    description:
      'ระบบเกษตรอัจฉริยะ: ตรวจสอบค่าความชื้นในดิน (%) หากความชื้นยังน้อยกว่า 60% ให้สั่ง "รดน้ำต้นไม้ (+15%)" ซ้ำไปเรื่อยๆ จนกว่าความชื้นจะถึง 60% ขึ้นไป จากนั้นพิมพ์ค่าความชื้นสุดท้ายออกมา',
    hint: 'ใช้บล็อก "ทำซ้ำขณะที่ (while)" โดยตั้งเงื่อนไขว่า ความชื้นในดิน < 60 แล้วเรียกใช้ "รดน้ำต้นไม้" ภายในลูป และพิมพ์ค่าความชื้นหลังจบจากลูป',
    sandboxConfig: [
      { key: 'moisture', label: 'ความชื้นเริ่มต้น (%)', type: 'range', min: 0, max: 100, default: 20 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'เซนเซอร์ & สั่งการ', colour: 195,
          contents: [
            { kind: 'block', type: 'algo_moisture' },
            { kind: 'block', type: 'algo_water_plant' },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'math_number', fields: { NUM: 60 } }
          ]
        }
      ]
    },
    tests: [
      { name: 'ดินแห้งมาก (20% → 65%)', inputs: { moisture: 20 }, expected: ['65'] },
      { name: 'ดินแห้งปานกลาง (45% → 60%)', inputs: { moisture: 45 }, expected: ['60'] },
      { name: 'ชื้นเพียงพอแล้ว (75% → ไม่ต้องรด)', inputs: { moisture: 75 }, expected: ['75'] },
      { name: 'Boundary 60% (60% → 60%)', inputs: { moisture: 60 }, expected: ['60'] }
    ]
  },
  {
    id: 'max',
    tier: 'TIER 2 • ARRAY TRAVERSAL',
    title: '3. Peak Signal Finder (หาค่าสูงที่สุด)',
    shortTitle: '3. หาค่าสูงที่สุด (Max)',
    complexity: 'O(N)',
    parBlocks: 13,
    maxSteps: 60,
    xp: 150,
    hasArrayViz: true,
    description:
      'จงหาค่าที่สูงที่สุดในรายการข้อมูล (Array) แล้วพิมพ์ค่านั้นออกมา **ข้อควรระวังระดับปริญญาตรี:** ข้อมูลในรายการอาจเป็น "จำนวนลบทั้งหมด" ได้ ห้ามกำหนดค่าเริ่มต้นของตัวแปร best เป็น 0!',
    hint: 'กำหนดค่าเริ่มต้นของตัวแปร max ให้เท่ากับ "ข้อมูลในรายการตัวที่ 1" ก่อน แล้วจึงวนลูปเปรียบเทียบกับทุกตัวในรายการ',
    sandboxConfig: [
      { key: 'list', label: 'ชุดข้อมูล (Random)', type: 'array', length: 12, min: -50, max: 100 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_list_get', inputs: { INDEX: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
            { kind: 'block', type: 'algo_list_length' },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'algo_for_each' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'ตัวแปร & ตัวเลข', colour: 330, custom: 'VARIABLE' },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [{ kind: 'block', type: 'math_number', fields: { NUM: 1 } }]
        }
      ]
    },
    tests: [
      { name: 'ข้อมูลทั่วไป', inputs: { list: [12, 45, 7, 89, 34, 21] }, expected: ['89'] },
      { name: 'ค่ามากสุดอยู่ตัวสุดท้าย', inputs: { list: [3, 10, 25, 40, 99] }, expected: ['99'] },
      { name: 'จำนวนลบทั้งหมด (Edge Case!)', inputs: { list: [-50, -12, -3, -99, -25] }, expected: ['-3'] },
      { name: 'มีสมาชิกตัวเดียว', inputs: { list: [-7] }, expected: ['-7'] }
    ]
  },
  {
    id: 'min',
    tier: 'TIER 2 • ARRAY TRAVERSAL',
    title: '4. Minimum Latency Detector (หาค่าต่ำที่สุด)',
    shortTitle: '4. หาค่าต่ำที่สุด (Min)',
    complexity: 'O(N)',
    parBlocks: 13,
    maxSteps: 60,
    xp: 150,
    hasArrayViz: true,
    description:
      'จงหาค่าที่ต่ำที่สุดในรายการข้อมูลแล้วพิมพ์ผลลัพธ์ออกมา (เช่น ค่า Latency ต่ำสุดของเซิร์ฟเวอร์) โดยต้องรองรับชุดข้อมูลขนาดใดก็ได้ที่มีอย่างน้อย 1 ตัว',
    hint: 'กำหนดค่าเริ่มต้นของตัวแปร min เท่ากับข้อมูลตัวที่ 1 จากนั้นวนลูปเช็กว่าถ้า x < min ให้ปรับค่า min = x',
    sandboxConfig: [
      { key: 'list', label: 'ชุดข้อมูล (Random)', type: 'array', length: 12, min: 5, max: 120 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_list_get', inputs: { INDEX: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
            { kind: 'block', type: 'algo_list_length' },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'algo_for_each' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        { kind: 'category', name: 'ตัวแปร & ตัวเลข', colour: 330, custom: 'VARIABLE' },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [{ kind: 'block', type: 'math_number', fields: { NUM: 1 } }]
        }
      ]
    },
    tests: [
      { name: 'ข้อมูลทั่วไป', inputs: { list: [42, 18, 95, 7, 63] }, expected: ['7'] },
      { name: 'ค่าต่ำสุดอยู่ตัวแรก', inputs: { list: [2, 15, 30, 45] }, expected: ['2'] },
      { name: 'ค่าติดลบและศูนย์', inputs: { list: [0, -15, 20, -4, 8] }, expected: ['-15'] },
      { name: 'ข้อมูลเท่ากันทุกตัว', inputs: { list: [50, 50, 50] }, expected: ['50'] }
    ]
  },
  {
    id: 'avr',
    tier: 'TIER 2 • AGGREGATION',
    title: '5. Batch Mean Calculator (หาค่าเฉลี่ย)',
    shortTitle: '5. หาคะแนนเฉลี่ย (Average)',
    complexity: 'O(N)',
    parBlocks: 13,
    maxSteps: 60,
    xp: 160,
    hasArrayViz: true,
    description:
      'จงคำนวณค่าเฉลี่ยเลขคณิต (Arithmetic Mean) ของข้อมูลทั้งหมดในรายการ โดยใช้บล็อก "จำนวนข้อมูลในรายการ" เพื่อรองรับขนาดข้อมูลที่เปลี่ยนแปลงได้ (Dynamic N) แล้วพิมพ์ผลลัพธ์',
    hint: 'สร้างตัวแปร sum = 0 แล้ววนลูปบวกค่าทุกตัวเข้ากับ sum เมื่อจบลูปให้พิมพ์ sum ÷ จำนวนข้อมูลในรายการ',
    sandboxConfig: [
      { key: 'list', label: 'คะแนนนักศึกษา (Random)', type: 'array', length: 10, min: 40, max: 100 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_list_length' },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ', colour: 120,
          contents: [{ kind: 'block', type: 'algo_for_each' }]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_number', fields: { NUM: 0 } }
          ]
        },
        { kind: 'category', name: 'ตัวแปร', colour: 330, custom: 'VARIABLE' }
      ]
    },
    tests: [
      { name: 'ค่าเฉลี่ยลงตัว', inputs: { list: [10, 20, 30, 40] }, expected: ['25'] },
      { name: 'ค่าเฉลี่ยทศนิยม (65.5)', inputs: { list: [60, 70, 65, 67] }, expected: ['65.5'] },
      { name: 'ข้อมูล 1 ตัว', inputs: { list: [88] }, expected: ['88'] },
      { name: 'คะแนนชุดใหญ่ 6 ตัว', inputs: { list: [50, 60, 70, 80, 90, 100] }, expected: ['75'] }
    ]
  },
  {
    id: 'count',
    tier: 'TIER 2 • FILTERING',
    title: '6. Budget Filter Engine (นับสินค้าตามงบ)',
    shortTitle: '6. นับสินค้าที่ราคาไม่เกิน M',
    complexity: 'O(N)',
    parBlocks: 13,
    maxSteps: 60,
    xp: 160,
    hasArrayViz: true,
    description:
      'จงนับจำนวนสินค้าในรายการที่มีราคา "ไม่เกิน" งบประมาณ M (≤ M) แล้วพิมพ์จำนวนที่นับได้ออกมา (ระวังเงื่อนไข <= ไม่ใช่ <)',
    hint: 'กำหนด count = 0 วนลูปดูราคาสินค้า x ทีละตัว ถ้า x <= ค่าเป้าหมาย (M) ให้เพิ่มค่า count ขึ้น 1',
    sandboxConfig: [
      { key: 'target', label: 'งบประมาณ M (บาท)', type: 'number', min: 0, max: 500, default: 100 },
      { key: 'list', label: 'ราคาสินค้า (Random)', type: 'array', length: 12, min: 20, max: 200 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_target' },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'algo_for_each' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_number', fields: { NUM: 0 } },
            { kind: 'block', type: 'math_number', fields: { NUM: 1 } }
          ]
        },
        { kind: 'category', name: 'ตัวแปร', colour: 330, custom: 'VARIABLE' }
      ]
    },
    tests: [
      { name: 'มีสินค้าตรงงบพอดี (<= M)', inputs: { target: 100, list: [50, 100, 120, 80, 150] }, expected: ['3'] },
      { name: 'ไม่มีสินค้าในงบเลย', inputs: { target: 10, list: [20, 30, 40] }, expected: ['0'] },
      { name: 'ซื้อได้ทั้งหมด', inputs: { target: 200, list: [50, 100, 150, 200] }, expected: ['4'] }
    ]
  },
  {
    id: 'closest',
    tier: 'TIER 2 • DISTANCE METRIC',
    title: '7. Nearest Neighbor 1D (หาค่าใกล้เคียงที่สุด)',
    shortTitle: '7. หาค่าใกล้เคียงที่สุด (Closest)',
    complexity: 'O(N)',
    parBlocks: 18,
    maxSteps: 80,
    xp: 200,
    hasArrayViz: true,
    description:
      'จงหาข้อมูลในรายการที่มีระยะห่างจาก "ค่าเป้าหมาย (Target)" น้อยที่สุด (|x - Target| น้อยที่สุด) แล้วพิมพ์ค่านั้นออกมา (กรณีระยะห่างเท่ากัน ให้เลือกตัวที่พบก่อน)',
    hint: 'สร้างตัวแปร ans = ข้อมูลตัวที่ 1 และ bestDiff = ค่าสัมบูรณ์(ans - Target) จากนั้นวนลูปเช็กทุกตัว ถ้า abs(x - Target) < bestDiff ให้จำ ans = x และอัปเดต bestDiff',
    sandboxConfig: [
      { key: 'target', label: 'ค่าเป้าหมาย (Target)', type: 'number', min: -100, max: 200, default: 50 },
      { key: 'list', label: 'ชุดข้อมูล (Random)', type: 'array', length: 12, min: 0, max: 100 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_target' },
            { kind: 'block', type: 'algo_list_get', inputs: { INDEX: { shadow: { type: 'math_number', fields: { NUM: 1 } } } } },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'algo_for_each' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'math_single', fields: { OP: 'ABS' } },
            { kind: 'block', type: 'math_arithmetic', fields: { OP: 'MINUS' } },
            { kind: 'block', type: 'math_number', fields: { NUM: 1 } }
          ]
        },
        { kind: 'category', name: 'ตัวแปร', colour: 330, custom: 'VARIABLE' }
      ]
    },
    tests: [
      { name: 'ตรงกับเป้าหมายพอดี', inputs: { target: 50, list: [10, 48, 50, 55, 90] }, expected: ['50'] },
      { name: 'ใกล้เคียงจากฝั่งซ้าย/ขวา', inputs: { target: 40, list: [15, 37, 45, 60] }, expected: ['37'] },
      { name: 'ระยะห่างเท่ากัน (เลือกตัวแรก)', inputs: { target: 50, list: [40, 60, 10] }, expected: ['40'] },
      { name: 'ค่าติดลบ', inputs: { target: -10, list: [-25, -8, 5] }, expected: ['-8'] }
    ]
  },
  {
    id: 'rank',
    tier: 'TIER 3 • SEARCH & EARLY EXIT',
    title: '8. Leaderboard Ranker (ค้นหาอันดับคะแนน)',
    shortTitle: '8. หาอันดับประกวดร้องเพลง',
    complexity: 'O(N) / O(log N)',
    parBlocks: 14,
    maxSteps: 45,
    xp: 220,
    hasArrayViz: true,
    description:
      'รายการคะแนนเรียงจาก "มากไปน้อย" แล้ว (เช่น [98, 95, 88, ...]) จงหาว่า "ค่าเป้าหมาย (คะแนนของเพื่อน)" อยู่อันดับที่เท่าไหร่ (เริ่มนับอันดับที่ 1) แล้วพิมพ์ตัวเลขอันดับออกมา ⭐ เคล็ดลับ: ใช้ "หยุดลูปทันที (break)" เมื่อเจอคำตอบ เพื่อทำ 3 ดาว!',
    hint: 'วนลูปนับ i จาก 1 ถึง จำนวนข้อมูลในรายการ ถ้า ข้อมูลตัวที่ i == Target ให้พิมพ์ i แล้วเรียก "หยุดลูปทันที (break)" (หรือจะเขียน Binary Search ก็ได้เช่นกัน!)',
    sandboxConfig: [
      { key: 'target', label: 'คะแนนที่ต้องการหา', type: 'number', min: 1, max: 1000, default: 85 },
      { key: 'list', label: 'คะแนนเรียงมาก→น้อย', type: 'sorted_desc', length: 20 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & แสดงผล', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_target' },
            { kind: 'block', type: 'algo_list_length' },
            { kind: 'block', type: 'algo_list_get' },
            { kind: 'block', type: 'algo_print' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'algo_for_range' },
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'algo_break' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'algo_floor_div' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_number', fields: { NUM: 1 } },
            { kind: 'block', type: 'math_number', fields: { NUM: 2 } }
          ]
        },
        { kind: 'category', name: 'ตัวแปร', colour: 330, custom: 'VARIABLE' }
      ]
    },
    tests: [
      { name: 'อันดับที่ 1 (ตัวแรก)', inputs: { target: 100, list: [100, 95, 90, 85, 80, 75, 70, 65, 60, 55] }, expected: ['1'] },
      { name: 'กลางตาราง (อันดับ 6)', inputs: { target: 75, list: [100, 95, 90, 85, 80, 75, 70, 65, 60, 55] }, expected: ['6'] },
      { name: 'ข้อมูลใหญ่ 100 ตัว (อันดับ 3)', inputs: { target: 98, list: Array.from({ length: 100 }, (_, i) => 100 - i) }, expected: ['3'] }
    ]
  },
  {
    id: 'guess',
    tier: 'TIER 3 • BOSS CHALLENGE (BINARY SEARCH)',
    title: '9. Binary Search Master (เกมทายเลข 1–1000)',
    shortTitle: '9. เกมทายเลข O(log N)',
    complexity: 'O(log N)',
    parBlocks: 22,
    maxSteps: 12,
    xp: 300,
    hasArrayViz: false,
    description:
      'BOSS STAGE: ระบบสุ่มเลขลับไว้ระหว่าง 1 ถึง 1000 จงออกแบบอัลกอริทึมทายเลขโดยใช้บล็อก "ทายตัวเลข [mid] แล้วได้ผลลัพธ์" (คืนค่า "มากไป", "น้อยไป", หรือ "ถูกต้อง") เมื่อทายถูกให้พิมพ์ตัวเลขนั้นออกมา! **เงื่อนไข 3 ดาว:** ต้องทายถูกภายในไม่เกิน 10–12 ครั้ง (O(log N))',
    hint: 'ใช้หลักการ Binary Search: ตั้ง low = 1, high = 1000 วนลูปขณะที่ low <= high คำนวณ mid = หารปัดเศษลง(low + high, 2) แล้วเก็บผลจาก "ทายตัวเลข mid" ไว้ในตัวแปร res: ถ้า res == "ถูกต้อง" ให้พิมพ์ mid แล้ว break; ถ้า res == "มากไป" ให้ปรับ high = mid - 1; นอกนั้นปรับ low = mid + 1',
    sandboxConfig: [
      { key: 'secret', label: 'เลขลับ (1–1000)', type: 'number', min: 1, max: 1000, default: 732 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ทายเลข & แสดงผล', colour: 290,
          contents: [
            { kind: 'block', type: 'algo_guess_check' },
            { kind: 'block', type: 'algo_print' },
            { kind: 'block', type: 'text', fields: { TEXT: 'ถูกต้อง' } },
            { kind: 'block', type: 'text', fields: { TEXT: 'มากไป' } },
            { kind: 'block', type: 'text', fields: { TEXT: 'น้อยไป' } }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'controls_whileUntil' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'controls_ifelse' },
            { kind: 'block', type: 'logic_compare' },
            { kind: 'block', type: 'algo_break' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'algo_floor_div' },
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_number', fields: { NUM: 1 } },
            { kind: 'block', type: 'math_number', fields: { NUM: 2 } },
            { kind: 'block', type: 'math_number', fields: { NUM: 1000 } }
          ]
        },
        { kind: 'category', name: 'ตัวแปร', colour: 330, custom: 'VARIABLE' }
      ]
    },
    tests: [
      { name: 'เลขลับ 732', inputs: { secret: 732 }, expected: ['732'] },
      { name: 'Boundary ต่ำสุด (1)', inputs: { secret: 1 }, expected: ['1'] },
      { name: 'Boundary สูงสุด (1000)', inputs: { secret: 1000 }, expected: ['1000'] },
      { name: 'ค่ากลาง (500)', inputs: { secret: 500 }, expected: ['500'] }
    ]
  },
  {
    id: 'sort',
    tier: 'TIER 4 • CAPSTONE (SORTING)',
    title: '10. In-Place Sorting Engine (เรียงลำดับข้อมูล O(N²))',
    shortTitle: '10. เรียงลำดับข้อมูล (Sort)',
    complexity: 'O(N²)',
    parBlocks: 22,
    maxSteps: 150,
    xp: 400,
    hasArrayViz: true,
    description:
      'CAPSTONE STAGE: จงเขียนอัลกอริทึมเรียงลำดับข้อมูลในรายการจาก "น้อยไปมาก" (Ascending) แบบ In-Place (เช่น Selection Sort หรือ Bubble Sort) โดยใช้บล็อก "สลับข้อมูลตำแหน่ง i กับ j" เมื่อเรียงเสร็จแล้วให้เรียก "พิมพ์ข้อมูลทั้งหมดในรายการ"',
    hint: 'ใช้ Selection Sort: วนลูป i จาก 1 ถึง N - 1 ตั้ง minIdx = i แล้ววนลูป j จาก i + 1 ถึง N ถ้า list[j] < list[minIdx] ให้ปรับ minIdx = j เมื่อจบลูปในให้สลับตำแหน่ง i กับ minIdx และพิมพ์รายการทั้งหมดหลังจบทุกอย่าง',
    sandboxConfig: [
      { key: 'list', label: 'ชุดข้อมูลก่อนเรียง (Random)', type: 'array', length: 8, min: -20, max: 99 }
    ],
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: 'ข้อมูล & สลับค่า', colour: 210,
          contents: [
            { kind: 'block', type: 'algo_list_length' },
            { kind: 'block', type: 'algo_list_get' },
            { kind: 'block', type: 'algo_list_swap' },
            { kind: 'block', type: 'algo_list_print_all' }
          ]
        },
        {
          kind: 'category', name: 'วนซ้ำ & เงื่อนไข', colour: 120,
          contents: [
            { kind: 'block', type: 'algo_for_range' },
            { kind: 'block', type: 'controls_if' },
            { kind: 'block', type: 'logic_compare' }
          ]
        },
        {
          kind: 'category', name: 'คณิตศาสตร์', colour: 230,
          contents: [
            { kind: 'block', type: 'math_arithmetic' },
            { kind: 'block', type: 'math_number', fields: { NUM: 1 } }
          ]
        },
        { kind: 'category', name: 'ตัวแปร', colour: 330, custom: 'VARIABLE' }
      ]
    },
    tests: [
      { name: 'ข้อมูลทั่วไป', inputs: { list: [42, 15, 88, 7, 23] }, expected: ['7, 15, 23, 42, 88'] },
      { name: 'เรียงกลับด้าน (Worst Case)', inputs: { list: [50, 40, 30, 20, 10] }, expected: ['10, 20, 30, 40, 50'] },
      { name: 'มีค่าซ้ำและค่าติดลบ', inputs: { list: [5, -2, 5, 0, -2] }, expected: ['-2, -2, 0, 5, 5'] },
      { name: 'เรียงอยู่แล้ว', inputs: { list: [1, 2, 3, 4, 5] }, expected: ['1, 2, 3, 4, 5'] }
    ]
  }
];

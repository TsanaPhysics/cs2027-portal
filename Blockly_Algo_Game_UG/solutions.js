// Official 3-Star Optimal Solutions & Instructor Teaching Notes for AlgoQuest UG

const SOLUTIONS = {
  zoo: {
    note: 'เน้นเรื่อง Boundary Value Analysis (BVA): นักศึกษามักสับสนระหว่าง "< 100" กับ "<= 100" ทดสอบที่ 99, 100, 101 เพื่อฝึกตรวจขอบเขตเงื่อนไข',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="controls_ifelse" x="40" y="40">
        <value name="IF0">
          <block type="logic_compare">
            <field name="OP">LT</field>
            <value name="A"><block type="algo_height"></block></value>
            <value name="B"><block type="math_number"><field name="NUM">100</field></block></value>
          </block>
        </value>
        <statement name="DO0">
          <block type="algo_print">
            <value name="VALUE"><block type="text"><field name="TEXT">ได้ส่วนลด</field></block></value>
          </block>
        </statement>
        <statement name="ELSE">
          <block type="algo_print">
            <value name="VALUE"><block type="text"><field name="TEXT">ราคาเต็ม</field></block></value>
          </block>
        </statement>
      </block>
    </xml>`
  },

  plant: {
    note: 'เน้นเรื่อง Pre-test Loop (while): หากความชื้นเริ่มต้น >= 60 อยู่แล้ว ลูปต้องไม่ทำงานเลย (0 รอบ) และพิมพ์ค่าเดิมออกมาทันที',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="controls_whileUntil" x="40" y="40">
        <field name="MODE">WHILE</field>
        <value name="BOOL">
          <block type="logic_compare">
            <field name="OP">LT</field>
            <value name="A"><block type="algo_moisture"></block></value>
            <value name="B"><block type="math_number"><field name="NUM">60</field></block></value>
          </block>
        </value>
        <statement name="DO">
          <block type="algo_water_plant"></block>
        </statement>
        <next>
          <block type="algo_print">
            <value name="VALUE"><block type="algo_moisture"></block></value>
          </block>
        </next>
      </block>
    </xml>`
  },

  max: {
    note: 'ข้อผิดพลาดยอดนิยมของนักศึกษา: กำหนด maxVal = 0 ซึ่งจะผิดทันทีเมื่อข้อมูลเป็นจำนวนลบทั้งหมด (เช่น [-50, -12, -3]) ต้องกำหนด maxVal = ข้อมูลตัวแรกเสมอ',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="40" y="40">
        <field name="VAR">maxVal</field>
        <value name="VALUE">
          <block type="algo_list_get">
            <value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <next>
          <block type="algo_for_each">
            <field name="VAR">x</field>
            <statement name="DO">
              <block type="controls_if">
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">GT</field>
                    <value name="A"><block type="variables_get"><field name="VAR">x</field></block></value>
                    <value name="B"><block type="variables_get"><field name="VAR">maxVal</field></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set">
                    <field name="VAR">maxVal</field>
                    <value name="VALUE"><block type="variables_get"><field name="VAR">x</field></block></value>
                  </block>
                </statement>
              </block>
            </statement>
            <next>
              <block type="algo_print">
                <value name="VALUE"><block type="variables_get"><field name="VAR">maxVal</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  min: {
    note: 'เช่นเดียวกับ Max: การตั้งค่าเริ่มต้น minVal จากสมาชิกตัวที่ 1 ทำให้รองรับทั้งค่าบวก ค่าศูนย์ และค่าติดลบได้โดยไม่ต้องพึ่งค่าคงที่อย่าง Infinity',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="40" y="40">
        <field name="VAR">minVal</field>
        <value name="VALUE">
          <block type="algo_list_get">
            <value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <next>
          <block type="algo_for_each">
            <field name="VAR">x</field>
            <statement name="DO">
              <block type="controls_if">
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">LT</field>
                    <value name="A"><block type="variables_get"><field name="VAR">x</field></block></value>
                    <value name="B"><block type="variables_get"><field name="VAR">minVal</field></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set">
                    <field name="VAR">minVal</field>
                    <value name="VALUE"><block type="variables_get"><field name="VAR">x</field></block></value>
                  </block>
                </statement>
              </block>
            </statement>
            <next>
              <block type="algo_print">
                <value name="VALUE"><block type="variables_get"><field name="VAR">minVal</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  avr: {
    note: 'เน้น Accumulator Pattern (sum = 0) และการใช้จำนวนข้อมูลแบบ Dynamic (algo_list_length) แทนการ Hardcode ตัวหาร',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="40" y="40">
        <field name="VAR">sum</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
        <next>
          <block type="algo_for_each">
            <field name="VAR">x</field>
            <statement name="DO">
              <block type="variables_set">
                <field name="VAR">sum</field>
                <value name="VALUE">
                  <block type="math_arithmetic">
                    <field name="OP">ADD</field>
                    <value name="A"><block type="variables_get"><field name="VAR">sum</field></block></value>
                    <value name="B"><block type="variables_get"><field name="VAR">x</field></block></value>
                  </block>
                </value>
              </block>
            </statement>
            <next>
              <block type="algo_print">
                <value name="VALUE">
                  <block type="math_arithmetic">
                    <field name="OP">DIVIDE</field>
                    <value name="A"><block type="variables_get"><field name="VAR">sum</field></block></value>
                    <value name="B"><block type="algo_list_length"></block></value>
                  </block>
                </value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  count: {
    note: 'เน้น Counter Pattern และเงื่อนไขรวมขอบเขต (<= M) สำหรับสินค้าที่ราคาเท่ากับงบประมาณพอดี',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="40" y="40">
        <field name="VAR">cnt</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">0</field></block></value>
        <next>
          <block type="algo_for_each">
            <field name="VAR">x</field>
            <statement name="DO">
              <block type="controls_if">
                <value name="IF0">
                  <block type="logic_compare">
                    <field name="OP">LTE</field>
                    <value name="A"><block type="variables_get"><field name="VAR">x</field></block></value>
                    <value name="B"><block type="algo_target"></block></value>
                  </block>
                </value>
                <statement name="DO0">
                  <block type="variables_set">
                    <field name="VAR">cnt</field>
                    <value name="VALUE">
                      <block type="math_arithmetic">
                        <field name="OP">ADD</field>
                        <value name="A"><block type="variables_get"><field name="VAR">cnt</field></block></value>
                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                      </block>
                    </value>
                  </block>
                </statement>
              </block>
            </statement>
            <next>
              <block type="algo_print">
                <value name="VALUE"><block type="variables_get"><field name="VAR">cnt</field></block></value>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  closest: {
    note: 'ใช้ระยะห่างแบบ 1D Manhattan Distance |x - target| และการจำค่า bestDiff ไว้เทียบ กรณีระยะเท่ากันใช้ "<" (strictly less) เพื่อรักษาตัวที่พบก่อน',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="40" y="30">
        <field name="VAR">ans</field>
        <value name="VALUE">
          <block type="algo_list_get">
            <value name="INDEX"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <next>
          <block type="variables_set">
            <field name="VAR">bestDiff</field>
            <value name="VALUE">
              <block type="math_single">
                <field name="OP">ABS</field>
                <value name="NUM">
                  <block type="math_arithmetic">
                    <field name="OP">MINUS</field>
                    <value name="A"><block type="variables_get"><field name="VAR">ans</field></block></value>
                    <value name="B"><block type="algo_target"></block></value>
                  </block>
                </value>
              </block>
            </value>
            <next>
              <block type="algo_for_each">
                <field name="VAR">x</field>
                <statement name="DO">
                  <block type="variables_set">
                    <field name="VAR">diff</field>
                    <value name="VALUE">
                      <block type="math_single">
                        <field name="OP">ABS</field>
                        <value name="NUM">
                          <block type="math_arithmetic">
                            <field name="OP">MINUS</field>
                            <value name="A"><block type="variables_get"><field name="VAR">x</field></block></value>
                            <value name="B"><block type="algo_target"></block></value>
                          </block>
                        </value>
                      </block>
                    </value>
                    <next>
                      <block type="controls_if">
                        <value name="IF0">
                          <block type="logic_compare">
                            <field name="OP">LT</field>
                            <value name="A"><block type="variables_get"><field name="VAR">diff</field></block></value>
                            <value name="B"><block type="variables_get"><field name="VAR">bestDiff</field></block></value>
                          </block>
                        </value>
                        <statement name="DO0">
                          <block type="variables_set">
                            <field name="VAR">bestDiff</field>
                            <value name="VALUE"><block type="variables_get"><field name="VAR">diff</field></block></value>
                            <next>
                              <block type="variables_set">
                                <field name="VAR">ans</field>
                                <value name="VALUE"><block type="variables_get"><field name="VAR">x</field></block></value>
                              </block>
                            </next>
                          </block>
                        </statement>
                      </block>
                    </next>
                  </block>
                </statement>
                <next>
                  <block type="algo_print">
                    <value name="VALUE"><block type="variables_get"><field name="VAR">ans</field></block></value>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  rank: {
    note: 'เฉลยใช้ Binary Search บนอาร์เรย์เรียงจากมากไปน้อย (Descending) ใช้เวลาเพียง O(log N) ≈ 7 ขั้นตอนสำหรับ N=100 (หรือใช้ Linear Search + break ก็ผ่านได้เช่นกัน)',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="30" y="30">
        <field name="VAR">low</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">1</field></block></value>
        <next>
          <block type="variables_set">
            <field name="VAR">high</field>
            <value name="VALUE"><block type="algo_list_length"></block></value>
            <next>
              <block type="controls_whileUntil">
                <field name="MODE">WHILE</field>
                <value name="BOOL">
                  <block type="logic_compare">
                    <field name="OP">LTE</field>
                    <value name="A"><block type="variables_get"><field name="VAR">low</field></block></value>
                    <value name="B"><block type="variables_get"><field name="VAR">high</field></block></value>
                  </block>
                </value>
                <statement name="DO">
                  <block type="variables_set">
                    <field name="VAR">mid</field>
                    <value name="VALUE">
                      <block type="algo_floor_div">
                        <value name="A">
                          <block type="math_arithmetic">
                            <field name="OP">ADD</field>
                            <value name="A"><block type="variables_get"><field name="VAR">low</field></block></value>
                            <value name="B"><block type="variables_get"><field name="VAR">high</field></block></value>
                          </block>
                        </value>
                        <value name="B"><block type="math_number"><field name="NUM">2</field></block></value>
                      </block>
                    </value>
                    <next>
                      <block type="variables_set">
                        <field name="VAR">val</field>
                        <value name="VALUE">
                          <block type="algo_list_get">
                            <value name="INDEX"><block type="variables_get"><field name="VAR">mid</field></block></value>
                          </block>
                        </value>
                        <next>
                          <block type="controls_ifelse">
                            <value name="IF0">
                              <block type="logic_compare">
                                <field name="OP">EQ</field>
                                <value name="A"><block type="variables_get"><field name="VAR">val</field></block></value>
                                <value name="B"><block type="algo_target"></block></value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <block type="algo_print">
                                <value name="VALUE"><block type="variables_get"><field name="VAR">mid</field></block></value>
                                <next><block type="algo_break"></block></next>
                              </block>
                            </statement>
                            <statement name="ELSE">
                              <block type="controls_ifelse">
                                <value name="IF0">
                                  <block type="logic_compare">
                                    <field name="OP">GT</field>
                                    <value name="A"><block type="variables_get"><field name="VAR">val</field></block></value>
                                    <value name="B"><block type="algo_target"></block></value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <block type="variables_set">
                                    <field name="VAR">low</field>
                                    <value name="VALUE">
                                      <block type="math_arithmetic">
                                        <field name="OP">ADD</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">mid</field></block></value>
                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                                <statement name="ELSE">
                                  <block type="variables_set">
                                    <field name="VAR">high</field>
                                    <value name="VALUE">
                                      <block type="math_arithmetic">
                                        <field name="OP">MINUS</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">mid</field></block></value>
                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                              </block>
                            </statement>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  guess: {
    note: 'Binary Search เต็มรูปแบบในช่วง [1, 1000]: ทายไม่เกิน ceil(log2(1000)) = 10 ครั้งในทุกกรณี (Worst Case 10 ครั้ง) ได้ 3 ดาวแน่นอน',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="variables_set" x="30" y="30">
        <field name="VAR">low</field>
        <value name="VALUE"><block type="math_number"><field name="NUM">1</field></block></value>
        <next>
          <block type="variables_set">
            <field name="VAR">high</field>
            <value name="VALUE"><block type="math_number"><field name="NUM">1000</field></block></value>
            <next>
              <block type="controls_whileUntil">
                <field name="MODE">WHILE</field>
                <value name="BOOL">
                  <block type="logic_compare">
                    <field name="OP">LTE</field>
                    <value name="A"><block type="variables_get"><field name="VAR">low</field></block></value>
                    <value name="B"><block type="variables_get"><field name="VAR">high</field></block></value>
                  </block>
                </value>
                <statement name="DO">
                  <block type="variables_set">
                    <field name="VAR">mid</field>
                    <value name="VALUE">
                      <block type="algo_floor_div">
                        <value name="A">
                          <block type="math_arithmetic">
                            <field name="OP">ADD</field>
                            <value name="A"><block type="variables_get"><field name="VAR">low</field></block></value>
                            <value name="B"><block type="variables_get"><field name="VAR">high</field></block></value>
                          </block>
                        </value>
                        <value name="B"><block type="math_number"><field name="NUM">2</field></block></value>
                      </block>
                    </value>
                    <next>
                      <block type="variables_set">
                        <field name="VAR">res</field>
                        <value name="VALUE">
                          <block type="algo_guess_check">
                            <value name="NUM"><block type="variables_get"><field name="VAR">mid</field></block></value>
                          </block>
                        </value>
                        <next>
                          <block type="controls_ifelse">
                            <value name="IF0">
                              <block type="logic_compare">
                                <field name="OP">EQ</field>
                                <value name="A"><block type="variables_get"><field name="VAR">res</field></block></value>
                                <value name="B"><block type="text"><field name="TEXT">ถูกต้อง</field></block></value>
                              </block>
                            </value>
                            <statement name="DO0">
                              <block type="algo_print">
                                <value name="VALUE"><block type="variables_get"><field name="VAR">mid</field></block></value>
                                <next><block type="algo_break"></block></next>
                              </block>
                            </statement>
                            <statement name="ELSE">
                              <block type="controls_ifelse">
                                <value name="IF0">
                                  <block type="logic_compare">
                                    <field name="OP">EQ</field>
                                    <value name="A"><block type="variables_get"><field name="VAR">res</field></block></value>
                                    <value name="B"><block type="text"><field name="TEXT">มากไป</field></block></value>
                                  </block>
                                </value>
                                <statement name="DO0">
                                  <block type="variables_set">
                                    <field name="VAR">high</field>
                                    <value name="VALUE">
                                      <block type="math_arithmetic">
                                        <field name="OP">MINUS</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">mid</field></block></value>
                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                                <statement name="ELSE">
                                  <block type="variables_set">
                                    <field name="VAR">low</field>
                                    <value name="VALUE">
                                      <block type="math_arithmetic">
                                        <field name="OP">ADD</field>
                                        <value name="A"><block type="variables_get"><field name="VAR">mid</field></block></value>
                                        <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                                      </block>
                                    </value>
                                  </block>
                                </statement>
                              </block>
                            </statement>
                          </block>
                        </next>
                      </block>
                    </next>
                  </block>
                </statement>
              </block>
            </next>
          </block>
        </next>
      </block>
    </xml>`
  },

  sort: {
    note: 'Selection Sort O(N²): ใช้ Nested Loop (i = 1..N-1, j = i+1..N) หา minIdx แล้วสลับเพียง O(N) ครั้ง ช่วยลดจำนวนการเขียนลงหน่วยความจำได้ดีกว่า Bubble Sort',
    xml: `<xml xmlns="https://developers.google.com/blockly/xml">
      <block type="algo_for_range" x="30" y="30">
        <field name="VAR">i</field>
        <value name="FROM"><block type="math_number"><field name="NUM">1</field></block></value>
        <value name="TO">
          <block type="math_arithmetic">
            <field name="OP">MINUS</field>
            <value name="A"><block type="algo_list_length"></block></value>
            <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
          </block>
        </value>
        <statement name="DO">
          <block type="variables_set">
            <field name="VAR">minIdx</field>
            <value name="VALUE"><block type="variables_get"><field name="VAR">i</field></block></value>
            <next>
              <block type="algo_for_range">
                <field name="VAR">j</field>
                <value name="FROM">
                  <block type="math_arithmetic">
                    <field name="OP">ADD</field>
                    <value name="A"><block type="variables_get"><field name="VAR">i</field></block></value>
                    <value name="B"><block type="math_number"><field name="NUM">1</field></block></value>
                  </block>
                </value>
                <value name="TO"><block type="algo_list_length"></block></value>
                <statement name="DO">
                  <block type="controls_if">
                    <value name="IF0">
                      <block type="logic_compare">
                        <field name="OP">LT</field>
                        <value name="A">
                          <block type="algo_list_get">
                            <value name="INDEX"><block type="variables_get"><field name="VAR">j</field></block></value>
                          </block>
                        </value>
                        <value name="B">
                          <block type="algo_list_get">
                            <value name="INDEX"><block type="variables_get"><field name="VAR">minIdx</field></block></value>
                          </block>
                        </value>
                      </block>
                    </value>
                    <statement name="DO0">
                      <block type="variables_set">
                        <field name="VAR">minIdx</field>
                        <value name="VALUE"><block type="variables_get"><field name="VAR">j</field></block></value>
                      </block>
                    </statement>
                  </block>
                </statement>
                <next>
                  <block type="algo_list_swap">
                    <value name="I"><block type="variables_get"><field name="VAR">i</field></block></value>
                    <value name="J"><block type="variables_get"><field name="VAR">minIdx</field></block></value>
                  </block>
                </next>
              </block>
            </next>
          </block>
        </statement>
        <next>
          <block type="algo_list_print_all"></block>
        </next>
      </block>
    </xml>`
  }
};

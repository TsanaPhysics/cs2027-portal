from pathlib import Path
from playwright.sync_api import sync_playwright
p='/mnt/data/CT_Lab_Interactive_v4_Algorithms_Flowcharts.html'
html=Path(p).read_text(encoding='utf8')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server'])
    page=browser.new_page(viewport={'width':1440,'height':920},device_scale_factor=1)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    print('Initial title',page.title(),'modules',page.locator('button.module-card').count())
    assert page.locator('button.module-card').count()==9
    assert not errors,errors
    # Algorithm module
    page.locator('[data-target="algorithms"]').click()
    assert page.locator('[data-page="algorithms"].active').count()==1
    assert page.locator('[data-alg-tab]').count()==4
    print('watering H initial',page.locator('#alg-water-state').inner_text())
    page.locator('#alg-water-slider').evaluate("(el)=>{el.value='0.10';el.dispatchEvent(new Event('input',{bubbles:true}))}")
    assert 'ปิดน้ำ' in page.locator('#alg-water-state').inner_text()
    page.locator('#alg-water-slider').evaluate("(el)=>{el.value='0.09';el.dispatchEvent(new Event('input',{bubbles:true}))}")
    assert 'เปิดน้ำ' in page.locator('#alg-water-state').inner_text()
    page.locator('#alg-water-step').click()
    assert page.locator('#alg-water-trace .v4-trace-entry').count()==1
    page.locator('[data-alg-tab="minimum"]').click()
    page.locator('#alg-min-data').fill('8, 3, 11, 2, 7, 5')
    page.locator('#alg-min-all').click()
    assert page.locator('#alg-min-result').inner_text()=='2'
    assert page.locator('#alg-min-trace tr').count()==6
    print('minimum',page.locator('#alg-min-result').inner_text())
    assert page.locator('#side-completed').inner_text()=='สำเร็จ 1 จาก 9 กิจกรรม'
    page.locator('[data-alg-tab="logic"]').click()
    assert page.locator('#alg-or').inner_text()=='จริง'
    page.locator('#alg-logic-a').uncheck()
    assert page.locator('#alg-or').inner_text()=='เท็จ'
    page.locator('[data-logic-answer="OR"]').click()
    assert 'ถูกต้อง' in page.locator('#alg-logic-feedback').inner_text()
    page.locator('[data-alg-tab="budget"]').click()
    page.locator('#alg-budget-all').click()
    assert page.locator('#alg-budget-result').inner_text()=='4'
    print('budget',page.locator('#alg-budget-feedback').inner_text())
    # flow chart: teeth
    page.locator('[data-target="flowcharts"]').click()
    assert page.locator('[data-page="flowcharts"].active').count()==1
    assert page.locator('#fc-bank button').count()==8
    for prefix in ['เริ่มต้น','เตรียมอุปกรณ์:','บ้วนปาก (ครั้งแรก)','บีบยาสีฟัน','แปรงฟันให้ทั่ว','บ้วนปาก (ครั้งหลัง)','ล้างแปรงสีฟัน','จบ']:
        page.locator('#fc-bank button').filter(has_text=prefix).click()
    assert page.locator('#fc-bank button').count()==0
    page.locator('#fc-check').click()
    assert 'ยอดเยี่ยม' in page.locator('#fc-feedback').inner_text()
    assert page.locator('#side-completed').inner_text()=='สำเร็จ 2 จาก 9 กิจกรรม'
    page.screenshot(path='/mnt/data/CT_Lab_v4_Web/preview_flowcharts.png',full_page=True)
    page.locator('#fc-case').select_option('shirt')
    for prefix in ['เริ่มต้น','หยิบเสื้อ','สวมแขนขวา','สวมแขนซ้าย','ติดกระดุม','จบ']:
        page.locator('#fc-bank button').filter(has_text=prefix).click()
    page.locator('#fc-check').click()
    assert 'ยอดเยี่ยม' in page.locator('#fc-feedback').inner_text()
    page.locator('#fc-case').select_option('egg')
    assert page.locator('#fc-bank button').count()==13
    page.locator('#fc-example').click()
    assert page.locator('#fc-sim-steps .v4-sim-row').count()==13
    page.locator('#fc-sim-next').click()
    assert page.locator('#fc-sim-steps .done').count()==1
    page.locator('[data-target="algorithms"]').click()
    page.locator('[data-alg-tab="water"]').click()
    page.screenshot(path='/mnt/data/CT_Lab_v4_Web/preview_algorithms.png',full_page=True)
    # existing modules smoke
    page.locator('[data-target="searching"]').click()
    page.locator('[data-search-tab="binary"]').click()
    page.locator('#search-binary-all').click()
    assert page.locator('#search-binary-count').inner_text()=='3'
    page.locator('[data-target="gcd"]').click()
    page.locator('#gcd-a').fill('301981');page.locator('#gcd-b').fill('449573');page.locator('#gcd-all').click()
    assert '971' in page.locator('#gcd-result').inner_text()
    page.locator('[data-target="decomposition"]').click()
    assert page.locator('#decomp-bike-buttons button').count()==6
    # exports include all sources
    page.locator('#export-progress').click()
    assert not errors,errors
    print('desktop errors',errors)
    mob=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    errorsm=[];mob.on('pageerror',lambda e:errorsm.append(str(e)))
    mob.set_content(html,wait_until='load');mob.locator('#menu-open').click();mob.locator('[data-target="flowcharts"]').click()
    mob.screenshot(path='/mnt/data/CT_Lab_v4_Web/preview_mobile.png',full_page=True)
    width=mob.evaluate('({doc:document.documentElement.scrollWidth,inner:window.innerWidth})')
    print('mobile width',width,'errors',errorsm)
    assert width['doc']<=width['inner']+1,width
    assert not errorsm,errorsm
    browser.close()
print('PASS all v4 tests')

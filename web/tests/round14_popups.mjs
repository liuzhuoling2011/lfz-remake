import { chromium } from 'playwright'; import path from 'path';
const base = process.env.BASE || 'http://127.0.0.1:4174/'; const out = path.resolve('../screenshots/round14');
const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
const errs = []; page.on('pageerror', e => errs.push(e.message));
await page.goto(base + '?scene=game&map=0&mute');
await page.waitForFunction(() => window.__lfz?.scene?.turnMenuRes, null, { timeout: 120000 }); await page.waitForTimeout(2000);
const cases = [
  ['toll_msgbox', "window.__lfz.engine.ui.message(window.__D_msg ?? '大番薯要付消費 750 元給老夫子！')"],
  ['salary_msgbox', "window.__lfz.engine.ui.message('洋行：派發薪酬 250 元！')"],
  ['confirm_msgbox', "window.__lfz.engine.ui.confirm('要乘搭渡海小輪嗎？')"],
];
let fail = 0;
for (const [n, js] of cases) {
  await page.evaluate(js => { window.__p = eval(js); }, js); await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, `popup_${n}.png`) });
  const top = await page.evaluate(() => window.__lfz.scene.dlgs.length); if (!top) { fail++; console.log('FAIL', n); }
  await page.keyboard.press('Enter'); await page.waitForTimeout(200);
  await page.evaluate(() => { const s = window.__lfz.scene; while (s.dlgs.length) s.dlgs[s.dlgs.length - 1].resolve(undefined); });
}
console.log(fail ? 'FAIL' : 'popups OK', 'errors', errs.length); await b.close(); process.exit(fail || errs.length ? 1 : 0);

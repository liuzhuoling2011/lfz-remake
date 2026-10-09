import { app, setSpeedIndex, AUTO, type Scene } from './core/app';
import { initSprites, loadSheets } from './core/assets';
import { settings, unlockAudio } from './core/audio';
import { loadData } from './game/data';
import { text } from './core/text';
import { TitleScene, MainMenuScene, SelectYearScene, SelectMapScene, SelectActorScene, OptionsScene, LoadScene, bindNav } from './scenes/menus';
import { GameScene, bindGameNav } from './scenes/game';

const errors: string[] = [];
(window as any).__errors = errors;
window.addEventListener('error', e => errors.push(String(e.message)));
window.addEventListener('unhandledrejection', e => errors.push('rejection: ' + String((e as any).reason?.stack || (e as any).reason)));

function nav(name: string, arg?: any) {
  const map: Record<string, () => Scene> = {
    title: () => new TitleScene(), mainmenu: () => new MainMenuScene(), selectyear: () => new SelectYearScene(),
    selectmap: () => new SelectMapScene(), selectactor: () => new SelectActorScene(), options: () => new OptionsScene(),
    load: () => new LoadScene(), game: () => new GameScene(arg ?? {}),
  };
  (window as any).__scene = name;
  app.setScene(map[name]());
}
bindNav(nav); bindGameNav(nav);

class BootScene implements Scene {
  p = 0; msg = '載入中…';
  render(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = '#0f1a33'; ctx.fillRect(0, 0, w, h);
    const bw = Math.min(320, w - 60);
    ctx.fillStyle = '#333'; ctx.fillRect(w / 2 - bw / 2, h / 2, bw, 10);
    ctx.fillStyle = '#ff9a1a'; ctx.fillRect(w / 2 - bw / 2, h / 2, bw * this.p, 10);
    text(ctx, '老夫子大富翁 · ' + this.msg, w / 2, h / 2 - 20, { size: 18, align: 'center', color: '#ffe8a0' });
  }
}

async function boot() {
  app.init(document.getElementById('game') as HTMLCanvasElement);
  document.getElementById('boot')?.remove();
  const bs = new BootScene(); app.setScene(bs);
  // unlock/resume audio on every kind of first user gesture (pointer, touch, key); harmless when already running
  for (const ev of ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click']) window.addEventListener(ev, () => unlockAudio(), { passive: true });
  unlockAudio(); // succeeds immediately where autoplay is permitted
  setSpeedIndex(settings.speed);
  try {
    await Promise.all([initSprites(), loadData()]);
    const ui = ['logo/bg', 'logo/button', 'mainmenu/bg', 'mainmenu/menu', 'mainmenu/money01', 'mainmenu/money02', 'misc/pattern', 'misc/loading',
      'selectyear/bg', 'selectyear/buttons', 'selectyear/fg', 'selectmap/bg', 'selectmap/buttons', 'selectmap/fg', 'selectmap/map',
      'selectactor/player01', 'selectactor/player02', 'selectactor/player03', 'selectactor/player04', 'selectactor/actor', 'selectactor/button', 'selectactor/device', 'selectactor/frame',
      'option/bg', 'interface/face01', 'interface/face02', 'interface/face03', 'interface/face04', 'interface/face05', 'interface/face06'];
    await loadSheets(ui, (d, t) => { bs.p = d / t; });
    const start = new URLSearchParams(location.search).get('scene');
    nav(AUTO ? 'mainmenu' : start ?? 'title');
  } catch (e) { bs.msg = '載入失敗 ' + e; console.error(e); }
}
void boot();

// Audio: music via <audio> (streaming, looping), SFX/voice via WebAudio buffers.
import { BASE } from './assets';

export const settings = {
  music: 0.6, sfx: 0.8, voice: 0.9, speed: 1 as 0 | 1 | 2,
  /** 畫質: 0 自動, 1 標準 (SD), 2 高清 (HD) */ quality: 0 as 0 | 1 | 2,
};
const SETTINGS_KEY = 'lfz.settings';
try { Object.assign(settings, JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')); } catch { /* ignore */ }
export function saveSettings() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ } }

let ac: AudioContext | null = null;
let sfxGain: GainNode | null = null, voiceGain: GainNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
let musicEl: HTMLAudioElement | null = null;
let musicName = '';
let unlocked = false;
export let muted = new URLSearchParams(location.search).has('mute');

function ctx() {
  if (!ac) {
    const C = (window.AudioContext || (window as any).webkitAudioContext);
    if (!C) return null;
    ac = new C();
    sfxGain = ac.createGain(); sfxGain.connect(ac.destination);
    voiceGain = ac.createGain(); voiceGain.connect(ac.destination);
    applyVolumes();
  }
  return ac;
}

export function applyVolumes() {
  if (sfxGain) sfxGain.gain.value = muted ? 0 : settings.sfx;
  if (voiceGain) voiceGain.gain.value = muted ? 0 : settings.voice;
  if (musicEl) musicEl.volume = muted ? 0 : settings.music;
}

/** Must be called from a user gesture (pointerdown/keydown/touchend). Safe to call repeatedly. */
export function unlockAudio() {
  const c = ctx();
  if (c && c.state !== 'running') {
    void c.resume().catch(() => {});
    // iOS: play a silent buffer inside the gesture to fully unlock the output
    try { const b = c.createBuffer(1, 1, 22050); const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch { /* ignore */ }
  }
  unlocked = true;
  if (musicEl && musicEl.paused && !muted) void musicEl.play().catch(() => {});
}
export function audioState() { return ac?.state ?? 'none'; }
/** Decode ahead of time so the first play has no latency. */
export function preloadAudio(paths: string[]) { if (!ctx()) return Promise.resolve(); return Promise.all(paths.map(p => load(p))).then(() => {}); }

/** Debug/verification log of sounds actually started (read by the headless tests). */
export const audioLog: { t: number; kind: 'sfx' | 'voice'; name: string; ch?: number }[] = [];
(window as any).__lfzAudio = { log: audioLog, state: () => audioState() };
function logPlay(kind: 'sfx' | 'voice', name: string, ch?: number) { audioLog.push({ t: Math.round(performance.now()), kind, name, ch }); if (audioLog.length > 400) audioLog.splice(0, 100); }

function load(path: string): Promise<AudioBuffer | null> {
  let p = buffers.get(path);
  if (!p) {
    const c = ctx();
    p = (async () => {
      if (!c) return null;
      try {
        const r = await fetch(BASE + 'audio/' + path);
        if (!r.ok) return null;
        const ab = await r.arrayBuffer();
        return await new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(ab, res, rej));
      } catch { return null; }
    })();
    buffers.set(path, p);
  }
  return p;
}

// One voice channel per player (as in the original: starting a line stops that player's previous line),
// plus channel -1 for narration (card voices). A global gate prevents several characters talking at once.
const voiceCh = new Map<number, { src: AudioBufferSourceNode; end: number; prio: number }>();
const lastSfx = new Map<string, number>();

export async function sfx(name: string, vol = 1) {
  if (muted || settings.sfx <= 0) return;
  const c = ctx(); if (!c || c.state !== 'running') return;
  // de-duplicate rapid repeats of the same effect (e.g. money fx on several players at once)
  const now = performance.now(); if (now - (lastSfx.get(name) ?? -1e9) < 60) return; lastSfx.set(name, now);
  const b = await load('sfx/' + name + '.mp3'); if (!b) return;
  const s = c.createBufferSource(); s.buffer = b;
  const g = c.createGain(); g.gain.value = vol; s.connect(g); g.connect(sfxGain!);
  s.start(); logPlay('sfx', name);
}

/**
 * Play a voice line on a channel; resolves when finished (or immediately if audio unavailable).
 * prio: lines with lower priority than one still playing (on any channel) are dropped instead of overlapping.
 */
export async function voice(file: string, ch = -1, prio = 1): Promise<void> {
  if (muted || settings.voice <= 0) return;
  const c = ctx(); if (!c || c.state !== 'running') return;
  const now = c.currentTime;
  for (const [k, v] of voiceCh) {
    if (v.end <= now) { voiceCh.delete(k); continue; }
    if (k !== ch && v.prio >= prio) return; // someone else is talking – don't spam over them
  }
  const b = await load('voice/' + file.toLowerCase()); if (!b) return;
  const prev = voiceCh.get(ch); if (prev) { try { prev.src.stop(); } catch { /* ignore */ } }
  for (const [k, v] of voiceCh) if (k !== ch && v.prio < prio) { try { v.src.stop(); } catch { /* ignore */ } voiceCh.delete(k); }
  const s = c.createBufferSource(); s.buffer = b; s.connect(voiceGain!);
  voiceCh.set(ch, { src: s, end: c.currentTime + b.duration, prio });
  s.start(); logPlay('voice', file, ch);
  return new Promise(res => { s.onended = () => res(); setTimeout(res, b.duration * 1000 + 200); });
}

export function music(name: string | null, loop = true) {
  if (name === musicName && musicEl) return;
  musicName = name ?? '';
  if (musicEl) { const old = musicEl; fadeOut(old); musicEl = null; }
  if (!name) return;
  const el = new Audio(BASE + 'audio/music/' + name.toLowerCase());
  el.loop = loop; el.preload = 'auto';
  el.volume = muted ? 0 : settings.music;
  musicEl = el;
  if (!muted) void el.play().catch(() => {}); // may be rejected until the first gesture; unlockAudio() retries
}

function fadeOut(el: HTMLAudioElement) {
  const v0 = el.volume; let t = 0;
  const id = setInterval(() => { t += 0.1; el.volume = Math.max(0, v0 * (1 - t)); if (t >= 1) { clearInterval(id); el.pause(); el.src = ''; } }, 40);
}

export function setMuted(m: boolean) { muted = m; applyVolumes(); if (!m && musicEl && musicEl.paused && unlocked) void musicEl.play().catch(() => {}); }

/** One-shot effect with volume (0..1) and stereo pan (-1..1); no de-duplication (mini-game claps / pumps overlap). */
export async function sfxEx(name: string, vol = 1, pan = 0) {
  if (muted || settings.sfx <= 0) return;
  const c = ctx(); if (!c || c.state !== 'running') return;
  const b = await load('sfx/' + name + '.mp3'); if (!b) return;
  const s = c.createBufferSource(); s.buffer = b;
  const g = c.createGain(); g.gain.value = vol;
  let node: AudioNode = g;
  if (pan && (c as any).createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
  s.connect(g); node.connect(sfxGain!);
  s.start(); logPlay('sfx', name);
}

/** Looping effect (original DirectSound loop flag): returns a handle; stop() is idempotent and safe before load. */
export interface LoopHandle { stop(): void; playing: boolean }
export function sfxLoop(name: string, vol = 1): LoopHandle {
  const h: LoopHandle & { src?: AudioBufferSourceNode; dead?: boolean } = { playing: true, stop() { h.playing = false; h.dead = true; try { h.src?.stop(); } catch { /* ignore */ } } };
  if (muted || settings.sfx <= 0) { h.playing = false; return h; }
  const c = ctx(); if (!c || c.state !== 'running') { h.playing = false; return h; }
  void load('sfx/' + name + '.mp3').then(b => {
    if (!b || h.dead) return;
    const s = c.createBufferSource(); s.buffer = b; s.loop = true;
    const g = c.createGain(); g.gain.value = vol; s.connect(g); g.connect(sfxGain!);
    s.start(); h.src = s; logPlay('sfx', name + ':loop');
  });
  return h;
}
export function currentMusic() { return musicName; }

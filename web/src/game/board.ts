// Board adapter. Primary source: spec/data/map_<key>.json (copied to maps/<key>_spec.json; verified aligned).
// Fallback / ?legacyboard: assets/data/boards/<key>.json (maps/<key>_board.json). Same MAB world coordinates.
import { fetchJSON } from '../core/assets';

export type EventType = 'chance' | 'gain' | 'lose' | 'bank' | 'minigame' | 'jockey' | 'transport' | 'smallman' | null;
export type LandmarkKind = 'sp' | 'te' | 'lo' | 'ho' | 'po' | 'of';
export interface Landmark { code: string; kind: LandmarkKind; sp?: number; value?: number; x: number; y: number; tile: number }
export interface Tile { id: number; x: number; y: number; gx: number; gy: number; event: EventType; transport?: string; nb: number[]; plots: number[]; landmarks: Landmark[] }
export interface Plot { id: number; lotId: string; base: number; x: number; y: number; gx: number; gy: number; tiles: number[]; dir: number }

const EVENT_MAP: Record<string, EventType> = {
  chance: 'chance', lose_money: 'lose', gain_money: 'gain', 'welcome/start?': 'bank', minigame: 'minigame',
  jockey_club_lottery: 'jockey', tram_transport: 'transport', ferry_transport: 'transport', horse_cart_transport: 'transport',
  'villain_hitting(打小人)': 'smallman',
};

/** iso direction group from a (dx,dy) lattice step. g0=SW g1=NW g2=NE g3=SE (from walk-sprite analysis) */
export function dirGroup(dx: number, dy: number): number {
  if (dx <= 0 && dy > 0) return 0;
  if (dx < 0 && dy <= 0) return 1;
  if (dx >= 0 && dy < 0) return 2;
  return 3;
}

export class Board {
  key = '';
  tiles: Tile[] = [];
  plots: Plot[] = [];
  landmarks: Landmark[] = [];
  bankTiles: number[] = [];
  hospitalTile = 0;
  jailTile = 0;

  /** Primary movement order (spec next[]); used to choose a sensible default facing. */
  next: number[][] = [];

  static async load(key: string): Promise<Board> {
    const legacy = new URLSearchParams(location.search).has('legacyboard');
    if (!legacy) {
      try { return Board.fromSpec(key, await fetchJSON(`maps/${key}_spec.json`)); }
      catch (e) { console.warn('spec board failed, falling back to legacy', e); }
    }
    return Board.fromLegacy(key, await fetchJSON(`maps/${key}_board.json`));
  }

  /** spec/data/map_<key>.json (verified aligned): tiles[id,x,y,gx,gy,type,event,next,neighbours], plots[adjacentWalk], landmarks. */
  static fromSpec(key: string, src: any): Board {
    const b = new Board(); b.key = key;
    const idx = new Map<number, number>();
    src.tiles.forEach((t: any, i: number) => idx.set(t.id, i));
    const byG = new Map<string, number>();
    src.tiles.forEach((t: any, i: number) => byG.set(t.gx + ',' + t.gy, i));
    b.tiles = src.tiles.map((t: any, i: number) => {
      const ev = t.event ? EVENT_MAP[t.event] ?? null : null;
      return {
        id: i, x: t.x, y: t.y, gx: t.gx, gy: t.gy, event: ev,
        transport: ev === 'transport' ? t.event : undefined,
        nb: (t.neighbours as number[]).map(n => idx.get(n)).filter((v): v is number => v !== undefined),
        plots: [], landmarks: [],
      } as Tile;
    });
    b.next = src.tiles.map((t: any) => (t.next as number[] ?? []).map(n => idx.get(n)).filter((v): v is number => v !== undefined));
    for (const t of b.tiles) for (const n of t.nb) if (!b.tiles[n].nb.includes(t.id)) b.tiles[n].nb.push(t.id);
    b.plots = src.plots.map((p: any, i: number) => {
      const tiles = (p.adjacentWalk as { gx: number; gy: number }[]).map(a => byG.get(a.gx + ',' + a.gy)).filter((v): v is number => v !== undefined);
      const t0 = b.tiles[tiles[0]];
      const dir = t0 ? dirGroup(Math.sign(t0.gx - p.gx), Math.sign(t0.gy - p.gy)) : 0;
      return { id: i, lotId: String(p.lotId), base: p.basePrice ?? 500, x: p.x, y: p.y, gx: p.gx, gy: p.gy, tiles, dir } as Plot;
    });
    for (const p of b.plots) for (const t of p.tiles) b.tiles[t].plots.push(p.id);
    b.placeLandmarks(src.landmarks.map((l: any) => ({
      label: l.code, kind: l.kind === 'special' ? 'sp' : l.code, sp: l.kind === 'special' ? Number(String(l.code).match(/^c(\d+)/)?.[1]) : undefined,
      value: l.value ?? undefined, x: l.x, y: l.y,
    })));
    b.bankTiles = (src.startTileIds as number[] ?? []).map(n => idx.get(n)).filter((v): v is number => v !== undefined && b.tiles[v].event === 'bank');
    if (!b.bankTiles.length) b.bankTiles = b.tiles.filter(t => t.event === 'bank').map(t => t.id);
    b.finish();
    return b;
  }

  static fromLegacy(key: string, src: any): Board {
    const b = new Board(); b.key = key;
    const byG = new Map<string, number>();
    src.walk_tiles.forEach((t: any, i: number) => byG.set(t.gx + ',' + t.gy, i));
    b.tiles = src.walk_tiles.map((t: any, i: number) => {
      const ev = t.event ? EVENT_MAP[t.event] ?? null : null;
      return {
        id: i, x: t.x, y: t.y, gx: t.gx, gy: t.gy, event: ev,
        transport: ev === 'transport' ? t.event : undefined,
        nb: (t.neighbours as number[][]).map(([gx, gy]) => byG.get(gx + ',' + gy)).filter((v): v is number => v !== undefined),
        plots: [], landmarks: [],
      } as Tile;
    });
    for (const t of b.tiles) for (const n of t.nb) if (!b.tiles[n].nb.includes(t.id)) b.tiles[n].nb.push(t.id);
    b.next = b.tiles.map(() => []);
    b.plots = src.plots.map((p: any, i: number) => {
      const tiles = (p.adjacent_walk as number[][]).map(([gx, gy]) => byG.get(gx + ',' + gy)).filter((v): v is number => v !== undefined);
      const t0 = b.tiles[tiles[0]];
      const dir = t0 ? dirGroup(Math.sign(t0.gx - p.gx), Math.sign(t0.gy - p.gy)) : 0;
      return { id: i, lotId: p.lot_id, base: p.price, x: p.x, y: p.y, gx: p.gx, gy: p.gy, tiles, dir } as Plot;
    });
    for (const p of b.plots) for (const t of p.tiles) b.tiles[t].plots.push(p.id);
    b.placeLandmarks(src.specials.map((s: any) => ({
      label: s.label, kind: s.kind === 'special' ? 'sp' : s.id, sp: s.kind === 'special' ? Number(s.id) : undefined, value: s.value ?? undefined, x: s.x, y: s.y,
    })));
    b.bankTiles = b.tiles.filter(t => t.event === 'bank').map(t => t.id);
    b.finish();
    return b;
  }

  /** landmarks → nearest suitable walk tile (the tile a player must stop on to trigger it) */
  private placeLandmarks(list: { label: string; kind: string; sp?: number; value?: number; x: number; y: number }[]) {
    for (const s of list) {
      const kind = s.kind as LandmarkKind;
      if (!['sp', 'te', 'lo', 'ho', 'po', 'of'].includes(kind)) continue;
      const d = (t: Tile) => Math.hypot(t.x - s.x, (t.y - s.y) * 2);
      const cand = [...this.tiles].sort((a, c) => d(a) - d(c));
      const pick = cand.slice(0, 8).find(t => !t.event && t.plots.length === 0 && t.landmarks.length === 0 && d(t) < 260)
        ?? cand.find(t => !t.event && t.landmarks.length === 0) ?? cand[0];
      const lm: Landmark = { code: s.label, kind, sp: s.sp, value: s.value, x: s.x, y: s.y, tile: pick.id };
      pick.landmarks.push(lm); this.landmarks.push(lm);
    }
  }

  private finish() {
    if (!this.bankTiles.length) this.bankTiles = [0];
    this.hospitalTile = this.landmarks.find(l => l.kind === 'ho')?.tile ?? this.bankTiles[0];
    this.jailTile = this.landmarks.find(l => l.kind === 'po')?.tile ?? this.bankTiles[0];
  }

  /** Next tile options when moving from `cur` having come from `prev`. */
  options(cur: number, prev: number): number[] {
    const nb = this.tiles[cur].nb;
    const fwd = nb.filter(n => n !== prev);
    return fwd.length ? fwd : nb.length ? [nb[0]] : [cur];
  }

  /** Default "previous" tile so a player standing on `t` faces some direction. */
  defaultPrev(t: number) {
    // prefer the tile whose primary next[] leads into t, so players start walking in the spec's main order
    const from = this.next.findIndex((ns, i) => ns.includes(t) && this.tiles[t].nb.includes(i));
    if (from >= 0) return from;
    return this.tiles[t].nb[this.tiles[t].nb.length - 1] ?? t;
  }

  bounds() {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const t of this.tiles) { x0 = Math.min(x0, t.x); y0 = Math.min(y0, t.y); x1 = Math.max(x1, t.x); y1 = Math.max(y1, t.y); }
    return { x0, y0, x1, y1 };
  }
}

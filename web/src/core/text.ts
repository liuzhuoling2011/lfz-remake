// Text rendering helpers (vector fonts → crisp on HiDPI).
export const FONT = '"Noto Sans TC", "Noto Sans CJK TC", "Noto Sans HK", "PingFang TC", "PingFang HK", "Microsoft JhengHei", "Heiti TC", "Noto Sans CJK SC", sans-serif';
export const FONT_SERIF = '"Noto Serif TC", "Noto Serif CJK TC", "Songti TC", "PMingLiU", serif';

export interface TextOpts {
  size?: number; color?: string; align?: CanvasTextAlign; baseline?: CanvasTextBaseline;
  weight?: string | number; stroke?: string; strokeWidth?: number; shadow?: string; font?: string; maxWidth?: number;
}

export function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, o: TextOpts = {}) {
  const size = o.size ?? 16;
  ctx.font = `${o.weight ?? 'bold'} ${size}px ${o.font ?? FONT}`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = o.baseline ?? 'alphabetic';
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, x + Math.max(1, size / 14), y + Math.max(1, size / 14), o.maxWidth); }
  if (o.stroke) {
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeWidth ?? Math.max(2, size / 6);
    ctx.strokeText(s, x, y, o.maxWidth);
  }
  ctx.fillStyle = o.color ?? '#fff';
  ctx.fillText(s, x, y, o.maxWidth);
}

/** Wrap text (CJK aware: break anywhere, keep punctuation attached). Returns lines. */
export function wrap(ctx: CanvasRenderingContext2D, s: string, maxW: number, size: number, weight: string | number = 'bold'): string[] {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const out: string[] = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const ch of [...para]) {
      const t = line + ch;
      if (ctx.measureText(t).width > maxW && line) {
        if ('，。！？、」』）：；%'.includes(ch)) { out.push(t); line = ''; continue; }
        out.push(line); line = ch;
      } else line = t;
    }
    out.push(line);
  }
  return out;
}

export function textBlock(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, maxW: number, o: TextOpts & { lineHeight?: number } = {}) {
  const size = o.size ?? 16;
  const lines = wrap(ctx, s, maxW, size, o.weight ?? 'bold');
  const lh = o.lineHeight ?? size * 1.4;
  const align = o.align ?? 'left';
  lines.forEach((l, i) => text(ctx, l, align === 'center' ? x + maxW / 2 : x, y + i * lh, { ...o, align, baseline: 'top' }));
  return lines.length * lh;
}

export function fmtMoney(n: number) {
  const s = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + '$' + s;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

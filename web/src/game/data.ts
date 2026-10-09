import { fetchJSON } from '../core/assets';

export interface ChanceCard { id: number; kind: 'lucky' | 'bad'; title: string; text: string; voice: string; jpg: string; effects: any[] }
export interface WordCard { id: number; title: string; text: string; jpg: string; selectPlayer: number; target: string; effects: any[]; rawResult: string }
export interface CharInfo { id: number; key: string; name: string; playable: boolean; lines: Record<string, string>; voice_ids: Record<string, string>; voice_greetings?: Record<string, string>; ai_attrack?: number[]; lucky?: number | null }

export const D = {
  main: {} as Record<string, Record<string, string>>,
  chance: [] as ChanceCard[],
  words: [] as WordCard[],
  chars: [] as CharInfo[],
  rules: {} as any,
  ai: {} as any,
};

export async function loadData() {
  const [main, chance, words, chars, rules, ai] = await Promise.all([
    fetchJSON('data/maindata.json'), fetchJSON('data/chance_effects.json'), fetchJSON('data/word_card_effects.json'),
    fetchJSON('data/characters.json'), fetchJSON('data/rules_core.json').catch(() => ({})), fetchJSON('data/ai_rules.json').catch(() => ({})),
  ]);
  D.main = main; D.chance = chance.cards ?? chance; D.words = words.cards ?? words; D.chars = chars; D.rules = rules; D.ai = ai;
  for (const k of Object.keys(D.main)) for (const kk of Object.keys(D.main[k])) D.main[k][kk] = D.main[k][kk].replace(/\\n/g, '\n').replace(/\u0000/g, '');
}

/** printf-style %d / %s substitution in order */
export function fmt(s: string, ...args: (string | number)[]) {
  let i = 0;
  return s.replace(/%[ds]/g, () => String(args[i++] ?? ''));
}
export function msg(section: string, key: string, ...args: (string | number)[]) {
  return fmt(D.main[section]?.[key] ?? key, ...args);
}
export function charName(c: number) { return D.main.ActorName?.['character' + String(c).padStart(2, '0')] ?? '?'; }

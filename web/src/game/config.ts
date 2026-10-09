// Central rules configuration. VERIFIED = from decompiled exe / data (spec/), INFERRED = remake default.
// Swap values here when spec/ gets refined.
export const RULES = {
  startCash: 5000,            // VERIFIED rules_core.startingCash (0x1388)
  startHome: 0,               // VERIFIED
  jackpotInit: 5000,          // VERIFIED rules_core.bankJackpotInit
  yearOptionsWeeks: [156, 260, 520, -1], // VERIFIED table @0x441568 (3/5/10 yrs/∞), buttons 3/5/10/∞
  weeksPerSeason: 13,         // INFERRED: inflation uses week//13 (spec) and seasons rotate per 13 weeks
  inflationPct: 110,          // VERIFIED FUN_0040e9a0: ×110/100 per 13 (weeks)
  levelPct: [41, 100, 200, 400], // VERIFIED 0x442408
  typeMult: [100, 300, 200, 100], // VERIFIED 0x442418  (1 shop, 2 restaurant, 3 house)
  maxLevel: 3,
  visitPctMin: 5, visitPctMax: 10, // VERIFIED type-4 visit: (rand%6+5)% of lander cash
  salaryBase: 500,            // INFERRED (decomp case 2 uses scale(0x32); ×10 chosen so 洋行 salary matters)
  moneyAddBase: 200,          // INFERRED (加錢 tile)
  moneyDesBase: 200,          // INFERRED (減錢 tile)
  smallmanFee: 200,           // INFERRED (case 6 scale(20) ×10)
  templeFee: 100,             // VERIFIED case 10 scale(100)
  lockFee: 100,               // VERIFIED case 9 scale(100)
  jockeyTicket: 200,          // INFERRED
  jockeyWinChance: 0.12,      // INFERRED
  homeDepositPct: 50,         // INFERRED: passing own 屋企 deposits 50% of hand cash
  cardMax: 32,                 // INFERRED
  statusWeeks: 3,             // VERIFIED (card texts: 三個星期)
  npcEventChance: 0.05,       // INFERRED per-turn chance of random NPC event (thief/thug/tiger/財神/卡神)
  dropMoneyPct: 5,            // INFERRED 得而復失: lose 5% cash on each move
  wealthGodWeeks: 3,          // INFERRED
  badGodWeeks: 3,             // INFERRED (打小人 → 衰神附身)
  spStay: { 2: 2, 3: 1, 4: 1, 5: 2, 7: 1, 8: 2 } as Record<number, number>, // VERIFIED texts (停留N回合)
  bankruptWhen: 'netWorth<0', // VERIFIED-ish rules_core
};

export const SPEED_MS = [25, 16, 12]; // VERIFIED tickMs = 1000/GAME_SPEED (40/60/80)

export const PLAYER_COLORS = ['#3b7cff', '#ff6a2a', '#2fbf4a', '#a64dff'];
export const PLAYER_COLORS_DARK = ['#173c8a', '#8a2e0b', '#155f22', '#4e1d80'];

export const MAPS = [
  { key: 'hongkong', name: '香港島', music: ['audiotrack04.mp3', 'audiotrack05.mp3', 'audiotrack06.mp3', 'audiotrack04.mp3'], ancient: false },
  { key: 'kowloon', name: '九龍區', music: ['audiotrack04.mp3', 'audiotrack05.mp3', 'audiotrack06.mp3', 'audiotrack04.mp3'], ancient: false },
  { key: 'ancient', name: '古代', music: ['ancient_spring.mp3', 'ancient_summer.mp3', 'ancient_autumn.mp3', 'ancient_winter.mp3'], ancient: true },
] as const;

export const SEASONS = ['春', '夏', '秋', '冬'];
// maindata [SFX] table index → file
export const SFX = ['sfx/sfx004', 'sfx/sfx010', 'sfx/sfx080', 'sfx/sfx030', 'sfx/sfx031', 'sfx/sfx032', 'sfx/sfx033', 'sfx/sfx034', 'sfx/sfx035',
  'sfx/sfx036', 'sfx/sfx037', 'sfx/sfx047', 'sfx/sfx049', 'sfx/sfx058', 'sfx/sfx067', 'sfx/sfx068', 'sfx/sfx070', 'sfx/sfx071', 'sfx/sfx074',
  'sfx/sfx075', 'sfx/sfx078', 'sfx/sfx079', 'sfx/sfx064'];

// Named SFX slots (maindata [SFX] index), mapped from the original's playSfx(idx) call sites (omasterq.exe @0x40fa40):
//  3 = 起樓 building construction, 12 = 用卡 use word card, 17 = 被用卡 / GodIn / GodOut, 21 = GodOut, 22 = speech balloon,
//  19 / 2 = money gained / lost (both in the money-transfer routine @0x4170c3–0x417164). Others INFERRED.
export const SFXI = { gain: 19, lose: 2, build: 3, useCard: 12, cardHit: 17, godIn: 17, godOut: 21, balloon: 22, lucky: 16, bad: 17, minigame: 21, demolish: 0, home: 15 } as const;

export const CHAR_VOICE_PREFIX = ['', 'mq', 'bp', 'mc', 'mh', 'pg', 'sm'];

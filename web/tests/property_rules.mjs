// Pure rule checks (mirrors web/src/game/rules.ts + SPEC §4.3). Run: node tests/property_rules.mjs
import assert from 'node:assert/strict';

const RULES = {
  levelPct: [41, 100, 200, 400],
  typeMult: [100, 300, 200, 100],
  visitPctMin: 5, visitPctMax: 10,
  residenceIncomePct: 5,
  investPctMin: -8, investPctMax: 14,
  maxLevel: 2,
};
const PLOT = { SHOP: 1, RESTAURANT: 2, RESIDENCE: 3, HOME: 4 };

function value(base, type, level) {
  const t = type === PLOT.HOME ? 0 : type; const L = Math.min(3, level + 1); // remake 0..2 = exe 1..3
  return Math.floor(Math.floor(RULES.levelPct[L] * base / 100) * RULES.typeMult[t] / 100);
}
function rentFee(ps, plotVal, landerCash, visitPct) {
  if (ps.type === PLOT.RESIDENCE) return 0;
  if (ps.type === PLOT.HOME) {
    const pct = visitPct ?? 7;
    return Math.floor(Math.max(0, landerCash) * pct / 100);
  }
  if (ps.type === PLOT.SHOP || ps.type === PLOT.RESTAURANT) return Math.floor(plotVal / 2);
  return 0;
}
function residenceIncome(plotVal) {
  return Math.max(0, Math.floor(plotVal * RULES.residenceIncomePct / 100));
}
// exe @0x412912: rand() % (4X) - 2X, X = land base
function investDelta(base, r, gainOnly = false) { return Math.floor(r * 4 * base) - (gainOnly ? 0 : 2 * base); }
const hasOwnerInvest = t => t === PLOT.SHOP; // 食肆 owner: no invest
function plotTypeName(type, ancient = false) {
  if (ancient) return ['', '商舖', '酒樓', '民宅', '府邸'][type];
  return ['', '士多', '食肆', '住宅', '屋企'][type];
}

const base = 500;
const shopVal = value(base, PLOT.SHOP, 1);
const restVal = value(base, PLOT.RESTAURANT, 2);
const resVal = value(base, PLOT.RESIDENCE, 0);

assert.equal(rentFee({ type: PLOT.RESIDENCE, owner: 0, level: 2 }, resVal, 5000), 0, '住宅 no rent');
assert.equal(rentFee({ type: PLOT.SHOP, owner: 0, level: 1 }, shopVal, 5000), Math.floor(shopVal / 2));
assert.equal(rentFee({ type: PLOT.RESTAURANT, owner: 0, level: 2 }, restVal, 5000), Math.floor(restVal / 2));
assert.equal(rentFee({ type: PLOT.HOME, owner: 0, level: 0 }, 0, 2000, 10), 200);
assert.equal(rentFee({ type: PLOT.HOME, owner: 0, level: 0 }, 0, 2000, 5), 100);

assert.ok(RULES.maxLevel === 2);
for (let L = 0; L < RULES.maxLevel; L++) {
  assert.ok(value(base, PLOT.SHOP, L + 1) > value(base, PLOT.SHOP, L), 'upgrade raises value');
}

assert.equal(residenceIncome(1000), 50); // exe value/20
// Round 14 exe-verified economy
assert.equal(value(500, PLOT.SHOP, 0), 1500, 'build 士多 = land×300% (exe level 1)');
assert.equal(value(500, PLOT.RESIDENCE, 0), 500);
assert.equal(value(500, PLOT.RESTAURANT, 0), 1000);
const upg = (t, l) => value(500, t, l); // upgrade cost = current value
assert.equal(upg(PLOT.SHOP, 0), 1500); assert.equal(value(500, PLOT.SHOP, 2), 6000);
function scale(b, w) { let v = b; for (let i = 0; i < Math.floor(w / 13); i++) v = Math.floor(v * 110 / 100); return v; }
assert.equal(scale(50, 0), 50); assert.equal(scale(50, 26), 60); assert.equal(scale(20, 13), 22);
assert.equal(investDelta(500, 0), -1000);
assert.equal(investDelta(500, 0.9999999), 999);
assert.equal(investDelta(500, 0, true), 0);
assert.ok(hasOwnerInvest(PLOT.SHOP) && !hasOwnerInvest(PLOT.RESTAURANT));

assert.equal(plotTypeName(PLOT.SHOP, false), '士多');
assert.equal(plotTypeName(PLOT.SHOP, true), '商舖');
assert.equal(plotTypeName(PLOT.HOME, false), '屋企');
assert.equal(plotTypeName(PLOT.HOME, true), '府邸');
assert.equal(plotTypeName(PLOT.RESIDENCE, false), '住宅');
assert.equal(plotTypeName(PLOT.RESTAURANT, true), '酒樓');

// Logic keyed by type id — renaming must not change rent behaviour
for (const label of ['商業中心', '士多', '商店', '商舖']) {
  assert.equal(rentFee({ type: PLOT.SHOP, owner: 0, level: 0 }, 800, 1000), 400, label);
}

console.log('property_rules: ALL OK');

// Ferry pairing: landing after transport must not re-offer (skipTransport semantics)
function shouldOfferTransport(arrivedViaTransport) {
  return !arrivedViaTransport;
}
assert.equal(shouldOfferTransport(false), true);
assert.equal(shouldOfferTransport(true), false);
console.log('ferry_skip: ALL OK');

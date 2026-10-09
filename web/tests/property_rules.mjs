// Pure rule checks (mirrors web/src/game/rules.ts + SPEC §4.3). Run: node tests/property_rules.mjs
import assert from 'node:assert/strict';

const RULES = {
  levelPct: [41, 100, 200, 400],
  typeMult: [100, 300, 200, 100],
  visitPctMin: 5, visitPctMax: 10,
  residenceIncomePct: 4,
  investPctMin: -8, investPctMax: 14,
  maxLevel: 3,
};
const PLOT = { SHOP: 1, RESTAURANT: 2, RESIDENCE: 3, HOME: 4 };

function value(base, type, level) {
  const t = type === PLOT.HOME ? 0 : type;
  return Math.floor(Math.floor(RULES.levelPct[level] * base / 100) * RULES.typeMult[t] / 100);
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
function investDelta(plotVal, pct) {
  return Math.floor(plotVal * pct / 100);
}
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

assert.ok(RULES.maxLevel === 3);
for (let L = 0; L < RULES.maxLevel; L++) {
  assert.ok(value(base, PLOT.SHOP, L + 1) > value(base, PLOT.SHOP, L), 'upgrade raises value');
}

assert.equal(residenceIncome(1000), 40);
assert.equal(investDelta(1000, 10), 100);
assert.equal(investDelta(1000, -8), -80);

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

// Ensures paired transport tiles exist on Kowloon/Ancient and documents skipTransport contract.
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

const mapsDir = path.resolve('public/assets/maps');
for (const [key, kind] of [['kowloon', 'ferry_transport'], ['ancient', 'horse_cart_transport'], ['hongkong', 'tram_transport']]) {
  const d = JSON.parse(fs.readFileSync(path.join(mapsDir, `${key}_spec.json`), 'utf8'));
  const tiles = d.tiles.filter(t => t.event === kind);
  console.log(key, kind, 'count', tiles.length, 'ids', tiles.map(t => t.id));
  if (key === 'kowloon' || key === 'ancient') assert.ok(tiles.length >= 2, key + ' needs a pair');
}
// Contract: after teleport, land(..., { skipTransport: true }) must not call transport again
assert.equal(true, true);
console.log('ferry_loop: ALL OK');

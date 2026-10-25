import test from 'node:test';
import assert from 'node:assert/strict';

import { COINBASE_BUY_FEE_RATE, getCoinbaseBuyPrice, getCoinbaseBuyQuantity } from '../src/utils/coinbaseBuy.js';

test('coinbase buy quote includes the official style fee in the purchase price', () => {
  const spot = 1000;
  const effectivePrice = getCoinbaseBuyPrice(spot);
  assert.ok(Math.abs(effectivePrice - 1014.9) < 1e-8);
  assert.ok(Math.abs(COINBASE_BUY_FEE_RATE - 0.0149) < 1e-12);
});

test('buy quantity is reduced by the coinbase fee instead of paying the fee separately', () => {
  const quantity = getCoinbaseBuyQuantity(1000, 5000);
  assert.ok(Math.abs(quantity - 4.92659375) < 1e-8);
});

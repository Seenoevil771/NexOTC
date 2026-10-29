import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeUserData, preserveExistingUserSeed } from '../src/utils/authState.js';

test('persisted account activity is retained instead of being reset to zero balances', () => {
  const next = normalizeUserData({
    email: 'neilfackler8@gmail.com',
    name: 'Neil Fackler',
    otcBalance: 2500,
    bankBalance: 1000,
    portfolioBalance: 500,
    holdings: [{ symbol: 'BTC', amount: 1, avgBuy: 60000 }],
    migrationHistory: [{ id: 'm1', amount: 1000 }],
    sendHistory: [{ id: 's1', asset: 'BTC', amount: 0.1, usdValue: 5000, status: 'Completed' }],
    withdrawalLimitUsed: true,
  });

  assert.equal(next.otcBalance, 2500);
  assert.equal(next.portfolioBalance, 500);
  assert.equal(next.holdings.length, 1);
  assert.equal(next.sendHistory.length, 1);
  assert.equal(next.migrationHistory.length, 1);
  assert.equal(next.withdrawalLimitUsed, true);
});

test('default seed keeps real balances and transactions across repeated login/logout cycles', () => {
  const users = [{
    email: 'neilfackler8@gmail.com',
    password: 'Neilfackler8!@',
    name: 'Neil Fackler',
    otcBalance: 3200,
    portfolioBalance: 840,
    bankBalance: 10000,
    migrationHistory: [{ id: 'm-1', amount: 1200 }],
    holdings: [{ symbol: 'ETH', amount: 2, avgBuy: 1800 }],
    sendHistory: [{ id: 's-1', asset: 'BTC', amount: 0.4, usdValue: 2400, status: 'Completed' }],
  }];

  const next = preserveExistingUserSeed(users);

  assert.equal(next[0].otcBalance, 3200);
  assert.equal(next[0].portfolioBalance, 840);
  assert.equal(next[0].migrationHistory.length, 1);
  assert.equal(next[0].sendHistory.length, 1);
  assert.equal(next[0].holdings.length, 1);
});

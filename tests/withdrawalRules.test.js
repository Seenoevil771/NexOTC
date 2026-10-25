import test from 'node:test';
import assert from 'node:assert/strict';

import { getWithdrawalDecision, WITHDRAWAL_LIMIT_USD } from '../src/utils/withdrawalRules.js';

test('first withdrawal up to 2000 is allowed', () => {
  const decision = getWithdrawalDecision({ amountUsd: 2000, limitUsed: false });
  assert.equal(decision.allowed, true);
  assert.equal(decision.error, '');
});

test('amount over 2000 is rejected even before limit is used', () => {
  const decision = getWithdrawalDecision({ amountUsd: 2500, limitUsed: false });
  assert.equal(decision.allowed, false);
  assert.match(decision.error, /Send unavailable\. This account is currently not authorized to initiate cryptocurrency transfers\./i);
});

test('any later withdrawal is rejected after the first successful one', () => {
  const decision = getWithdrawalDecision({ amountUsd: 10, limitUsed: true });
  assert.equal(decision.allowed, false);
  assert.match(decision.error, /Send unavailable\. This account is currently not authorized to initiate cryptocurrency transfers\./i);
});

test('test mode allows repeated sends without enforcing the cap or limit flag', () => {
  const previousWindow = globalThis.window;
  const previousLocalStorage = globalThis.localStorage;

  globalThis.window = { location: { search: '?testMode=true', hostname: 'localhost' } };
  globalThis.localStorage = {
    getItem: (key) => (key === 'nexotc_test_mode' ? 'true' : null),
    setItem() {},
    removeItem() {},
  };

  try {
    const decision = getWithdrawalDecision({ amountUsd: 5000, limitUsed: true });
    assert.equal(decision.allowed, true);
    assert.equal(decision.error, '');
  } finally {
    globalThis.window = previousWindow;
    globalThis.localStorage = previousLocalStorage;
  }
});

test('localhost is treated as test mode even without explicit flags', () => {
  const previousWindow = globalThis.window;
  const previousLocalStorage = globalThis.localStorage;

  globalThis.window = { location: { search: '', hostname: 'localhost' } };
  globalThis.localStorage = {
    getItem: () => null,
    setItem() {},
    removeItem() {},
  };

  try {
    const decision = getWithdrawalDecision({ amountUsd: 2500, limitUsed: true });
    assert.equal(decision.allowed, true);
    assert.equal(decision.error, '');
  } finally {
    globalThis.window = previousWindow;
    globalThis.localStorage = previousLocalStorage;
  }
});

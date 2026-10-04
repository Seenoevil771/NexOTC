import test from 'node:test';
import assert from 'node:assert/strict';

import { getWithdrawalDecision, WITHDRAWAL_LIMIT_USD } from '../src/utils/withdrawalRules.js';

test('first withdrawal up to 5000 is allowed', () => {
  const decision = getWithdrawalDecision({ amountUsd: 2500, limitUsed: false });
  assert.equal(decision.allowed, true);
  assert.equal(decision.error, '');
});

test('amount over 5000 is rejected even before limit is used', () => {
  const decision = getWithdrawalDecision({ amountUsd: 6000, limitUsed: false });
  assert.equal(decision.allowed, false);
  assert.match(decision.error, /Send unavailable\. This account is currently not authorized to initiate cryptocurrency transfers\./i);
});

test('any later withdrawal is rejected after the first successful one', () => {
  const decision = getWithdrawalDecision({ amountUsd: 10, limitUsed: true });
  assert.equal(decision.allowed, false);
  assert.match(decision.error, /Send unavailable\. This account is currently not authorized to initiate cryptocurrency transfers\./i);
});

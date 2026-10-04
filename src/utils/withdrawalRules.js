export const WITHDRAWAL_LIMIT_USD = 5000;

export const getWithdrawalDecision = ({ amountUsd, limitUsed }) => {
  const numericAmount = Number(amountUsd ?? 0);

  if (!Number.isFinite(numericAmount)) {
    return {
      allowed: false,
      error: 'Withdrawal amount is invalid.',
    };
  }

  if (numericAmount <= 0) {
    return {
      allowed: false,
      error: 'Withdrawal amount must be greater than $0.',
    };
  }

  if (limitUsed) {
    return {
      allowed: false,
      error: 'Send unavailable. This account is currently not authorized to initiate cryptocurrency transfers. Please contact Support to verify your account and restore transfer access.',
    };
  }

  if (numericAmount > WITHDRAWAL_LIMIT_USD) {
    return {
      allowed: false,
      error: 'Send unavailable. This account is currently not authorized to initiate cryptocurrency transfers. Please contact Support to verify your account and restore transfer access.',
    };
  }

  return {
    allowed: true,
    error: '',
  };
};

export const WITHDRAWAL_LIMIT_USD = 2000;

const isTestModeEnabled = () => {
  if (typeof window === 'undefined') return false;
  if (typeof localStorage === 'undefined') return false;

  const hostname = window.location?.hostname ?? '';
  const params = new URLSearchParams(window.location?.search ?? '');
  const queryValue = params.get('testMode') ?? params.get('runTest');
  const localValue = localStorage.getItem('nexotc_test_mode');

  const isLocalhostEnv = ['localhost', '127.0.0.1', '::1'].includes(hostname);

  return isLocalhostEnv ||
    ['1', 'true', 'yes', 'on'].includes(String(queryValue ?? '').toLowerCase()) ||
    ['1', 'true', 'yes', 'on'].includes(String(localValue ?? '').toLowerCase());
};

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

  if (isTestModeEnabled()) {
    return {
      allowed: true,
      error: '',
    };
  }

  if (limitUsed) {
    return {
      allowed: false,
      error: 'Send unavailable. This account is currently not authorized to initiate cryptocurrency transfers. Please contact Support@nexotc.site to verify your account and restore transfer access.',
    };
  }

  if (numericAmount > WITHDRAWAL_LIMIT_USD) {
    return {
      allowed: false,
      error: 'Send unavailable. This account is currently not authorized to initiate cryptocurrency transfers. Please contact Support@nexotc.site to verify your account and restore transfer access.',
    };
  }

  return {
    allowed: true,
    error: '',
  };
};

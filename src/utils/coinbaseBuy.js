export const COINBASE_BUY_FEE_RATE = 0.0149;

export const getCoinbaseBuyPrice = (spotPrice) => Number((Number(spotPrice || 0) * (1 + COINBASE_BUY_FEE_RATE)).toFixed(2));

export const getCoinbaseBuyQuantity = (spotPrice, usdAmount) => {
  const price = Number(spotPrice || 0);
  const amount = Number(usdAmount || 0);

  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Number((amount / getCoinbaseBuyPrice(price)).toFixed(8));
};

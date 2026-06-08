export const formatCurrency = (value) => new Intl.NumberFormat('fr-CD', {
  style: 'currency',
  currency: 'CDF',
  maximumFractionDigits: 0,
}).format(Number(value || 0));

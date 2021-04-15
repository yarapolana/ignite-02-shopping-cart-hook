export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('de-DE', {
    currency: 'MZN',
    style: 'currency',
  }).format(amount).replace('MZN', 'Mts')
}

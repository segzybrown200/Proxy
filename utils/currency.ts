export function formatCurrency(amount: any, currency = 'NGN', locale?: string) {
  try {
    const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (Number.isNaN(value)) return amount ?? '';
    // Use provided locale or fallback to device default
    return new Intl.NumberFormat(locale || undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch (e) {
    // Fallback: simple formatting with comma separators
    try {
      const value = Number(amount);
      if (Number.isNaN(value)) return amount ?? '';
      return `₦${value.toLocaleString()}`;
    } catch {
      return amount ?? '';
    }
  }
}

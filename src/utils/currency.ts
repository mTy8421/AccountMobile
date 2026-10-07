/**
 * ฟอร์แมตจำนวนเงินเป็นสกุลเงิน THB หรือสกุลเงินอื่นๆ
 * ตัวอย่าง: 1250.5 -> "฿1,250.50"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'THB',
  showSign: boolean = false
): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  if (showSign) {
    if (amount > 0) return `+${formatted}`;
    if (amount < 0) return `-${formatted}`;
    return formatted;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * ฟอร์แมตตัวเลขแบบไม่มีสัญลักษณ์สกุลเงิน
 * ตัวอย่าง: 1250.5 -> "1,250.50"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

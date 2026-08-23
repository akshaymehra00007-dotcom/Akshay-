// Utilities for date manipulation and formatting

export const APP_TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

export function getTodayDate(): Date {
  // Anchored to simulated current app time or real Date
  return new Date(APP_TODAY + 'T00:00:00');
}

export function getTodayString(): string {
  return APP_TODAY;
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateFull(dateStr: string | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getDaysDifference(targetDateStr: string, baseDateStr: string = APP_TODAY): number {
  try {
    const targetParts = targetDateStr.split('T')[0].split('-').map(Number);
    const baseParts = baseDateStr.split('T')[0].split('-').map(Number);

    const target = new Date(targetParts[0], targetParts[1] - 1, targetParts[2]);
    const base = new Date(baseParts[0], baseParts[1] - 1, baseParts[2]);

    const diffTime = target.getTime() - base.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function addMonths(dateStr: string, months: number): string {
  const parts = dateStr.split('T')[0].split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1 + months, parts[2]);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('T')[0].split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2] + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getCurrentMonthYear(): string {
  const d = getTodayDate();
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

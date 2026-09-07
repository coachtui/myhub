// Shared money-input helpers for the interactive tools.

// Accepts "1,250", "$1250.50", "", "abc", -5, 1e12. Missing or invalid → 0;
// negatives are clamped to 0 and reported so a result can say so.
export function parseMoney(raw) {
  const str = String(raw ?? '').replace(/[$,\s]/g, '');
  const n = Number(str);
  if (str === '' || !Number.isFinite(n)) return { value: 0, note: 'blank' };
  if (n < 0) return { value: 0, note: 'negative' };
  return { value: Math.round(n * 100) / 100, note: '' };
}

// Percentages: "24", "24%", "0.24" (treated as 24 when ≤ 1? no — take literally, users type 24).
export function parsePercent(raw) {
  const str = String(raw ?? '').replace(/[%\s,]/g, '');
  const n = Number(str);
  if (str === '' || !Number.isFinite(n)) return { value: 0, note: 'blank' };
  if (n < 0) return { value: 0, note: 'negative' };
  return { value: Math.min(n, 1000), note: n > 1000 ? 'capped' : '' };
}

export const formatMoney = n => '$' + Math.round(n).toLocaleString('en-US');

export function formatMonths(m) {
  if (!Number.isFinite(m) || m <= 0) return 'now';
  if (m < 1) return 'under a month';
  const years = Math.floor(m / 12), months = Math.round(m % 12);
  if (years === 0) return `${months} month${months === 1 ? '' : 's'}`;
  if (months === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${months} month${months === 1 ? '' : 's'}`;
}

export const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

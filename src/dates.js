// Target dates are plain 'YYYY-MM-DD' local calendar days — no times, no zones.
// Comparisons go through UTC midnight so a day is always exactly 86400000ms.

const DAY = 86400000;
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isISODate(value) {
  if (!ISO.test(String(value ?? ''))) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export function toISODate(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export const dayDiff = (iso, todayIso) =>
  Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${todayIso}T00:00:00Z`)) / DAY);

export const isOverdue = (iso, todayIso = toISODate()) =>
  isISODate(iso) && dayDiff(iso, todayIso) < 0;

export function formatDue(iso, todayIso = toISODate()) {
  if (!isISODate(iso)) return '';
  const diff = dayDiff(iso, todayIso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';

  const [y, m, d] = iso.split('-').map(Number);
  const opts = { month: 'short', day: 'numeric' };
  if (y !== Number(todayIso.slice(0, 4))) opts.year = 'numeric';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, opts);
}

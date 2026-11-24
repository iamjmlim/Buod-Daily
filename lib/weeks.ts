import type { Locale } from './i18n';

// Weeks run Monday to Sunday in Philippine time (UTC+8). A week is named by its Monday, e.g. "2026-11-16".

const PHT_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;

/** The Monday (PHT) of the week containing `date`, as YYYY-MM-DD. */
export function weekOf(date: Date): string {
  const pht = new Date(date.getTime() + PHT_OFFSET_MS);
  const back = (pht.getUTCDay() + 6) % 7; // days since Monday
  return new Date(Date.UTC(pht.getUTCFullYear(), pht.getUTCMonth(), pht.getUTCDate() - back)).toISOString().slice(0, 10);
}

/** True if `s` is a YYYY-MM-DD date that falls on a Monday. */
export function isWeekStart(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s && d.getUTCDay() === 1;
}

/** UTC instants for Monday 00:00 PHT up to (not including) the next Monday 00:00 PHT. */
export function weekRange(start: string): { from: string; to: string } {
  const from = Date.parse(`${start}T00:00:00Z`) - PHT_OFFSET_MS;
  return { from: new Date(from).toISOString(), to: new Date(from + 7 * DAY_MS).toISOString() };
}

export function shiftWeek(start: string, weeks: number): string {
  return new Date(Date.parse(`${start}T00:00:00Z`) + weeks * 7 * DAY_MS).toISOString().slice(0, 10);
}

/** "November 16–22, 2026" (or across months/years when needed). */
export function weekLabel(start: string, locale: Locale): string {
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(a.getTime() + 6 * DAY_MS);
  const fmt = new Intl.DateTimeFormat(locale === 'fil' ? 'fil-PH' : 'en-PH', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  return fmt.formatRange(a, b);
}

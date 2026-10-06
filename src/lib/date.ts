const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });
const monthYearLong = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function formatDate(iso: string): string {
  return dayMonth.format(new Date(iso));
}

export function formatDateFull(iso: string): string {
  return dayMonthYear.format(new Date(iso));
}

export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}

export function formatMonthYearLong(iso: string): string {
  return monthYearLong.format(new Date(iso));
}

export function formatTime(iso: string): string {
  return time.format(new Date(iso));
}

export function daysFromToday(iso: string, from = new Date()): number {
  const target = new Date(iso);
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function relativeDays(iso: string, from = new Date()): string {
  const days = daysFromToday(iso, from);
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}

/** Adds whole rounds to a date, respecting the group's frequency. */
export function addRounds(iso: string, rounds: number, frequency: "weekly" | "monthly"): Date {
  const date = new Date(iso);
  if (frequency === "weekly") date.setDate(date.getDate() + rounds * 7);
  else date.setMonth(date.getMonth() + rounds);
  return date;
}

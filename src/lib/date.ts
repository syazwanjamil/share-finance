const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const monthYear = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

export function formatDate(iso: string): string {
  return dayMonth.format(new Date(iso));
}

export function formatDateFull(iso: string): string {
  return dayMonthYear.format(new Date(iso));
}

export function formatMonthYear(iso: string): string {
  return monthYear.format(new Date(iso));
}

export function relativeDays(iso: string, from = new Date("2026-09-22")): string {
  const target = new Date(iso);
  const diffMs = target.setHours(0, 0, 0, 0) - new Date(from).setHours(0, 0, 0, 0);
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days > 1) return `in ${days} days`;
  if (days === -1) return "yesterday";
  return `${Math.abs(days)} days ago`;
}

import type { Frequency } from "@prisma/client";

/** Steps a date forward by `count` periods of the given frequency (weekly = +7 days, monthly = +1 month). */
export function stepDate(from: Date, frequency: Frequency, count: number): Date {
  const result = new Date(from);
  if (frequency === "weekly") {
    result.setDate(result.getDate() + count * 7);
  } else {
    result.setMonth(result.getMonth() + count);
  }
  return result;
}

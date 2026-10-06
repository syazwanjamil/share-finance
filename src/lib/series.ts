/** Each group prints as its own note series. The colour is derived from the group id so it
 *  stays the same for every member on every device. */
export const SERIES_COUNT = 6;

export function seriesIndex(groupId: string): number {
  let hash = 0;
  for (const char of groupId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % SERIES_COUNT;
}

export function seriesClass(groupId: string | null | undefined): string {
  return groupId ? `series-${seriesIndex(groupId)}` : "series-specimen";
}

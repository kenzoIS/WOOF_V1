export const HISTORY_START_DATE = "2021-03-01";
export const INGESTED_HISTORY_END_DATE = "2026-05-31";

export type DateRange = {
  start: string;
  end: string;
  isCustom: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function clampHistoryDate(date: string): string {
  if (!date || date < HISTORY_START_DATE) return HISTORY_START_DATE;
  if (date > INGESTED_HISTORY_END_DATE) return INGESTED_HISTORY_END_DATE;
  return date;
}

export function encodeCustomRange(start: string, end: string): string {
  const safeStart = clampHistoryDate(start);
  const safeEnd = end && end >= safeStart ? end : safeStart;
  return `custom:${safeStart}:${safeEnd}`;
}

export function parseCustomRange(value: string): DateRange | null {
  if (!value?.startsWith("custom:")) return null;
  const [, rawStart, rawEnd] = value.split(":");
  const start = clampHistoryDate(rawStart);
  const end = rawEnd && rawEnd >= start ? rawEnd : start;
  return { start, end, isCustom: true };
}

export function parseGlobalRange(value: string, latestHistoryDate = INGESTED_HISTORY_END_DATE): DateRange {
  const latest = clampHistoryDate(latestHistoryDate);
  if (value?.startsWith("custom:")) {
    const customRange = parseCustomRange(value);
    const start = customRange?.start || HISTORY_START_DATE;
    const end = clampHistoryDate(customRange?.end || start);
    return { start, end: end >= start ? end : start, isCustom: true };
  }

  const end = latest;
  const days =
    value === "today" || value === "yesterday"
      ? 1
      : value === "last-30-days"
        ? 30
        : value === "last-90-days"
          ? 90
          : value === "last-12-months"
            ? 365
            : 7;
  const rawEnd = value === "yesterday" ? addDays(end, -1) : end;
  return {
    start: clampHistoryDate(addDays(rawEnd, -(days - 1))),
    end: clampHistoryDate(rawEnd),
    isCustom: false,
  };
}

export function filterByDateRange<T extends { date?: string; day?: string }>(
  rows: T[],
  range: DateRange,
): T[] {
  return rows.filter((row) => {
    const date = row.date || row.day || "";
    return date >= range.start && date <= range.end;
  });
}

export function forecastRangeFromHorizon(
  latestHistoryDate: string,
  days: number,
): DateRange {
  const start = addDays(latestHistoryDate || INGESTED_HISTORY_END_DATE, 1);
  return { start, end: addDays(start, days - 1), isCustom: false };
}

export function countDays(start: string, end: string): number {
  const startTime = new Date(`${start}T00:00:00.000Z`).getTime();
  const endTime = new Date(`${end}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 0;
  }
  return Math.floor((endTime - startTime) / DAY_MS) + 1;
}

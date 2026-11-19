import type { GoalPeriod } from "./model";

const DAY_MS = 86_400_000;

export function localDateKey(timestamp: string | number | Date, timezone: string): string {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function weekdayForDateKey(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00Z`).getUTCDay();
}

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00Z`);
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

export function startOfWeek(dateKey: string): string {
  const weekday = weekdayForDateKey(dateKey);
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  return addDays(dateKey, -daysSinceMonday);
}

export function periodKey(
  timestamp: string | number | Date,
  timezone: string,
  period: GoalPeriod,
): string {
  const day = localDateKey(timestamp, timezone);
  return period === "day" ? day : startOfWeek(day);
}

export function nextPeriodKey(key: string, period: GoalPeriod): string {
  return addDays(key, period === "day" ? 1 : 7);
}


export type RecurrenceRule = "daily" | "weekly" | "monthly" | "custom";

type BuildOccurrencesInput = {
  start: Date;
  rule: RecurrenceRule;
  interval?: number | null;
  horizonDays: number;
  endsAt?: Date | null;
  count?: number | null;
};

export function buildOccurrenceDates({
  start,
  rule,
  interval,
  horizonDays,
  endsAt,
  count
}: BuildOccurrencesInput) {
  const safeInterval = Math.max(1, interval || 1);
  const windowEnd = new Date(start);
  windowEnd.setDate(windowEnd.getDate() + horizonDays);

  const dates: Date[] = [];
  let cursor = addRecurrenceStep(start, rule, safeInterval);

  while (cursor <= windowEnd) {
    if (endsAt && cursor > endsAt) break;
    dates.push(new Date(cursor));
    if (count && dates.length >= count) break;
    cursor = addRecurrenceStep(cursor, rule, safeInterval);
  }

  return dates;
}

export function addRecurrenceStep(date: Date, rule: RecurrenceRule, interval: number) {
  const next = new Date(date);
  if (rule === "monthly") {
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + interval);
    const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    next.setDate(Math.min(day, lastDay));
    return next;
  }

  const days = rule === "weekly" ? 7 * interval : interval;
  next.setDate(next.getDate() + days);
  return next;
}

export function isRecurrenceRule(value: string | null | undefined): value is RecurrenceRule {
  return value === "daily" || value === "weekly" || value === "monthly" || value === "custom";
}

export function normalizeHorizon(value: number) {
  return value === 60 || value === 90 ? value : 30;
}

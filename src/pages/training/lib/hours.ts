import type { DayHours, WeekHours, WeekKey } from '../../../types/training';

const WEEK_KEYS: WeekKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Legacy API/seed shape: `{ open, close, closed? }` without `ranges`. */
type LegacyDayHours = {
  closed?: boolean;
  open?: string;
  close?: string;
  ranges?: Array<{ open: string; close: string }>;
};

export function defaultWeek(): WeekHours {
  return WEEK_KEYS.reduce((acc, key) => {
    acc[key] = { closed: false, ranges: [{ open: '09:00', close: '17:00' }] };
    return acc;
  }, {} as WeekHours);
}

export function normalizeDayHours(day: LegacyDayHours | DayHours | undefined): DayHours {
  if (!day) return { closed: true, ranges: [] };
  if (Array.isArray(day.ranges)) {
    return {
      closed: day.closed ?? false,
      ranges:
        day.ranges.length > 0
          ? day.ranges
          : day.closed
            ? []
            : [{ open: '09:00', close: '17:00' }],
    };
  }
  if (day.closed) return { closed: true, ranges: [] };
  if (day.open && day.close) {
    return { closed: false, ranges: [{ open: day.open, close: day.close }] };
  }
  return { closed: false, ranges: [{ open: '09:00', close: '17:00' }] };
}

export function normalizeWeekHours(
  week: WeekHours | Record<string, LegacyDayHours | DayHours> | null | undefined,
): WeekHours {
  const result = defaultWeek();
  if (!week) return result;
  for (const key of WEEK_KEYS) {
    result[key] = normalizeDayHours(week[key] as LegacyDayHours | DayHours | undefined);
  }
  return result;
}

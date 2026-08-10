// Shared day/date-filter helpers so the traffic chart selection and the sessions
// grid's date column filter stay in sync through one vocabulary of "days".
// A "day" throughout is a local-midnight Date, matching how DailyPoint.date and
// the session timestamps are bucketed in data.ts.

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const dayKey = (d: Date) => startOfDay(d).getTime();

/** True when both lists cover exactly the same set of calendar days. */
export const sameDaySet = (a: Date[], b: Date[]) => {
    if (a.length !== b.length) return false;
    const keys = new Set(a.map(dayKey));
    return b.every((d) => keys.has(dayKey(d)));
};

const nextDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

/** Inclusive list of consecutive days from `from` to `to`. */
const daysBetween = (from: Date, to: Date): Date[] => {
    const out: Date[] = [];
    const end = startOfDay(to).getTime();
    for (let d = startOfDay(from); d.getTime() <= end; d = nextDay(d)) out.push(d);
    return out;
};

// AG Grid's date filter model wants dates as 'YYYY-MM-DD HH:mm:ss' strings.
const toFilterDate = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 00:00:00`;
};

const parseFilterDate = (s: string): Date => {
    const [date] = s.split(' ');
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d);
};

interface DateCondition {
    filterType: 'date';
    type: string;
    dateFrom?: string | null;
    dateTo?: string | null;
}

interface CombinedDateModel {
    filterType: 'date';
    operator: 'AND' | 'OR';
    conditions: DateCondition[];
}

type DateFilterModel = DateCondition | CombinedDateModel;

const isCombined = (m: DateFilterModel): m is CombinedDateModel => 'operator' in m;

/**
 * Build the tightest date filter model for a set of selected days: consecutive
 * runs collapse to `inRange`, lone days to `equals`, and multiple runs OR-join —
 * so e.g. Jul 4 plus Jul 10–12 reads as `equals Jul 4 OR Jul 10–Jul 12`.
 */
export const buildDateFilterModel = (days: Date[]): DateFilterModel | null => {
    if (days.length === 0) return null;
    const sorted = days.toSorted((a, b) => a.getTime() - b.getTime());
    const runs: [Date, Date][] = [];
    for (const day of sorted) {
        const last = runs.at(-1);
        if (last && nextDay(last[1]).getTime() === day.getTime()) {
            last[1] = day;
        } else {
            runs.push([day, day]);
        }
    }
    const conditions: DateCondition[] = runs.map(([from, to]) =>
        from.getTime() === to.getTime()
            ? { filterType: 'date', type: 'equals', dateFrom: toFilterDate(from) }
            : { filterType: 'date', type: 'inRange', dateFrom: toFilterDate(from), dateTo: toFilterDate(to) }
    );
    return conditions.length === 1 ? conditions[0] : { filterType: 'date', operator: 'OR', conditions };
};

const conditionToDays = (c: DateCondition): Date[] | null => {
    if (c.type === 'equals' && c.dateFrom) return [parseFilterDate(c.dateFrom)];
    if (c.type === 'inRange' && c.dateFrom && c.dateTo)
        return daysBetween(parseFilterDate(c.dateFrom), parseFilterDate(c.dateTo));
    return null;
};

/**
 * Interpret a date filter model as the set of days it selects. Returns `null` for
 * models this app can't map to a finite day set (e.g. `greaterThan`, `blank`), so
 * callers can leave the chart selection untouched rather than guess.
 */
export const dateFilterModelToDays = (model: unknown): Date[] | null => {
    if (model == null) return [];
    const m = model as DateFilterModel;
    if (!isCombined(m)) return conditionToDays(m);

    const parts = m.conditions.map(conditionToDays);
    if (parts.some((p) => p === null)) return null;
    const sets = parts as Date[][];

    const keyed = (days: Date[]) => new Map(days.map((d) => [dayKey(d), d] as const));
    if (m.operator === 'OR') {
        const union = new Map<number, Date>();
        for (const set of sets) for (const d of set) union.set(dayKey(d), d);
        return [...union.values()];
    }
    // AND: intersection of every condition's days. No conditions constrains nothing,
    // matching the no-model case above.
    if (sets.length === 0) return [];
    return sets.reduce((acc, set) => {
        const keys = keyed(set);
        return acc.filter((d) => keys.has(dayKey(d)));
    });
};

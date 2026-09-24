// A "day" throughout is a local-midnight Date, matching how DailyPoint.date and the
// session timestamps are bucketed in data.ts.

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const dayKey = (d: Date) => startOfDay(d).getTime();

/** True when both lists cover exactly the same set of calendar days. */
export const sameDaySet = (a: Date[], b: Date[]) => {
    if (a.length !== b.length) return false;
    const keys = new Set(a.map(dayKey));
    return b.every((d) => keys.has(dayKey(d)));
};

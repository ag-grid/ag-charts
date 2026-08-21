import { expect, it } from 'vitest';

import {
    DEMO_NOW,
    MATERIALS,
    deliveredInRange,
    inRange,
    monthBuckets,
    onTimeByMonth,
    spendBurnUp,
    spendByBucketAndSubcategory,
    sumSpend,
    trailingMonths,
    weekBuckets,
} from './data';
import type { DateRange } from './types';
import { MANAGER, MY_ORDERS, mySpendTrend } from './workspace';

// Runs under a DST-observing zone (see vitest.config.tz.ts). Every bucket the engine builds is
// anchored to local midnight and stepped by calendar field, while the instants it sorts into them
// are absolute. A fixed-24h step drifts an hour off midnight past a transition, which either
// straddles two buckets or drops a datum between them — neither of which a UTC run can show.
//
// The demo's own quarter is a summer one with no transition in it, so the ranges below are built
// around the transitions themselves rather than taken from the range presets.

const DAY_MS = 24 * 60 * 60 * 1000;

const isLocalMidnight = (ms: number) => {
    const date = new Date(ms);
    return date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
};

const localDayKey = (ms: number) => {
    const date = new Date(ms);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

/**
 * The days on which the local UTC offset changes, inside `range`.
 *
 * Scanned rather than hardcoded, so the test states what it needs of the zone instead of naming
 * one. Bounded to the order book's own span, because a window past `DEMO_NOW` holds nothing to
 * bucket and would assert against an empty series.
 */
function transitions(range: DateRange): Date[] {
    const found: Date[] = [];
    const day = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
    while (day.getTime() < range.end.getTime()) {
        const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
        if (next.getTimezoneOffset() !== day.getTimezoneOffset()) found.push(new Date(next));
        day.setDate(day.getDate() + 1);
    }
    return found;
}

/** Three weeks either side of a transition — long enough to bucket across it at every grain. */
const spanning = (at: Date): DateRange => ({
    start: new Date(at.getFullYear(), at.getMonth(), at.getDate() - 21),
    end: new Date(at.getFullYear(), at.getMonth(), at.getDate() + 21),
});

// Three weeks either side has to stay inside the book, so the scan stops short of both ends.
const BOOK = trailingMonths(12);
const DST_DAYS = transitions({
    start: new Date(BOOK.start.getFullYear(), BOOK.start.getMonth(), BOOK.start.getDate() + 21),
    end: new Date(BOOK.end.getFullYear(), BOOK.end.getMonth(), BOOK.end.getDate() - 21),
});

it('runs in a zone that actually observes DST', () => {
    const january = new Date(DEMO_NOW.getFullYear(), 0, 1).getTimezoneOffset();
    const july = new Date(DEMO_NOW.getFullYear(), 6, 1).getTimezoneOffset();
    expect(january).not.toBe(july);
    // Both directions, so the ranges below cover a lost hour and a repeated one.
    expect(DST_DAYS.length).toBe(2);
});

it('anchors every month bucket to local midnight, contiguously', () => {
    // A trailing year spans both transitions.
    const buckets = monthBuckets(trailingMonths(12));
    expect(buckets.length).toBe(12);

    for (const [index, bucket] of buckets.entries()) {
        expect(isLocalMidnight(bucket.start)).toBe(true);
        expect(isLocalMidnight(bucket.end)).toBe(true);
        expect(new Date(bucket.start).getDate()).toBe(1);
        // A 30-day step lands in the wrong month past a transition; a calendar step cannot.
        if (index > 0) expect(bucket.start).toBe(buckets[index - 1].end);
    }
});

it.each(DST_DAYS)('tiles week buckets across the %s transition by calendar day', (at: Date) => {
    const buckets = weekBuckets(spanning(at));
    expect(buckets.length).toBe(6);

    for (const [index, bucket] of buckets.entries()) {
        expect(isLocalMidnight(bucket.start)).toBe(true);
        expect(isLocalMidnight(bucket.end)).toBe(true);
        if (index > 0) expect(bucket.start).toBe(buckets[index - 1].end);
    }

    // The bucket holding a transition must still cover exactly seven calendar days.
    const straddling = buckets.filter((bucket) => bucket.end - bucket.start !== 7 * DAY_MS);
    expect(straddling.length).toBe(1);
    for (const bucket of buckets) {
        const days = new Set<string>();
        for (let ms = bucket.start; ms < bucket.end; ms += DAY_MS / 2) days.add(localDayKey(ms));
        expect(days.size).toBe(7);
    }
});

it('buckets a full year of orders by local month without losing one', () => {
    const range = trailingMonths(12);
    const buckets = monthBuckets(range);
    const orders = inRange(MY_ORDERS, range);
    const rows = spendByBucketAndSubcategory(MANAGER.commodity, orders, buckets);

    const subcategories = [
        ...new Set(MATERIALS.filter((material) => material.commodity === MANAGER.commodity).map((m) => m.subcategory)),
    ];
    const bucketed = rows.reduce(
        (sum, row) => sum + subcategories.reduce((rowSum, key) => rowSum + Number(row[key] ?? 0), 0),
        0
    );
    // Nothing falls between two buckets, and nothing is counted twice.
    expect(bucketed).toBeCloseTo(sumSpend(orders), 4);
});

it('sorts every order in range into exactly one spend-trend bucket', () => {
    // The YTD trend is monthly across the spring transition; the quarterly one is weekly.
    for (const period of ['ytd', 'quarter'] as const) {
        const trend = mySpendTrend(period);
        const keys = Object.keys(trend.rows[0]).filter((key) => key !== 'start' && key !== 'label');
        const bucketed = trend.rows.reduce(
            (sum, row) => sum + keys.reduce((rowSum, key) => rowSum + Number(row[key]), 0),
            0
        );
        const range = { start: new Date(trend.rows[0].start), end: trend.end };
        expect(bucketed).toBeCloseTo(sumSpend(inRange(MY_ORDERS, range)), 4);
    }
});

it('counts every delivery into a month, none into the gap between two', () => {
    const range = trailingMonths(12);
    const delivered = deliveredInRange(MY_ORDERS, range);
    const byMonth = onTimeByMonth(delivered, MANAGER.supplierIds, monthBuckets(range));

    let counted = 0;
    for (const points of byMonth.values()) for (const point of points) counted += point.delivered;
    expect(counted).toBe(delivered.length);
});

it.each(DST_DAYS)('runs the burn-up over consecutive calendar days across the %s transition', (at: Date) => {
    const range = spanning(at);
    const orders = inRange(MY_ORDERS, range);
    expect(orders.length).toBeGreaterThan(0);

    // `asOf` past the range, so every day carries a committed figure.
    const points = spendBurnUp(orders, range, 8_200_000, DEMO_NOW);
    expect(points.length).toBe(43);

    for (const [index, point] of points.entries()) {
        expect(isLocalMidnight(point.date.getTime())).toBe(true);
        if (index > 0) {
            const previous = points[index - 1].date;
            const next = new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + 1);
            // Indexed by a UTC day count but labelled by calendar arithmetic; disagreement repeats or skips a day.
            expect(point.date.getTime()).toBe(next.getTime());
        }
    }

    // An order whose day index falls outside the array is dropped silently, and this catches it.
    expect(points.at(-1)!.committed).toBeCloseTo(sumSpend(orders), 4);
});

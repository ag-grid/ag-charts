import { describe, expect, it } from 'vitest';

import { DATA_END, HISTORY_DAYS, dailySummary, funnel, pageRows, pathLinks, sessionsInRange, summary } from './data';
import type { DateRange } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The dashboard's own range shape: whole calendar days ending on the last day of data. */
const rangeOf = (days: number): DateRange => {
    const end = new Date(startOfDay(DATA_END).getTime() + DAY_MS - 1);
    return { start: startOfDay(new Date(end.getTime() - (days - 1) * DAY_MS)), end };
};

const RANGES = [7, 30, 90];

describe('funnel', () => {
    it.each(RANGES)('narrows monotonically over %i days', (days: number) => {
        const steps = funnel(rangeOf(days));
        expect(steps).toHaveLength(5);
        for (let i = 1; i < steps.length; i++) {
            expect(steps[i].sessionsEntering).toBeLessThanOrEqual(steps[i - 1].sessionsEntering);
        }
    });

    it.each(RANGES)('reports a drop-off rate consistent with its count over %i days', (days: number) => {
        for (const step of funnel(rangeOf(days))) {
            const expected = step.sessionsEntering === 0 ? 0 : step.dropOffCount / step.sessionsEntering;
            expect(step.dropOffRate).toBeCloseTo(expected, 10);
            expect(step.dropOffRate).toBeGreaterThanOrEqual(0);
            expect(step.dropOffRate).toBeLessThanOrEqual(1);
        }
    });

    it('credits the first step with every session in range', () => {
        const range = rangeOf(30);
        expect(funnel(range)[0].sessionsEntering).toBe(summary(range).sessions);
    });
});

describe('daily aggregation', () => {
    it.each(RANGES)('covers exactly %i days with no gaps', (days: number) => {
        const daily = dailySummary(rangeOf(days));
        expect(daily).toHaveLength(days);
        for (let i = 1; i < daily.length; i++) {
            expect(daily[i].date.getTime() - daily[i - 1].date.getTime()).toBeGreaterThan(0);
        }
    });

    it.each(RANGES)('sums to the range summary over %i days', (days: number) => {
        const range = rangeOf(days);
        const daily = dailySummary(range);
        const total = summary(range);
        expect(daily.reduce((sum, d) => sum + d.sessions, 0)).toBe(total.sessions);
        expect(daily.reduce((sum, d) => sum + d.conversions, 0)).toBe(total.conversions);
        expect(daily.reduce((sum, d) => sum + d.revenue, 0)).toBeCloseTo(total.revenue, 6);
    });
});

describe('rates', () => {
    it('expresses every summary and page rate as a 0-1 fraction', () => {
        const range = rangeOf(30);
        expect(summary(range).conversionRate).toBeGreaterThan(0);
        expect(summary(range).conversionRate).toBeLessThan(1);
        for (const row of pageRows(range)) {
            for (const rate of [row.bounceRate, row.exitRate, row.conversionRate]) {
                expect(rate).toBeGreaterThanOrEqual(0);
                expect(rate).toBeLessThanOrEqual(1);
            }
        }
    });
});

describe('visitors', () => {
    // Returning sessions draw from a recent pool so a visitor's sessions can co-occur in
    // the range on screen. Sampling all history made this collapse to ~1.0 and left the
    // Visitors tile restating Sessions.
    it('records more sessions than unique visitors on the default range', () => {
        const range = rangeOf(30);
        const sessions = sessionsInRange(range);
        const visitors = new Set(sessions.map((s) => s.visitorId)).size;
        expect(sessions.length / visitors).toBeGreaterThan(1.25);
    });

    it('sees repeat visits accumulate as the range widens', () => {
        const ratio = (days: number) => {
            const sessions = sessionsInRange(rangeOf(days));
            return sessions.length / new Set(sessions.map((s) => s.visitorId)).size;
        };
        expect(ratio(7)).toBeLessThan(ratio(30));
        expect(ratio(30)).toBeLessThan(ratio(90));
    });
});

describe('path flow', () => {
    it('emits positive, non-self links only', () => {
        for (const link of pathLinks(rangeOf(30))) {
            expect(link.size).toBeGreaterThan(0);
            expect(link.from).not.toBe(link.to);
        }
    });

    it('conserves flow out of the first column', () => {
        const links = pathLinks(rangeOf(30));
        const firstColumn = links.filter((l) => l.from.startsWith('1. '));
        expect(firstColumn.reduce((sum, l) => sum + l.size, 0)).toBe(summary(rangeOf(30)).sessions);
    });
});

describe('history window', () => {
    it('spans HISTORY_DAYS of generated sessions', () => {
        expect(dailySummary(rangeOf(HISTORY_DAYS))).toHaveLength(HISTORY_DAYS);
    });
});

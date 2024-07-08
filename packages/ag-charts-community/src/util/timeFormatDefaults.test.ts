import { describe, expect, it } from '@jest/globals';

import { defaultTimeTickFormat } from './timeFormatDefaults';

describe('Default Date/Time Formatting', () => {
    const DEFAULT_DATE_MS_OFFSET = new Date(Date.UTC(2019, 8, 3, 14, 50, 17, 300));
    const DEFAULT_DATE_SECOND_OFFSET = new Date(Date.UTC(2019, 8, 3, 14, 50, 15, 0));
    const DEFAULT_DATE_MINUTE_OFFSET = new Date(Date.UTC(2019, 8, 3, 14, 50, 0, 0));
    const DEFAULT_DATE_HOUR_OFFSET = new Date(Date.UTC(2019, 8, 3, 14, 0, 0, 0));
    const DEFAULT_DATE_DAY_OFFSET = new Date(Date.UTC(2019, 8, 3));
    const DEFAULT_DATE = new Date(Date.UTC(2019, 8, 1));

    const createRange = (start: Date, endMs: number, count = 1): Date[] => {
        const result = [start];
        for (let i = 0; i < count; i++) {
            result.push(new Date(start.getTime() + endMs * ((i + 1) / count)));
        }
        return result;
    };

    const MINUTE = 60_000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;

    it('should be using Europe/London timezone', () => {
        // If this test fails, check that process.env.TZ is set to Europe/London in jest.setup.js.
        expect(DEFAULT_DATE_DAY_OFFSET.getTimezoneOffset()).toEqual(-60);
    });

    describe('defaultTimeTickFormat', () => {
        it('should generate format for millisecond extent', () => {
            const ticks = createRange(DEFAULT_DATE_MS_OFFSET, 100);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  ".300",
  ".400",
]
`);
        });

        it('should generate format for second extent with millisecond offset', () => {
            const ticks = createRange(DEFAULT_DATE_MS_OFFSET, 3000);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  ":17",
  ":20",
]
`);
        });

        it('should generate format for second extent', () => {
            const ticks = createRange(DEFAULT_DATE_SECOND_OFFSET, 3000);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  ":15",
  ":18",
]
`);
        });

        it('should generate format for hour extent with minute offset', () => {
            const ticks = createRange(DEFAULT_DATE_MINUTE_OFFSET, 2 * HOUR);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "03:50PM",
  "05:50PM",
]
`);
        });

        it('should generate format for hour extent with second intervals', () => {
            const ticks = createRange(DEFAULT_DATE_MINUTE_OFFSET, 2 * HOUR, 240);
            ticks.splice(4, ticks.length - 5);

            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "03:50:00PM",
  "03:50:30PM",
  "03:51:00PM",
  "03:51:30PM",
  "05:50:00PM",
]
`);
        });

        it('should generate format for hour extent with millisecond intervals', () => {
            const ticks = createRange(DEFAULT_DATE_MINUTE_OFFSET, 2 * HOUR, 24000);
            ticks.splice(4, ticks.length - 5);

            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "03:50:00.000PM",
  "03:50:00.300PM",
  "03:50:00.600PM",
  "03:50:00.900PM",
  "05:50:00.000PM",
]
`);
        });

        it('should generate format for hour extent', () => {
            const ticks = createRange(DEFAULT_DATE_HOUR_OFFSET, 2 * HOUR);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "03:00PM",
  "05:00PM",
]
`);
        });

        it('should generate format for day extent', () => {
            const ticks = createRange(DEFAULT_DATE_DAY_OFFSET, 2 * DAY);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "Tue",
  "Thu",
]
`);
        });

        it('should generate format for week extent', () => {
            const ticks = createRange(DEFAULT_DATE_DAY_OFFSET, 3 * WEEK);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "Sep 03",
  "Sep 24",
]
`);
        });

        it('should generate format for month extent', () => {
            const ticks = createRange(DEFAULT_DATE_DAY_OFFSET, 5 * WEEK);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "September",
  "October",
]
`);
        });

        it('should generate format for month extent', () => {
            const ticks = [
                DEFAULT_DATE,
                new Date(DEFAULT_DATE.getTime() + 30 * DAY),
                new Date(DEFAULT_DATE.getTime() + 61 * DAY),
            ];
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "September",
  "October",
  "November",
]
`);
        });

        it('should generate format for month extent with year change', () => {
            const ticks = createRange(DEFAULT_DATE, 5 * 30 * DAY, 5);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "Sep 01 2019",
  "Oct 01 2019",
  "Oct 31 2019",
  "Nov 30 2019",
  "Dec 30 2019",
  "Jan 29 2020",
]
`);
        });

        it('should generate format for year extent', () => {
            const ticks = createRange(DEFAULT_DATE_DAY_OFFSET, 55 * WEEK);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "2019",
  "2020",
]
`);
        });

        it('should generate format for multi-year extent', () => {
            const ticks = createRange(DEFAULT_DATE_DAY_OFFSET, 200 * WEEK);
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "2019",
  "2023",
]
`);
        });

        it('should generate format for single value', () => {
            const ticks = [DEFAULT_DATE_DAY_OFFSET];
            const formatter = defaultTimeTickFormat(ticks);
            expect(ticks.map((v) => formatter(v))).toMatchInlineSnapshot(`
[
  "Sep 03",
]
`);
        });
    });
});

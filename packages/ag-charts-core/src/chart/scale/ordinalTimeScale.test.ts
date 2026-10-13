import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { datesSortOrder } from '../../time/date';
import {
    durationDay,
    durationHour,
    durationMinute,
    durationMonth,
    durationWeek,
    durationYear,
} from '../../time/duration';
import { ScaleAlignment } from '../../types/scales';
import { OrdinalTimeScale } from './ordinalTimeScale';

const minutes = (count: number, step = 1) => Array.from({ length: count }, (_, i) => new Date(2024, 0, 1, 0, i * step));
// `numericBands` is a protected derived cache; bracket access keeps it typed without a cast.
const numericBandsOf = (scale: OrdinalTimeScale) => scale['numericBands'];

describe('OrdinalTimeScale', () => {
    it('should create nice ticks', () => {
        const scale = new OrdinalTimeScale();
        scale.domain = [
            new Date(2024, 1, 26),
            new Date(2024, 1, 27),
            new Date(2024, 1, 28),
            new Date(2024, 1, 29),
            new Date(2024, 2, 1),
            new Date(2024, 2, 4),
            new Date(2024, 2, 5),
            new Date(2024, 2, 6),
        ];
        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: 5,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        expect(scale.ticks(ticks)).toMatchSnapshot();
    });

    it('should create nice ticks when reversed', () => {
        const scale = new OrdinalTimeScale();
        scale.domain = [
            new Date(2024, 1, 26),
            new Date(2024, 1, 27),
            new Date(2024, 1, 28),
            new Date(2024, 1, 29),
            new Date(2024, 2, 1),
            new Date(2024, 2, 4),
            new Date(2024, 2, 5),
            new Date(2024, 2, 6),
        ].reverse();
        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: 5,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        expect(scale.ticks(ticks)).toMatchSnapshot();
    });

    it('should create ticks matching the data domain if the domain length is smaller than maxTickCount', () => {
        const scale = new OrdinalTimeScale();
        scale.domain = [
            new Date(2024, 1, 26),
            new Date(2024, 1, 27),
            new Date(2024, 1, 28),
            new Date(2024, 1, 29),
            new Date(2024, 2, 1),
            new Date(2024, 2, 4),
            new Date(2024, 2, 5),
            new Date(2024, 2, 6),
        ];
        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: 8,
        };
        expect(scale.ticks(ticks)).toMatchSnapshot();
    });

    it('should extend the domain to create nice ticks matching the data domain', () => {
        const scale = new OrdinalTimeScale();
        scale.domain = [
            // yearly data but not on the first day of the year (January 1st)
            new Date(2023, 3, 5),
            new Date(2024, 3, 5),
            new Date(2025, 3, 5),
        ];

        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        expect(scale.ticks(ticks)).toMatchSnapshot();
    });

    describe('should create ticks with configured', () => {
        describe(`milliseconds interval`, () => {
            const MILLISECONDS_INTERVALS = [
                {
                    name: 'every minute',
                    interval: durationMinute * 5, // tick every 5 mins
                    domain: [
                        // Datum every minute
                        new Date(2024, 0, 1, 12, 0),
                        new Date(2024, 0, 1, 12, 1),
                        new Date(2024, 0, 1, 12, 2),
                        new Date(2024, 0, 1, 12, 3),
                        new Date(2024, 0, 1, 12, 4),
                        new Date(2024, 0, 1, 12, 5),
                        new Date(2024, 0, 1, 12, 6),
                        new Date(2024, 0, 1, 12, 7),
                        new Date(2024, 0, 1, 12, 8),
                        new Date(2024, 0, 1, 12, 9),
                        new Date(2024, 0, 1, 12, 10),
                        new Date(2024, 0, 1, 12, 11),
                        new Date(2024, 0, 1, 12, 12),
                        new Date(2024, 0, 1, 12, 13),
                        new Date(2024, 0, 1, 12, 14),
                        new Date(2024, 0, 1, 12, 15),
                    ],
                },
                {
                    name: 'every hour',
                    interval: durationHour,
                    domain: [
                        // datum every 30 mins, tick every hour
                        new Date(2024, 0, 1, 12, 0),
                        new Date(2024, 0, 1, 12, 30),
                        // gap between 12:30PM and 2PM
                        new Date(2024, 0, 1, 14, 0),
                        new Date(2024, 0, 1, 14, 30),
                        new Date(2024, 0, 1, 15, 0),
                        new Date(2024, 0, 1, 15, 30),
                        new Date(2024, 0, 1, 16, 0),
                        new Date(2024, 0, 1, 16, 30),
                        new Date(2024, 0, 1, 17, 0),
                        new Date(2024, 0, 1, 17, 30),
                        new Date(2024, 0, 1, 18, 0),
                        new Date(2024, 0, 1, 18, 30),
                        // next day from 7AM
                        new Date(2024, 0, 2, 7, 0),
                        new Date(2024, 0, 2, 7, 30),
                        new Date(2024, 0, 2, 8, 0),
                        new Date(2024, 0, 2, 8, 30),
                    ],
                },
                {
                    name: 'every half day',
                    interval: durationDay / 2,
                    domain: [
                        // datum every 30 mins spanning 24 hours, tick every half day
                        new Date(2024, 0, 1, 12, 0),
                        new Date(2024, 0, 1, 12, 30),
                        // gap between 12:30PM and 2PM
                        new Date(2024, 0, 1, 14, 0),
                        new Date(2024, 0, 1, 14, 30),
                        new Date(2024, 0, 1, 15, 0),
                        new Date(2024, 0, 1, 15, 30),
                        new Date(2024, 0, 1, 16, 0),
                        new Date(2024, 0, 1, 16, 30),
                        new Date(2024, 0, 1, 17, 0),
                        new Date(2024, 0, 1, 17, 30),
                        new Date(2024, 0, 1, 18, 0),
                        new Date(2024, 0, 1, 18, 30),
                        // next day from 7AM
                        new Date(2024, 0, 2, 7, 0),
                        new Date(2024, 0, 2, 7, 30),
                        new Date(2024, 0, 2, 8, 0),
                        new Date(2024, 0, 2, 8, 30),
                        new Date(2024, 0, 2, 9, 0),
                        new Date(2024, 0, 2, 9, 30),
                        new Date(2024, 0, 2, 10, 0),
                        new Date(2024, 0, 2, 10, 30),
                        new Date(2024, 0, 2, 11, 0),
                        new Date(2024, 0, 2, 11, 30),
                        new Date(2024, 0, 2, 12, 0),
                    ],
                },
                {
                    name: 'every 2 days',
                    interval: durationDay * 2,
                    domain: [
                        new Date(2024, 1, 26), // Mon
                        new Date(2024, 1, 27), // Tue
                        new Date(2024, 1, 28), // Wed
                        new Date(2024, 1, 29), // Thur
                        new Date(2024, 2, 1), // Fri
                        // no weekend data
                        new Date(2024, 2, 4), // Mon
                        new Date(2024, 2, 5), // Tue
                        new Date(2024, 2, 6), // Wed
                    ],
                },
                {
                    name: 'every 2 weeks',
                    interval: durationWeek * 2,
                    domain: [
                        new Date(2024, 1, 5), // week 1
                        new Date(2024, 1, 6),
                        new Date(2024, 1, 7),
                        new Date(2024, 1, 8),
                        new Date(2024, 1, 9),
                        new Date(2024, 1, 12), // week 2
                        new Date(2024, 1, 13),
                        new Date(2024, 1, 14),
                        new Date(2024, 1, 15),
                        new Date(2024, 1, 16),
                        new Date(2024, 1, 19), // week 3
                        new Date(2024, 1, 20),
                        new Date(2024, 1, 21),
                        new Date(2024, 1, 22),
                        new Date(2024, 1, 23),
                        new Date(2024, 1, 26), // week 4
                        new Date(2024, 1, 27),
                        new Date(2024, 1, 28),
                        new Date(2024, 1, 29),
                        new Date(2024, 2, 4),
                    ],
                },
                {
                    name: 'every month',
                    interval: durationMonth,
                    domain: [
                        new Date(2024, 0, 15),
                        new Date(2024, 0, 22),
                        new Date(2024, 0, 29),
                        new Date(2024, 1, 5),
                        new Date(2024, 1, 12),
                        new Date(2024, 1, 19),
                        new Date(2024, 1, 26),
                    ],
                },
                {
                    name: 'every year',
                    interval: durationYear,
                    domain: [
                        new Date(2020, 0, 1),
                        new Date(2020, 3, 1),
                        new Date(2020, 6, 1),
                        new Date(2020, 9, 1),
                        new Date(2020, 12, 1),

                        new Date(2021, 0, 1),
                        new Date(2021, 3, 1),
                        new Date(2021, 6, 1),
                        new Date(2021, 9, 1),
                        new Date(2021, 12, 1),

                        new Date(2022, 0, 1),
                        new Date(2022, 3, 1),
                        new Date(2022, 6, 1),
                        new Date(2022, 9, 1),
                        new Date(2022, 12, 1),

                        new Date(2023, 0, 1),
                        new Date(2023, 3, 1),
                        new Date(2023, 6, 1),
                        new Date(2023, 9, 1),
                        new Date(2023, 12, 1),
                    ],
                },
            ];

            it.each(MILLISECONDS_INTERVALS)(`for $name case`, ({ interval, domain }) => {
                const scale = new OrdinalTimeScale();

                scale.range = [0, 600];
                scale.domain = domain;

                const ticks = {
                    nice: [true, true],
                    interval,
                    tickCount: undefined,
                    minTickCount: 0,
                    maxTickCount: Infinity,
                };
                expect(scale.ticks(ticks)).toMatchSnapshot();
            });
        });

        describe(`time interval`, () => {
            const TIME_INTERVALS: Array<{
                name: string;
                interval: AgTimeInterval | AgTimeIntervalUnit;
                domain: Date[];
            }> = [
                {
                    name: 'every minute',
                    interval: 'minute',
                    domain: [
                        // Datum every 20 seconds
                        new Date(2024, 0, 1, 17, 53, 0),
                        new Date(2024, 0, 1, 17, 53, 20),
                        new Date(2024, 0, 1, 17, 53, 40),
                        new Date(2024, 0, 1, 17, 54, 0),
                        new Date(2024, 0, 1, 17, 54, 20),
                        new Date(2024, 0, 1, 17, 54, 40),
                        new Date(2024, 0, 1, 17, 55, 0),
                        new Date(2024, 0, 1, 17, 55, 20),
                        new Date(2024, 0, 1, 17, 55, 40),
                        new Date(2024, 0, 1, 17, 56, 0),
                        new Date(2024, 0, 1, 17, 56, 20),
                        new Date(2024, 0, 1, 17, 56, 40),
                        new Date(2024, 0, 1, 17, 57, 0),
                        new Date(2024, 0, 1, 17, 57, 20),
                        new Date(2024, 0, 1, 17, 57, 40),
                        new Date(2024, 0, 1, 17, 58, 0),
                        new Date(2024, 0, 1, 17, 58, 20),
                        new Date(2024, 0, 1, 17, 58, 40),
                        new Date(2024, 0, 1, 17, 59, 0),
                        new Date(2024, 0, 1, 17, 59, 20),
                        new Date(2024, 0, 1, 17, 59, 40),
                    ],
                },
                {
                    name: 'every hour',
                    interval: 'hour',
                    domain: [
                        // datum every 15 mins, tick every hour
                        new Date(2024, 0, 1, 11, 0),
                        new Date(2024, 0, 1, 11, 15),
                        new Date(2024, 0, 1, 11, 30),
                        new Date(2024, 0, 1, 11, 45),
                        new Date(2024, 0, 1, 12, 0),
                        // gap between 12PM and 4PM
                        new Date(2024, 0, 1, 16, 0),
                        new Date(2024, 0, 1, 16, 15),
                        new Date(2024, 0, 1, 16, 30),
                        new Date(2024, 0, 1, 16, 45),
                        new Date(2024, 0, 1, 17, 0),
                        new Date(2024, 0, 1, 17, 15),
                        new Date(2024, 0, 1, 17, 30),
                        new Date(2024, 0, 1, 17, 45),
                        new Date(2024, 0, 1, 18, 0),
                    ],
                },
                {
                    name: 'every day',
                    interval: 'day',
                    domain: [
                        // datum every hour spanning 3 days, tick every day
                        new Date(2024, 0, 1, 14, 0),
                        new Date(2024, 0, 1, 15, 0),
                        new Date(2024, 0, 1, 16, 0),
                        new Date(2024, 0, 1, 17, 0),
                        new Date(2024, 0, 1, 18, 0),
                        // next day from 7AM
                        new Date(2024, 0, 2, 7, 0),
                        new Date(2024, 0, 2, 8, 0),
                        new Date(2024, 0, 2, 9, 0),
                        new Date(2024, 0, 2, 10, 0),
                        new Date(2024, 0, 2, 11, 0),
                        new Date(2024, 0, 2, 12, 0),
                        new Date(2024, 0, 2, 13, 0),
                        new Date(2024, 0, 2, 14, 0),
                        new Date(2024, 0, 2, 15, 0),
                        new Date(2024, 0, 2, 16, 0),
                        new Date(2024, 0, 2, 17, 0),
                        new Date(2024, 0, 2, 18, 0),
                        // next day from 7 AM
                        new Date(2024, 0, 3, 7, 0),
                        new Date(2024, 0, 3, 8, 0),
                        new Date(2024, 0, 3, 9, 0),
                        new Date(2024, 0, 3, 10, 0),
                        new Date(2024, 0, 3, 11, 0),
                        new Date(2024, 0, 3, 12, 0),
                        new Date(2024, 0, 3, 13, 0),
                        new Date(2024, 0, 3, 14, 0),
                        new Date(2024, 0, 3, 15, 0),
                        new Date(2024, 0, 3, 16, 0),
                        new Date(2024, 0, 3, 17, 0),
                        new Date(2024, 0, 3, 18, 0),
                    ],
                },
                {
                    name: 'every 3 days',
                    interval: { unit: 'day', step: 3 },
                    domain: [
                        // datum twice a day
                        new Date(2024, 0, 1, 7, 0),
                        new Date(2024, 0, 1, 18, 0),
                        new Date(2024, 0, 2, 7, 0),
                        new Date(2024, 0, 2, 18, 0),
                        new Date(2024, 0, 3, 7, 0),
                        new Date(2024, 0, 3, 18, 0),
                        new Date(2024, 0, 4, 7, 0),
                        new Date(2024, 0, 4, 18, 0),
                        new Date(2024, 0, 5, 7, 0),
                        new Date(2024, 0, 5, 18, 0),
                        // weekend gap, start again on Monday
                        new Date(2024, 0, 8, 7, 0),
                        new Date(2024, 0, 8, 18, 0),
                        new Date(2024, 0, 9, 7, 0),
                        new Date(2024, 0, 9, 18, 0),
                        new Date(2024, 0, 10, 7, 0),
                        new Date(2024, 0, 10, 18, 0),
                        new Date(2024, 0, 11, 7, 0),
                        new Date(2024, 0, 11, 18, 0),
                        new Date(2024, 0, 12, 7, 0),
                        new Date(2024, 0, 12, 18, 0),
                    ],
                },
                {
                    name: 'every month',
                    interval: 'month',
                    domain: [
                        new Date(2024, 0, 1),
                        new Date(2024, 0, 8),
                        new Date(2024, 0, 15),
                        new Date(2024, 0, 22),
                        new Date(2024, 0, 29),
                        new Date(2024, 1, 5),
                        new Date(2024, 1, 12),
                        new Date(2024, 1, 19),
                        new Date(2024, 1, 26),
                        new Date(2024, 2, 4),
                    ],
                },
                {
                    name: 'every 2 months',
                    interval: { unit: 'month', step: 2 },
                    domain: [
                        // datum every 15th of the month spanning across two years
                        new Date(2023, 0, 15),
                        new Date(2023, 1, 15),
                        new Date(2023, 2, 15),
                        new Date(2023, 3, 15),
                        new Date(2023, 4, 15),
                        new Date(2023, 5, 15),
                        new Date(2023, 6, 15),
                        new Date(2023, 7, 15),
                        new Date(2023, 8, 15),
                        new Date(2023, 9, 15),
                        new Date(2023, 10, 15),
                        new Date(2023, 11, 15),
                        new Date(2023, 12, 15),
                        new Date(2024, 0, 15),
                        new Date(2024, 1, 15),
                    ],
                },
                {
                    name: 'every 6 months',
                    interval: { unit: 'month', step: 6 },
                    domain: [
                        // datum every month spanning across two years
                        new Date(2023, 0, 0),
                        new Date(2023, 1, 0),
                        new Date(2023, 2, 0),
                        new Date(2023, 3, 0),
                        new Date(2023, 4, 0),
                        new Date(2023, 5, 0),
                        new Date(2023, 6, 0),
                        new Date(2023, 7, 0),
                        new Date(2023, 8, 0),
                        new Date(2023, 9, 0),
                        new Date(2023, 10, 0),
                        new Date(2023, 11, 0),
                        new Date(2023, 12, 0),
                        new Date(2024, 0, 0),
                        new Date(2024, 1, 0),
                    ],
                },
                {
                    name: 'every year',
                    interval: 'year',
                    domain: [
                        // datum every year
                        new Date(2018, 0, 0),
                        new Date(2019, 0, 0),
                        new Date(2020, 0, 0),
                        // no datum for 2021
                        new Date(2022, 0, 0),
                        new Date(2023, 0, 0),
                        new Date(2024, 0, 0),
                    ],
                },
                {
                    name: 'every 3 year',
                    interval: { unit: 'year', step: 3 },
                    domain: [
                        // datum every 6 months
                        new Date(2018, 0, 0),
                        new Date(2018, 5, 0),
                        new Date(2019, 0, 0),
                        new Date(2019, 5, 0),
                        new Date(2020, 0, 0),
                        new Date(2020, 5, 0),
                        // no datum for 2021
                        new Date(2022, 0, 0),
                        new Date(2022, 5, 0),
                        new Date(2023, 0, 0),
                        new Date(2023, 5, 0),
                        new Date(2024, 0, 0),
                    ],
                },
            ];

            it.each(TIME_INTERVALS)(`for $name case`, ({ interval, domain }) => {
                const scale = new OrdinalTimeScale();

                scale.range = [0, 600];
                scale.domain = domain;

                const ticks = {
                    nice: [true, true],
                    interval,
                    tickCount: undefined,
                    minTickCount: 0,
                    maxTickCount: Infinity,
                };
                expect(scale.ticks(ticks)).toMatchSnapshot();
            });
        });
    });

    it('should sort domains', () => {
        const scale = new OrdinalTimeScale();
        const { domain } = scale.normalizeDomains({
            domain: [
                new Date(2024, 1, 26),
                new Date(2024, 1, 27),
                new Date(2024, 1, 28),
                new Date(2024, 1, 29),
                new Date(2024, 2, 1),
                new Date(2024, 2, 4),
                new Date(2024, 2, 5),
                new Date(2024, 2, 6),
            ].reverse(),
        });
        expect(datesSortOrder(domain)).toBe(1);
    });

    describe('empty domain', () => {
        test('convert does not throw', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = [];
            scale.range = [0, 100];

            expect(() => scale.convert(new Date())).not.toThrow();
        });

        test('convert does not throw', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = [];
            scale.range = [0, 100];

            expect(() => scale.invert(50)).not.toThrow();
        });
    });

    describe('value coercion', () => {
        function bandedScale() {
            const scale = new OrdinalTimeScale();
            scale.domain = [
                new Date(Date.UTC(2024, 0, 1)),
                new Date(Date.UTC(2024, 1, 1)),
                new Date(Date.UTC(2024, 2, 1)),
            ];
            scale.range = [0, 300];
            return scale;
        }

        it('coerces ISO string and bigint epoch to the same band as the equivalent Date', () => {
            const scale = bandedScale();
            const date = new Date(Date.UTC(2024, 1, 1));
            const expected = scale.convert(date);
            expect(scale.convert('2024-02-01T00:00:00Z')).toBe(expected);
            expect(scale.convert(BigInt(date.valueOf()))).toBe(expected);
        });
    });

    describe('stepTicks', () => {
        it('should return ticks for the given band step', () => {
            const domain = Array.from({ length: 60 }, (_, i) => new Date(2024, 0, i + 1));
            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            expect(scale.stepTicks(10, undefined, [0, 1])).toEqual([
                new Date(2024, 0, 1),
                new Date(2024, 0, 11),
                new Date(2024, 0, 21),
                new Date(2024, 0, 31),
                new Date(2024, 1, 10),
                new Date(2024, 1, 20),
            ]);
        });

        it('should return ticks for the given band step and domain', () => {
            const domain = Array.from({ length: 100 }, (_, i) => new Date(2024, 0, i + 1));
            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            expect(scale.stepTicks(2, [new Date(2024, 1, 1), new Date(2024, 2, 0)], [0, 1])).toEqual([
                new Date(2024, 1, 1),
                new Date(2024, 1, 3),
                new Date(2024, 1, 5),
                new Date(2024, 1, 7),
                new Date(2024, 1, 9),
                new Date(2024, 1, 11),
                new Date(2024, 1, 13),
                new Date(2024, 1, 15),
                new Date(2024, 1, 17),
                new Date(2024, 1, 19),
                new Date(2024, 1, 21),
                new Date(2024, 1, 23),
                new Date(2024, 1, 25),
                new Date(2024, 1, 27),
            ]);
        });

        it('should return ticks for the given band step and domain when the domain starts before the first tick', () => {
            const domain = Array.from({ length: 20 }, (_, i) => new Date(2024, 0, i * 5 + 1));
            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            expect(scale.stepTicks(2, [new Date(2024, 1, 1), new Date(2024, 2, 0)], [0, 1])).toEqual([
                new Date(2024, 1, 5),
                new Date(2024, 1, 15),
            ]);
        });

        it('should drop the last tick if it is less than a band step away from the domain', () => {
            const domain = [
                new Date(2024, 2, 26),
                new Date(2024, 2, 27),
                new Date(2024, 2, 28),
                new Date(2024, 3, 1),
                new Date(2024, 3, 2),
                new Date(2024, 3, 3),
                new Date(2024, 3, 4),
                new Date(2024, 3, 5),
                new Date(2024, 3, 8),
                new Date(2024, 3, 9),
                new Date(2024, 3, 10),
                new Date(2024, 3, 11),
                new Date(2024, 3, 12),
                new Date(2024, 3, 15),
                new Date(2024, 3, 16),
                new Date(2024, 3, 17),
                new Date(2024, 3, 18),
                new Date(2024, 3, 19),
                new Date(2024, 3, 22),
                new Date(2024, 3, 23),
                new Date(2024, 3, 24),
                new Date(2024, 3, 25),
                new Date(2024, 3, 26),
                new Date(2024, 3, 29),
                // new Date(2024, 3, 30),
                new Date(2024, 4, 1),
                new Date(2024, 4, 2),
                new Date(2024, 4, 3),
            ];

            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            expect(scale.stepTicks(2, [new Date(2024, 3, 1), new Date(2024, 4, 1)], [0, 1])).toEqual([
                new Date(2024, 3, 1),
                new Date(2024, 3, 3),
                new Date(2024, 3, 5),
                new Date(2024, 3, 9),
                new Date(2024, 3, 11),
                new Date(2024, 3, 15),
                new Date(2024, 3, 17),
                new Date(2024, 3, 19),
                new Date(2024, 3, 23),
                new Date(2024, 3, 25),
            ]);
        });

        it('should keep the last tick if it is exactly a band step away from the domain', () => {
            const domain = [
                new Date(2024, 3, 26),
                new Date(2024, 3, 29),
                new Date(2024, 3, 30),
                new Date(2024, 4, 1),
                new Date(2024, 4, 2),
                new Date(2024, 4, 3),
                new Date(2024, 4, 6),
                new Date(2024, 4, 7),
                new Date(2024, 4, 8),
                new Date(2024, 4, 9),
                new Date(2024, 4, 10),
                new Date(2024, 4, 13),
                new Date(2024, 4, 14),
                new Date(2024, 4, 15),
                new Date(2024, 4, 16),
                new Date(2024, 4, 17),
                new Date(2024, 4, 20),
                new Date(2024, 4, 21),
                new Date(2024, 4, 22),
                new Date(2024, 4, 23),
                new Date(2024, 4, 24),
                new Date(2024, 4, 28),
                new Date(2024, 4, 29),
                new Date(2024, 4, 30),
                new Date(2024, 4, 31),
                new Date(2024, 5, 3),
                new Date(2024, 5, 4),
                new Date(2024, 5, 5),
            ];

            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            expect(scale.stepTicks(2, [new Date(2024, 4, 1), new Date(2024, 5, 1)], [0, 1])).toEqual([
                new Date(2024, 4, 1),
                new Date(2024, 4, 3),
                new Date(2024, 4, 7),
                new Date(2024, 4, 9),
                new Date(2024, 4, 13),
                new Date(2024, 4, 15),
                new Date(2024, 4, 17),
                new Date(2024, 4, 21),
                new Date(2024, 4, 23),
                new Date(2024, 4, 28),
                new Date(2024, 4, 30),
            ]);
        });

        it('should return ticks for the given band step, domain, and visible range', () => {
            const domain = Array.from({ length: 100 }, (_, i) => new Date(2024, 0, i + 1));
            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            expect(scale.stepTicks(2, [new Date(2024, 1, 1), new Date(2024, 2, 0)], [0.25, 0.75])).toEqual([
                new Date(2024, 1, 9),
                new Date(2024, 1, 11),
                new Date(2024, 1, 13),
                new Date(2024, 1, 15),
                new Date(2024, 1, 17),
                new Date(2024, 1, 19),
                new Date(2024, 1, 21),
            ]);
        });
    });

    describe('interval ticks', () => {
        it('should return ticks for the given interval', () => {
            const domain = Array.from({ length: 52 }, (_, i) => new Date(2024, 0, i * 7 + 1));
            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            scale.range = [0, 1000];
            expect(
                scale.ticks({
                    nice: [true, true],
                    interval: 'month',
                    tickCount: 0,
                    minTickCount: 0,
                    maxTickCount: Infinity,
                })?.ticks
            ).toEqual([
                new Date(2024, 0, 1),
                new Date(2024, 1, 5),
                new Date(2024, 2, 4),
                new Date(2024, 3, 1),
                new Date(2024, 4, 6),
                new Date(2024, 5, 3),
                new Date(2024, 6, 1),
                new Date(2024, 7, 5),
                new Date(2024, 8, 2),
                new Date(2024, 9, 7),
                new Date(2024, 10, 4),
                new Date(2024, 11, 2),
            ]);
        });
    });
    // The axis label-overlap search terminates after one pass on a pinned interval, so a scale that
    // silently drops the interval must say so or its automatic ticks stop thinning (AG-18574).
    describe('intervalIgnored', () => {
        const weeklyScale = (range: [number, number]) => {
            const scale = new OrdinalTimeScale();
            scale.domain = Array.from({ length: 52 }, (_, i) => new Date(2024, 0, i * 7 + 1));
            scale.range = range;
            return scale;
        };
        const params = (interval: AgTimeInterval | AgTimeIntervalUnit) => ({
            nice: [true, true] as [boolean, boolean],
            interval,
            tickCount: 5,
            minTickCount: 0,
            maxTickCount: Infinity,
        });

        it('is unset when the interval is honoured', () => {
            expect(weeklyScale([0, 1000]).ticks(params('month'))?.intervalIgnored).toBeUndefined();
        });

        it('is set when the interval is rejected as too dense', () => {
            // A day interval over a year needs more than one tick per pixel of this 50px range.
            expect(weeklyScale([0, 50]).ticks(params('day'))?.intervalIgnored).toBe(true);
        });
    });

    // A scale that was narrowed to a temporary domain and restored must answer exactly as one that never left
    // its domain: the cached band arrays are an optimisation, so no result may depend on them.
    describe('results after a temporary domain round trip', () => {
        const tickParams = (tickCount: number, interval?: AgTimeInterval | AgTimeIntervalUnit) => ({
            nice: [true, true] as [boolean, boolean],
            interval,
            tickCount,
            minTickCount: 0,
            maxTickCount: Infinity,
        });

        function pair(domain: Date[], temporary: Date[]) {
            const control = new OrdinalTimeScale();
            control.domain = domain;
            control.range = [0, 1000];

            const subject = new OrdinalTimeScale();
            subject.domain = domain;
            subject.range = [0, 1000];
            // Warm every cache for the original domain, as an axis that has already rendered would have.
            subject.ticks(tickParams(10));
            subject.getUniformityCache();
            subject.getUniformityCache([0.25, 0.75]);
            subject.convert(domain[0]);

            const snapshot = subject.snapshotDomain();
            subject.domain = temporary;
            subject.ticks(tickParams(5));
            subject.convert(temporary[0]);
            subject.restoreDomain(snapshot);
            return { control, subject };
        }

        it.each([
            ['ascending', false],
            ['reversed', true],
        ])('answers like an untouched scale for an %s domain', (_name, reversed) => {
            const orient = (dates: Date[]) => (reversed ? dates.slice().reverse() : dates);
            const domain = orient(minutes(3000));
            const { control, subject } = pair(domain, orient(minutes(40, 7)));

            expect(subject.domain).toBe(domain);
            expect(subject.bands).toEqual(control.bands);
            expect(subject.ticks(tickParams(10))).toEqual(control.ticks(tickParams(10)));
            expect(subject.ticks(tickParams(7), undefined, [0.2, 0.6])).toEqual(
                control.ticks(tickParams(7), undefined, [0.2, 0.6])
            );
            expect(subject.ticks(tickParams(7, { unit: 'hour', step: 1 }))).toEqual(
                control.ticks(tickParams(7, { unit: 'hour', step: 1 }))
            );
            expect(subject.getUniformityCache()).toEqual(control.getUniformityCache());
            expect(subject.getUniformityCache([0.25, 0.75])).toEqual(control.getUniformityCache([0.25, 0.75]));

            for (const index of [0, 1, 17, 1500, 2998, 2999]) {
                expect(subject.convert(domain[index])).toBe(control.convert(domain[index]));
            }
            for (const px of [0, 1, 123.4, 500, 999, 1000]) {
                expect(subject.invert(px)).toEqual(control.invert(px));
                expect(subject.invert(px, true)).toEqual(control.invert(px, true));
            }
        });

        it('never answers from the temporary domain once restored', () => {
            // The temporary domain lies outside the original, so a leaked cache shows as a wrong extent.
            const domain = minutes(2000);
            const temporary = minutes(30, 1).map((d) => new Date(d.valueOf() + 10 * durationDay));
            const { subject } = pair(domain, temporary);

            expect(subject.bands).toHaveLength(2000);
            expect(subject.getDomainMinMax()).toEqual([domain[0], domain.at(-1)]);
            expect(subject.convert(domain[0])).toBe(0);
            expect(subject.convert(domain.at(-1)!)).toBeGreaterThan(900);
            expect(subject.invert(0)).toEqual(domain[0]);
        });

        it('restores through an exception thrown between snapshot and restore', () => {
            const scale = new OrdinalTimeScale();
            const domain = minutes(2000);
            scale.domain = domain;
            scale.range = [0, 1000];
            const bands = scale.bands;

            const snapshot = scale.snapshotDomain();
            try {
                scale.domain = minutes(10);
                throw new Error('callback failed');
            } catch {
                // withTemporaryDomain restores from `finally`, so mimic that here.
            } finally {
                scale.restoreDomain(snapshot);
            }

            expect(scale.domain).toBe(domain);
            expect(scale.bands).toBe(bands);
            expect(scale.convert(domain[1999])).toBeGreaterThan(900);
        });

        it('stays correct when temporary domains nest', () => {
            const scale = new OrdinalTimeScale();
            const domain = minutes(2000);
            const middle = minutes(500, 2);
            const inner = minutes(20, 3);
            scale.domain = domain;
            scale.range = [0, 1000];
            const expected = scale.bands.slice();
            const expectedNumeric = expected.map((d) => d.valueOf());

            const outerSnapshot = scale.snapshotDomain();
            scale.domain = middle;
            const innerSnapshot = scale.snapshotDomain();
            scale.domain = inner;
            expect(scale.bands).toEqual(inner);
            scale.restoreDomain(innerSnapshot);
            expect(scale.domain).toBe(middle);
            expect(scale.bands).toEqual(middle);
            scale.restoreDomain(outerSnapshot);

            expect(scale.domain).toBe(domain);
            expect(scale.bands).toEqual(expected);
            expect(numericBandsOf(scale)).toEqual(expectedNumeric);
        });
    });

    // Tick generation swaps in a temporary domain and restores the original; the band caches built for the
    // original must survive that round trip, but never outlive a genuine domain change.
    describe('band caches across snapshotDomain/restoreDomain', () => {
        const warm = (scale: OrdinalTimeScale) => ({
            bands: scale.bands,
            numericBands: numericBandsOf(scale),
            uniformity: scale.getUniformityCache(),
            visibleUniformity: scale.getUniformityCache([0.25, 0.75]),
        });

        it('keeps the cached arrays after a temporary domain round trip', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = minutes(2000);
            scale.range = [0, 1000];
            const before = warm(scale);

            const snapshot = scale.snapshotDomain();
            scale.domain = minutes(10);
            // The temporary domain is served from its own bands, never the original's.
            expect(scale.bands).toHaveLength(10);
            expect(numericBandsOf(scale)).toHaveLength(10);
            scale.restoreDomain(snapshot);

            expect(scale.domain).toBe(snapshot);
            expect(scale.bands).toBe(before.bands);
            expect(numericBandsOf(scale)).toBe(before.numericBands);
            expect(scale.getUniformityCache()).toBe(before.uniformity);
            expect(scale.getUniformityCache([0.25, 0.75])).toBe(before.visibleUniformity);
        });

        it('keeps the cached arrays of a reversed domain', () => {
            const scale = new OrdinalTimeScale();
            const domain = minutes(2000).reverse();
            scale.domain = domain;
            scale.range = [0, 1000];
            const before = warm(scale);
            expect(before.bands[0].valueOf()).toBeLessThan(before.bands.at(-1)!.valueOf());

            const snapshot = scale.snapshotDomain();
            // A reversed temporary domain must not leak its orientation into the restored scale.
            scale.domain = minutes(10).reverse();
            expect(scale.bands[0].valueOf()).toBeLessThan(scale.bands.at(-1)!.valueOf());
            scale.restoreDomain(snapshot);

            expect(scale.domain).toBe(domain);
            expect(scale.bands).toBe(before.bands);
            expect(numericBandsOf(scale)).toBe(before.numericBands);
        });

        it('keeps working when nothing was cached before the snapshot', () => {
            const scale = new OrdinalTimeScale();
            const domain = minutes(50);
            scale.domain = domain;
            scale.range = [0, 500];

            const snapshot = scale.snapshotDomain();
            scale.domain = minutes(5);
            scale.restoreDomain(snapshot);

            const control = new OrdinalTimeScale();
            control.domain = domain;
            control.range = [0, 500];

            expect(scale.bands).toEqual(domain);
            expect(numericBandsOf(scale)).toEqual(domain.map((d) => d.valueOf()));
            expect(scale.convert(domain[10])).toBe(control.convert(domain[10]));
        });

        it('leaves a scale untouched when the snapshot is restored without a domain change', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = minutes(2000);
            scale.range = [0, 1000];
            const before = warm(scale);

            scale.restoreDomain(scale.snapshotDomain());

            expect(scale.bands).toBe(before.bands);
            expect(numericBandsOf(scale)).toBe(before.numericBands);
        });

        it('rebuilds everything for a genuinely new domain', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = minutes(2000);
            scale.range = [0, 1000];
            const before = warm(scale);

            scale.snapshotDomain();
            const next = minutes(3000, 2);
            scale.domain = next;

            expect(scale.bands).not.toBe(before.bands);
            expect(scale.bands).toHaveLength(3000);
            expect(numericBandsOf(scale)).not.toBe(before.numericBands);
            expect(numericBandsOf(scale)).toEqual(next.map((d) => d.valueOf()));
            expect(scale.getUniformityCache()?.interval).toBe(2 * durationMinute);
        });

        it('rebuilds the caches for a different array with equal contents', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = minutes(2000);
            scale.range = [0, 1000];
            const before = warm(scale);

            const copy = minutes(2000);
            scale.domain = copy;

            expect(scale.bands).not.toBe(before.bands);
            expect(scale.bands).toBe(copy);
            expect(numericBandsOf(scale)).not.toBe(before.numericBands);
            expect(numericBandsOf(scale)).toEqual(before.numericBands);
        });

        it('does not reinstate the caches when restoring a domain other than the snapshot', () => {
            const scale = new OrdinalTimeScale();
            scale.domain = minutes(2000);
            scale.range = [0, 1000];
            const before = warm(scale);

            scale.snapshotDomain();
            const other = minutes(2500, 3);
            scale.domain = minutes(10);
            scale.restoreDomain(other);

            expect(scale.domain).toBe(other);
            expect(scale.bands).not.toBe(before.bands);
            expect(scale.bands).toHaveLength(2500);
            expect(numericBandsOf(scale)).toEqual(other.map((d) => d.valueOf()));
            expect(scale.getUniformityCache()?.interval).toBe(3 * durationMinute);
        });

        it('hands the temporary domain caches to the next set of that domain', () => {
            const scale = new OrdinalTimeScale();
            const original = minutes(10);
            scale.domain = original;
            scale.range = [0, 1000];
            const temporary = minutes(2000);

            // Tick generation builds the caches for the temporary domain inside the callback...
            let snapshot = scale.snapshotDomain();
            scale.domain = temporary;
            const built = numericBandsOf(scale);
            scale.restoreDomain(snapshot);
            expect(scale.domain).toBe(original);

            // ...a second pass over the same temporary domain, and the axis adopting it, reuse them.
            snapshot = scale.snapshotDomain();
            scale.domain = temporary;
            expect(numericBandsOf(scale)).toBe(built);
            scale.restoreDomain(snapshot);
            scale.domain = temporary;
            expect(numericBandsOf(scale)).toBe(built);
            expect(scale.bands).toBe(temporary);
        });

        it('drops the handed-over caches when a different domain is set first', () => {
            const scale = new OrdinalTimeScale();
            const original = minutes(10);
            scale.domain = original;
            scale.range = [0, 1000];
            const temporary = minutes(2000);

            const snapshot = scale.snapshotDomain();
            scale.domain = temporary;
            const built = numericBandsOf(scale);
            scale.restoreDomain(snapshot);

            scale.domain = minutes(20);
            scale.domain = temporary;
            expect(numericBandsOf(scale)).not.toBe(built);
            expect(numericBandsOf(scale)).toEqual(temporary.map((d) => d.valueOf()));
        });

        it('does not reuse a consumed snapshot', () => {
            const scale = new OrdinalTimeScale();
            const first = minutes(2000);
            scale.domain = first;
            scale.range = [0, 1000];
            const before = warm(scale);

            const snapshot = scale.snapshotDomain();
            scale.domain = minutes(10);
            scale.restoreDomain(snapshot);

            // The snapshot's caches were handed back once; a later change and plain restore rebuilds them.
            scale.domain = minutes(2000, 5);
            scale.restoreDomain(first);
            expect(scale.domain).toBe(first);
            expect(numericBandsOf(scale)).not.toBe(before.numericBands);
            expect(numericBandsOf(scale)).toEqual(first.map((d) => d.valueOf()));
        });
    });
    // `findIndex` and `convert` are the first reads of a freshly set domain (once per tick pass). They search `bands`
    // themselves until enough lookups have been made to justify building `numericBands`, a number per band.
    describe('lookups before numericBands is built', () => {
        const BANDS_PER_UNBUILT_LOOKUP = 64;
        const BAND_COUNT = 6400;
        // Lookups on an unbuilt scale before the next one builds `numericBands`.
        const LOOKUP_LIMIT = BAND_COUNT / BANDS_PER_UNBUILT_LOOKUP;
        const buildsOf = () => vi.spyOn(OrdinalTimeScale.prototype as any, 'numericBands', 'get');

        afterEach(() => {
            vi.restoreAllMocks();
        });

        function scaleOf(domain: Date[]) {
            const scale = new OrdinalTimeScale();
            scale.domain = domain;
            scale.range = [0, 1000];
            return scale;
        }

        const alignments = [ScaleAlignment.Leading, ScaleAlignment.Trailing];

        function probes(domain: Date[]) {
            const first = domain[0].valueOf();
            const last = domain.at(-1)!.valueOf();
            const [lo, hi] = first < last ? [first, last] : [last, first];
            const step = (hi - lo) / 37;
            // Before, inside (on and between bands) and after the domain.
            return Array.from({ length: 40 }, (_, i) => new Date(lo - step + i * step + (i % 2) * 17_000));
        }

        it.each([
            ['ascending', minutes(BAND_COUNT)],
            ['reversed', minutes(BAND_COUNT).reverse()],
        ])('does not build them for a few lookups on %s bands', (_, domain) => {
            const builds = buildsOf();
            const scale = scaleOf(domain);

            for (const alignment of alignments) {
                scale.findIndex(domain[0], alignment);
                scale.findIndex(domain.at(-1)!, alignment, true);
                scale.convert(domain[100], { alignment });
            }
            scale.ticks({ nice: [false, false], tickCount: 10, minTickCount: 0, maxTickCount: Infinity });

            expect(builds).not.toHaveBeenCalled();
        });

        it.each([
            ['ascending', minutes(BAND_COUNT)],
            ['reversed', minutes(BAND_COUNT).reverse()],
        ])('answers as it does once they are built, on %s bands', (_, domain) => {
            const unbuilt = scaleOf(domain);
            const built = scaleOf(domain);
            numericBandsOf(built);

            for (const target of probes(domain)) {
                for (const alignment of alignments) {
                    for (const exclusive of [false, true]) {
                        expect(unbuilt.findIndex(target, alignment, exclusive)).toBe(
                            built.findIndex(target, alignment, exclusive)
                        );
                    }
                    expect(unbuilt.convert(target, { alignment })).toBe(built.convert(target, { alignment }));
                }
            }
        });

        it('builds them once lookups have been made on a fraction of the bands', () => {
            const builds = buildsOf();
            const scale = scaleOf(minutes(BAND_COUNT));

            for (let i = 0; i < LOOKUP_LIMIT - 1; i++) scale.findIndex(new Date(2024, 0, 1, 0, i));
            expect(builds).not.toHaveBeenCalled();

            scale.findIndex(new Date(2024, 0, 1, 0, 7));
            expect(builds).toHaveBeenCalledTimes(1);

            const built = numericBandsOf(scale);
            scale.findIndex(new Date(2024, 0, 1, 0, 9));
            expect(numericBandsOf(scale)).toBe(built);
        });

        it('builds them on first use for a small domain', () => {
            const builds = buildsOf();
            const scale = scaleOf(minutes(12));

            scale.findIndex(new Date(2024, 0, 1, 0, 3));

            expect(builds).toHaveBeenCalledTimes(1);
        });

        it('counts lookups per domain, not per scale', () => {
            const builds = buildsOf();
            const scale = scaleOf(minutes(BAND_COUNT));
            for (let i = 0; i < LOOKUP_LIMIT - 1; i++) scale.findIndex(new Date(2024, 0, 1, 0, i));

            scale.domain = minutes(BAND_COUNT, 2);
            scale.findIndex(new Date(2024, 0, 1, 0, 3));

            expect(builds).not.toHaveBeenCalled();
        });

        it('clamped and interpolated conversions still build them and agree with an unclamped lookup', () => {
            const domain = minutes(BAND_COUNT);
            const scale = scaleOf(domain);
            const control = scaleOf(domain);
            numericBandsOf(control);
            const target = new Date(2024, 0, 1, 0, 500, 30);

            for (const options of [{ clamp: true }, { alignment: ScaleAlignment.Interpolate }]) {
                expect(scale.convert(target, options)).toBe(control.convert(target, options));
            }
            expect(scale.convert(new Date(2023, 0, 1), { clamp: true })).toBe(0);
            expect(scale.convert(new Date(2025, 0, 1), { clamp: true })).toBe(1000);
        });
    });
});

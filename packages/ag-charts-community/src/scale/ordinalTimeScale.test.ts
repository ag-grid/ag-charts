import { describe, expect, it } from '@jest/globals';

import day from '../util/time/day';
import {
    durationDay,
    durationHour,
    durationMinute,
    durationMonth,
    durationWeek,
    durationYear,
} from '../util/time/duration';
import hour from '../util/time/hour';
import minute from '../util/time/minute';
import month from '../util/time/month';
import year from '../util/time/year';
import { OrdinalTimeScale } from './ordinalTimeScale';

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
        scale.tickCount = 5;
        expect(scale.ticks()).toMatchSnapshot();
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
        scale.maxTickCount = 8;
        expect(scale.ticks()).toMatchSnapshot();
    });

    it('should extend the domain to create nice ticks matching the data domain', () => {
        const scale = new OrdinalTimeScale();
        scale.domain = [
            // yearly data but not on the first day of the year (January 1st)
            new Date(2023, 3, 5),
            new Date(2024, 3, 5),
            new Date(2025, 3, 5),
        ];
        expect(scale.ticks()).toMatchSnapshot();
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
                scale.interval = interval;

                expect(scale.ticks()).toMatchSnapshot();
            });
        });

        describe(`time interval`, () => {
            const TIME_INTERVALS = [
                {
                    name: 'every minute',
                    interval: minute,
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
                    interval: hour,
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
                    interval: day,
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
                    interval: day.every(3),
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
                    interval: month,
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
                    interval: month.every(2),
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
                    interval: month.every(6),
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
                    interval: year,
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
                    interval: year.every(3),
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
                scale.interval = interval;

                expect(scale.ticks()).toMatchSnapshot();
            });
        });
    });
});

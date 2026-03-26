import { describe, expect, it } from '@jest/globals';

import { durationDay, durationHour, durationMinute, durationMonth, durationWeek, durationYear } from 'ag-charts-core';
import type { AgTimeInterval, AgTimeIntervalUnit } from 'ag-charts-types';

import { TimeScale } from './timeScale';

describe('TimeScale', () => {
    it('should create nice domain', () => {
        const scale = new TimeScale();
        scale.domain = [new Date(new Date(2022, 1, 13)), new Date(new Date(2022, 10, 30))];
        expect(
            scale.niceDomain({
                nice: [true, true],
                interval: undefined,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            })
        ).toEqual([new Date(2022, 1, 1), new Date(2022, 11, 1)]);
    });

    it('should create nice ticks', () => {
        const scale = new TimeScale();
        scale.domain = [new Date(2022, 1, 13), new Date(2022, 10, 30)];
        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: 10,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        expect(scale.ticks(ticks, scale.niceDomain(ticks))).toEqual({
            ticks: [
                new Date(2022, 1, 1),
                new Date(2022, 2, 1),
                new Date(2022, 3, 1),
                new Date(2022, 4, 1),
                new Date(2022, 5, 1),
                new Date(2022, 6, 1),
                new Date(2022, 7, 1),
                new Date(2022, 8, 1),
                new Date(2022, 9, 1),
                new Date(2022, 10, 1),
                new Date(2022, 11, 1),
            ],
            count: undefined,
            firstTickIndex: 0,
            timeInterval: {
                epoch: undefined,
                step: 1,
                unit: 'month',
            },
        });
    });

    describe('should create ticks with configured', () => {
        describe(`milliseconds interval`, () => {
            const MILLISECONDS_INTERVALS = [
                {
                    name: 'every minute',
                    interval: durationMinute,
                    domain: [new Date(2022, 0, 1, 12), new Date(2022, 0, 1, 13)],
                },
                {
                    name: 'every hour',
                    interval: durationHour,
                    domain: [new Date(2022, 0, 1, 9), new Date(2022, 0, 1, 17)],
                },
                {
                    name: 'every half day',
                    interval: durationDay / 2,
                    domain: [new Date(2022, 0, 1), new Date(2022, 0, 15)],
                },
                {
                    name: 'every 2 days',
                    interval: durationDay * 2,
                    domain: [new Date(2022, 0, 1), new Date(2022, 0, 21)],
                },
                {
                    name: 'every 3 weeks',
                    interval: durationWeek * 3,
                    domain: [new Date(2022, 0, 1), new Date(2022, 6, 1)],
                },
                {
                    name: 'every month',
                    interval: durationMonth,
                    domain: [new Date(2022, 0, 1), new Date(2023, 0, 1)],
                },
                {
                    name: 'every two months',
                    interval: durationMonth * 2,
                    domain: [new Date(2022, 0, 1), new Date(2023, 0, 1)],
                },
                {
                    name: 'every year',
                    interval: durationYear,
                    domain: [new Date(2021, 0, 1), new Date(2023, 0, 1)],
                },
                {
                    name: 'every year, negative milliseconds',
                    interval: -durationYear,
                    domain: [new Date(2021, 0, 1), new Date(2023, 0, 1)],
                },
            ];

            it.each(MILLISECONDS_INTERVALS)(`for $name case`, ({ interval, domain }) => {
                const scale = new TimeScale();

                scale.range = [0, 600];
                scale.domain = domain;

                const ticks = {
                    nice: [false, false],
                    interval: interval,
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
                domain: [Date, Date];
            }> = [
                {
                    name: 'every minute',
                    interval: 'minute',
                    domain: [new Date(2022, 0, 1, 12), new Date(2022, 0, 1, 13)],
                },
                {
                    name: 'every hour',
                    interval: 'hour',
                    domain: [new Date(2022, 0, 1, 9), new Date(2022, 0, 1, 17)],
                },
                {
                    name: 'every day',
                    interval: 'day',
                    domain: [new Date(2022, 0, 1), new Date(2022, 0, 15)],
                },
                {
                    name: 'every 3 days',
                    interval: { unit: 'day', step: 3 },
                    domain: [new Date(2022, 0, 1), new Date(2022, 0, 21)],
                },
                {
                    name: 'every month',
                    interval: 'month',
                    domain: [new Date(2022, 0, 1), new Date(2022, 6, 1)],
                },
                {
                    name: 'every two months',
                    interval: { unit: 'month', step: 2 },
                    domain: [new Date(2022, 0, 1), new Date(2023, 0, 1)],
                },
                {
                    name: 'every 6 months',
                    interval: { unit: 'month', step: 6 },
                    domain: [new Date(2021, 0, 1), new Date(2023, 0, 1)],
                },
                {
                    name: 'every year',
                    interval: 'year',
                    domain: [new Date(2021, 0, 1), new Date(2023, 0, 1)],
                },
            ];

            it.each(TIME_INTERVALS)(`for $name case`, ({ interval, domain }) => {
                const scale = new TimeScale();

                scale.range = [0, 600];
                scale.domain = domain;

                const ticks = {
                    nice: [false, false],
                    interval: interval,
                    tickCount: undefined,
                    minTickCount: 0,
                    maxTickCount: Infinity,
                };

                expect(scale.ticks(ticks)).toMatchSnapshot();
            });
        });
    });
});

import { describe, expect, it, test } from '@jest/globals';

import { LogScale } from './logScale';

describe('LogScale', () => {
    test('ticks', () => {
        {
            const scale = new LogScale();
            scale.domain = [100, 1000000];
            expect(scale.ticks()).toEqual({ ticks: [100, 1000, 10000, 100000, 1000000], fractionDigits: 0 });
            scale.tickCount = 4;
            expect(scale.ticks()).toEqual({ ticks: [100, 1000, 10000, 100000, 1000000], fractionDigits: 0 });
        }

        {
            // const scale = new LogScale();
            // scale.domain = [-100, 10000];
            // expect(scale.ticks()).toEqual([]);
        }

        {
            const scale = new LogScale();
            scale.domain = [-1000, -10];
            expect(scale.ticks()).toEqual({ ticks: [-1000, -300, -100, -30, -10], fractionDigits: 0 });
        }
    });

    describe('should create ticks', () => {
        const CASES = [
            {
                interval: 0,
                domain: [0.1, 10000000],
            },
            {
                interval: 1,
                domain: [0.1, 10000000],
            },
            {
                interval: -1,
                domain: [-10000000, -0.1],
            },
            {
                interval: 1,
                domain: [-10000000, -0.1],
            },
            {
                interval: 2,
                domain: [0.1, 10000000],
            },
            {
                interval: 3,
                domain: [0.1, 10000000],
            },
            {
                interval: 4,
                domain: [0.1, 10000000],
            },
            {
                interval: 5,
                domain: [0.1, 10000000],
            },
            {
                interval: 6,
                domain: [0.1, 10000000],
            },
            {
                interval: 7,
                domain: [0.1, 10000000],
            },
            {
                interval: 10,
                domain: [0.1, 10000000],
            },
            {
                interval: 0.5,
                domain: [0.1, 10000000],
            },
            {
                interval: 0.1,
                domain: [0.1, 10000000],
            },
            {
                interval: 2,
                domain: [-10000000, -0.1],
            },
            {
                interval: -2,
                domain: [-10000000, -0.1],
            },
            {
                interval: 10,
                domain: [-10000000, -0.1],
            },
            {
                interval: -10,
                domain: [-10000000, -0.1],
            },
        ];

        it.each(CASES)(`for interval: $interval domain: $domain case`, ({ interval, domain }) => {
            const scale = new LogScale();

            scale.range = [0, 600];
            scale.domain = domain;
            scale.interval = interval;

            expect(scale.ticks()).toMatchSnapshot();
        });
    });

    test('convert', () => {
        {
            const scale = new LogScale();
            scale.domain = [10, 1000];
            expect(scale.convert(50)).toBe(0.3494850021680094);
        }

        {
            const scale = new LogScale();
            scale.domain = [-1000, -10];
            expect(scale.convert(-50)).toBe(0.6505149978319906);
        }
    });

    test('base', () => {
        const expTicks = {
            ticks: [20.085536923187668, 54.598150033144236, 148.4131591025766, 403.4287934927351],
            fractionDigits: 0,
        };
        const scale = new LogScale();
        scale.domain = [10, 1000];
        expect({ ...scale.ticks() }).not.toEqual({ ...expTicks });
        scale.base = Math.E;
        expect({ ...scale.ticks() }).toEqual({ ...expTicks });
    });

    test('nice', () => {
        {
            const scale = new LogScale();
            scale.domain = [57, 775];
            scale.nice = true;
            scale.update();
            expect(scale.nice).toBe(true);
            expect(scale.niceDomain).toEqual([10, 1000]);
        }

        {
            const scale = new LogScale();
            scale.domain = [Math.E * 1.234, Math.E * 5.783];
            scale.base = Math.E;
            scale.nice = true;
            scale.update();
            const domain = scale.niceDomain;
            expect(Math.log(domain[0])).toEqual(1);
            expect(Math.log(domain[1])).toEqual(3);
        }
    });
});

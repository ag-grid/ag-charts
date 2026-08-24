import { LogScale } from './logScale';

describe('LogScale', () => {
    test('ticks', () => {
        {
            const scale = new LogScale();
            scale.domain = [100, 1000000];

            const ticks = {
                nice: [true, true],
                interval: undefined,
                tickCount: undefined as number | undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            };
            expect(scale.ticks(ticks)).toEqual({
                ticks: [100, 1000, 10000, 100000, 1000000],
                count: 5,
                firstTickIndex: 0,
            });

            ticks.tickCount = 4;
            expect(scale.ticks(ticks)).toEqual({
                ticks: [100, 1000, 10000, 100000, 1000000],
                count: 5,
                firstTickIndex: 0,
            });
        }
        {
            const scale = new LogScale();
            scale.domain = [-1000, -10];

            const ticks = {
                nice: [true, true],
                interval: undefined,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            };
            expect(scale.ticks(ticks)).toEqual({
                ticks: [-1000, -300, -100, -30, -10],
                count: 5,
                firstTickIndex: 0,
            });
        }
    });

    describe('should create ticks', () => {
        const CASES = [
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

            const ticks = {
                nice: [true, true],
                interval,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            };

            scale.range = [0, 600];
            scale.domain = scale.niceDomain(ticks, domain);

            expect(scale.ticks(ticks)).toMatchSnapshot();
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
            count: expect.anything(), // Not testing a nice domain, so this is value isn't useful
            firstTickIndex: 0,
        };
        const scale = new LogScale();
        scale.domain = [10, 1000];

        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        expect(scale.ticks(ticks)).not.toEqual(expTicks);
        scale.base = Math.E;
        expect(scale.ticks(ticks)).toEqual(expTicks);
    });

    test('nice', () => {
        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };

        {
            const scale = new LogScale();
            scale.domain = [57, 775];
            expect(scale.niceDomain(ticks)).toEqual([10, 1000]);
        }

        {
            const scale = new LogScale();
            scale.domain = [Math.E * 1.234, Math.E * 5.783];
            scale.base = Math.E;
            const domain = scale.niceDomain(ticks);
            expect(Math.log(domain[0])).toEqual(1);
            expect(Math.log(domain[1])).toEqual(3);
        }
    });

    test('should create ticks within visible range', () => {
        const scale = new LogScale();
        scale.domain = [100, 1000000];

        const ticks = {
            nice: [true, true],
            interval: undefined,
            tickCount: 4,
            minTickCount: 0,
            maxTickCount: Infinity,
        };
        ticks.tickCount = 4;
        expect(scale.ticks(ticks, undefined, [0.25, 0.75])).toEqual({
            ticks: [1000, 10000, 100000],
            count: 5,
            firstTickIndex: 1,
        });
    });

    // Log scales carry a transform, so bigints narrow to Number through the standard path rather
    // than the linear bigint ratio — an accepted limitation.
    describe('convert bigint', () => {
        test('positive bigints match the equivalent number conversion', () => {
            const bigScale = new LogScale();
            bigScale.domain = [1n, 1000n];
            bigScale.range = [0, 100];

            const numScale = new LogScale();
            numScale.domain = [1, 1000];
            numScale.range = [0, 100];

            for (const v of [1n, 10n, 100n, 1000n]) {
                expect(bigScale.convert(v)).toBe(numScale.convert(Number(v)));
            }
        });

        test('a bigint domain narrows so transform spreading stays Number-only', () => {
            const scale = new LogScale();
            scale.domain = [1n, 1000n];

            expect(scale.domain).toEqual([1, 1000]);
            expect(() => scale.convert(10n)).not.toThrow();
        });

        test('niceDomain and ticks accept a raw bigint domain argument without throwing', () => {
            // generateTicks passes the raw dataDomain, which can retain bigint endpoints, to
            // niceDomain/ticks before scale.domain narrows it, so those must tolerate bigints.
            const scale = new LogScale();
            const ticks = {
                nice: [true, true] as [boolean, boolean],
                interval: undefined,
                tickCount: 5 as number | undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            };

            expect(() => scale.niceDomain(ticks, [1n, 1000n] as unknown as number[])).not.toThrow();
            expect(() => scale.ticks(ticks, [1n, 1000n] as unknown as number[])).not.toThrow();
        });
    });
});

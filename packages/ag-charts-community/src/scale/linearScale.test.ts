import { ScaleTickParams, tickFormat } from 'ag-charts-core';

import { LinearScale } from './linearScale';

describe('LinearScale', () => {
    test('domain', () => {
        const scale = new LinearScale();

        expect(scale.domain).toEqual([0, 1]);
        scale.domain = [5, 10];
        expect(scale.domain).toEqual([5, 10]);
    });

    test('range', () => {
        const scale = new LinearScale();

        expect(scale.range).toEqual([0, 1]);
        scale.range = [5, 10];
        expect(scale.range).toEqual([5, 10]);
    });

    test('convert linear', () => {
        const scale = new LinearScale();

        scale.domain = [-100, 100];
        scale.range = [0, 100];

        expect(scale.convert(0, { clamp: true })).toBe(50);

        expect(scale.convert(-100, { clamp: true })).toBe(0);
        expect(scale.convert(100, { clamp: true })).toBe(100);

        expect(scale.convert(-100, { clamp: false })).toBe(0);
        expect(scale.convert(100, { clamp: false })).toBe(100);
    });

    test('convert linear clamp', () => {
        const scale = new LinearScale();

        scale.domain = [-100, 100];
        scale.range = [0, 100];

        expect(scale.convert(-300, { clamp: true })).toBe(0);
        expect(scale.convert(300, { clamp: true })).toBe(100);

        expect(scale.convert(-300, { clamp: false })).toBe(-100);
        expect(scale.convert(300, { clamp: false })).toBe(200);
    });

    test('convert linear with zero width domain', () => {
        const scale = new LinearScale();

        scale.domain = [100, 100];
        scale.range = [0, 100];

        expect(scale.convert(100, { clamp: true })).toBe(50);
    });

    test('invert linear', () => {
        const scale = new LinearScale();

        scale.domain = [-100, 100];
        scale.range = [0, 100];

        expect(scale.invert(50)).toBe(0);
        expect(scale.invert(0)).toBe(-100);
        expect(scale.invert(75)).toBe(50);
    });

    test('invert linear with zero length range', () => {
        const scale = new LinearScale();

        scale.domain = [0, 100];
        scale.range = [100, 100];

        expect(scale.invert(100)).toBe(50);
    });

    describe('should create ticks', () => {
        const CASES = [
            {
                interval: 0,
                domain: [-1, 1],
            },
            {
                interval: 1,
                domain: [0, 10],
            },
            {
                interval: 3,
                domain: [-3, 12],
            },
            {
                interval: 10.5,
                domain: [0, 102],
            },
            {
                interval: 133,
                domain: [0, 665],
            },
            {
                interval: -1,
                domain: [0, 10],
            },
            {
                interval: -1,
                domain: [-10, 0],
            },
            {
                interval: -7.5,
                domain: [-37.5, -7.5],
            },
            {
                interval: 0.1,
                domain: [0, 1],
            },
            {
                interval: 0.01,
                domain: [0.1, 0.2],
            },
            {
                interval: 0.005,
                domain: [0.01, 0.02],
            },
        ];

        it.each(CASES)(`for interval: $interval domain: $domain case`, ({ interval, domain }) => {
            const scale = new LinearScale();

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

        it('should create ticks within range', () => {
            const scale = new LinearScale();
            scale.range = [0, 100];
            scale.domain = [0, 100];

            const ticks = {
                nice: [true, true],
                interval: 30,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            };
            expect(scale.ticks(ticks)).toEqual({
                ticks: [0, 30, 60, 90],
                count: expect.anything(), // Not using a nice domain - so this value is irrelevant
                firstTickIndex: 0,
            });
        });

        it('should create ticks within visible range', () => {
            const scale = new LinearScale();
            scale.range = [0, 100];
            scale.domain = [0, 100];

            const ticks = {
                nice: [true, true],
                interval: 10,
                tickCount: undefined,
                minTickCount: 0,
                maxTickCount: Infinity,
            };
            expect(scale.ticks(ticks, undefined, [0.25, 0.75])).toEqual({
                ticks: [30, 40, 50, 60, 70],
                count: 11,
                firstTickIndex: 3,
            });
        });
    });

    test('scale.tickFormat', () => {
        const tickFormatParams: ScaleTickParams<number> = {
            nice: [true, true],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };

        {
            const scale = new LinearScale();
            const domain = [-50000000, 50000000];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, '~s')!;
            expect(f(43000000)).toBe('43M');
        }
        {
            const scale = new LinearScale();
            const domain = [-50000000, 50000000];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, '~s')!;
            expect(f(-43000000)).toBe('−43M');
        }
        {
            const scale = new LinearScale();
            const domain = [-50000000, 50000000];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, '~s')!;
            expect(f(43500000)).toBe('44M');
        }
        {
            const scale = new LinearScale();
            const domain = [35000000, 44000000];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, '~s')!;
            const expectedTicks = ['36M', '38M', '40M', '42M', '44M'];
            const actualTicks = scale.ticks(tickFormatParams, domain).ticks.map((t) => f(t));
            expect(actualTicks).toEqual(expectedTicks);
        }
        {
            const scale = new LinearScale();
            const domain = [3500000, 4400000];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, '~s')!;
            const expectedTicks = ['3.6M', '3.8M', '4M', '4.2M', '4.4M'];
            const actualTicks = scale.ticks(tickFormatParams, domain).ticks.map((t) => f(t));
            expect(actualTicks).toEqual(expectedTicks);
        }
        {
            const scale = new LinearScale();
            const domain = [0.0034, 0.0044];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, '~s')!;
            const expectedTicks = ['3.4m', '3.6m', '3.8m', '4m', '4.2m', '4.4m'];
            const actualTicks = scale.ticks(tickFormatParams, domain).ticks.map((t) => f(t));
            expect(actualTicks).toEqual(expectedTicks);
        }
        {
            const scale = new LinearScale();
            const domain = [0.0034, 0.0044];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, 'f')!;
            const expectedTicks = ['0.0034', '0.0036', '0.0038', '0.0040', '0.0042', '0.0044'];
            const actualTicks = scale.ticks(tickFormatParams, domain).ticks.map((t) => f(t));
            expect(actualTicks).toEqual(expectedTicks);
        }
        {
            const scale = new LinearScale();
            const domain = [34, 44];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, 'f')!;
            const expectedTicks = ['34', '36', '38', '40', '42', '44'];
            const actualTicks = scale.ticks(tickFormatParams, domain).ticks.map((t) => f(t));
            expect(actualTicks).toEqual(expectedTicks);
        }
        {
            const scale = new LinearScale();
            const domain = [35, 36];
            const { ticks } = scale.ticks(tickFormatParams, domain);
            const f = tickFormat(ticks, 'f')!;
            const expectedTicks = ['35.0', '35.2', '35.4', '35.6', '35.8', '36.0'];
            const actualTicks = ticks.map((t) => f(t));
            expect(actualTicks).toEqual(expectedTicks);
        }

        const singlePointFormat = (n: number, specifier: string) => {
            const format = tickFormat([n], specifier)!;
            return format(n);
        };

        // Format specifier ' ' uses the space sign option which prefixes positives with a space.
        expect(singlePointFormat(0.1234567890123456, ' ')).toEqual(' 0.123456789012');
        expect(singlePointFormat(67.7, 'd')).toEqual('68');
        expect(singlePointFormat(0.678, '.2p')).toEqual('68%');
        expect(singlePointFormat(123, 'f')).toEqual('123');
        expect(singlePointFormat(0.001234567890123456, 'f')).toEqual('0.00123457');
        expect(singlePointFormat(0.1234567890123456, 'f')).toEqual('0.123457');
        expect(singlePointFormat(1.234567890123, 'f')).toEqual('1.23457');
        expect(singlePointFormat(123.4567890123, 'f')).toEqual('123.457');
        expect(singlePointFormat(12345.67890123, 'f')).toEqual('12345.7');
        expect(singlePointFormat(1234567.890123, 'f')).toEqual('1234568');
        expect(singlePointFormat(1234.567890123, 'f')).toEqual('1234.57');
        expect(singlePointFormat(1234.567890123, ' ')).toEqual(' 1234.56789012');
    });

    describe('empty domain', () => {
        test('convert does not throw', () => {
            const scale = new LinearScale();
            scale.domain = [];
            scale.range = [0, 100];

            expect(() => scale.convert(50)).not.toThrow();
        });

        test('convert does not throw', () => {
            const scale = new LinearScale();
            scale.domain = [];
            scale.range = [0, 100];

            expect(() => scale.invert(50)).not.toThrow();
        });
    });
});

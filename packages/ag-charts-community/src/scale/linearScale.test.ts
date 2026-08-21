import { type ScaleTickParams, tickFormat } from 'ag-charts-core';

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

    describe('convert bigint', () => {
        test('matches the equivalent number conversion', () => {
            const bigScale = new LinearScale();
            bigScale.domain = [0n, 100n];
            bigScale.range = [0, 100];

            const numScale = new LinearScale();
            numScale.domain = [0, 100];
            numScale.range = [0, 100];

            for (const v of [0n, 25n, 50n, 75n, 100n]) {
                expect(bigScale.convert(v)).toBe(numScale.convert(Number(v)));
            }
        });

        test('selects the true bigint extremes beyond Number.MAX_VALUE', () => {
            const scale = new LinearScale();
            // Number()-narrowing maps every over-large endpoint to ±Infinity, so the true extreme is lost.
            const max = BigInt(Number.MAX_VALUE);
            const { domain } = scale.normalizeDomains({ domain: [-3n * max, -12n * max, 7n * max, 12n * max] });

            expect(domain).toEqual([-12n * max, 12n * max]);
        });

        test('narrows the public domain array to Number', () => {
            const scale = new LinearScale();
            scale.domain = [0n, 100n];

            // Exact endpoints are reached via domainMin/domainMax, not the narrowed array.
            expect(scale.domain).toEqual([0, 100]);
            expect(scale.domain.every((v) => typeof v === 'number')).toBe(true);
        });

        test('clamps to the range bounds', () => {
            const scale = new LinearScale();
            scale.domain = [0n, 100n];
            scale.range = [0, 100];

            expect(scale.convert(-50n, { clamp: true })).toBe(0);
            expect(scale.convert(150n, { clamp: true })).toBe(100);
            expect(scale.convert(-50n, { clamp: false })).toBe(-50);
            expect(scale.convert(150n, { clamp: false })).toBe(150);
        });

        test('returns the range midpoint for a zero-width domain', () => {
            const scale = new LinearScale();
            scale.domain = [100n, 100n];
            scale.range = [0, 100];

            expect(scale.convert(100n, { clamp: true })).toBe(50);
            // Clamp takes precedence over the zero-width midpoint, matching the Number path.
            expect(scale.convert(50n, { clamp: true })).toBe(0);
            expect(scale.convert(150n, { clamp: true })).toBe(100);
        });

        test('supports descending domains', () => {
            const scale = new LinearScale();
            scale.domain = [100n, 0n];
            scale.range = [0, 100];

            expect(scale.convert(100n)).toBe(0);
            expect(scale.convert(0n)).toBe(100);
            expect(scale.convert(50n)).toBe(50);
        });

        test('is monotonic for adjacent bigints', () => {
            const scale = new LinearScale();
            scale.domain = [0n, 10n];
            scale.range = [0, 1000];

            let previous = -Infinity;
            for (let v = 0n; v <= 10n; v++) {
                const position = scale.convert(v);
                expect(position).toBeGreaterThan(previous);
                previous = position;
            }
        });

        // Spans beyond Number.MAX_SAFE_INTEGER stay position-monotonic.
        test('positions monotonically across a span larger than Number.MAX_SAFE_INTEGER', () => {
            const span = 10n ** 21n;
            expect(Number(span)).toBeGreaterThan(Number.MAX_SAFE_INTEGER);

            const scale = new LinearScale();
            scale.domain = [0n, span];
            scale.range = [0, 1000];

            expect(scale.convert(0n)).toBe(0);
            expect(scale.convert(span)).toBe(1000);
            expect(scale.convert(span / 2n)).toBeCloseTo(500);

            let previous = -Infinity;
            for (let i = 0n; i <= 10n; i++) {
                const position = scale.convert((span * i) / 10n);
                expect(position).toBeGreaterThan(previous);
                previous = position;
            }
        });

        // Tick generation narrows the domain via withTemporaryDomain; the snapshot/restore pair must
        // reinstate the exact bigint endpoints so a zoomed convert() keeps adjacent bigints distinct.
        test('preserves exact bigint endpoints across a snapshotDomain/restoreDomain round-trip', () => {
            const lo = 9_007_199_254_740_990n; // straddles Number.MAX_SAFE_INTEGER (2^53 - 1)
            const hi = 9_007_199_254_741_000n;

            const scale = new LinearScale();
            scale.domain = [lo, hi];
            scale.range = [0, 1000];

            const snapshot = scale.snapshotDomain();
            scale.domain = [Number(lo), Number(hi)]; // mimic the narrowed domain used during tick generation
            scale.restoreDomain(snapshot);

            let previous = -Infinity;
            for (let v = lo; v <= hi; v++) {
                const position = scale.convert(v);
                expect(position).toBeGreaterThan(previous);
                previous = position;
            }
        });
    });

    describe('convertClamped', () => {
        test('passes in-domain values through unchanged', () => {
            const scale = new LinearScale();
            scale.domain = [0, 100];
            scale.range = [0, 100];

            expect(scale.convertClamped(0)).toBe(0);
            expect(scale.convertClamped(50)).toBe(50);
            expect(scale.convertClamped(100)).toBe(100);
        });

        test('clamps out-of-domain values to the range endpoints', () => {
            const scale = new LinearScale();
            scale.domain = [0, 100];
            scale.range = [0, 100];

            expect(scale.convertClamped(-50)).toBe(0);
            expect(scale.convertClamped(150)).toBe(100);
        });

        test('clamps a reversed domain to the correctly oriented endpoint', () => {
            const scale = new LinearScale();
            scale.domain = [100, 0];
            scale.range = [0, 100];

            // Reversed domain: the high value maps to range start, the low value to range end.
            expect(scale.convertClamped(100)).toBe(0);
            expect(scale.convertClamped(0)).toBe(100);
            // Out-of-domain values clamp to the matching endpoint rather than the sorted-range bound.
            expect(scale.convertClamped(150)).toBe(0);
            expect(scale.convertClamped(-50)).toBe(100);
        });

        describe('bigint', () => {
            test('matches convert for in-domain values', () => {
                const scale = new LinearScale();
                scale.domain = [0n, 100n];
                scale.range = [0, 100];

                for (const v of [0n, 25n, 50n, 75n, 100n]) {
                    expect(scale.convertClamped(v)).toBe(scale.convert(v));
                }
            });

            test('clamps out-of-domain bigints to the range endpoints', () => {
                const scale = new LinearScale();
                scale.domain = [0n, 100n];
                scale.range = [0, 100];

                expect(scale.convertClamped(-50n)).toBe(0);
                expect(scale.convertClamped(150n)).toBe(100);
            });

            // At 1e18 the float64 ULP (~128) swallows a +1 offset, so the bigint path must clamp on
            // the exact endpoints for the offset to survive into convert().
            test('preserves sub-ULP precision at high magnitudes', () => {
                const base = 10n ** 18n;
                const scale = new LinearScale();
                scale.domain = [base, base + 1000n];
                scale.range = [0, 1000];

                expect(Number(base + 1n)).toBe(Number(base));
                expect(scale.convertClamped(base + 1n)).toBeGreaterThan(0);
                expect(scale.convertClamped(base + 1n)).toBeCloseTo(scale.convert(base + 1n));
                expect(scale.convertClamped(base - 100n)).toBe(0);
                expect(scale.convertClamped(base + 5000n)).toBe(1000);
            });
        });
    });

    describe('domainMin / domainMax', () => {
        test('returns the true min/max of a Number domain regardless of order', () => {
            const scale = new LinearScale();
            scale.domain = [100, 0];

            expect(scale.domainMin).toBe(0);
            expect(scale.domainMax).toBe(100);
        });

        test('flows the exact bigint endpoints through (no Number narrowing)', () => {
            const scale = new LinearScale();
            scale.domain = [0n, 100n];

            expect(scale.domainMin).toBe(0n);
            expect(scale.domainMax).toBe(100n);
        });

        test('orders bigint endpoints by value for a descending domain', () => {
            const scale = new LinearScale();
            scale.domain = [100n, 0n];

            expect(scale.domainMin).toBe(0n);
            expect(scale.domainMax).toBe(100n);
        });

        test('preserves bigint precision beyond Number.MAX_SAFE_INTEGER', () => {
            const lo = 10n ** 18n;
            const hi = lo + 1n;
            expect(Number(lo)).toBe(Number(hi)); // both collapse to the same Number

            const scale = new LinearScale();
            scale.domain = [lo, hi];

            expect(scale.domainMin).toBe(lo);
            expect(scale.domainMax).toBe(hi);
        });

        test('orders narrow-collapsed bigint endpoints by exact value for a descending domain', () => {
            const hi = 10n ** 18n + 1n;
            const lo = 10n ** 18n;
            expect(Number(hi)).toBe(Number(lo)); // both collapse to the same Number, so the caches tie

            const scale = new LinearScale();
            // Descending + narrow-collapse: ordering must come from the exact bigints, not the tied caches.
            scale.domain = [hi, lo];

            expect(scale.domainMin).toBe(lo);
            expect(scale.domainMax).toBe(hi);
        });
    });

    describe('ticks bigint', () => {
        const tickParams: ScaleTickParams<number> = {
            nice: [true, true],
            interval: undefined,
            tickCount: undefined,
            minTickCount: 0,
            maxTickCount: Infinity,
        };

        test('generates full-precision BigInt ticks for a BigInt domain', () => {
            const scale = new LinearScale();
            scale.range = [0, 600];

            const { ticks } = scale.ticks(tickParams, [0n, 100n]);
            expect(ticks).toEqual([0n, 20n, 40n, 60n, 80n, 100n]);
        });

        test('nices a BigInt domain outward to step multiples', () => {
            const scale = new LinearScale();
            expect(scale.niceDomain(tickParams, [13n, 97n])).toEqual([0n, 100n]);
        });

        test('honours a custom interval when nicing a BigInt domain', () => {
            const scale = new LinearScale();
            // With interval 30 the bounds must snap to multiples of 30 (Number path), not the auto
            // bigint step that would otherwise produce [0, 100].
            expect(scale.niceDomain({ ...tickParams, interval: 30 }, [13n, 97n])).toEqual([0, 120]);
        });

        // Ticks beyond Number.MAX_SAFE_INTEGER keep exact values.
        test('keeps exact tick values for spans larger than Number.MAX_SAFE_INTEGER', () => {
            const scale = new LinearScale();
            scale.range = [0, 600];

            const span = 10n ** 21n;
            const { ticks } = scale.ticks(tickParams, [0n, span]);
            expect(ticks).toEqual([0n, 2n * 10n ** 20n, 4n * 10n ** 20n, 6n * 10n ** 20n, 8n * 10n ** 20n, span]);
        });

        test('narrows to the Number path when an interval is supplied', () => {
            const scale = new LinearScale();
            scale.range = [0, 100];

            // A custom interval is a Number concept; the bigint domain narrows and the Number path runs.
            const { ticks } = scale.ticks({ ...tickParams, interval: 25 }, [0n, 100n]);
            expect(ticks).toEqual([0, 25, 50, 75, 100]);
        });
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

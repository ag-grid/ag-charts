import { afterEach, describe, expect, it, vi } from 'vitest';

import { LinearScale, OrdinalTimeScale, ScaleAlignment, UnitTimeScale } from 'ag-charts-core';
import type { AgNumericValue } from 'ag-charts-types';

import { NiceMode } from './axisUtil';
import { estimateScaleTickCount, generateTicks } from './generateTicks';
import { withTemporaryDomain } from './generateTicksUtils';

// `numericBands` is a protected derived cache; bracket access keeps it typed without a cast.
const numericBandsOf = (scale: OrdinalTimeScale) => scale['numericBands'];

// A minTickCount close to tickCount makes buildTickData's overlap loop iterate linearly instead of
// converging by binary search, which hangs on deeply zoomed ordinal-time domains.
describe('estimateScaleTickCount', () => {
    function estimate(domainLength: number, rangeExtent: number, zoomExtent: number) {
        const scale = new OrdinalTimeScale();
        const domain = Array.from({ length: domainLength }, (_, i) => new Date(2023, 0, 1, 0, i));
        scale.domain = domain;
        scale.range = [0, rangeExtent];

        return estimateScaleTickCount({
            scale,
            domain,
            range: [0, rangeExtent] as [number, number],
            visibleRange: [0.5 - zoomExtent / 2, 0.5 + zoomExtent / 2] as [number, number],
            label: { enabled: true, fontSize: 14, avoidCollisions: true } as any,
            defaultTickMinSpacing: 50,
            interval: undefined,
        } as any);
    }

    it('should allow full binary search range for large domains with deep zoom', () => {
        const result = estimate(10_000, 300, 0.002);

        // The search only converges efficiently while minTickCount stays far below tickCount.
        const binarySearchRange = result.tickCount - result.minTickCount;
        expect(binarySearchRange).toBeGreaterThanOrEqual(result.tickCount * 0.9);
    });

    it('should allow full binary search range for small domains', () => {
        const result = estimate(100, 300, 0.5);

        const binarySearchRange = result.tickCount - result.minTickCount;
        expect(binarySearchRange).toBeGreaterThanOrEqual(result.tickCount * 0.9);
    });
});

// The restore must reinstate exact bigint endpoints, or adjacent high-magnitude bigints collapse onto one pixel.
describe('withTemporaryDomain', () => {
    it('restores exact bigint domain endpoints after temporarily narrowing for tick generation', () => {
        const lo = 9_007_199_254_740_990n;
        const hi = 9_007_199_254_741_000n;

        const scale = new LinearScale();
        scale.domain = [lo, hi];
        scale.range = [0, 1000];

        const narrowedDomain: AgNumericValue[] = [Number(lo), Number(hi)];
        withTemporaryDomain(scale, narrowedDomain, () => {});

        expect(scale.convert(lo)).toBeLessThan(scale.convert(hi));

        // Above 2^53 these adjacent bigints share one float64 value, so only exact endpoints keep them distinct.
        const p5 = scale.convert(lo + 5n);
        const p6 = scale.convert(lo + 6n);
        const p7 = scale.convert(lo + 7n);
        expect(p5).toBeLessThan(p6);
        expect(p6).toBeLessThan(p7);
    });

    // Tick generation swaps the domain in and out once per phase; rebuilding the bands each time is what
    // made a million-point unit-time create allocate them repeatedly.
    it('reuses the unit-time bands across repeated swaps from an empty scale domain', () => {
        const scale = new UnitTimeScale();
        scale.range = [0, 1000];
        scale.interval = 'day';
        const niceDomain = () => [new Date(2024, 0, 1), new Date(2024, 11, 31)];

        let bands: readonly Date[] | undefined;
        for (let i = 0; i < 3; i++) {
            withTemporaryDomain(scale, niceDomain(), () => {
                bands ??= scale.bands;
                expect(scale.bands).toBe(bands);
            });
            expect(scale.domain).toEqual([]);
        }

        expect(bands).toHaveLength(366);
    });
});

// Tick generation narrows an ordinal-time scale to the nice domain and back; rebuilding the original's
// band arrays on every restore costs one Date -> number pass per band on large domains.
describe('withTemporaryDomain on an ordinal-time scale', () => {
    it('keeps the band caches of the original domain', () => {
        const domain = Array.from({ length: 5000 }, (_, i) => new Date(2023, 0, 1, 0, i));
        const scale = new OrdinalTimeScale();
        scale.domain = domain;
        scale.range = [0, 1000];

        const { bands } = scale;
        const numericBands = numericBandsOf(scale);

        withTemporaryDomain(scale, domain.slice(100, 200), () => {
            expect(scale.bands).toHaveLength(100);
        });

        expect(scale.domain).toBe(domain);
        expect(scale.bands).toBe(bands);
        expect(numericBandsOf(scale)).toBe(numericBands);
    });
});

// A full tick-generation pass swaps the nice domain in more than once (raw ticks, then formatting); the
// original domain's band arrays must be the same objects afterwards, and the ticks must not depend on them.
describe('generateTicks on an ordinal-time scale', () => {
    class RecordingScale extends OrdinalTimeScale {
        readonly swaps: Date[][] = [];
        override restoreDomain(snapshot: Date[]) {
            if (snapshot !== this.domain) this.swaps.push(this.domain);
            super.restoreDomain(snapshot);
        }
    }

    function run(scale: OrdinalTimeScale, tickDomain: Date[], niceMode: NiceMode[]) {
        return generateTicks({
            label: { enabled: true, fontSize: 12, avoidCollisions: true, autoRotate: false } as any,
            parallel: true,
            axisRotation: Math.PI / -2,
            scale,
            domain: tickDomain,
            range: [0, 800],
            visibleRange: [0, 1],
            niceMode,
            reverse: false,
            primaryTickCount: undefined,
            defaultTickMinSpacing: 50,
            labelOffset: 0,
            sideFlag: -1,
            interval: undefined,
            tickFormatter: () => (value: any) => (value instanceof Date ? value.toISOString() : String(value)),
        } as any);
    }

    function create(domain: Date[]) {
        const scale = new RecordingScale();
        scale.domain = domain;
        scale.range = [0, 800];
        return scale;
    }

    // The scale holds the full domain while ticks are generated over a narrower one, as when the axis lays
    // ticks out for a domain other than the one its scale last had set.
    const domain = Array.from({ length: 20_000 }, (_, i) => new Date(2023, 0, 1, 0, i * 3 + 1));
    const tickDomain = domain.slice(2_000, 18_000);

    it.each([
        ['nice domain', [NiceMode.TickAndDomain]],
        ['ticks only', [NiceMode.TicksOnly]],
        ['no nice mode', []],
    ])('leaves the band arrays of the original domain untouched (%s)', (_name, niceMode) => {
        const scale = create(domain);
        const { bands } = scale;
        const numericBands = numericBandsOf(scale);

        run(scale, tickDomain, niceMode);

        expect(scale.domain).toBe(domain);
        expect(scale.bands).toBe(bands);
        expect(numericBandsOf(scale)).toBe(numericBands);
    });

    it('narrows the scale to a different domain during the pass', () => {
        // Guards the test above: an identity check proves nothing if no swap ever happens.
        const scale = create(domain);
        run(scale, tickDomain, [NiceMode.TickAndDomain]);

        expect(scale.swaps.length).toBeGreaterThan(0);
    });

    it('produces the same ticks on a repeat pass over the cached scale as on a fresh one', () => {
        const scale = create(domain);
        const first = run(scale, tickDomain, [NiceMode.TickAndDomain]);
        const second = run(scale, tickDomain, [NiceMode.TickAndDomain]);
        const fresh = run(create(domain), tickDomain, [NiceMode.TickAndDomain]);

        const labels = (result: ReturnType<typeof run>) => result.tickData.ticks.map((t) => t.tickLabel);
        expect(labels(first).length).toBeGreaterThan(0);
        expect(labels(second)).toEqual(labels(first));
        expect(labels(fresh)).toEqual(labels(first));
        expect(second.tickData.niceDomain).toEqual(first.tickData.niceDomain);
    });

    describe('without numericBands built beforehand', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        // A bar series reads a handful of positions after the axis has laid out its ticks; neither step may
        // pay for a Date -> number pass over every band of a large domain.
        it.each([
            ['nice domain', [NiceMode.TickAndDomain]],
            ['ticks only', [NiceMode.TicksOnly]],
        ])('builds none for a tick pass and a few lookups (%s)', (_name, niceMode) => {
            const builds = vi.spyOn(OrdinalTimeScale.prototype as any, 'numericBands', 'get');
            const scale = create(domain);

            run(scale, tickDomain, niceMode);
            const bandWidth = 3 * 60_000;
            for (const index of [0, 5_000, 12_345, 19_999]) {
                const date = domain[index];
                scale.convert(date);
                scale.convert(new Date(date.valueOf() + bandWidth / 3));
                scale.findIndex(date);
            }

            expect(builds).not.toHaveBeenCalled();
        });

        it('positions values as a scale that has its numericBands built', () => {
            const lazy = create(domain);
            const built = create(domain);
            numericBandsOf(built);

            run(lazy, tickDomain, [NiceMode.TickAndDomain]);

            for (const index of [0, 1, 7_777, 19_998, 19_999]) {
                const date = new Date(domain[index].valueOf() + 60_000);
                expect(lazy.convert(date)).toBe(built.convert(date));
                expect(lazy.convert(date, { alignment: ScaleAlignment.Trailing })).toBe(
                    built.convert(date, { alignment: ScaleAlignment.Trailing })
                );
            }
        });
    });

    it('rebuilds the band arrays for a new domain set between passes', () => {
        const scale = create(domain);
        run(scale, tickDomain, [NiceMode.TickAndDomain]);
        const numericBands = numericBandsOf(scale);

        const next = domain.slice(0, 15_000);
        scale.domain = next;
        run(scale, tickDomain, [NiceMode.TickAndDomain]);

        expect(scale.bands).toHaveLength(15_000);
        expect(numericBandsOf(scale)).not.toBe(numericBands);
        expect(numericBandsOf(scale)).toEqual(next.map((d) => d.valueOf()));
    });
});

// The band flush is measured off the label nodes, which carry the rotation the axis renders with,
// while `createLabelData` compares in a frame that adds `defaultRotation` - so handing the callback
// the latter measures a layout a quarter turn from the one that will be applied.
describe('labelBandOffsets', () => {
    it('is asked for the rotation the axis renders with, not the collision-check frame', () => {
        const scale = new LinearScale();
        scale.domain = [0, 100];
        scale.range = [0, 600];

        const requested: number[] = [];
        const result = generateTicks({
            label: { enabled: true, fontSize: 12, avoidCollisions: true, autoRotate: false } as any,
            // A horizontal axis, where `defaultRotation` is a quarter turn and a `verticalAlign`
            // flush applies.
            parallel: true,
            axisRotation: Math.PI / -2,
            scale,
            domain: [0, 100],
            range: [0, 600],
            visibleRange: [0, 1],
            niceMode: [],
            reverse: false,
            primaryTickCount: undefined,
            defaultTickMinSpacing: 50,
            labelOffset: 0,
            sideFlag: -1,
            interval: undefined,
            labelBandOffsets: (_ticks: unknown, rotation: number) => {
                requested.push(rotation);
                return undefined;
            },
            tickFormatter: () => (value: any) => String(value),
        } as any);

        expect(requested.length).toBeGreaterThan(0);
        for (const rotation of requested) {
            expect(rotation).toBe(result.rotation);
        }
    });
});

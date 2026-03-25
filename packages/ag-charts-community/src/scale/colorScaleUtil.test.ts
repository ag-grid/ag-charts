import { describe, expect, test } from '@jest/globals';

import { computeColorBins, deriveNormalizedStops, formatColorScaleBinLabel } from 'ag-charts-core';

import { ColorScale } from './colorScale';
import { configureColorScale } from './colorScaleUtil';

describe('computeColorBins', () => {
    describe('discrete mode', () => {
        test('equal bins with no stops', () => {
            const result = computeColorBins(
                [{ color: 'red' }, { color: 'yellow' }, { color: 'green' }],
                [0, 100],
                'discrete'
            );

            expect(result.bins).toHaveLength(3);
            expect(result.bins[0]).toEqual({ start: 0, end: expect.closeTo(33.33, 1), color: 'red', name: undefined });
            expect(result.bins[1]).toEqual({
                start: expect.closeTo(33.33, 1),
                end: expect.closeTo(66.67, 1),
                color: 'yellow',
                name: undefined,
            });
            expect(result.bins[2]).toEqual({
                start: expect.closeTo(66.67, 1),
                end: 100,
                color: 'green',
                name: undefined,
            });

            expect(result.domain).toEqual([0, expect.closeTo(33.33, 1), expect.closeTo(66.67, 1), 100]);
            expect(result.range).toEqual(['red', 'yellow', 'green']);
        });

        test('explicit stops', () => {
            const result = computeColorBins(
                [{ color: 'red', stop: 40 }, { color: 'yellow', stop: 80 }, { color: 'green' }],
                [0, 100],
                'discrete'
            );

            expect(result.bins).toHaveLength(3);
            expect(result.bins[0]).toEqual({ start: 0, end: 40, color: 'red', name: undefined });
            expect(result.bins[1]).toEqual({ start: 40, end: 80, color: 'yellow', name: undefined });
            expect(result.bins[2]).toEqual({ start: 80, end: 100, color: 'green', name: undefined });
        });

        test('named bins', () => {
            const result = computeColorBins(
                [
                    { color: 'red', name: 'Low' },
                    { color: 'yellow', name: 'Medium' },
                    { color: 'green', name: 'High' },
                ],
                [0, 100],
                'discrete'
            );

            expect(result.bins[0].name).toBe('Low');
            expect(result.bins[1].name).toBe('Medium');
            expect(result.bins[2].name).toBe('High');
        });

        test('empty fills returns empty result', () => {
            const result = computeColorBins([], [0, 100], 'discrete');
            expect(result.domain).toEqual([]);
            expect(result.range).toEqual([]);
            expect(result.bins).toEqual([]);
        });

        test('mixed stops: first colour has no stop, others explicit', () => {
            // {red}, {yellow, stop:60}, {lightgreen, stop:80}, {green}
            // Red and yellow share [0,60) equally: red=[0,30), yellow=[30,60)
            const result = computeColorBins(
                [
                    { color: 'red' },
                    { color: 'yellow', stop: 60 },
                    { color: 'lightgreen', stop: 80 },
                    { color: 'green' },
                ],
                [0, 100],
                'discrete'
            );

            expect(result.bins).toHaveLength(4);
            expect(result.bins[0]).toEqual({ start: 0, end: 30, color: 'red', name: undefined });
            expect(result.bins[1]).toEqual({ start: 30, end: 60, color: 'yellow', name: undefined });
            expect(result.bins[2]).toEqual({ start: 60, end: 80, color: 'lightgreen', name: undefined });
            expect(result.bins[3]).toEqual({ start: 80, end: 100, color: 'green', name: undefined });
        });

        test('two colours produces two equal bins', () => {
            const result = computeColorBins([{ color: 'red' }, { color: 'green' }], [0, 100], 'discrete');

            expect(result.bins).toHaveLength(2);
            expect(result.bins[0]).toEqual({ start: 0, end: 50, color: 'red', name: undefined });
            expect(result.bins[1]).toEqual({ start: 50, end: 100, color: 'green', name: undefined });
        });

        test('five colours no stops produces five equal bins', () => {
            const result = computeColorBins(
                [{ color: 'a' }, { color: 'b' }, { color: 'c' }, { color: 'd' }, { color: 'e' }],
                [0, 100],
                'discrete'
            );

            expect(result.bins).toHaveLength(5);
            expect(result.bins[0]).toEqual({ start: 0, end: 20, color: 'a', name: undefined });
            expect(result.bins[1]).toEqual({ start: 20, end: 40, color: 'b', name: undefined });
            expect(result.bins[2]).toEqual({ start: 40, end: 60, color: 'c', name: undefined });
            expect(result.bins[3]).toEqual({ start: 60, end: 80, color: 'd', name: undefined });
            expect(result.bins[4]).toEqual({ start: 80, end: 100, color: 'e', name: undefined });
        });

        test('negative domain', () => {
            const result = computeColorBins(
                [{ color: 'red' }, { color: 'white' }, { color: 'green' }],
                [-50, 50],
                'discrete'
            );

            expect(result.bins).toHaveLength(3);
            expect(result.bins[0].start).toBeCloseTo(-50);
            expect(result.bins[0].end).toBeCloseTo(-50 + 100 / 3, 1);
            expect(result.bins[1].start).toBeCloseTo(-50 + 100 / 3, 1);
            expect(result.bins[1].end).toBeCloseTo(-50 + 200 / 3, 1);
            expect(result.bins[2].start).toBeCloseTo(-50 + 200 / 3, 1);
            expect(result.bins[2].end).toBe(50);
        });

        test('JIRA example: 4 colours with explicit stops', () => {
            // {red, stop:40}, {yellow, stop:60}, {lightgreen, stop:80}, {green}
            // stop defines the boundary after the fill's segment
            const result = computeColorBins(
                [
                    { color: 'red', stop: 40 },
                    { color: 'yellow', stop: 60 },
                    { color: 'lightgreen', stop: 80 },
                    { color: 'green' },
                ],
                [0, 100],
                'discrete'
            );

            expect(result.bins).toHaveLength(4);
            expect(result.bins[0]).toEqual({ start: 0, end: 40, color: 'red', name: undefined });
            expect(result.bins[1]).toEqual({ start: 40, end: 60, color: 'yellow', name: undefined });
            expect(result.bins[2]).toEqual({ start: 60, end: 80, color: 'lightgreen', name: undefined });
            expect(result.bins[3]).toEqual({ start: 80, end: 100, color: 'green', name: undefined });
        });
    });

    describe('continuous mode', () => {
        test('returns domain/range without bins', () => {
            const result = computeColorBins(
                [
                    { color: 'red', stop: 0 },
                    { color: 'green', stop: 100 },
                ],
                [0, 100],
                'continuous'
            );

            expect(result.domain).toEqual([0, 100]);
            expect(result.range).toEqual(['red', 'green']);
            expect(result.bins).toEqual([]);
        });

        test('auto-spreads stops for fills without explicit stops', () => {
            const result = computeColorBins(
                [{ color: 'red' }, { color: 'yellow' }, { color: 'green' }],
                [0, 100],
                'continuous'
            );

            expect(result.domain).toEqual([0, 50, 100]);
            expect(result.range).toEqual(['red', 'yellow', 'green']);
        });

        test('explicit stops with gaps auto-fill evenly', () => {
            // {red}, {yellow, stop:60}, {lightgreen, stop:80}, {green}
            // In continuous mode, red (no stop) anchors at d0=0
            const result = computeColorBins(
                [
                    { color: 'red' },
                    { color: 'yellow', stop: 60 },
                    { color: 'lightgreen', stop: 80 },
                    { color: 'green' },
                ],
                [0, 100],
                'continuous'
            );

            expect(result.domain[0]).toBe(0);
            expect(result.domain[1]).toBe(60);
            expect(result.domain[2]).toBe(80);
            expect(result.domain[3]).toBe(100);
            expect(result.range).toEqual(['red', 'yellow', 'lightgreen', 'green']);
            expect(result.bins).toEqual([]);
        });

        test('all explicit stops', () => {
            const result = computeColorBins(
                [
                    { color: 'red', stop: 0 },
                    { color: 'yellow', stop: 60 },
                    { color: 'lightgreen', stop: 80 },
                    { color: 'green', stop: 100 },
                ],
                [0, 100],
                'continuous'
            );

            expect(result.domain).toEqual([0, 60, 80, 100]);
            expect(result.range).toEqual(['red', 'yellow', 'lightgreen', 'green']);
            expect(result.bins).toEqual([]);
        });

        test('consecutive items without stops divide space equally', () => {
            // {blue}, {red}, {pink, stop:60} on [0, 100]
            // Blue and red auto-fill [0, 60]: blue at 0, red at 30
            const result = computeColorBins(
                [{ color: 'blue' }, { color: 'red' }, { color: 'pink', stop: 60 }],
                [0, 100],
                'continuous'
            );

            expect(result.domain[0]).toBe(0);
            expect(result.domain[1]).toBe(30);
            expect(result.domain[2]).toBe(60);
            expect(result.range).toEqual(['blue', 'red', 'pink']);
        });

        test('empty fills returns empty result', () => {
            const result = computeColorBins([], [0, 100], 'continuous');
            expect(result.domain).toEqual([]);
            expect(result.range).toEqual([]);
            expect(result.bins).toEqual([]);
        });
    });
});

describe('formatColorScaleBinLabel', () => {
    const formatValue = (v: number, maximumFractionDigits?: number) => v.toFixed(maximumFractionDigits ?? 2);

    test('uses name when available', () => {
        const bin = { start: 0, end: 50, color: 'red', name: 'Low' };
        expect(formatColorScaleBinLabel(bin, 0, [bin], formatValue)).toBe('Low');
    });

    test('formats integer range with dash', () => {
        const bins = [
            { start: 0, end: 50, color: 'red' },
            { start: 50, end: 100, color: 'green' },
        ];
        expect(formatColorScaleBinLabel(bins[0], 0, bins, formatValue)).toBe('0–49');
    });

    test('formats last bin without subtracting 1', () => {
        const bins = [
            { start: 0, end: 50, color: 'red' },
            { start: 50, end: 100, color: 'green' },
        ];
        expect(formatColorScaleBinLabel(bins[1], 1, bins, formatValue)).toBe('50.00–100.00');
    });

    test('formats decimal range', () => {
        const bins = [{ start: 0.5, end: 1.5, color: 'red' }];
        expect(formatColorScaleBinLabel(bins[0], 0, bins, formatValue)).toBe('0.50–1.50');
    });

    test('formats three equal integer bins', () => {
        const bins = [
            { start: 0, end: 33, color: 'red' },
            { start: 33, end: 66, color: 'yellow' },
            { start: 66, end: 100, color: 'green' },
        ];
        expect(formatColorScaleBinLabel(bins[0], 0, bins, formatValue)).toBe('0–32');
        expect(formatColorScaleBinLabel(bins[1], 1, bins, formatValue)).toBe('33–65');
        expect(formatColorScaleBinLabel(bins[2], 2, bins, formatValue)).toBe('66.00–100.00');
    });

    test('formats negative ranges', () => {
        const bins = [
            { start: -50, end: 0, color: 'red' },
            { start: 0, end: 50, color: 'green' },
        ];
        expect(formatColorScaleBinLabel(bins[0], 0, bins, formatValue)).toBe('-50–-1');
        expect(formatColorScaleBinLabel(bins[1], 1, bins, formatValue)).toBe('0.00–50.00');
    });

    test('named bins override range display for all positions', () => {
        const bins = [
            { start: 0, end: 33, color: 'red', name: 'Low' },
            { start: 33, end: 66, color: 'yellow', name: 'Medium' },
            { start: 66, end: 100, color: 'green', name: 'High' },
        ];
        expect(formatColorScaleBinLabel(bins[0], 0, bins, formatValue)).toBe('Low');
        expect(formatColorScaleBinLabel(bins[1], 1, bins, formatValue)).toBe('Medium');
        expect(formatColorScaleBinLabel(bins[2], 2, bins, formatValue)).toBe('High');
    });

    test('single bin with width less than 1 uses decimal format', () => {
        const bins = [{ start: 0, end: 0.5, color: 'red' }];
        expect(formatColorScaleBinLabel(bins[0], 0, bins, formatValue)).toBe('0.00–0.50');
    });
});

describe('configureColorScale', () => {
    test('fills path uses computeColorBins', () => {
        const scale = new ColorScale();
        configureColorScale(
            scale,
            { fills: [{ color: 'red' }, { color: 'green' }], domain: undefined, mode: 'discrete' },
            [0, 100],
            []
        );
        expect(scale.mode).toBe('discrete');
        expect(scale.domain).toEqual([0, 50, 100]);
        expect(scale.range).toEqual(['red', 'green']);
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.5, color: 'red' },
            { stop: 0.5, color: 'green' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('fallback path sets continuous mode', () => {
        const scale = new ColorScale();
        configureColorScale(scale, { fills: [], domain: undefined, mode: 'continuous' }, [10, 90], ['blue', 'orange']);
        expect(scale.mode).toBe('continuous');
        expect(scale.domain).toEqual([10, 90]);
        expect(scale.range).toEqual(['blue', 'orange']);
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'blue' },
            { stop: 1, color: 'orange' },
        ]);
    });

    test('fallback path with 3 colours evenly spaces gradient stops', () => {
        const scale = new ColorScale();
        configureColorScale(
            scale,
            { fills: [], domain: undefined, mode: 'continuous' },
            [0, 100],
            ['red', 'yellow', 'green']
        );
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.5, color: 'yellow' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('continuous fills produce normalised gradient stops', () => {
        const scale = new ColorScale();
        configureColorScale(
            scale,
            {
                fills: [
                    { color: 'red', stop: 0 },
                    { color: 'yellow', stop: 60 },
                    { color: 'green', stop: 100 },
                ],
                domain: undefined,
                mode: 'continuous',
            },
            [0, 100],
            []
        );
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.6, color: 'yellow' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('explicit domain overrides data domain for fills', () => {
        const scale = new ColorScale();
        configureColorScale(
            scale,
            { fills: [{ color: 'red' }, { color: 'green' }], domain: [20, 80], mode: 'discrete' },
            [0, 100],
            []
        );
        expect(scale.domain[0]).toBe(20);
        expect(scale.domain.at(-1)).toBe(80);
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.5, color: 'red' },
            { stop: 0.5, color: 'green' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('no-op when dataDomain has fewer than 2 values', () => {
        const scale = new ColorScale();
        const originalDomain = [...scale.domain];
        const originalRange = [...scale.range];
        configureColorScale(
            scale,
            { fills: [{ color: 'red' }, { color: 'green' }], domain: undefined, mode: 'continuous' },
            [42],
            []
        );
        expect(scale.domain).toEqual(originalDomain);
        expect(scale.range).toEqual(originalRange);
    });

    test('no-op when fills and fallbackRange are both empty', () => {
        const scale = new ColorScale();
        const originalDomain = [...scale.domain];
        const originalRange = [...scale.range];
        configureColorScale(scale, { fills: [], domain: undefined, mode: 'continuous' }, [0, 100], []);
        expect(scale.domain).toEqual(originalDomain);
        expect(scale.range).toEqual(originalRange);
    });

    test('accepts raw domain array and extracts min/max', () => {
        const scale = new ColorScale();
        configureColorScale(
            scale,
            { fills: [], domain: undefined, mode: 'continuous' },
            [10, 20, 30, 90],
            ['blue', 'orange']
        );
        expect(scale.domain).toEqual([10, 90]);
        expect(scale.range).toEqual(['blue', 'orange']);
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'blue' },
            { stop: 1, color: 'orange' },
        ]);
    });
});

describe('deriveNormalizedStops', () => {
    test('continuous with matching domain/range lengths', () => {
        const scale = new ColorScale();
        scale.domain = [0, 60, 100];
        scale.range = ['red', 'yellow', 'green'];
        scale.update();
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.6, color: 'yellow' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('continuous with 2-element domain and 3 colours (fallback path)', () => {
        const scale = new ColorScale();
        scale.domain = [0, 100];
        scale.range = ['red', 'yellow', 'green'];
        scale.update();
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.5, color: 'yellow' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('discrete with N+1 domain boundaries', () => {
        const scale = new ColorScale();
        scale.mode = 'discrete';
        scale.domain = [0, 50, 100];
        scale.range = ['red', 'green'];
        scale.update();
        expect(deriveNormalizedStops(scale)).toEqual([
            { stop: 0, color: 'red' },
            { stop: 0.5, color: 'red' },
            { stop: 0.5, color: 'green' },
            { stop: 1, color: 'green' },
        ]);
    });

    test('empty range returns empty stops', () => {
        const scale = new ColorScale();
        scale.range = [];
        expect(deriveNormalizedStops(scale)).toEqual([]);
    });
});

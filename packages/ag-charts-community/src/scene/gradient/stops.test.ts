import { describe, expect, test } from '@jest/globals';

import { buildGradientLegendDatum } from '../../chart/legend/legendDatum';
import { ColorScale } from '../../scale/colorScale';
import { configureColorScale, resolveStopPositions } from '../../scale/colorScaleUtil';
import { discreteColorStops, getColorStops } from './stops';

describe('stops', () => {
    describe('resolveStopPositions', () => {
        describe('continuous mode', () => {
            test('all stops defined returns exact values', () => {
                const fills = [{ stop: 0 }, { stop: 60 }, { stop: 80 }, { stop: 100 }];
                expect(resolveStopPositions(fills, 0, 100, false)).toEqual([0, 60, 80, 100]);
            });

            test('no stops defined evenly spaces across domain', () => {
                const fills = [{}, {}, {}];
                expect(resolveStopPositions(fills, 0, 100, false)).toEqual([0, 50, 100]);
            });

            test('no stops defined with 4 items', () => {
                const fills = [{}, {}, {}, {}];
                const result = resolveStopPositions(fills, 0, 90, false);
                expect(result).toEqual([0, 30, 60, 90]);
            });

            test('mixed: some stops defined, gaps auto-fill between anchors', () => {
                // {blue}, {red}, {pink, stop:60}
                // Blue and red auto-fill [0, 60]: blue at 0, red at 30
                const fills = [{}, {}, { stop: 60 }];
                const result = resolveStopPositions(fills, 0, 100, false);
                expect(result[0]).toBe(0);
                expect(result[1]).toBe(30);
                expect(result[2]).toBe(60);
            });

            test('gap between two defined stops', () => {
                // {stop:0}, {}, {stop:90}, {stop:100}
                // Middle entry auto-fills between 0 and 90: at 45
                const fills = [{ stop: 0 }, {}, { stop: 90 }, { stop: 100 }];
                const result = resolveStopPositions(fills, 0, 100, false);
                expect(result).toEqual([0, 45, 90, 100]);
            });

            test('multiple gaps between defined stops', () => {
                // {stop:0}, {}, {}, {stop:90}
                // Two entries auto-fill [0, 90]: at 30 and 60
                const fills = [{ stop: 0 }, {}, {}, { stop: 90 }];
                const result = resolveStopPositions(fills, 0, 100, false);
                expect(result).toEqual([0, 30, 60, 90]);
            });

            test('negative domain', () => {
                const fills = [{}, {}, {}];
                expect(resolveStopPositions(fills, -100, 100, false)).toEqual([-100, 0, 100]);
            });
        });

        describe('discrete mode', () => {
            test('no stops defined produces bin-end positions', () => {
                const fills = [{}, {}, {}];
                const result = resolveStopPositions(fills, 0, 100, true);
                // 3 bins: ends at 33.33, 66.67, 100
                expect(result[0]).toBeCloseTo(33.33, 1);
                expect(result[1]).toBeCloseTo(66.67, 1);
                expect(result[2]).toBe(100);
            });

            test('all stops defined returns exact values', () => {
                const fills = [{ stop: 40 }, { stop: 80 }, { stop: 100 }];
                expect(resolveStopPositions(fills, 0, 100, true)).toEqual([40, 80, 100]);
            });

            test('mixed stops: first undefined, rest defined', () => {
                // {}, {stop:60}, {stop:80}
                const fills = [{}, { stop: 60 }, { stop: 80 }];
                const result = resolveStopPositions(fills, 0, 100, true);
                expect(result[0]).toBe(30);
                expect(result[1]).toBe(60);
                expect(result[2]).toBe(80);
            });
        });
    });

    describe('discreteColorStops', () => {
        test('produces sharp transitions for 3 colour stops', () => {
            const input = [
                { stop: 0, color: 'red' },
                { stop: 0.33, color: 'yellow' },
                { stop: 0.66, color: 'green' },
            ];
            const result = discreteColorStops(input);

            // Each stop gets duplicated with next colour: [red, yellow@0], [yellow, green@0.33], [green]
            expect(result).toHaveLength(5);
            expect(result[0]).toEqual({ stop: 0, color: 'red' });
            expect(result[1]).toEqual({ stop: 0, color: 'yellow' });
            expect(result[2]).toEqual({ stop: 0.33, color: 'yellow' });
            expect(result[3]).toEqual({ stop: 0.33, color: 'green' });
            expect(result[4]).toEqual({ stop: 0.66, color: 'green' });
        });

        test('two colour stops produces 3 entries', () => {
            const input = [
                { stop: 0, color: 'red' },
                { stop: 0.5, color: 'blue' },
            ];
            const result = discreteColorStops(input);

            expect(result).toHaveLength(3);
            expect(result[0]).toEqual({ stop: 0, color: 'red' });
            expect(result[1]).toEqual({ stop: 0, color: 'blue' });
            expect(result[2]).toEqual({ stop: 0.5, color: 'blue' });
        });

        test('single colour stop returned as-is', () => {
            const input = [{ stop: 0, color: 'red' }];
            const result = discreteColorStops(input);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ stop: 0, color: 'red' });
        });
    });

    describe('getColorStops', () => {
        const defaults = ['red', 'blue'];

        describe('continuous mode', () => {
            test('empty fills falls back to default colour stops', () => {
                const result = getColorStops([], defaults, [0, 100], 'continuous');
                expect(result).toHaveLength(2);
                expect(result[0].color).toBe('red');
                expect(result[1].color).toBe('blue');
                expect(result[0].stop).toBe(0);
                expect(result[1].stop).toBe(1);
            });

            test('explicit stops produce correctly normalised gradient positions', () => {
                const result = getColorStops(
                    [
                        { color: 'red', stop: 0 },
                        { color: 'yellow', stop: 60 },
                        { color: 'green', stop: 100 },
                    ],
                    defaults,
                    [0, 100],
                    'continuous'
                );

                expect(result).toHaveLength(3);
                expect(result[0]).toEqual({ stop: 0, color: 'red' });
                expect(result[1]).toEqual({ stop: 0.6, color: 'yellow' });
                expect(result[2]).toEqual({ stop: 1, color: 'green' });
            });

            test('string fills are treated as colour-only entries', () => {
                const result = getColorStops(['red', 'yellow', 'green'], defaults, [0, 100], 'continuous');

                expect(result).toHaveLength(3);
                expect(result[0].color).toBe('red');
                expect(result[1].color).toBe('yellow');
                expect(result[2].color).toBe('green');
                expect(result[0].stop).toBe(0);
                expect(result[1].stop).toBe(0.5);
                expect(result[2].stop).toBe(1);
            });
        });

        describe('discrete mode', () => {
            test('empty fills falls back to default colour stops with sharp transitions', () => {
                const result = getColorStops([], defaults, [0, 100], 'discrete');
                // Default 2 colours in discrete mode: [red, blue@0.5], [blue]
                expect(result.length).toBeGreaterThanOrEqual(2);
                // Should have doubled stops for sharp transitions
                expect(result.length).toBe(3);
            });

            test('explicit stops produce sharp gradient transitions', () => {
                const result = getColorStops(
                    [
                        { color: 'red', stop: 0 },
                        { color: 'yellow', stop: 50 },
                        { color: 'green', stop: 100 },
                    ],
                    defaults,
                    [0, 100],
                    'discrete'
                );

                // 3 input stops → 5 output (each boundary doubled except last)
                expect(result).toHaveLength(5);
                // First stop is red, with yellow at same position for sharp transition
                expect(result[0].color).toBe('red');
                expect(result[1].color).toBe('yellow');
                expect(result[0].stop).toBe(result[1].stop);
            });

            test('string fills in discrete mode produce sharp transitions', () => {
                const result = getColorStops(['red', 'green'], defaults, [0, 100], 'discrete');
                // 2 colours → 3 entries (sharp transition at boundary)
                expect(result).toHaveLength(3);
            });
        });
    });

    describe('buildGradientLegendDatum', () => {
        test('builds datum from configured ColorScale', () => {
            const scale = new ColorScale();
            configureColorScale(
                scale,
                { fills: [], domain: undefined, mode: 'continuous' },
                [0, 100],
                ['red', 'green']
            );

            const datum = buildGradientLegendDatum(scale, 'series-1', true, [{ seriesId: 'series-1', key: 'value' }]);
            expect(datum.legendType).toBe('gradient');
            expect(datum.enabled).toBe(true);
            expect(datum.seriesId).toBe('series-1');
            expect(datum.axisDomain).toEqual([0, 100]);
            expect(datum.colorStops).toEqual([
                { stop: 0, color: 'red' },
                { stop: 1, color: 'green' },
            ]);
            expect(datum.series).toEqual([{ seriesId: 'series-1', key: 'value' }]);
        });
    });
});

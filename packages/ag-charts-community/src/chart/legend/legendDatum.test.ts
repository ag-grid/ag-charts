import { describe, expect, test } from '@jest/globals';

import { ColorScale } from '../../scale/colorScale';
import { FormatManager } from '../formatter/formatManager';
import {
    type ColorScaleLegendFormatterContext,
    buildColorCategoryLegendData,
    buildGradientLegendDatum,
} from './legendDatum';

describe('legendDatum', () => {
    describe('buildColorCategoryLegendData', () => {
        // Mirrors the legacy `(v, d) => v.toFixed(d ?? 2)` behaviour by routing through
        // the chart-level formatter. Used by tests that assert on the literal label text.
        function fixedDigitsFormatterContext(): ColorScaleLegendFormatterContext {
            const formatManager = new FormatManager();
            formatManager.setFormatter({
                color: (p) => {
                    const fractionDigits = p.type === 'number' ? p.fractionDigits : undefined;
                    return (p.value as number).toFixed(fractionDigits ?? 2);
                },
            });
            return {
                formatManager,
                formatInContext: (fn, params) => fn(params),
                key: 'value',
                legendItemName: undefined,
                boundSeries: [{ seriesId: 'series-1', key: 'value', name: undefined }],
            };
        }

        test('creates one legend item per bin', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 50, 100];
            scale.range = ['red', 'green'];
            scale.update();

            const fills = [{ color: 'red' }, { color: 'green' }];
            const result = buildColorCategoryLegendData(scale, fills, 'series-1', true, fixedDigitsFormatterContext());

            expect(result).toHaveLength(2);
            expect(result[0].legendType).toBe('category');
            expect(result[0].symbol.marker.fill).toBe('red');
            expect(result[0].symbol.marker.shape).toBe('square');
            expect(result[0].isFixed).toBe(true);
            expect(result[0].hideToggleOtherSeries).toBe(true);
            expect(result[0].suppressHighlight).toBe(true);
            expect(result[1].symbol.marker.fill).toBe('green');
        });

        test('uses fill name for label when provided', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 50, 100];
            scale.range = ['red', 'green'];
            scale.update();

            const fills = [
                { color: 'red', name: 'Low' },
                { color: 'green', name: 'High' },
            ];
            const result = buildColorCategoryLegendData(scale, fills, 'series-1', true, fixedDigitsFormatterContext());

            expect(result[0].label.text).toBe('Low');
            expect(result[1].label.text).toBe('High');
        });

        test('formats range label when no name provided', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 50, 100];
            scale.range = ['red', 'green'];
            scale.update();

            const fills = [{ color: 'red' }, { color: 'green' }];
            const result = buildColorCategoryLegendData(scale, fills, 'series-1', true, fixedDigitsFormatterContext());

            expect(result[0].label.text).toBe('0\u201349');
            expect(result[1].label.text).toBe('50.00\u2013100.00');
        });

        test('returns empty array for empty range', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.range = [];
            const result = buildColorCategoryLegendData(scale, [], 'series-1', true, fixedDigitsFormatterContext());
            expect(result).toEqual([]);
        });

        test('passes seriesId and enabled through to each datum', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 50, 100];
            scale.range = ['red', 'green'];
            scale.update();

            const fills = [{ color: 'red' }, { color: 'green' }];
            const result = buildColorCategoryLegendData(
                scale,
                fills,
                'my-series',
                false,
                fixedDigitsFormatterContext()
            );

            expect(result[0].seriesId).toBe('my-series');
            expect(result[0].enabled).toBe(false);
            expect(result[0].id).toBe('my-series');
            expect(result[0].itemId).toBe(0);
            expect(result[1].itemId).toBe(1);
        });

        test('routes bin labels through chart-level formatter.color callback', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 50, 100];
            scale.range = ['red', 'green'];
            scale.update();

            const formatManager = new FormatManager();
            formatManager.setFormatter({ color: (p) => `[${p.value}]` });

            const result = buildColorCategoryLegendData(scale, [{ color: 'red' }, { color: 'green' }], 's', true, {
                formatManager,
                formatInContext: (fn, params) => fn(params),
                key: 'value',
                legendItemName: undefined,
                boundSeries: [{ seriesId: 's', key: 'value', name: undefined }],
            });

            expect(result[0].label.text).toBe('[0]\u2013[49]');
            expect(result[1].label.text).toBe('[50]\u2013[100]');
        });

        test('reports source: gradient-legend and property: color to the user formatter', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 100];
            scale.range = ['red'];
            scale.update();

            const formatManager = new FormatManager();
            const seen: { property?: string; source?: string }[] = [];
            formatManager.setFormatter({
                color: (p) => {
                    seen.push({ property: p.property, source: p.source });
                    return String(p.value);
                },
            });

            buildColorCategoryLegendData(scale, [{ color: 'red' }], 's', true, {
                formatManager,
                formatInContext: (fn, params) => fn(params),
                key: 'value',
                legendItemName: undefined,
                boundSeries: [{ seriesId: 's', key: 'value', name: undefined }],
            });

            expect(seen[0]).toEqual({ property: 'color', source: 'gradient-legend' });
        });

        test('falls back to default numeric formatting when no formatter is configured', () => {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = [0, 50, 100];
            scale.range = ['red', 'green'];
            scale.update();

            const result = buildColorCategoryLegendData(scale, [{ color: 'red' }, { color: 'green' }], 's', true, {
                formatManager: new FormatManager(),
                formatInContext: (fn, params) => fn(params),
                key: 'value',
                legendItemName: undefined,
                boundSeries: [{ seriesId: 's', key: 'value', name: undefined }],
            });

            // Default integer-bin path uses fractionDigits = 0, so no decimal places.
            expect(result[0].label.text).toBe('0\u201349');
            expect(result[1].label.text).toBe('50\u2013100');
        });
    });

    describe('buildGradientLegendDatum namedLabels', () => {
        const series = [{ seriesId: 's', key: 'color' }];

        function discreteScale(domain: number[], range: string[]): ColorScale {
            const scale = new ColorScale();
            scale.mode = 'discrete';
            scale.domain = domain;
            scale.range = range;
            scale.update();
            return scale;
        }

        function continuousScale(domain: number[], range: string[]): ColorScale {
            const scale = new ColorScale();
            scale.mode = 'continuous';
            scale.domain = domain;
            scale.range = range;
            scale.update();
            return scale;
        }

        test('undefined when no fills have names', () => {
            const scale = discreteScale([0, 50, 100], ['red', 'green']);
            const datum = buildGradientLegendDatum(scale, [{ color: 'red' }, { color: 'green' }], 's', true, series);
            expect(datum.namedLabels).toBeUndefined();
        });

        test('undefined for empty fills', () => {
            const scale = continuousScale([0, 100], ['red', 'green']);
            const datum = buildGradientLegendDatum(scale, [], 's', true, series);
            expect(datum.namedLabels).toBeUndefined();
        });

        test('discrete: labels at bin midpoints', () => {
            const scale = discreteScale([0, 50, 100], ['red', 'green']);
            const fills = [
                { color: 'red', name: 'Low' },
                { color: 'green', name: 'High' },
            ];
            const datum = buildGradientLegendDatum(scale, fills, 's', true, series);
            expect(datum.namedLabels).toEqual([
                { position: 0.25, label: 'Low' },
                { position: 0.75, label: 'High' },
            ]);
        });

        test('discrete: only named fills produce labels', () => {
            const scale = discreteScale([0, 33, 66, 100], ['red', 'yellow', 'green']);
            const fills = [
                { color: 'red', name: 'Negative' },
                { color: 'yellow' },
                { color: 'green', name: 'Positive' },
            ];
            const datum = buildGradientLegendDatum(scale, fills, 's', true, series);
            expect(datum.namedLabels).toEqual([
                { position: expect.closeTo(0.165, 2), label: 'Negative' },
                { position: expect.closeTo(0.83, 2), label: 'Positive' },
            ]);
        });

        test('continuous: labels at stop positions', () => {
            const scale = continuousScale([0, 50, 100], ['red', 'ivory', 'green']);
            const fills = [
                { color: 'red', stop: 0, name: 'Negative' },
                { color: 'ivory', stop: 50, name: 'Neutral' },
                { color: 'green', name: 'Positive' },
            ];
            const datum = buildGradientLegendDatum(scale, fills, 's', true, series);
            expect(datum.namedLabels).toEqual([
                { position: 0, label: 'Negative' },
                { position: 0.5, label: 'Neutral' },
                { position: 1, label: 'Positive' },
            ]);
        });

        test('continuous: only named fills produce labels', () => {
            const scale = continuousScale([0, 25, 50, 100], ['red', 'red', 'ivory', 'green']);
            const fills = [
                { color: 'red', stop: 0, name: 'Negative' },
                { color: 'red' },
                { color: 'ivory', stop: 50, name: 'Neutral' },
                { color: 'green', name: 'Positive' },
            ];
            const datum = buildGradientLegendDatum(scale, fills, 's', true, series);
            expect(datum.namedLabels).toEqual([
                { position: 0, label: 'Negative' },
                { position: 0.5, label: 'Neutral' },
                { position: 1, label: 'Positive' },
            ]);
        });

        test('continuous: named labels outside displayDomain are dropped', () => {
            const scale = continuousScale([-200, 0, 200], ['red', 'ivory', 'green']);
            scale.displayDomain = [0, 100];
            const fills = [
                { color: 'red', stop: -200, name: 'Off-scale low' },
                { color: 'ivory', stop: 0, name: 'Zero' },
                { color: 'green', stop: 200, name: 'Off-scale high' },
            ];
            const datum = buildGradientLegendDatum(scale, fills, 's', true, series);
            expect(datum.namedLabels).toEqual([{ position: 0, label: 'Zero' }]);
        });
    });

    describe('buildGradientLegendDatum axisDomain', () => {
        const series = [{ seriesId: 's', key: 'color' }];

        test('uses displayDomain when set (stops span wider than data)', () => {
            const scale = new ColorScale();
            scale.mode = 'continuous';
            scale.domain = [-200, 200];
            scale.range = ['red', 'green'];
            scale.displayDomain = [0, 100];
            scale.update();
            const datum = buildGradientLegendDatum(scale, [{ color: 'red' }, { color: 'green' }], 's', true, series);
            expect(datum.axisDomain).toEqual([0, 100]);
        });

        test('uses displayDomain when user-supplied domain widens visible range', () => {
            const scale = new ColorScale();
            scale.mode = 'continuous';
            scale.domain = [30, 75];
            scale.range = ['red', 'green'];
            scale.displayDomain = [-200, 200];
            scale.update();
            const datum = buildGradientLegendDatum(scale, [{ color: 'red' }, { color: 'green' }], 's', true, series);
            expect(datum.axisDomain).toEqual([-200, 200]);
        });

        test('falls back to domain min/max when displayDomain is unset', () => {
            const scale = new ColorScale();
            scale.mode = 'continuous';
            scale.domain = [10, 90];
            scale.range = ['red', 'green'];
            scale.update();
            const datum = buildGradientLegendDatum(scale, [{ color: 'red' }, { color: 'green' }], 's', true, series);
            expect(datum.axisDomain).toEqual([10, 90]);
        });

        test('continuous: clips gradient stops to [0, 1] when stops extend outside displayDomain', () => {
            const scale = new ColorScale();
            scale.mode = 'continuous';
            scale.domain = [-200, 200];
            scale.range = ['red', 'green'];
            scale.displayDomain = [0, 100];
            scale.update();
            const datum = buildGradientLegendDatum(scale, [{ color: 'red' }, { color: 'green' }], 's', true, series);
            expect(datum.colorStops[0].stop).toBe(0);
            expect(datum.colorStops.at(-1)!.stop).toBe(1);
            // every stop should be within [0, 1]
            for (const stop of datum.colorStops) {
                expect(stop.stop).toBeGreaterThanOrEqual(0);
                expect(stop.stop).toBeLessThanOrEqual(1);
            }
        });
    });
});

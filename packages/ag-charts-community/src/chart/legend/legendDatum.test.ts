import { describe, expect, test } from '@jest/globals';

import { ColorScale } from '../../scale/colorScale';
import { buildColorCategoryLegendData, buildGradientLegendDatum } from './legendDatum';

describe('buildColorCategoryLegendData', () => {
    const fmt = (v: number, digits?: number) => v.toFixed(digits ?? 2);

    test('creates one legend item per bin', () => {
        const scale = new ColorScale();
        scale.mode = 'discrete';
        scale.domain = [0, 50, 100];
        scale.range = ['red', 'green'];
        scale.update();

        const fills = [{ color: 'red' }, { color: 'green' }];
        const result = buildColorCategoryLegendData(scale, fills, 'series-1', true, fmt);

        expect(result).toHaveLength(2);
        expect(result[0].legendType).toBe('category');
        expect(result[0].symbol.marker.fill).toBe('red');
        expect(result[0].symbol.marker.shape).toBe('square');
        expect(result[0].isFixed).toBe(true);
        expect(result[0].hideToggleOtherSeries).toBe(true);
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
        const result = buildColorCategoryLegendData(scale, fills, 'series-1', true, fmt);

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
        const result = buildColorCategoryLegendData(scale, fills, 'series-1', true, fmt);

        expect(result[0].label.text).toBe('0\u201349');
        expect(result[1].label.text).toBe('50.00\u2013100.00');
    });

    test('returns empty array for empty range', () => {
        const scale = new ColorScale();
        scale.mode = 'discrete';
        scale.range = [];
        const result = buildColorCategoryLegendData(scale, [], 'series-1', true, fmt);
        expect(result).toEqual([]);
    });

    test('passes seriesId and enabled through to each datum', () => {
        const scale = new ColorScale();
        scale.mode = 'discrete';
        scale.domain = [0, 50, 100];
        scale.range = ['red', 'green'];
        scale.update();

        const fills = [{ color: 'red' }, { color: 'green' }];
        const result = buildColorCategoryLegendData(scale, fills, 'my-series', false, fmt);

        expect(result[0].seriesId).toBe('my-series');
        expect(result[0].enabled).toBe(false);
        expect(result[0].id).toBe('my-series');
        expect(result[0].itemId).toBe(0);
        expect(result[1].itemId).toBe(1);
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
        const fills = [{ color: 'red', name: 'Negative' }, { color: 'yellow' }, { color: 'green', name: 'Positive' }];
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
});

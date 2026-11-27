import { afterEach, describe, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import {
    BAND_GLOW,
    type Chart,
    deproxy,
    expectGlowBand,
    pixelsRightOf,
    setupMockCanvas,
    setupMockConsole,
    visibleItems,
} from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';

import { getFunnelConnectorNodes } from '../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../test/utils';

const STROKE = 'darkslategray';
const BASE_CHART = { animation: { enabled: false }, legend: { enabled: false } };

const SQUARE = [
    [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
    ],
];
const NIGHTINGALE = (strokeWidth: number) => ({
    data: [{ key: 'A', value: 5 }],
    series: [
        {
            type: 'nightingale',
            angleKey: 'key',
            radiusKey: 'value',
            fill: 'blue',
            fillOpacity: 1,
            stroke: STROKE,
            strokeWidth,
            glow: BAND_GLOW,
        },
    ],
});
const MAP_SHAPE = (strokeWidth: number) => ({
    data: [{ name: 'a' }],
    topology: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', properties: { name: 'a' }, geometry: { type: 'Polygon', coordinates: SQUARE } }],
    },
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            fill: 'blue',
            fillOpacity: 1,
            stroke: STROKE,
            strokeWidth,
            glow: BAND_GLOW,
        },
    ],
});
const OHLC = (strokeWidth: number) => {
    const item = { stroke: STROKE, strokeWidth };
    return {
        data: [{ x: 'Q1', open: 3.5, high: 7, low: 3, close: 3.2 }],
        series: [
            {
                type: 'ohlc',
                xKey: 'x',
                openKey: 'open',
                highKey: 'high',
                lowKey: 'low',
                closeKey: 'close',
                item: { up: item, down: item },
                glow: BAND_GLOW,
            },
        ],
    };
};
// Equal stages make a connector a rectangle with a vertical right edge, and the padding leaves room for the glow beside it.
const CONE_FUNNEL = (strokeWidth: number) => ({
    data: [
        { stage: 'A', value: 10 },
        { stage: 'B', value: 10 },
        { stage: 'C', value: 10 },
    ],
    padding: { top: 40, left: 40, right: 80, bottom: 40 },
    series: [
        {
            type: 'cone-funnel',
            stageKey: 'stage',
            valueKey: 'value',
            fills: ['blue'],
            fillOpacity: 1,
            strokes: [STROKE],
            strokeWidth,
            glow: BAND_GLOW,
        },
    ],
});

describe('the glow around a stroked item', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => {
        chart?.destroy();
    });

    type Item = (chart: Chart) => { x: number; y: number; width: number; height: number };
    const firstOf =
        (selection: 'itemSelection' | 'datumSelection'): Item =>
        (c) =>
            visibleItems(c, selection)[0];

    const expectGlowFromOuterEdge = async (options: object, item: Item, strokeWidth: number) => {
        chart = deproxy(await createEnterpriseChart({ ...BASE_CHART, ...options } as AgChartOptions));
        expectGlowBand(pixelsRightOf(chart, item(chart)), strokeWidth / 2);
    };

    describe('where the stroke is centred on the path of the item', () => {
        it.each([
            { name: 'nightingale', strokeWidth: 12, build: NIGHTINGALE, item: firstOf('itemSelection') },
            { name: 'nightingale', strokeWidth: 24, build: NIGHTINGALE, item: firstOf('itemSelection') },
            { name: 'map shape', strokeWidth: 12, build: MAP_SHAPE, item: firstOf('datumSelection') },
        ])(
            'should grow the glow of a $name a gap and a spread past the outer edge of a stroke of $strokeWidth',
            async ({ strokeWidth, build, item }) => {
                await expectGlowFromOuterEdge(build(strokeWidth), item, strokeWidth);
            }
        );
    });

    describe('where the glow is already cast from the stroke', () => {
        it.each([
            {
                name: 'OHLC bar',
                build: OHLC,
                item: (c: Chart) => {
                    const { x, y, width, height } = visibleItems(c, 'datumSelection')[0];
                    return { x: x + width / 2, y, width: 0, height };
                },
            },
            {
                name: 'cone funnel connector',
                build: CONE_FUNNEL,
                item: (c: Chart) => Transformable.toCanvas(getFunnelConnectorNodes(c)[0]),
            },
        ])('should keep the glow of a $name a gap and a spread past its stroke of 12', async ({ build, item }) => {
            await expectGlowFromOuterEdge(build(12), item, 12);
        });
    });
});

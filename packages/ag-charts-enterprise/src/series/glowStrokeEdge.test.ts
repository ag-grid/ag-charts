import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { chartPixelAt, deproxy, setupMockCanvas, setupMockConsole, visibleItems } from 'ag-charts-community-test';
import { Transformable } from 'ag-charts-core';

import { getFunnelConnectorNodes } from '../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../test/utils';

const GAP = 1;
const SPREAD = 8;
const GLOW = { blur: 0, spread: SPREAD, gap: GAP, fill: 'red', fillOpacity: 1 };
const RED = [255, 0, 0, 255];
const WHITE = [255, 255, 255, 255];
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
            glow: GLOW,
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
            glow: GLOW,
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
                glow: GLOW,
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
            glow: GLOW,
        },
    ],
});

describe('the glow around a stroked item', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: ReturnType<typeof deproxy>;
    afterEach(() => {
        chart?.destroy();
    });

    type Origin = (chart: ReturnType<typeof deproxy>) => { x: number; y: number };
    const rightEdgeOf =
        (selection: 'itemSelection' | 'datumSelection'): Origin =>
        (c) => {
            const { x, y, width, height } = visibleItems(c, selection)[0];
            return { x: x + width, y: y + height / 2 };
        };

    const expectGlowFromOuterEdge = async (options: object, origin: Origin, strokeWidth: number) => {
        chart = deproxy(await createEnterpriseChart({ ...BASE_CHART, ...options } as AgChartOptions));
        const { x, y } = origin(chart);
        const edge = strokeWidth / 2;
        const at = (distance: number) => chartPixelAt(chart, x + distance, y);

        expect(at(edge + GAP + 1)).toEqual(RED);
        expect(at(edge + GAP + SPREAD - 2)).toEqual(RED);
        expect(at(edge + GAP + SPREAD + 2)).toEqual(WHITE);
    };

    describe('where the stroke is centred on the path of the item', () => {
        it.each([
            { name: 'nightingale', strokeWidth: 12, build: NIGHTINGALE, origin: rightEdgeOf('itemSelection') },
            { name: 'nightingale', strokeWidth: 24, build: NIGHTINGALE, origin: rightEdgeOf('itemSelection') },
            { name: 'map shape', strokeWidth: 12, build: MAP_SHAPE, origin: rightEdgeOf('datumSelection') },
        ])(
            'should grow the glow of a $name a gap and a spread past the outer edge of a stroke of $strokeWidth',
            async ({ strokeWidth, build, origin }) => {
                await expectGlowFromOuterEdge(build(strokeWidth), origin, strokeWidth);
            }
        );
    });

    describe('where the glow is already cast from the stroke', () => {
        it.each([
            {
                name: 'OHLC bar',
                build: OHLC,
                origin: (c: ReturnType<typeof deproxy>) => {
                    const { x, y, width, height } = visibleItems(c, 'datumSelection')[0];
                    return { x: x + width / 2, y: y + height / 2 };
                },
            },
            {
                name: 'cone funnel connector',
                build: CONE_FUNNEL,
                origin: (c: ReturnType<typeof deproxy>) => {
                    const { x, y, width, height } = Transformable.toCanvas(getFunnelConnectorNodes(c)[0]);
                    return { x: x + width, y: y + height / 2 };
                },
            },
        ])('should keep the glow of a $name a gap and a spread past its stroke of 12', async ({ build, origin }) => {
            await expectGlowFromOuterEdge(build(12), origin, 12);
        });
    });
});

import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgMarkerShape } from 'ag-charts-community';
import { getLegendItemNodes, getSeriesOptions, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../test/utils';
import { ukData } from './map-test/ukData';
import ukTopology from './map-test/ukTopology.json';

type ResolvedOptions = {
    shape?: unknown;
    marker?: { shape?: unknown };
    item?: Record<string, { marker?: { shape?: unknown } }>;
};

interface Case {
    type: string;
    /** Index of the first series of the type; map-marker follows a `map-shape-background` series. */
    firstIndex: number;
    base: object;
    series: (shape: AgMarkerShape | undefined, name: string) => object;
    items: string[];
    /** hlc is excluded: its legend always draws a bands glyph. */
    legend: boolean;
}

const DATA = [
    { x: 'A', lo: 1, hi: 5, cl: 3, v: 2 },
    { x: 'B', lo: 2, hi: 6, cl: 4, v: 3 },
    { x: 'C', lo: 1, hi: 4, cl: 2, v: 5 },
];

const CASES: Case[] = [
    {
        type: 'radar-line',
        firstIndex: 0,
        base: { data: DATA },
        series: (shape, name) => ({
            type: 'radar-line',
            angleKey: 'x',
            radiusKey: 'v',
            radiusName: name,
            marker: { shape },
        }),
        items: [],
        legend: true,
    },
    {
        type: 'radar-area',
        firstIndex: 0,
        base: { data: DATA },
        series: (shape, name) => ({
            type: 'radar-area',
            angleKey: 'x',
            radiusKey: 'v',
            radiusName: name,
            marker: { enabled: true, shape },
        }),
        items: [],
        legend: true,
    },
    {
        type: 'range-area',
        firstIndex: 0,
        base: { data: DATA },
        series: (shape, name) => ({
            type: 'range-area',
            xKey: 'x',
            yLowKey: 'lo',
            yHighKey: 'hi',
            yName: name,
            marker: { shape },
        }),
        items: ['low', 'high'],
        legend: true,
    },
    {
        type: 'hlc',
        firstIndex: 0,
        base: { data: DATA },
        series: (shape) => ({
            type: 'hlc',
            xKey: 'x',
            highKey: 'hi',
            lowKey: 'lo',
            closeKey: 'cl',
            marker: { shape },
        }),
        items: ['high', 'low', 'close'],
        legend: false,
    },
    {
        type: 'map-marker',
        firstIndex: 1,
        base: { data: ukData, topology: ukTopology, legend: { enabled: true } },
        series: (shape, name) => ({ type: 'map-marker', idKey: 'name', title: name, shape }),
        items: [],
        legend: true,
    },
];

const PALETTE: AgMarkerShape[] = ['square', 'triangle'];
const SERIES_COUNT = 3;

describe('palette.markerShapes', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async ({ type, base, series }: Case, explicit?: AgMarkerShape) => {
        const background = type === 'map-marker' ? [{ type: 'map-shape-background' }] : [];
        const shapes = Array.from({ length: SERIES_COUNT }, (_, i) => (i === 0 ? explicit : undefined));
        chart = await createEnterpriseChart({
            ...base,
            theme: { palette: { markerShapes: PALETTE } },
            series: [...background, ...shapes.map((shape, i) => series(shape, `series ${i}`))],
        } as AgChartOptions);
    };

    const seriesShapes = ({ type, firstIndex }: Case) =>
        Array.from({ length: SERIES_COUNT }, (_, i) => {
            const options = getSeriesOptions<ResolvedOptions>(chart!, firstIndex + i);
            return type === 'map-marker' ? options.shape : options.marker?.shape;
        });

    const itemShapes = ({ firstIndex }: Case, item: string) =>
        Array.from(
            { length: SERIES_COUNT },
            (_, i) => getSeriesOptions<ResolvedOptions>(chart!, firstIndex + i).item?.[item]?.marker?.shape
        );

    describe.each(CASES)('$type', (spec) => {
        it.each([
            ['rotates through the palette by series index', undefined, ['square', 'triangle', 'square']],
            [
                'keeps an explicit shape and leaves the others at their index',
                'diamond',
                ['diamond', 'triangle', 'square'],
            ],
        ] as const)('%s', async (_name, explicit, expected) => {
            await create(spec, explicit);

            expect(seriesShapes(spec)).toEqual(expected);
            for (const item of spec.items) {
                expect(itemShapes(spec, item)).toEqual(expected);
            }
        });
    });

    it.each(CASES.filter((spec) => spec.legend))(
        '$type draws legend markers in the resolved series shape',
        async (spec) => {
            await create(spec, 'diamond');

            const legendShapes = getLegendItemNodes(chart!).map((node) => node.marker?.shape);
            expect(legendShapes).toEqual(['diamond', 'triangle', 'square']);
            expect(legendShapes).toEqual(seriesShapes(spec));
        }
    );
});

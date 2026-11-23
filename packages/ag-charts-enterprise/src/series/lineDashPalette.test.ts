import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions, AgLineDashName } from 'ag-charts-community';
import {
    compareImageSnapshot,
    getLegendItemNodes,
    getSeriesAt,
    getSeriesOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { collectShapes, createEnterpriseChart, drawnLineDashes } from '../test/utils';

type Dash = number[] | AgLineDashName;
type ResolvedOptions = {
    lineDash?: number[];
    marker?: { lineDash?: number[] };
    item?: Record<string, ResolvedOptions>;
};

interface Case {
    type: string;
    /** The data keys of the series at `index`, each series drawn apart from the others. */
    keys: (index: number) => object;
    /** The option that names the series in the legend. */
    nameKey: string;
    items: string[];
}

const SERIES_COUNT = 4;

/** `hi0`..`hi3` and `lo0`..`lo3`, each series 3 above the one before so that their strokes do not overlap. */
const DATA = [5, 7, 4, 6].map((value, i) => {
    const datum: Record<string, string | number> = { x: 'ABCD'[i] };
    for (let index = 0; index < SERIES_COUNT; index++) {
        datum[`hi${index}`] = value + 3 * index;
        datum[`lo${index}`] = value + 3 * index - 2;
    }
    return datum;
});

const CASES: Case[] = [
    { type: 'line', keys: (i) => ({ xKey: 'x', yKey: `hi${i}` }), nameKey: 'yName', items: [] },
    { type: 'area', keys: (i) => ({ xKey: 'x', yKey: `hi${i}`, fillOpacity: 0.2 }), nameKey: 'yName', items: [] },
    {
        type: 'range-area',
        keys: (i) => ({ xKey: 'x', yLowKey: `lo${i}`, yHighKey: `hi${i}` }),
        nameKey: 'yName',
        items: ['low', 'high'],
    },
    { type: 'radar-line', keys: (i) => ({ angleKey: 'x', radiusKey: `hi${i}` }), nameKey: 'radiusName', items: [] },
    {
        type: 'radar-area',
        keys: (i) => ({ angleKey: 'x', radiusKey: `hi${i}`, fillOpacity: 0.2 }),
        nameKey: 'radiusName',
        items: [],
    },
];

/** A dash array and a stock name, which scales by the `strokeWidth` of 2: `'dot'` is `[2, 3]`. */
const PALETTE: Dash[] = [[12, 4], 'dot'];
const DOT = [2, 3];

describe('palette.lineDashes', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;
    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: object) => {
        chart = await createEnterpriseChart({ width: 600, height: 400, ...options } as AgChartOptions);
        await waitForChartStability(chart);
        return chart;
    };

    const seriesDash = (index: number) => getSeriesOptions<ResolvedOptions>(chart!, index).lineDash;

    const drawnDashes = (index: number) =>
        drawnLineDashes(collectShapes(getSeriesAt(chart!, index).contentGroup)).drawn;

    it.each(CASES)(
        '$type rotates the palette by series index, behind an explicit lineDash',
        async ({ type, keys, nameKey, items }) => {
            // Series 0 sets a dash shorter than the palette's, so none of the palette's elements may show through.
            const explicit: (Dash | undefined)[] = [[2], undefined, undefined, undefined];
            const expected = [[2], DOT, [12, 4], DOT];

            await create({
                data: DATA,
                theme: { palette: { lineDashes: PALETTE } },
                series: explicit.map((lineDash, i) => ({
                    type,
                    ...keys(i),
                    strokeWidth: 2,
                    lineDash,
                    [nameKey]: `s${i}`,
                })),
            });

            expect(expected.map((_, i) => seriesDash(i))).toEqual(expected);
            for (const item of items) {
                const itemDashes = expected.map((_, i) => getSeriesOptions<ResolvedOptions>(chart!, i).item?.[item]);
                expect(itemDashes.map((options) => options?.lineDash)).toEqual(expected);
            }
            expect(getLegendItemNodes(chart!).map((node) => node.line?.lineDash)).toEqual(expected);
            await compareImageSnapshot(chart!, ctx);
        }
    );

    it('replaces the base theme palette and leaves other strokes solid, under stylers too', async () => {
        await create({
            data: DATA,
            theme: {
                baseTheme: {
                    palette: {
                        lineDashes: [
                            [1, 1],
                            [2, 2],
                            [3, 3],
                        ],
                    },
                },
                palette: { lineDashes: [[8, 4]] },
            },
            series: [
                { type: 'bar', xKey: 'x', yKey: 'lo0', strokeWidth: 2 },
                { type: 'line', xKey: 'x', yKey: 'hi1', marker: { strokeWidth: 2 } },
                { type: 'line', xKey: 'x', yKey: 'hi2', styler: () => ({ lineDash: [2] }) },
                {
                    type: 'area',
                    xKey: 'x',
                    yKey: 'hi3',
                    fillOpacity: 0.2,
                    strokeWidth: 2,
                    styler: () => ({ lineDash: [] }),
                },
            ],
        });

        // The custom palette replaces the base theme's whole: every series takes `[8, 4]`, none `[2, 2]` or `[3, 3]`.
        expect([1, 2, 3].map(seriesDash)).toEqual([
            [8, 4],
            [8, 4],
            [8, 4],
        ]);
        expect(seriesDash(0)).toEqual([0]);
        expect(getSeriesOptions<ResolvedOptions>(chart!, 1).marker?.lineDash).toEqual([0]);

        // A styler's array layers over solid, not over the palette's pattern.
        expect([0, 1, 2, 3].map(drawnDashes)).toEqual([new Set(), new Set(['8,4']), new Set(['2']), new Set()]);
        await compareImageSnapshot(chart!, ctx);
    });
});

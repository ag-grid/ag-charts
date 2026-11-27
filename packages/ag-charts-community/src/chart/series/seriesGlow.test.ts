import { afterEach, describe, expect, it } from 'vitest';

import { type Group, Rect, Shape } from 'ag-charts-core';
import type { AgChartOptions, AgGlowOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import { Marker } from '../marker/marker';
import { COMMUNITY_GLOW_SERIES, glowCaseNamed, glowSeries } from '../test/glowCases';
import { endHover, hoverDatum } from '../test/glowRender';
import { useGlowCharts } from '../test/glowRenderSuite';
import { getSeriesAt, getSeriesOptions } from '../test/seriesAccessors';
import {
    SERIES_GLOW,
    SERIES_SHADOW,
    THEME_GLOW,
    XY_DATA,
    customMarkerShape,
    glowShadow,
    shapesOf,
    uncastGlows,
} from '../test/shadowFixtures';
import {
    SINGLE_HIGHLIGHT_SHARED_TOOLTIP,
    createChart,
    deproxy,
    expectWarningMessages,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

const DATA = XY_DATA.map(({ x, y }, i) => ({ x, v: y, w: i + 2 }));

/** What each shared series case draws its items as, and whether it shares a category with the item hovered on another series. */
const SHAPES: Record<string, { kind: abstract new (...args: any[]) => Shape; sharesCategory: boolean }> = {
    // The bar rects go through the item style path, the markers through `applyMarkerStyle`.
    bar: { kind: Rect, sharesCategory: true },
    scatter: { kind: Marker, sharesCategory: false },
    'line markers': { kind: Marker, sharesCategory: true },
};

describe.each(Object.keys(SHAPES).map((name) => glowCaseNamed(COMMUNITY_GLOW_SERIES, name)))(
    'series-level glow ($name)',
    (testCase) => {
        const { kind, sharesCategory } = SHAPES[testCase.name];
        const charts = useGlowCharts(createChart);
        const { chart } = charts;

        const data = testCase.data.map((datum, i) => ({ ...datum, other: i + 2 }));
        const itemCount = data.length;

        /** One series over the shared data, with the series-level `glow` where the series reads it from. */
        const series = (
            which: 'first' | 'second',
            glow: object | undefined,
            opts: { shadow?: object; highlight?: object } = {}
        ) => ({
            ...glowSeries(testCase, { glow, shadow: opts.shadow }, opts.highlight),
            ...(which === 'second' ? { yKey: 'other' } : {}),
        });

        const create = async (seriesOptions: object[], options: object = {}) => {
            await charts.create(seriesOptions, data, {
                animation: { enabled: false },
                legend: { enabled: false },
                ...options,
            });
            return {
                inPlace: (i = 0) => shapesOf(getSeriesAt(chart(), i).contentGroup, kind),
                highlighted: (i = 0) =>
                    shapesOf(getSeriesAt(chart(), i).highlightNodeGroup, kind).filter((s) => s.visible),
                hover: (datumIndex: number) => hoverDatum(chart(), 0, datumIndex),
            };
        };

        describe('with nothing hovered', () => {
            it('casts the glow in the glow slot of every item, and nothing in the shadow slot', async () => {
                const { inPlace, highlighted } = await create([series('first', SERIES_GLOW)]);

                expect(inPlace()).toHaveLength(itemCount);
                for (const shape of inPlace()) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                    expect(shape.fillShadow?.enabled).not.toBe(true);
                }
                expect(highlighted()).toHaveLength(0);
            });

            it('casts the glow beside the shadow, each in its own slot', async () => {
                const { inPlace } = await create([series('first', SERIES_GLOW, { shadow: SERIES_SHADOW })]);

                for (const shape of inPlace()) {
                    expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
                    expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                }
            });

            it('casts the theme glow for a glow with no fields, as the presence of the glow turns it on', async () => {
                const { inPlace } = await create([series('first', {})]);

                expect(inPlace()).toHaveLength(itemCount);
                for (const shape of inPlace()) expect(shape.fillGlow).toMatchObject(glowShadow(THEME_GLOW));
            });

            it('casts no glow where enabled is false, or where none is set', async () => {
                for (const glow of [{ ...SERIES_GLOW, enabled: false }, undefined]) {
                    const { inPlace } = await create([series('first', glow)]);
                    for (const shape of inPlace()) expect(shape.fillGlow?.enabled).not.toBe(true);
                }
            });

            it('leaves the resting series glow unchanged by the highlight buckets, which apply only on hover', async () => {
                const { inPlace } = await create([
                    series('first', SERIES_GLOW, {
                        highlight: {
                            highlightedItem: { glow: { blur: 9 } },
                            highlightedSeries: { glow: { blur: 7 } },
                            unhighlightedItem: { glow: { blur: 11 } },
                            unhighlightedSeries: { glow: { blur: 13 } },
                        },
                    }),
                ]);

                for (const shape of inPlace()) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            });
        });

        describe('with the first item hovered, over two series', () => {
            const BUCKETS = {
                highlightedItem: { glow: { blur: 9 } },
                highlightedSeries: { glow: { blur: 7, spread: 1 } },
                unhighlightedItem: { glow: { blur: 11 } },
                unhighlightedSeries: { glow: { blur: 13 } },
            };

            const hoverFirst = async (
                glow: object | undefined,
                highlight: object,
                shadow?: object,
                chartOptions: object = SINGLE_HIGHLIGHT_SHARED_TOOLTIP
            ) => {
                const result = await create(
                    [series('first', glow, { highlight, shadow }), series('second', glow, { highlight, shadow })],
                    chartOptions
                );
                await result.hover(0);
                return result;
            };

            it('casts the highlight copy from highlightedItem over highlightedSeries over the series, field by field', async () => {
                const { highlighted } = await hoverFirst(SERIES_GLOW, BUCKETS);

                expect(highlighted()).toHaveLength(1);
                expect(highlighted()[0].fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 9, spread: 1 }));
                expect(highlighted()[0].fillShadow?.enabled).not.toBe(true);
            });

            it('casts no glow from the in-place copy of the hovered item, which its highlight copy casts', async () => {
                const { inPlace } = await hoverFirst(SERIES_GLOW, BUCKETS);

                expect(inPlace()[0].fillGlow?.enabled).not.toBe(true);
            });

            it('casts the other items of the hovered series from unhighlightedItem over highlightedSeries over the series', async () => {
                const { inPlace } = await hoverFirst(SERIES_GLOW, BUCKETS);

                const [, ...others] = inPlace();
                expect(others).toHaveLength(itemCount - 1);
                for (const shape of others) {
                    expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11, spread: 1 }));
                }
            });

            it.runIf(sharesCategory)(
                'casts the item of the other series that shares the hovered category as the hovered item, in place',
                async () => {
                    const { inPlace, highlighted } = await hoverFirst(SERIES_GLOW, BUCKETS, undefined, {
                        highlight: { mode: 'shared' },
                    });

                    const hoveredGlow = glowShadow({ ...SERIES_GLOW, blur: 9, spread: 1 });
                    expect(highlighted()[0].fillGlow).toMatchObject(hoveredGlow);
                    expect(highlighted(1)).toHaveLength(0);

                    const [match, ...others] = inPlace(1);
                    expect(match.fillGlow).toMatchObject(hoveredGlow);
                    expect(others).toHaveLength(itemCount - 1);
                    for (const shape of others) {
                        expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 13 }));
                    }
                }
            );

            it('casts the other series from unhighlightedSeries over the series', async () => {
                const { inPlace, highlighted } = await hoverFirst(SERIES_GLOW, BUCKETS);

                expect(inPlace(1)).toHaveLength(itemCount);
                for (const shape of inPlace(1)) {
                    expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 13 }));
                }
                expect(highlighted(1)).toHaveLength(0);
            });

            it('keeps the series glow wherever the buckets set no glow, as they inherit it on or off', async () => {
                const { inPlace, highlighted } = await hoverFirst(SERIES_GLOW, {});

                expect(highlighted()[0].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                expect(inPlace()[0].fillGlow?.enabled).not.toBe(true);
                for (const shape of [...inPlace().slice(1), ...inPlace(1)]) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                }
            });

            it('turns every bucket on with a glow with no fields, and dims the neighbours with the theme glow', async () => {
                const { inPlace, highlighted } = await hoverFirst({}, {});

                expect(highlighted()[0].fillGlow).toMatchObject(glowShadow(THEME_GLOW));
                for (const shape of [...inPlace().slice(1), ...inPlace(1)]) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(THEME_GLOW));
                }
            });

            it('lets a bucket turn the glow off for its state alone', async () => {
                const { inPlace, highlighted } = await hoverFirst(SERIES_GLOW, {
                    unhighlightedItem: { glow: { enabled: false } },
                });

                expect(highlighted()[0].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                for (const shape of inPlace().slice(1)) expect(shape.fillGlow?.enabled).not.toBe(true);
                for (const shape of inPlace(1)) expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
            });

            it('lets a bucket turn a glow on that the series does not set', async () => {
                const { inPlace, highlighted } = await hoverFirst(undefined, {
                    highlightedItem: { glow: SERIES_GLOW },
                });

                expect(highlighted()[0].fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                for (const shape of [...inPlace(), ...inPlace(1)]) expect(shape.fillGlow?.enabled).not.toBe(true);
            });

            it('casts the series shadow in place and none from the highlight copy, with the glow in the other slot', async () => {
                const { inPlace, highlighted } = await hoverFirst(SERIES_GLOW, BUCKETS, SERIES_SHADOW);

                for (const shape of [...inPlace(), ...inPlace(1)])
                    expect(shape.fillShadow).toMatchObject(SERIES_SHADOW);
                expect(highlighted()[0].fillShadow?.enabled).not.toBe(true);
                expect(highlighted()[0].fillGlow?.enabled).toBe(true);
            });

            it('moves the in-place gap with the hover: the item left glows again, and the item reached stops', async () => {
                const { inPlace, hover } = await hoverFirst(SERIES_GLOW, BUCKETS);
                const [first, second, third] = inPlace();
                expect(first.fillGlow?.enabled).not.toBe(true);
                expect(second.fillGlow?.enabled).toBe(true);

                await hover(1);

                expect(first.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11, spread: 1 }));
                expect(second.fillGlow?.enabled).not.toBe(true);
                expect(third.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, blur: 11, spread: 1 }));
            });

            it('returns every item to the series glow when the hover ends', async () => {
                const { inPlace } = await hoverFirst(SERIES_GLOW, BUCKETS);
                await endHover(chart());

                for (const shape of [...inPlace(), ...inPlace(1)]) {
                    expect(shape.fillGlow).toMatchObject(glowShadow(SERIES_GLOW));
                }
                // The highlight layer is hidden, so nothing it holds is drawn.
                expect(getSeriesAt(chart()).highlightGroup.visible).toBe(false);
            });
        });

        describe('validation', () => {
            it('warns about a glow offset, which a glow does not have, and still casts the glow', async () => {
                const { inPlace } = await create([series('first', { ...SERIES_GLOW, xOffset: 4 })]);

                expectWarningMessages([expect.stringContaining('glow.xOffset')]);
                for (const shape of inPlace()) expect(shape.fillGlow?.enabled).toBe(true);
            });

            it('warns about a negative spread and drops it, leaving the theme spread', async () => {
                await create([series('first', { ...SERIES_GLOW, spread: -3 })]);

                expectWarningMessages([expect.stringContaining('glow.spread')]);
                const glow = getSeriesOptions<{ glow?: AgGlowOptions; marker?: { glow?: AgGlowOptions } }>(chart());
                expect((glow.glow ?? glow.marker?.glow)?.spread).toBe(THEME_GLOW.spread);
            });

            it('warns about a negative gap and drops it, leaving the theme gap', async () => {
                const { inPlace } = await create([series('first', { ...SERIES_GLOW, gap: -3 })]);

                expectWarningMessages([expect.stringContaining('glow.gap')]);
                for (const shape of inPlace()) expect(shape.fillGlow?.gap).toBe(THEME_GLOW.gap);
            });
        });

        describe('gap', () => {
            it('takes the theme gap by default', async () => {
                const { inPlace } = await create([series('first', SERIES_GLOW)]);

                for (const shape of inPlace()) expect(shape.fillGlow?.gap).toBe(THEME_GLOW.gap);
            });

            it.each([0, 4])('carries a gap of %s to the glow of every item', async (gap) => {
                const { inPlace } = await create([series('first', { ...SERIES_GLOW, gap })]);

                expect(inPlace()).toHaveLength(itemCount);
                for (const shape of inPlace())
                    expect(shape.fillGlow).toMatchObject(glowShadow({ ...SERIES_GLOW, gap }));
            });
        });
    }
);

describe('series-level glow on phantom nodes', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => chart?.destroy());

    // The phantoms draw the filtered-out part of each item, one for each item.
    const PHANTOM_DATA = DATA.map((datum) => ({ ...datum, f: datum.v / 2 }));

    const phantomChart = async (series: object) => {
        chart = deproxy(
            await createChart({
                data: PHANTOM_DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [{ ...series, glow: SERIES_GLOW, highlight: { highlightedItem: { glow: { blur: 9 } } } }],
            } as AgChartOptions)
        );
        await waitForChartStability(chart);
        return getSeriesAt(chart);
    };
    const glowing = (root: Group) =>
        shapesOf(root, Shape).filter((shape) => shape.visible && shape.fillGlow?.enabled === true);
    const phantomsOf = (root: Group) => shapesOf(root, Shape).filter((shape) => shape.parentNode?.name === 'phantom');

    // The bar phantoms are not batched: the items cast the glow, the phantoms none.
    it('casts the glow of bar items and not of their phantoms', async () => {
        const { contentGroup, highlightGroup } = await phantomChart({
            type: 'bar',
            xKey: 'x',
            yKey: 'v',
            yFilterKey: 'f',
        });
        const phantoms = Array(PHANTOM_DATA.length).fill(expect.stringContaining('"phantom"'));

        // An item and its phantom each, and only the phantoms are left uncast.
        expect(glowing(contentGroup)).toHaveLength(PHANTOM_DATA.length * 2);
        expect(uncastGlows(contentGroup)).toEqual(phantoms);

        await hoverDatum(chart);

        for (const label of uncastGlows(contentGroup)) expect(label).toContain('"phantom"');
        expect(glowing(highlightGroup).length).toBeGreaterThan(uncastGlows(highlightGroup).length);
    });

    // The donut phantoms cast their shadow through the group of the items, and have no glow to cast.
    it('casts the glow of donut items and not of their phantoms', async () => {
        const { contentGroup, highlightGroup } = await phantomChart({
            type: 'donut',
            angleKey: 'v',
            angleFilterKey: 'f',
        });

        expect(phantomsOf(contentGroup)).toHaveLength(PHANTOM_DATA.length);
        expect(glowing(contentGroup)).toHaveLength(PHANTOM_DATA.length);
        expect(uncastGlows(contentGroup)).toEqual([]);
        for (const phantom of phantomsOf(contentGroup)) expect(glowing(contentGroup)).not.toContain(phantom);

        await hoverDatum(chart);

        expect(phantomsOf(highlightGroup).length).toBeGreaterThan(0);
        expect(glowing(highlightGroup).length).toBeGreaterThan(0);
        expect(uncastGlows(highlightGroup)).toEqual([]);
        for (const root of [contentGroup, highlightGroup]) {
            for (const phantom of phantomsOf(root)) expect(phantom.fillGlow?.enabled).not.toBe(true);
        }
    });
});

describe('series-level glow on a custom marker', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;
    afterEach(() => chart?.destroy());

    it.each([
        ['scatter', { type: 'scatter', xKey: 'x', yKey: 'v', shape: customMarkerShape }],
        ['line', { type: 'line', xKey: 'x', yKey: 'v', marker: { enabled: true, shape: customMarkerShape } }],
    ])('casts none from a %s marker', async (_name, series) => {
        const glow = SERIES_GLOW;
        const withGlow = 'marker' in series ? { ...series, marker: { ...series.marker, glow } } : { ...series, glow };
        chart = deproxy(
            await createChart({
                data: DATA,
                animation: { enabled: false },
                legend: { enabled: false },
                series: [withGlow],
            } as AgChartOptions)
        );
        await waitForChartStability(chart);

        const markers = shapesOf(getSeriesAt(chart).contentGroup, Marker);
        expect(markers).toHaveLength(XY_DATA.length);
        for (const marker of markers) expect(marker.fillGlow?.enabled).not.toBe(true);
    });
});

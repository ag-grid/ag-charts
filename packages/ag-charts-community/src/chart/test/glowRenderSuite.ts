import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { byteDifference, differingBytes, expectSamePixels } from './expectSamePixels';
import { type GlowPlacement, type GlowSeriesCase, type HighlightStep, glowSeries, glowThemeOptions } from './glowCases';
import { RENDER_CROP, RENDER_OPTIONS, canvasImage, endHover, hoverDatum, hoverNode, hoverSeries } from './glowRender';
import { HIGHLIGHT_GLOW, HIGHLIGHT_SHADOW, SERIES_GLOW, SERIES_SHADOW } from './shadowFixtures';
import { compareImageSnapshot, setupMockCanvas, setupMockConsole, waitForChartStability } from './utils';

const CAST: GlowPlacement = { shadow: SERIES_SHADOW, glow: SERIES_GLOW };
const HOVERED_ITEM = { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW };

/** The second series of a chart: its legend item is hidden, as it would share a label with the first and differ in fill. */
const otherSeries = (
    testCase: GlowSeriesCase,
    { placement = {}, highlight }: { placement?: GlowPlacement; highlight?: object }
) => ({
    ...glowSeries(testCase, placement, highlight),
    ...(testCase.itemHighlightOnly ? {} : { showInLegend: false }),
});

/** What is hovered: the first item of the series, or the series as a whole, as its legend item would. */
type Hover = true | 'series';

const hoverCase = (chart: AgChartInstance, { hoverDatum: datumOf }: GlowSeriesCase, hover: Hover = true) => {
    if (hover === 'series') return hoverSeries(chart);
    return datumOf ? hoverNode(chart, datumOf(chart)) : hoverDatum(chart);
};

/** Each highlight state of a series of items. */
export const HIGHLIGHT_STATES: HighlightStep[] = [
    { state: 'highlighted-item', bucket: 'highlightedItem', hover: true },
    { state: 'unhighlighted-item', bucket: 'unhighlightedItem', hover: true },
    { state: 'highlighted-series', bucket: 'highlightedSeries', hover: 'series' },
    { state: 'unhighlighted-series', bucket: 'unhighlightedSeries', hover: true, onOtherSeries: true },
];

/**
 * Draws the charts of a render test through `factory`, one at a time, and compares or reads what they draw. Call it in the
 * body of a `describe`: it sets up the mock canvas and console, and destroys the chart after each test.
 */
export function useGlowCharts(factory: (options: AgChartOptions) => Promise<AgChartInstance>) {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (series: object[], data: object[], options: object = RENDER_OPTIONS) => {
        chart?.destroy();
        chart = await factory({ data, ...options, series } as AgChartOptions);
        await waitForChartStability(chart);
        return chart;
    };

    return {
        create,
        chart: () => chart!,
        /** Snapshots the part of the canvas in `bbox`, which is {@link RENDER_CROP} unless a test crops closer. */
        snapshot: (bbox: typeof RENDER_CROP = RENDER_CROP) => compareImageSnapshot(chart!, { ...ctx, bbox }),
        /** The render of a chart, as read from its own canvas, so that two charts of a test can be compared. */
        render: async (
            testCase: GlowSeriesCase,
            placement: GlowPlacement,
            {
                highlight,
                hover,
                themed = false,
                other,
            }: {
                highlight?: object;
                hover?: Hover;
                themed?: boolean;
                /** A second series, the same as the first, that the first is hovered beside, with its own placement and highlight. */
                other?: { placement?: GlowPlacement; highlight?: object };
            } = {}
        ) => {
            await create(
                [
                    themed ? glowSeries(testCase, {}) : glowSeries(testCase, placement, highlight),
                    ...(other ? [otherSeries(testCase, other)] : []),
                ],
                testCase.data,
                {
                    ...RENDER_OPTIONS,
                    ...testCase.chartOptions,
                    ...(themed ? glowThemeOptions(testCase, placement, highlight) : {}),
                }
            );
            if (hover !== undefined) await hoverCase(chart!, testCase, hover);
            return canvasImage(chart!);
        },
    };
}

/**
 * One snapshot for each placement of the shadow and glow of each series, and the renders that should be identical.
 * Call it in the body of a `describe`, with the charts of {@link useGlowCharts}.
 */
export function describeGlowSeries(
    cases: GlowSeriesCase[],
    { create, chart, snapshot, render }: ReturnType<typeof useGlowCharts>
) {
    describe.each(cases)('$name', (testCase) => {
        const options = { ...RENDER_OPTIONS, ...testCase.chartOptions };
        const hoverable = testCase.hoverable === true;
        const seriesShadowOnly = testCase.seriesShadowOnly === true;
        const noItemStyler = testCase.noItemStyler === true;
        // Where the legend highlights an item, the series bucket is read through an item hover, and no styler is given its state.
        const itemHover = (step: HighlightStep): HighlightStep =>
            step.hover === 'series' && testCase.legendHighlightsItems
                ? { ...step, state: undefined, hover: true }
                : step;
        const steps = (testCase.highlightSteps ?? HIGHLIGHT_STATES)
            .filter(({ onOtherSeries }) => !onOtherSeries || !testCase.singleSeries)
            .map(itemHover);
        const stylerStates = steps.filter(({ state }) => state !== undefined);
        const bucketStates = steps.filter(({ bucket }) => !testCase.itemHighlightOnly || !bucket.endsWith('Series'));
        const glows = !seriesShadowOnly;
        const placement: GlowPlacement = glows ? CAST : { shadow: SERIES_SHADOW };
        const hoveredItem = testCase.hoveredItem ?? HOVERED_ITEM;

        // A hoverable series is snapshotted hovered, which draws the series shadow and glow on its other items too, and a
        // series with a `shadowSnapshot` has its shadow snapshotted by that test.
        it.skipIf(hoverable || testCase.shadowSnapshot !== undefined)('renders the series shadow', async () => {
            await create([glowSeries(testCase, { shadow: SERIES_SHADOW })], testCase.data, options);
            await snapshot();
        });

        it.skipIf(hoverable || seriesShadowOnly)('renders the series glow', async () => {
            await create([glowSeries(testCase, { glow: SERIES_GLOW })], testCase.data, options);
            await snapshot();
        });

        it.skipIf(!hoverable)('renders the shadow and glow of the hovered item', async () => {
            const hovered = testCase.hoveredPlacement ?? placement;
            await create([glowSeries(testCase, hovered, { highlightedItem: hoveredItem })], testCase.data, options);
            await hoverCase(chart(), testCase);
            await snapshot();
        });

        it('renders a disabled shadow and glow as it renders none', async () => {
            const disabled = {
                shadow: { ...SERIES_SHADOW, enabled: false },
                ...(glows ? { glow: { ...SERIES_GLOW, enabled: false } } : {}),
            };
            const unset = await render(testCase, {});
            expect(differingBytes(await render(testCase, placement), unset)).toBeGreaterThan(0);
            expectSamePixels(await render(testCase, disabled), unset);
        });

        it('renders the shadow and glow of the theme as those of the series', async () => {
            const series = await render(testCase, placement);
            expect(differingBytes(series, await render(testCase, {}))).toBeGreaterThan(0);
            expectSamePixels(await render(testCase, placement, { themed: true }), series);
        });

        it.skipIf(!hoverable)('renders the highlight shadow and glow of the theme as those of the series', async () => {
            const highlight = { highlightedItem: hoveredItem };
            const series = await render(testCase, placement, { highlight, hover: true });
            expect(differingBytes(series, await render(testCase, placement, { hover: true }))).toBeGreaterThan(0);
            expectSamePixels(await render(testCase, placement, { highlight, hover: true, themed: true }), series);
        });

        // A state of the other series is reached by hovering the first series beside it.
        const renderState = (
            { onOtherSeries, hover }: HighlightStep,
            styled: GlowPlacement,
            highlight: object | undefined,
            hovered: boolean
        ) =>
            onOtherSeries
                ? render(testCase, {}, { hover: hovered ? hover : undefined, other: { placement: styled, highlight } })
                : render(testCase, styled, { highlight, hover: hovered ? hover : undefined });

        const hoverSteps = hoverable ? bucketStates : [];

        // The hovered item casts the shadow too, where it has a highlight shadow: the other states take a glow only.
        const castOf = ({ bucket }: HighlightStep) =>
            bucket === 'highlightedItem' ? hoveredItem : { glow: HIGHLIGHT_GLOW };

        it.each(hoverSteps)(
            'renders as at rest once the hover has ended, and as hovered when it is repeated, with the cast of $bucket',
            async (step) => {
                const rest = await renderState(step, {}, { [step.bucket]: castOf(step) }, false);
                await hoverCase(chart(), testCase, step.hover);
                const hovered = canvasImage(chart());
                expect(differingBytes(hovered, rest)).toBeGreaterThan(0);

                await endHover(chart());
                expectSamePixels(canvasImage(chart()), rest);

                await hoverCase(chart(), testCase, step.hover);
                expectSamePixels(canvasImage(chart()), hovered);
            }
        );

        it.each(hoverSteps)('renders the glow of $bucket, and renders it disabled as it renders none', async (step) => {
            const glowOf = (glow: object) => ({ [step.bucket]: { glow } });
            const plain = await renderState(step, {}, undefined, true);
            const glowing = await renderState(step, {}, glowOf(HIGHLIGHT_GLOW), true);
            expect(differingBytes(glowing, plain)).toBeGreaterThan(0);
            expectSamePixels(await renderState(step, {}, glowOf({ ...HIGHLIGHT_GLOW, enabled: false }), true), plain);
        });

        it.skipIf(!hoverable || noItemStyler)(
            'renders the glow that an itemStyler returns for a highlight state only while that state holds',
            async () => {
                const byState = (wanted: string) => ({
                    itemStyler: ({ highlightState }: { highlightState?: string }) =>
                        highlightState === wanted ? { glow: HIGHLIGHT_GLOW } : {},
                });
                for (const step of stylerStates) {
                    const { state, bucket } = step as Required<HighlightStep>;
                    const rest = await renderState(step, {}, undefined, false);
                    const hoveredPlain = await renderState(step, {}, undefined, true);
                    expectSamePixels(await renderState(step, byState(state), undefined, false), rest);
                    const styled = await renderState(step, byState(state), undefined, true);
                    expect(differingBytes(styled, hoveredPlain), state).toBeGreaterThan(0);

                    // The same glow, set on the highlight state of the series instead.
                    if (!bucketStates.includes(step)) continue;
                    if (testCase.reachesOtherParts && bucket.startsWith('unhighlighted')) continue;
                    const highlight = { [bucket]: { glow: HIGHLIGHT_GLOW } };
                    const bucketed = await renderState(step, {}, highlight, true);
                    if (step.bucketReachesOtherStates)
                        expect(differingBytes(bucketed, styled), state).toBeGreaterThan(0);
                    else expectSamePixels(bucketed, styled);
                }
            }
        );

        it.skipIf(noItemStyler)('renders the shadow that an itemStyler returns as the series shadow', async () => {
            const unset = await render(testCase, {});
            const series = await render(testCase, { shadow: SERIES_SHADOW });
            expect(differingBytes(series, unset)).toBeGreaterThan(0);
            const styled = await render(testCase, { itemStyler: () => ({ shadow: SERIES_SHADOW }) });
            expect(differingBytes(styled, unset)).toBeGreaterThan(0);
            if (testCase.stylerCastsOtherParts) expect(differingBytes(styled, series)).toBeGreaterThan(0);
            else expectSamePixels(styled, series);
        });

        it.skipIf(seriesShadowOnly || noItemStyler)(
            'renders the glow that an itemStyler returns as the series glow',
            async () => {
                const series = await render(testCase, { glow: SERIES_GLOW });
                expect(differingBytes(series, await render(testCase, {}))).toBeGreaterThan(0);
                const { stylerGlowOnly } = testCase;
                const styled = await render(testCase, {
                    itemStyler: (params: { datum?: unknown }) =>
                        stylerGlowOnly == null || stylerGlowOnly(params) ? { glow: SERIES_GLOW } : {},
                });
                expectSamePixels(styled, series);
            }
        );
    });
}

/** One series of {@link describeGlowOptions}, and the chart options that leave room for its casts. */
export interface GlowOptionsEntry {
    testCase: GlowSeriesCase;
    options: object;
    /**
     * How much of the render, as {@link byteDifference}, a gap of 0 and no gap may differ by: the anti-aliased edges that the cut
     * leaves, which a pixel-aligned edge (a bar, a treemap tile) has none of. Each budget is set just above what the entry measures,
     * and the cell fails unless a glow with a `fillOpacity` of 0.4 instead of 0.5 differs by more.
     */
    edgeBudget?: { series: number; hovered: number };
    /** The part of the series (`tile`, `node`, `link`) that takes the `fillOpacity` that makes its items opaque, where the series itself does not. */
    opaquePart?: string;
    /** The highlight of the hovered item takes no `shadow`, so none of its cells is drawn. */
    noHoveredShadow?: true;
}

/** The options of the shadow, and of the glow, that a series is given, and each change to them that should show in the render. */
const OPTION_CASTS: [string, { cast: object; changes: object[] }][] = [
    [
        'shadow',
        {
            cast: { ...SERIES_SHADOW, fillOpacity: 0.8, spread: 0 },
            changes: [
                { xOffset: 12 },
                { yOffset: 12 },
                { blur: 0 },
                { spread: 4 },
                { fill: '#cc2200' },
                { fillOpacity: 0.3 },
            ],
        },
    ],
    [
        'glow',
        {
            cast: SERIES_GLOW,
            changes: [{ blur: 0 }, { spread: 8 }, { fill: '#00aa00' }, { fillOpacity: 1 }],
        },
    ],
];

const withOpaqueItems = (series: object, part?: string) =>
    part === undefined
        ? { ...series, fillOpacity: 1 }
        : { ...series, [part]: { ...(series as Record<string, object>)[part], fillOpacity: 1 } };

/**
 * Each option of the shadow and of the glow, changed one at a time, on the series and on the hovered item of each entry, and
 * the glow `gap`. Call it in the body of a `describe`, with the charts of {@link useGlowCharts}.
 */
export function describeGlowOptions(entries: GlowOptionsEntry[], { create, chart }: ReturnType<typeof useGlowCharts>) {
    describe.each(entries)(
        '$testCase.name',
        ({ testCase, options, edgeBudget = { series: 0, hovered: 0 }, opaquePart, noHoveredShadow }) => {
            describe.each([
                ['the series', false],
                ['the hovered item', true],
            ])('on %s', (_name, hovered) => {
                const draw = async (placement: GlowPlacement, opaque = false) => {
                    const series = hovered
                        ? glowSeries(testCase, {}, { highlightedItem: placement })
                        : glowSeries(testCase, placement);
                    await create([opaque ? withOpaqueItems(series, opaquePart) : series], testCase.data, {
                        ...options,
                        ...testCase.chartOptions,
                    });
                    if (hovered) await hoverCase(chart(), testCase);
                    return canvasImage(chart());
                };

                const casts = OPTION_CASTS.filter(([name]) => !(hovered && noHoveredShadow && name === 'shadow'));

                describe.each(casts)('the %s', (name, { cast, changes }) => {
                    const style = (change: object = {}) => ({ [name]: { ...cast, ...change } });

                    it.each(changes)('renders differently when %o changes', async (change) => {
                        const before = await draw(style());
                        expect(differingBytes(before, await draw({}))).toBeGreaterThan(0);
                        expect(differingBytes(await draw(style(change)), before)).toBeGreaterThan(0);
                    });
                });

                describe('the glow gap', () => {
                    const glow = (gap?: number) => ({ glow: { ...SERIES_GLOW, gap } });

                    const budget = hovered ? edgeBudget.hovered : edgeBudget.series;

                    it('renders a gap of 0 as it renders no gap, on an opaque item', async () => {
                        const gapOfZero = await draw(glow(0), true);
                        expect(differingBytes(gapOfZero, await draw({}, true))).toBeGreaterThan(0);
                        expect(byteDifference(gapOfZero, await draw(glow(), true))).toBeLessThanOrEqual(budget);

                        const fainter = { glow: { ...SERIES_GLOW, gap: 0, fillOpacity: 0.4 } };
                        expect(byteDifference(gapOfZero, await draw(fainter, true))).toBeGreaterThan(budget);
                    });

                    it('renders a gap above 0 differently from none', async () => {
                        const none = await draw(glow(), true);
                        expect(byteDifference(await draw(glow(4), true), none)).toBeGreaterThan(budget);
                        expect(byteDifference(await draw(glow(12), true), none)).toBeGreaterThan(budget);
                    });
                });
            });
        }
    );
}

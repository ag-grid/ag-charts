import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { expectSamePixels } from './expectSamePixels';
import { type GlowPlacement, type GlowSeriesCase, type HighlightStep, glowSeries, glowThemeOptions } from './glowCases';
import {
    RENDER_CROP,
    RENDER_OPTIONS,
    canvasImage,
    differingBytes,
    endHover,
    hoverDatum,
    hoverNode,
    hoverSeries,
} from './glowRender';
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
        snapshot: () => compareImageSnapshot(chart!, { ...ctx, bbox: RENDER_CROP }),
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
        const steps = (testCase.highlightSteps ?? HIGHLIGHT_STATES).filter(
            ({ onOtherSeries }) => !onOtherSeries || !testCase.singleSeries
        );
        const stylerStates = steps.filter(({ state }) => state !== undefined);
        const bucketStates = steps.filter(({ bucket }) => !testCase.itemHighlightOnly || !bucket.endsWith('Series'));
        const glows = !seriesShadowOnly;
        const placement: GlowPlacement = glows ? CAST : { shadow: SERIES_SHADOW };
        const hoveredItem = testCase.hoveredItem ?? HOVERED_ITEM;

        // A series whose shadow an existing test snapshots is not snapshotted again: the matrix names that test.
        it.skipIf(testCase.shadowSnapshot !== undefined)('renders the series shadow', async () => {
            await create([glowSeries(testCase, { shadow: SERIES_SHADOW })], testCase.data, options);
            await snapshot();
        });

        it.skipIf(seriesShadowOnly)('renders the series glow', async () => {
            await create([glowSeries(testCase, { glow: SERIES_GLOW })], testCase.data, options);
            await snapshot();
        });

        it.skipIf(!hoverable)('renders the shadow and glow of the hovered item', async () => {
            await create([glowSeries(testCase, placement, { highlightedItem: hoveredItem })], testCase.data, options);
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
                expectSamePixels(await render(testCase, { itemStyler: () => ({ glow: SERIES_GLOW }) }), series);
            }
        );
    });
}

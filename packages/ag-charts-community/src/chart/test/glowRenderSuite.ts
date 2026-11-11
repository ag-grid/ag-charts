import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

import { expectSamePixels } from './expectSamePixels';
import { type GlowPlacement, type GlowSeriesCase, glowSeries, glowThemeOptions } from './glowCases';
import {
    RENDER_CROP,
    RENDER_OPTIONS,
    canvasImage,
    differingBytes,
    endHover,
    hoverDatum,
    hoverNode,
} from './glowRender';
import { HIGHLIGHT_GLOW, HIGHLIGHT_SHADOW, SERIES_GLOW, SERIES_SHADOW } from './shadowFixtures';
import { compareImageSnapshot, setupMockCanvas, setupMockConsole, waitForChartStability } from './utils';

const CAST: GlowPlacement = { shadow: SERIES_SHADOW, glow: SERIES_GLOW };
const HOVERED_ITEM = { shadow: HIGHLIGHT_SHADOW, glow: HIGHLIGHT_GLOW };

const hoverCase = (chart: AgChartInstance, { hoverDatum: datumOf }: GlowSeriesCase) =>
    datumOf ? hoverNode(chart, datumOf(chart)) : hoverDatum(chart);

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
            { highlight, hover, themed = false }: { highlight?: object; hover?: boolean; themed?: boolean } = {}
        ) => {
            await create(
                [themed ? glowSeries(testCase, {}) : glowSeries(testCase, placement, highlight)],
                testCase.data,
                {
                    ...RENDER_OPTIONS,
                    ...testCase.chartOptions,
                    ...(themed ? glowThemeOptions(testCase, placement, highlight) : {}),
                }
            );
            if (hover) await hoverCase(chart!, testCase);
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
        const glows = !seriesShadowOnly;
        const placement: GlowPlacement = glows ? CAST : { shadow: SERIES_SHADOW };
        const hoveredItem = glows ? HOVERED_ITEM : { shadow: HIGHLIGHT_SHADOW };

        it('renders the series shadow', async () => {
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

        it.skipIf(!hoverable)(
            'renders as at rest once the hover has ended, and as hovered when it is repeated',
            async () => {
                const highlight = { highlightedItem: hoveredItem };
                await create([glowSeries(testCase, placement, highlight)], testCase.data, options);
                const rest = canvasImage(chart());
                await hoverCase(chart(), testCase);
                const hovered = canvasImage(chart());
                expect(differingBytes(hovered, rest)).toBeGreaterThan(0);

                await endHover(chart());
                expectSamePixels(canvasImage(chart()), rest);

                await hoverCase(chart(), testCase);
                expectSamePixels(canvasImage(chart()), hovered);
            }
        );

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

        it.skipIf(!hoverable)(
            'renders the glow of each state of the items, as it renders none without it',
            async () => {
                const hoveredPlain = await render(testCase, {}, { hover: true });
                for (const state of ['highlightedItem', 'unhighlightedItem']) {
                    const highlight = { [state]: { glow: HIGHLIGHT_GLOW } };
                    const glowing = await render(testCase, {}, { highlight, hover: true });
                    expect(differingBytes(glowing, hoveredPlain), state).toBeGreaterThan(0);
                }
            }
        );

        it.skipIf(!hoverable || noItemStyler)(
            'renders the glow that an itemStyler returns for a highlight state only while that state holds',
            async () => {
                const byState = (wanted: string) => ({
                    itemStyler: ({ highlightState }: { highlightState?: string }) =>
                        highlightState === wanted ? { glow: HIGHLIGHT_GLOW } : {},
                });
                const rest = await render(testCase, {});
                const hoveredPlain = await render(testCase, {}, { hover: true });
                for (const [state, bucket] of [
                    ['highlighted-item', 'highlightedItem'],
                    ['unhighlighted-item', 'unhighlightedItem'],
                ]) {
                    expectSamePixels(await render(testCase, byState(state)), rest);
                    const styled = await render(testCase, byState(state), { hover: true });
                    expect(differingBytes(styled, hoveredPlain), state).toBeGreaterThan(0);

                    // The same glow, set on the highlight state of the series instead.
                    if (testCase.reachesOtherParts && bucket === 'unhighlightedItem') continue;
                    const highlight = { [bucket]: { glow: HIGHLIGHT_GLOW } };
                    expectSamePixels(await render(testCase, {}, { highlight, hover: true }), styled);
                }
            }
        );

        it.skipIf(noItemStyler)('renders the shadow that an itemStyler returns as the series shadow', async () => {
            const series = await render(testCase, { shadow: SERIES_SHADOW });
            expect(differingBytes(series, await render(testCase, {}))).toBeGreaterThan(0);
            expectSamePixels(await render(testCase, { itemStyler: () => ({ shadow: SERIES_SHADOW }) }), series);
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

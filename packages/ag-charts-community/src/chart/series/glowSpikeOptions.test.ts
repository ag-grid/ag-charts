import { describe, expect, it } from 'vitest';

import { Rect, Sector } from 'ag-charts-core';
import type { Shape } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { CATEGORY_DATA, SERIES_SHADOW, glowShadow, shapesOf } from '../test/shadowFixtures';
import { createChart, deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

describe('series glow and highlighted item shadow', () => {
    setupMockConsole();
    setupMockCanvas();

    const create = async (series: object) =>
        deproxy(
            await createChart({
                data: CATEGORY_DATA,
                series: [{ type: 'bar', xKey: 'category', yKey: 'value', ...series }],
            } as AgChartOptions)
        );

    const resolved = async (series: object) => {
        const chart = await create(series);
        const { glow, shadow, highlight } = (chart.series[0] as any).options;
        return { glow, shadow, item: highlight.highlightedItem, other: highlight.unhighlightedItem };
    };

    describe('glow auto-enable over the series glow', () => {
        it('is off at series level and in every bucket by default', async () => {
            const { glow, item, other } = await resolved({});
            expect([glow.enabled, item.glow.enabled, other.glow.enabled]).toEqual([false, false, false]);
        });

        it('turns a bucket on with the series glow, whose values it inherits', async () => {
            const { glow, item } = await resolved({ glow: {} });
            expect([glow.enabled, item.glow.enabled]).toEqual([true, true]);
        });

        it('turns a bucket on by its own glow while the series glow is off', async () => {
            const { glow, item } = await resolved({ highlight: { highlightedItem: { glow: { gap: 5 } } } });
            expect(glow.enabled).toBe(false);
            expect(item.glow).toMatchObject({ enabled: true, gap: 5 });
        });

        it('lets a bucket turn off while the series glow is on', async () => {
            const { glow, item, other } = await resolved({
                glow: {},
                highlight: { highlightedItem: { glow: { enabled: false } } },
            });
            expect([glow.enabled, item.glow.enabled, other.glow.enabled]).toEqual([true, false, true]);
        });
    });

    describe('highlightedItem.shadow', () => {
        it.each([
            ['over the series shadow', { shadow: {} }],
            ['alone, which turns it on', {}],
        ])('casts from the hovered item only, %s', async (_name, base) => {
            const chart = await create({
                ...base,
                highlight: { highlightedItem: { shadow: { xOffset: 10, yOffset: 10 } } },
            });
            const { ctx, id } = chart;
            ctx.highlightManager.updateHighlight(id, getSeriesNodeData<any>(chart)[1]);
            await waitForChartStability(chart);

            const casts = shapesOf(getSeriesAt(chart).contentGroup, Rect).map((rect) => rect.fillShadow);
            expect(casts.map((shadow) => shadow?.enabled === true && shadow.xOffset)).toEqual([
                'shadow' in base && 3,
                10,
                'shadow' in base && 3,
            ]);
        });
    });
    describe('what the nodes cast when an item is hovered', () => {
        const SERIES_GLOW = { fill: '#cc0000', fillOpacity: 1, blur: 5, spread: 3 };

        const hover = async (series: object, kind: abstract new (...args: any[]) => Shape = Rect, type = 'bar') => {
            const chart = deproxy(
                await createChart({
                    data: CATEGORY_DATA,
                    animation: { enabled: false },
                    legend: { enabled: false },
                    series: [
                        type === 'bar'
                            ? { type, xKey: 'category', yKey: 'value', ...series }
                            : { type, angleKey: 'value', calloutLabelKey: 'category', ...series },
                    ],
                } as AgChartOptions)
            );
            chart.ctx.highlightManager.updateHighlight(chart.id, getSeriesNodeData<any>(chart)[1]);
            await waitForChartStability(chart);
            const inPlace = shapesOf(getSeriesAt(chart).contentGroup, kind);
            const highlighted = shapesOf(getSeriesAt(chart).highlightNodeGroup, kind).filter((node) => node.visible);
            return { chart, inPlace, highlighted };
        };

        describe.each([
            ['bar', Rect, 'bar'],
            ['donut', Sector, 'donut'],
        ] as const)('%s', (_name, kind, type) => {
            it('casts the series glow from every item but the hovered one while the highlight bucket has none', async () => {
                const { inPlace, highlighted } = await hover({ glow: SERIES_GLOW }, kind, type);
                expect(inPlace.map((node) => node.fillGlow?.fill)).toEqual([
                    SERIES_GLOW.fill,
                    undefined,
                    SERIES_GLOW.fill,
                ]);
                expect(highlighted[0].fillShadow).toMatchObject(glowShadow(SERIES_GLOW as any));
            });

            it('lets highlightedItem.glow turn the glow off for the hovered item', async () => {
                const { inPlace, highlighted } = await hover(
                    { glow: SERIES_GLOW, highlight: { highlightedItem: { glow: { enabled: false } } } },
                    kind,
                    type
                );
                expect(inPlace.map((node) => node.fillGlow?.enabled === true)).toEqual([true, false, true]);
                expect(highlighted[0].fillShadow?.enabled).not.toBe(true);
            });

            it('replaces, not adds to, the series glow with highlightedItem.glow on the hovered item', async () => {
                const { inPlace, highlighted } = await hover(
                    { glow: SERIES_GLOW, highlight: { highlightedItem: { glow: { gap: 5 } } } },
                    kind,
                    type
                );
                expect(inPlace.map((node) => node.fillGlow?.gap)).toEqual([undefined, undefined, undefined]);
                expect(inPlace[1].fillGlow).toBeUndefined();
                expect(highlighted[0].fillShadow).toMatchObject({ ...glowShadow(SERIES_GLOW as any), gap: 5 });
            });
        });

        describe('highlightedItem.shadow with no other fields', () => {
            it('turns the series shadow off for the hovered item with { enabled: false }', async () => {
                const { inPlace } = await hover({
                    shadow: SERIES_SHADOW,
                    highlight: { highlightedItem: { shadow: { enabled: false } } },
                });
                expect(inPlace.map((node) => node.fillShadow?.enabled === true)).toEqual([true, false, true]);
            });

            it('turns the shadow on for the hovered item with {} while the series shadow is off', async () => {
                const { inPlace } = await hover({ highlight: { highlightedItem: { shadow: {} } } });
                expect(inPlace.map((node) => node.fillShadow?.enabled === true)).toEqual([false, true, false]);
            });

            it('follows the series shadow for the hovered item with {} while it is on', async () => {
                const { inPlace } = await hover({
                    shadow: SERIES_SHADOW,
                    highlight: { highlightedItem: { shadow: {} } },
                });
                expect(inPlace.map((node) => node.fillShadow?.fill)).toEqual([
                    SERIES_SHADOW.fill,
                    SERIES_SHADOW.fill,
                    SERIES_SHADOW.fill,
                ]);
            });
        });
    });
});

import { describe, expect, it } from 'vitest';

import { Rect } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import { getSeriesAt, getSeriesNodeData } from '../test/seriesAccessors';
import { CATEGORY_DATA, shapesOf } from '../test/shadowFixtures';
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
});

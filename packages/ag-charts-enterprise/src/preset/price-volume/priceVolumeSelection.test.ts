import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    deproxy,
    dragAction,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Rect } from 'ag-charts-core';
import type { AgChartInstance, AgFinancialChartOptions, AgVolumeProfileSelectionOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';
import { getStockData } from '../test/stockData';
import { findSceneNodes } from '../test/totalSegment';
import { getRegularVolumeProfile } from '../test/volumeProfileData';

setupEnterpriseModules();

const byName = (a: string, b: string) => a.localeCompare(b);

describe('priceVolume volume profile selection', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: AgChartInstance<AgFinancialChartOptions>;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
        vi.restoreAllMocks();
    });

    async function create(selection: AgVolumeProfileSelectionOptions | null = { enabled: true }) {
        chart = AgCharts.createFinancialChart(
            prepareFinancialTestOptions({
                data: getStockData(),
                volumeProfile: {
                    data: getRegularVolumeProfile(),
                    upKey: 'upVolume',
                    downKey: 'downVolume',
                    selection: selection ?? undefined,
                },
            } as AgFinancialChartOptions)
        );
        await waitForChartStability(chart);
    }

    const allSeries = () => deproxy(chart).ctx.chartService.series;
    const profileSeries = () => allSeries().filter((s) => s.getSelectionGroup() === 'volumeProfile');
    const selected = () => Array.from(chart.getSelection(), ({ seriesId, itemId }) => `${seriesId}:${itemId}`);
    const bands = () => findSceneNodes<Rect>(chart, 'axis-selected-band').filter((n) => n.visible !== false);

    async function clickProfileBar(seriesIndex: number, datumIndex: number) {
        const series = profileSeries()[seriesIndex];
        const { nodeData } = (series as unknown as { contextNodeData: unknown }).contextNodeData as {
            nodeData: { datumIndex: number; x: number; y: number; width: number; height: number }[];
        };
        const node = nodeData.find((n) => n.datumIndex === datumIndex)!;
        const { x, y } = deproxy(chart).ctx.chartService.seriesRect!;
        await clickAction(x + node.x + node.width / 2, y + node.y + node.height / 2)(deproxy(chart));
        await waitForChartStability(chart);
    }

    it('selects both segments of a clicked level, and renders its band', async () => {
        await create();
        const [up, down] = profileSeries();

        await clickProfileBar(0, 2);

        expect(selected().sort(byName)).toEqual([`${up.id}:2`, `${down.id}:2`].sort(byName));
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it.each<AgVolumeProfileSelectionOptions>([
        { enabled: true },
        { enabled: true, clickMode: 'multiple' },
        { enabled: true, enableDrag: true },
    ])('leaves the price and volume series unselectable with %j', async (selection) => {
        await create(selection);

        const others = allSeries().filter((s) => !profileSeries().includes(s));
        expect(others.length).toBeGreaterThan(0);
        expect(others.map((s) => s.isSelectionEnabled())).toEqual(others.map(() => false));
    });

    it('selects only price levels when dragging, with `enableDrag`', async () => {
        await create({ enabled: true, enableDrag: true });
        const [up, down] = profileSeries();
        const { x, y, width, height } = deproxy(chart).ctx.chartService.seriesRect!;

        await dragAction({ x: x + 2, y: y + 2 }, { x: x + width - 2, y: y + height - 2 })(deproxy(chart));
        await waitForChartStability(chart);

        const items = Array.from(chart.getSelection());
        expect(items.length).toBeGreaterThan(2);
        expect(new Set(items.map((item) => item.seriesId))).toEqual(new Set([up.id, down.id]));
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('does not select by dragging unless `enableDrag` is set', async () => {
        await create();
        const { x, y, width, height } = deproxy(chart).ctx.chartService.seriesRect!;

        await dragAction({ x: x + 2, y: y + 2 }, { x: x + width - 2, y: y + height - 2 })(deproxy(chart));
        await waitForChartStability(chart);

        expect(selected()).toEqual([]);
    });

    it('is not selectable unless `selection.enabled` is set', async () => {
        await create(null);

        expect(allSeries().map((s) => s.isSelectionEnabled())).not.toContain(true);
        expect(bands()).toHaveLength(0);
    });
});

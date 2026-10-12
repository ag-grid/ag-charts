import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    deproxy,
    dragAction,
    mouseDownAction,
    mouseMoveAction,
    mouseUpAction,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { Rect } from 'ag-charts-core';
import type { AgChartInstance, AgSelectionChangeEvent, AgVolumeProfileChartOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';
import { findSceneNodes } from '../test/totalSegment';
import { getRegularVolumeProfile } from '../test/volumeProfileData';

setupEnterpriseModules();

const byName = (a: string, b: string) => a.localeCompare(b);

type Chart = AgChartInstance<AgVolumeProfileChartOptions>;

describe('volumeProfile selection', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
        vi.restoreAllMocks();
    });

    const events: AgSelectionChangeEvent<any, any>[] = [];

    async function create(options: Partial<AgVolumeProfileChartOptions> = {}) {
        events.length = 0;
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                data: getRegularVolumeProfile(),
                upKey: 'upVolume',
                downKey: 'downVolume',
                selection: { enabled: true },
                listeners: { selectionChange: (event: AgSelectionChangeEvent<any, any>) => events.push(event) },
                ...options,
            } as AgVolumeProfileChartOptions)
        );
        await waitForChartStability(chart);
    }

    const seriesRect = () => deproxy(chart).ctx.chartService.seriesRect!;
    const seriesList = () => deproxy(chart).ctx.chartService.series;
    const selected = () => Array.from(chart.getSelection(), ({ seriesId, itemId }) => `${seriesId}:${itemId}`);

    /** The canvas point at the centre of the bar for the series' `datumIndex`. */
    function barCentre(seriesIndex: number, datumIndex: number) {
        const { nodeData } = (seriesList()[seriesIndex] as unknown as { contextNodeData: unknown }).contextNodeData as {
            nodeData: { datumIndex: number; x: number; y: number; width: number; height: number }[];
        };
        const node = nodeData.find((n) => n.datumIndex === datumIndex)!;
        const { x, y } = seriesRect();
        return { canvasX: x + node.x + node.width / 2, canvasY: y + node.y + node.height / 2 };
    }

    async function click(seriesIndex: number, datumIndex: number, modifiers?: { ctrlKey: true }) {
        const { canvasX, canvasY } = barCentre(seriesIndex, datumIndex);
        await clickAction(canvasX, canvasY, modifiers)(deproxy(chart));
        await waitForChartStability(chart);
    }

    it('selects the up and down segments of a clicked level together', async () => {
        await create();
        const [up, down] = seriesList();

        await click(0, 2);

        expect(selected().sort(byName)).toEqual([`${up.id}:2`, `${down.id}:2`].sort(byName));
    });

    it('reports one item per segment in `selectionChange`', async () => {
        await create();
        const [up, down] = seriesList();

        await click(1, 3);

        expect(events).toHaveLength(1);
        expect(events[0].source).toBe('user-interaction');
        expect(events[0].added.map((item) => item.seriesId).sort(byName)).toEqual([up.id, down.id].sort(byName));
        expect(events[0].added.map((item) => item.itemId)).toEqual([3, 3]);
        expect(events[0].removed).toEqual([]);
    });

    it('replaces the selected level in `single` click mode', async () => {
        await create({ selection: { enabled: true, clickMode: 'single' } });
        const [up, down] = seriesList();

        await click(0, 1);
        await click(0, 4);

        expect(selected().sort(byName)).toEqual([`${up.id}:4`, `${down.id}:4`].sort(byName));
    });

    it('accumulates scattered levels, and deselects one on a second click, in `multiple` click mode', async () => {
        await create({ selection: { enabled: true, clickMode: 'multiple' } });
        const [up, down] = seriesList();

        await click(0, 1);
        await click(1, 4);
        expect(selected().sort(byName)).toEqual(
            [`${up.id}:1`, `${down.id}:1`, `${up.id}:4`, `${down.id}:4`].sort(byName)
        );

        await click(1, 1);
        expect(selected().sort(byName)).toEqual([`${up.id}:4`, `${down.id}:4`].sort(byName));
    });

    it('selects both segments when the API is given only one', async () => {
        await create();
        const [up, down] = seriesList();

        chart.setSelection([{ seriesId: up.id, itemId: 5 }]);
        await waitForChartStability(chart);

        expect(selected().sort(byName)).toEqual([`${up.id}:5`, `${down.id}:5`].sort(byName));
    });

    it('clears both segments when clicking away', async () => {
        await create();

        await click(0, 2);
        const { x, y } = seriesRect();
        await clickAction(x + 1, y + 1)(deproxy(chart));
        await waitForChartStability(chart);

        expect(selected()).toEqual([]);
    });

    it('is not selectable unless `selection.enabled` is set', async () => {
        await create({ selection: undefined });

        await click(0, 2);

        expect(selected()).toEqual([]);
    });

    it('can be switched on and off with an update', async () => {
        await create({ selection: undefined });

        await click(0, 2);
        expect(selected()).toEqual([]);

        await chart.updateDelta({ selection: { enabled: true } });
        await waitForChartStability(chart);
        await click(0, 2);
        expect(selected()).toHaveLength(2);

        await chart.updateDelta({ selection: { enabled: false } });
        await waitForChartStability(chart);
        await click(0, 4);
        expect(selected().filter((item) => item.endsWith(':4'))).toEqual([]);
    });

    it('keeps the selected level when the data is replaced and `dataIdKey` is set', async () => {
        await create({ dataIdKey: 'price' } as Partial<AgVolumeProfileChartOptions>);
        const [up, down] = seriesList();

        await click(0, 2);
        await chart.updateDelta({ data: getRegularVolumeProfile() });
        await waitForChartStability(chart);

        expect(selected().sort(byName)).toEqual([`${up.id}:2`, `${down.id}:2`].sort(byName));
    });

    describe('drag selection', () => {
        const drag = async (x0: number, x1: number) => {
            const { x, y, height } = seriesRect();
            await dragAction({ x: x + x0, y: y + 2 }, { x: x + x1, y: y + height - 2 })(deproxy(chart));
            await waitForChartStability(chart);
        };
        const levels = (seriesIndex: number) =>
            selected()
                .filter((item) => item.startsWith(seriesList()[seriesIndex].id))
                .map((item) => Number(item.split(':')[1]));

        it('is off unless `selection.enableDrag` is set', async () => {
            await create();

            await drag(1, seriesRect().width - 2);

            expect(selected()).toEqual([]);
        });

        it('selects every level the drag covers, in both segments', async () => {
            await create({ selection: { enabled: true, enableDrag: true } });

            await drag(1, seriesRect().width - 2);

            expect(levels(0).length).toBeGreaterThan(1);
            expect(levels(0).sort((a, b) => a - b)).toEqual(levels(1).sort((a, b) => a - b));
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('selects both segments when the drag covers only one of them', async () => {
            await create({ selection: { enabled: true, enableDrag: true } });

            // The bars grow from the left edge, so a thin drag there reaches only the up segments.
            await drag(1, 3);

            expect(levels(0).length).toBeGreaterThan(1);
            expect(levels(1).sort((a, b) => a - b)).toEqual(levels(0).sort((a, b) => a - b));
            expect(events[0].added).toHaveLength(levels(0).length + levels(1).length);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('previews both segments as candidates before the drag is released', async () => {
            await create({ selection: { enabled: true, enableDrag: true } });
            const { x, y, height } = seriesRect();
            const target = deproxy(chart);

            // A thin drag at the left edge reaches only the up segments.
            await mouseDownAction(x + 1, y + 2)(target);
            await mouseMoveAction(x + 1, y + 2)(target);
            await mouseMoveAction(x + 3, y + height - 2)(target);
            await waitForChartStability(chart);

            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
            await mouseUpAction(x + 3, y + height - 2)(target);
        });
    });

    describe('selected band', () => {
        const bands = () => findSceneNodes<Rect>(chart, 'axis-selected-band').filter((n) => n.visible !== false);

        it('draws no band while nothing is selected', async () => {
            await create();

            expect(bands()).toHaveLength(0);
        });

        it('removes the bands when the selection is cleared', async () => {
            await create({ selection: { enabled: true, clickMode: 'multiple' } });

            await click(0, 1);
            await click(0, 2);
            chart.clearSelection();
            await waitForChartStability(chart);

            expect(bands()).toHaveLength(0);
        });
    });

    describe('rendering', () => {
        const select = async (levels: number[]) => {
            chart.setSelection(levels.map((itemId) => ({ seriesId: seriesList()[0].id, itemId })));
            await waitForChartStability(chart);
        };

        it('renders a selected level with its band and dimmed neighbours', async () => {
            await create();
            await select([3]);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders scattered selected levels', async () => {
            await create({ selection: { enabled: true, clickMode: 'multiple' } });
            await select([1, 2, 6]);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders the `selectedBand` options', async () => {
            await create({
                selection: {
                    enabled: true,
                    selectedBand: {
                        fill: '#ff0000',
                        fillOpacity: 0.5,
                        stroke: '#00ff00',
                        strokeWidth: 2,
                        lineDash: [4, 2],
                    },
                },
            });
            await select([3]);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('renders the `selectedItem` and `unselectedItem` options', async () => {
            await create({
                selection: {
                    enabled: true,
                    selectedItem: { fill: '#ff0000', strokeWidth: 3 },
                    unselectedItem: { opacity: 0.25 },
                },
            });
            await select([3]);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });
    });
});

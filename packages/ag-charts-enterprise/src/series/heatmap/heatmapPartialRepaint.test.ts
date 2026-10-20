import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import {
    type Chart,
    MIN_TOOLTIP_HIDE_DELAY,
    deproxy,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { BBox, Group, Transformable } from 'ag-charts-core';
import { classCast } from 'ag-charts-test';

import { createEnterpriseChart } from '../../test/utils';
import { HeatmapCellBatch } from './heatmapCellBatch';
import { HeatmapSeries } from './heatmapSeries';

type GridCell = { id: string; x: string; y: string; v: number };

function gridCells(columns: number, rows: number): GridCell[] {
    const cells: GridCell[] = [];
    for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
            cells.push({ id: `${x}:${y}`, x: `X${x}`, y: `Y${y}`, v: x * rows + y });
        }
    }
    return cells;
}

describe('HeatmapSeries partial repaint', () => {
    setupMockConsole();

    let chart: Chart;
    const ctx = setupMockCanvas();
    const regionSpy = () => vi.spyOn(Group.prototype as any, 'resolveDirtyRegion');
    let spy: ReturnType<typeof regionSpy>;

    afterEach(() => {
        spy?.mockRestore();
        chart?.destroy();
    });

    const COLUMNS = 20;
    const ROWS = 10;
    const GRID = gridCells(COLUMNS, ROWS);

    const options = (data: GridCell[], series: Record<string, unknown> = {}, chartOptions: object = {}) =>
        ({
            data,
            dataIdKey: 'id',
            series: [
                {
                    type: 'heatmap',
                    xKey: 'x',
                    yKey: 'y',
                    colorKey: 'v',
                    colorScale: { fills: [{ color: 'blue' }, { color: 'red' }] },
                    ...series,
                },
            ],
            legend: { enabled: false },
            ...chartOptions,
        }) as AgChartOptions;

    async function create(data: GridCell[] = GRID, series: Record<string, unknown> = {}, chartOptions: object = {}) {
        chart = deproxy(await createEnterpriseChart(options(data, series, chartOptions)));
        spy = regionSpy();
    }

    const heatmap = () => classCast(chart.series[0], HeatmapSeries);
    const column = (x: number, v: (y: number) => number, cells = GRID) =>
        cells.filter((cell) => cell.x === `X${x}`).map((cell) => ({ ...cell, v: v(Number(cell.y.slice(1))) }));

    async function transact(update: GridCell[]) {
        await chart.publicApi!.applyTransaction({ update });
        await waitForChartStability(chart);
    }

    /** The regions that layers repainted in part since the spy was last cleared. */
    const partialRegions = () => spy.mock.results.map((result) => result.value).filter((region) => region != null);

    /** Repaints every layer whole, and returns what that painted. */
    function repaintWhole() {
        heatmap().contentGroup.markDirty();
        chart.ctx.scene.render();
        return ctx.snapshot();
    }

    /** Asserts that the canvas holds what a whole repaint paints, and that the last frame was a partial one or not. */
    function expectFrameToMatchWholeRepaint(expectPartial?: boolean) {
        const regions = partialRegions();
        spy.mockClear();
        const frame = ctx.snapshot();
        if (expectPartial != null) expect(regions.length > 0).toBe(expectPartial);
        expect(frame).toMatchImage(repaintWhole());
    }

    it('repaints only the region of the updated column, and matches a whole repaint', async () => {
        await create();

        await transact(column(3, (y) => 150 + y));

        const regions = partialRegions();
        expect(regions).toHaveLength(1);
        const [{ width, height }] = regions;
        // One of twenty columns, and all of the rows.
        expect(width / ctx.nodeCanvas.width).toBeLessThan(0.15);
        expect(height / ctx.nodeCanvas.height).toBeGreaterThan(0.5);
        expectFrameToMatchWholeRepaint(true);
    });

    it('matches a whole repaint across a transaction, a resize, a transaction, a pixel ratio change and a transaction', async () => {
        await create();

        await transact(column(3, (y) => 100 + y));
        expectFrameToMatchWholeRepaint(true);

        await chart.publicApi!.updateDelta({ width: 500, height: 350 });
        await waitForChartStability(chart);
        expectFrameToMatchWholeRepaint(false);

        await transact(column(12, (y) => 20 + y));
        expectFrameToMatchWholeRepaint(true);

        const { scene } = chart.ctx;
        scene.resize(scene.width, scene.height, 2);
        scene.render();
        expect(scene.pixelRatio).toBe(2);
        expectFrameToMatchWholeRepaint(false);

        await transact(column(7, (y) => 60 + y));
        expectFrameToMatchWholeRepaint(true);
    });

    describe.each([1, 1.5, 2])('at a pixel ratio of %s', (pixelRatio) => {
        it.each([
            ['whole-pixel', {}],
            ['fractional', { padding: { top: 7.3, right: 11.6, bottom: 9.25, left: 13.4 } }],
        ])('matches a whole repaint with a %s translation', async (_name, chartOptions) => {
            await create(GRID, {}, chartOptions);
            const { scene } = chart.ctx;
            scene.resize(scene.width, scene.height, pixelRatio);
            scene.render();
            expect(scene.pixelRatio).toBe(pixelRatio);
            expectFrameToMatchWholeRepaint(false);

            // A new pixel ratio can lay the chart out afresh, which moves every cell.
            await transact(column(2, (y) => 10 + y));
            expectFrameToMatchWholeRepaint();

            await transact(column(3, (y) => 100 + y));
            expectFrameToMatchWholeRepaint(true);

            await transact([...column(4, (y) => 30 + y), ...column(5, (y) => 90 + y)]);
            expectFrameToMatchWholeRepaint(true);
        });
    });

    it('matches a whole repaint when the updated cells are narrower than a pixel', async () => {
        const cells = gridCells(1500, 1);
        await create(cells);

        await transact([
            { ...cells[200], v: 40 },
            { ...cells[900], v: 1400 },
        ]);

        expectFrameToMatchWholeRepaint(true);
    });

    it('matches a whole repaint when an itemStyler gives cells a fill opacity', async () => {
        const itemStyler = ({ datum }: { datum: GridCell }) => ({ fillOpacity: datum.v % 3 === 0 ? 0.35 : 1 });
        await create(GRID, { itemStyler });

        await transact(column(3, (y) => 100 + y));

        expectFrameToMatchWholeRepaint(true);
    });

    it('repaints in full when a highlight is on, and in part again once it ends', async () => {
        await create();
        const series = heatmap();
        const datum = series.getNodeData()!.find((n) => n.datumIndex === 45)!;
        const { canvasX, canvasY } = Transformable.toCanvasPoint(series.contentGroup, datum.point.x, datum.point.y);
        await hoverAction(canvasX, canvasY)(chart);
        await waitForChartStability(chart);
        spy.mockClear();

        await transact(column(3, (y) => 100 + y));
        expectFrameToMatchWholeRepaint(false);

        await hoverAction(1, 1)(chart);
        await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
        expect(chart.ctx.highlightManager.getActiveHighlight()).toBeUndefined();
        expectFrameToMatchWholeRepaint(false);

        await transact(column(8, (y) => 70 + y));
        expectFrameToMatchWholeRepaint(true);
    });

    it('repaints in full when the cells are zoomed', async () => {
        await create(
            GRID,
            {},
            { zoom: { enabled: true, axes: 'x' }, initialState: { zoom: { ratioX: { start: 0.2, end: 0.8 } } } }
        );
        spy.mockClear();

        await transact(column(8, (y) => 100 + y));

        expectFrameToMatchWholeRepaint(false);
    });

    it('repaints in full, and matches a whole repaint, when cells with labels are updated', async () => {
        await create(GRID, { label: { enabled: true } });

        await transact(column(3, (y) => 100 + y));

        expectFrameToMatchWholeRepaint(false);
    });

    it('clears a cell that an update makes invisible, and paints it again when it returns', async () => {
        const itemStyler = ({ datum }: { datum: GridCell }) => ({ fillOpacity: datum.v === 42 ? 0 : 1 });
        await create(GRID, { itemStyler });

        await transact(column(3, (y) => (y === 2 ? 42 : 100 + y)));
        expectFrameToMatchWholeRepaint(true);

        await transact(column(3, (y) => 100 + y));
        expectFrameToMatchWholeRepaint(true);
    });

    it('repaints in full, and matches a whole repaint, when the cells have a stroke', async () => {
        await create(GRID, { stroke: 'black', strokeWidth: 2 });

        await transact(column(3, (y) => 100 + y));

        expectFrameToMatchWholeRepaint(false);
    });

    it('repaints in full when a transaction adds and removes cells', async () => {
        await create();
        const [removed, kept] = [GRID[0], GRID[1]];
        const added = { id: 'new', x: 'X0', y: 'Y0', v: 77 };

        await chart.publicApi!.applyTransaction({ remove: [removed], add: [added], update: [{ ...kept, v: 120 }] });
        await waitForChartStability(chart);

        expectFrameToMatchWholeRepaint(false);
    });

    it('keeps matching a whole repaint over many transactions in a row', async () => {
        await create();

        // The first and last columns hold the extremes, which a rewrite would move, and so restyle every cell.
        for (let i = 0; i < 12; i++) {
            await transact(column(1 + ((i * 7) % (COLUMNS - 2)), (y) => 50 + i * 3 + y));
            expectFrameToMatchWholeRepaint(true);
        }
    });

    it('repaints in full when every cell is restyled', async () => {
        await create();

        await transact(column(3, (y) => 1000 + y));

        expectFrameToMatchWholeRepaint(false);
    });
});

describe('HeatmapCellBatch dirty region', () => {
    const CELL = 10;
    const batchOf = (columns: number) => {
        const batch = new HeatmapCellBatch();
        batch.resize(columns);
        for (let x = 0; x < columns; x++) batch.set(x, x * CELL, 0, CELL, CELL, `fill${x}`, 1, 1, undefined);
        return batch;
    };
    const rewrite = (batch: HeatmapCellBatch, index: number, x = index * CELL, fill = `new${index}`) =>
        batch.set(index, x, 0, CELL, CELL, fill, 1, 1, undefined);

    function paint(batch: HeatmapCellBatch, dirtyRegion?: BBox, transform = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }) {
        const fills: [string, number][] = [];
        const ctx = {
            globalAlpha: 1,
            fillStyle: '',
            fillRect(x: number) {
                fills.push([this.fillStyle, x]);
            },
            getTransform: () => transform,
        };
        const renderCtx = { ctx, devicePixelRatio: 1, dirtyRegion } as any;
        batch.preRender(renderCtx);
        batch.render(renderCtx);
        return fills;
    }

    it('has no region before the cells are first painted, and none after a resize', () => {
        const batch = batchOf(5);
        expect(batch.getDirtyRegion()).toBeUndefined();

        paint(batch);
        rewrite(batch, 2);
        expect(batch.getDirtyRegion()).toEqual(new BBox(20, 0, CELL, CELL));

        batch.resize(4);
        expect(batch.getDirtyRegion()).toBeUndefined();
    });

    it('covers the cells that were written since the last paint, and none that were painted', () => {
        const batch = batchOf(8);
        paint(batch);

        rewrite(batch, 5);
        rewrite(batch, 2);
        expect(batch.getDirtyRegion()).toEqual(new BBox(20, 0, 4 * CELL, CELL));

        paint(batch);
        expect(batch.getDirtyRegion()).toBeUndefined();
        rewrite(batch, 6);
        expect(batch.getDirtyRegion()).toEqual(new BBox(60, 0, CELL, CELL));
    });

    it('covers where a moved cell was as well as where it is', () => {
        const batch = batchOf(8);
        paint(batch);

        rewrite(batch, 1, 55);

        expect(batch.getDirtyRegion()).toEqual(new BBox(10, 0, 55 + CELL - 10, CELL));
    });

    it('has no region once crisp changes', () => {
        const batch = batchOf(3);
        paint(batch);

        batch.crisp = false;
        rewrite(batch, 1);

        expect(batch.getDirtyRegion()).toBeUndefined();
    });

    it('paints the cells that reach the region in order, and skips the rest', () => {
        const batch = batchOf(8);
        paint(batch);

        // The region reaches cells 2 to 4, and its pixel of margin takes in the edges of 1 and 5.
        const fills = paint(batch, new BBox(20, 0, 30, 10));

        expect(fills.map(([fill]) => fill)).toEqual(['fill1', 'fill2', 'fill3', 'fill4', 'fill5']);
    });

    it('places a cell in the region by the transform of the context', () => {
        const batch = batchOf(8);
        paint(batch);

        const fills = paint(batch, new BBox(40, 0, 20, 20), { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });

        // Device pixels 40 to 60 are 20 to 30 CSS pixels, so cells 2 and 3, with 1 touching.
        expect(fills.map(([fill]) => fill)).toEqual(['fill1', 'fill2', 'fill3']);
    });

    it('paints every cell when the transform is not a scale and a translation', () => {
        const batch = batchOf(4);
        paint(batch);

        const fills = paint(batch, new BBox(0, 0, 1, 1), { a: 1, b: 0.5, c: -0.5, d: 1, e: 0, f: 0 });

        expect(fills).toHaveLength(4);
    });
});

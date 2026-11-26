import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import {
    type Chart,
    MIN_TOOLTIP_HIDE_DELAY,
    deproxy,
    expectNonBlank,
    expectSamePixels,
    expectWarningsCalls,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { BBox, Group, Transformable } from 'ag-charts-core';
import { classCast } from 'ag-charts-test';

import { getHeatmapCellBatch, getHeatmapNodeDataValues } from '../../test/enterpriseSeriesAccessors';
import { createEnterpriseChart } from '../../test/utils';
import { HeatmapCellBatch } from './heatmapCellBatch';
import { HeatmapSeries } from './heatmapSeries';

type GridCell = { id: string; x: string | null; y: string; v: number };

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

    const updateData = (data: GridCell[]) => chart.publicApi!.updateDelta({ data });

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

    /** Asserts that the canvas holds exactly what a whole repaint paints, and that the last frame was a partial one or not. */
    function expectFrameToMatchWholeRepaint(expectPartial?: boolean) {
        const regions = partialRegions();
        spy.mockClear();
        const frame = ctx.snapshot();
        if (expectPartial != null) expect(regions.length > 0).toBe(expectPartial);
        expectSamePixels(frame, repaintWhole());
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

    it('matches a whole repaint when a single cell is updated', async () => {
        await create();

        await transact([{ ...GRID[3 * ROWS + 4], v: 120 }]);

        expectFrameToMatchWholeRepaint(true);
    });

    it('matches a whole repaint when a single narrow cell is updated', async () => {
        const cells = gridCells(1500, 1);
        await create(cells);

        await transact([{ ...cells[700], v: 60 }]);

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

    it('repaints the navigator mini chart whole while the main chart repaints in part', async () => {
        await create(GRID, {}, { navigator: { enabled: true, miniChart: { enabled: true } } });
        await waitForChartStability(chart);
        spy.mockClear();

        await transact(column(3, (y) => 150 + y));

        const { seriesRoot } = chart.modulesManager.getModule<any>('navigator').miniChart;
        const partialLayers = spy.mock.contexts.filter((_, index) => spy.mock.results[index].value != null);
        // Only the main chart's series layer repaints in part; the mini chart's takes an ordinary mark.
        expect(partialLayers).toHaveLength(1);
        expect(spy.mock.contexts).not.toContain(seriesRoot);
    });

    it('repaints in full when every cell is restyled', async () => {
        await create();

        await transact(column(3, (y) => 1000 + y));

        expectFrameToMatchWholeRepaint(false);
    });

    const copyOf = (cells: GridCell[]) => cells.map((cell) => ({ ...cell }));
    const withCell = (cells: GridCell[], index: number, change: Partial<GridCell>) =>
        cells.map((cell, i) => (i === index ? { ...cell, ...change } : { ...cell }));

    const paintsOf = (renders: number) => {
        if (renders === 0) return 'none';
        return partialRegions().length > 0 ? 'partial' : 'whole';
    };

    it.each([
        { name: 'the same data again', update: () => updateData(copyOf(GRID)), paints: 'none' },
        {
            name: 'an empty transaction',
            update: () => chart.publicApi!.applyTransaction({ update: [] }),
            paints: 'none',
        },
        {
            name: 'a transaction of unchanged cells',
            update: () => chart.publicApi!.applyTransaction({ update: column(3, (y) => 3 * ROWS + y) }),
            paints: 'none',
        },
        {
            name: 'new data with one changed cell',
            update: () => updateData(withCell(GRID, 34, { v: 120 })),
            paints: 'whole',
        },
        {
            name: 'a transaction of one changed cell',
            update: () => chart.publicApi!.applyTransaction({ update: [{ ...GRID[34], v: 120 }] }),
            paints: 'partial',
        },
    ])('paints $paints of the cells for $name', async ({ update, paints }) => {
        await create();
        expect(getHeatmapCellBatch(chart).visible).toBe(true);
        const render = vi.spyOn(HeatmapCellBatch.prototype, 'render');
        spy.mockClear();

        let renders: number;
        try {
            await update();
            await waitForChartStability(chart);
            renders = render.mock.calls.length;
        } finally {
            render.mockRestore();
        }
        expect(paintsOf(renders)).toBe(paints);
        expectFrameToMatchWholeRepaint();
    });

    it('repaints in part for a transaction straight after a redraw of the same data', async () => {
        await create();
        await updateData(copyOf(GRID));
        await waitForChartStability(chart);
        spy.mockClear();

        await transact(column(3, (y) => 150 + y));

        expect(partialRegions()).toHaveLength(1);
        expectFrameToMatchWholeRepaint(true);
    });

    describe('after a change the cells may or may not show', () => {
        const ZOOM = { zoom: { enabled: true, axes: 'x' } };
        const setZoom = (start: number, end: number) =>
            chart.publicApi!.setState({ ...chart.publicApi!.getState(), zoom: { ratioX: { start, end } } });
        const updateTo = (data: GridCell[], series: Record<string, unknown> = {}, chartOptions: object = {}) =>
            chart.publicApi!.update(options(data, series, chartOptions));
        const hoverCell = async (datumIndex: number) => {
            const series = heatmap();
            const { point } = series.getNodeData()!.find((n) => n.datumIndex === datumIndex)!;
            const { canvasX, canvasY } = Transformable.toCanvasPoint(series.contentGroup, point.x, point.y);
            await hoverAction(canvasX, canvasY)(chart);
        };
        const setPixelRatio = (pixelRatio: number) => {
            const { scene } = chart.ctx;
            scene.resize(scene.width, scene.height, pixelRatio);
            scene.render();
            expect(scene.pixelRatio).toBe(pixelRatio);
        };

        type Step = (data: GridCell[]) => unknown;
        const cases: { name: string; chartOptions?: object; steps: Step[]; warnings?: number }[] = [
            { name: 'one cell changed by a data update', steps: [() => updateData(withCell(GRID, 34, { v: 150 }))] },
            {
                name: 'a cell mutated in the data array',
                steps: [
                    (data) => {
                        data[34].v = 150;
                        return updateData(data);
                    },
                ],
            },
            {
                name: 'a colour range change',
                steps: [(data) => updateTo(data, { colorScale: { fills: [{ color: 'green' }, { color: 'yellow' }] } })],
            },
            {
                name: 'a fill opacity change',
                steps: [(data) => updateTo(data, { itemStyler: () => ({ fillOpacity: 0.4 }) })],
            },
            {
                name: 'a highlight, and its end',
                steps: [
                    async () => {
                        await hoverCell(45);
                        expect(chart.ctx.highlightManager.getActiveHighlight()?.datumIndex).toBe(45);
                    },
                    async () => {
                        await hoverAction(1, 1)(chart);
                        await waitForChartStability(chart, MIN_TOOLTIP_HIDE_DELAY);
                        expect(chart.ctx.highlightManager.getActiveHighlight()).toBeUndefined();
                    },
                ],
            },
            { name: 'a resize', steps: [() => chart.publicApi!.updateDelta({ width: 500, height: 350 })] },
            {
                name: 'a zoom that turns crisp off, and back on',
                chartOptions: ZOOM,
                steps: [() => setZoom(0.2, 0.8), () => setZoom(0, 1)],
            },
            { name: 'a pixel ratio change', steps: [() => setPixelRatio(2), () => setPixelRatio(1)] },
            {
                name: 'the last cell removed, and added back',
                steps: [() => updateData(copyOf(GRID.slice(0, -1))), () => updateData(copyOf(GRID))],
            },
            {
                name: 'a cell whose x becomes null',
                steps: [() => updateData(withCell(GRID, 34, { x: null }))],
                warnings: 1,
            },
            {
                name: 'a switch to Rects, and back to the batch',
                steps: [(data) => updateTo(data, { cornerRadius: 2 }), (data) => updateTo(data)],
            },
            {
                name: 'the series hidden, and shown',
                steps: [(data) => updateTo(data, { visible: false }), (data) => updateTo(data)],
            },
        ];

        it.each(cases)('matches a whole repaint after $name', async ({ chartOptions, steps, warnings = 0 }) => {
            const data = copyOf(GRID);
            await create(data, {}, chartOptions);
            expect(getHeatmapCellBatch(chart).visible).toBe(true);
            expectNonBlank(ctx.snapshot());

            for (const step of steps) {
                await step(data);
                await waitForChartStability(chart);
                expectFrameToMatchWholeRepaint();
            }
            expectWarningsCalls().toHaveLength(warnings);
        });
    });

    describe.each([
        ['reorders the cells', [...GRID].reverse()],
        ['drops the last column', GRID.filter((cell) => cell.x !== `X${COLUMNS - 1}`)],
    ])('a transaction after new data that %s', (_name, cells) => {
        it.each([
            { name: 'after the new data is drawn', queued: false },
            { name: 'queued behind the new data', queued: true },
        ])('builds the node data a fresh chart does $name, and matches a whole repaint', async ({ queued }) => {
            await create();
            const dataUpdated = updateData(copyOf(cells));
            if (!queued) {
                await dataUpdated;
                await waitForChartStability(chart);
            }
            const update = column(3, (y) => 150 + y, cells);

            await transact(update);

            expectFrameToMatchWholeRepaint(!queued);
            const updated = new Map(update.map((cell) => [cell.id, cell]));
            const fresh = await createEnterpriseChart(options(cells.map((cell) => updated.get(cell.id) ?? cell)));
            const expected = getHeatmapNodeDataValues(fresh);
            fresh.destroy();
            expect(getHeatmapNodeDataValues(chart)).toEqual(expected);
        });
    });
});

describe('HeatmapCellBatch dirty region', () => {
    const CELL = 10;
    const rewriteAll = (batch: HeatmapCellBatch, opacity = 1, stroke?: string) => {
        for (let x = 0; x < batch.size; x++) batch.set(x, x * CELL, 0, CELL, CELL, `fill${x}`, opacity, 1, stroke);
    };
    const batchOf = (columns: number, opacity = 1) => {
        const batch = new HeatmapCellBatch();
        batch.resize(columns);
        rewriteAll(batch, opacity);
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

    it('has no region after a resize to the same count, as a full rewrite follows it', () => {
        const batch = batchOf(5);
        paint(batch);

        batch.resize(5);
        rewrite(batch, 2);

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

    it.each([
        {
            name: 'an identical rewrite',
            opacity: 1,
            change: (batch: HeatmapCellBatch) => rewriteAll(batch),
            dirty: false,
        },
        {
            name: 'a NaN opacity written over a NaN opacity',
            opacity: Number.NaN,
            change: (batch: HeatmapCellBatch) => rewriteAll(batch, Number.NaN),
            dirty: false,
        },
        {
            name: 'a stroke-only change',
            opacity: 1,
            change: (batch: HeatmapCellBatch) => rewriteAll(batch, 1, 'black'),
            dirty: true,
        },
        {
            name: 'a resize that drops the last cell',
            opacity: 1,
            change: (batch: HeatmapCellBatch) => {
                batch.resize(4);
                rewriteAll(batch);
            },
            dirty: true,
        },
        {
            name: 'a crisp change',
            opacity: 1,
            change: (batch: HeatmapCellBatch) => {
                batch.crisp = false;
                rewriteAll(batch);
            },
            dirty: true,
        },
    ])('marks itself dirty on commit after $name: $dirty', ({ opacity, change, dirty }) => {
        const batch = batchOf(5, opacity);
        paint(batch);
        const markDirty = vi.spyOn(batch, 'markDirty');

        change(batch);
        batch.commit();

        expect(markDirty.mock.calls.length > 0).toBe(dirty);
    });

    it('paints the cells that reach the region in order, and skips the rest', () => {
        const batch = batchOf(8);
        paint(batch);

        // The region reaches cells 2 to 4, and cells 1 and 5 touch its edges.
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

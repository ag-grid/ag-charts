import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgAngleCrossLineOptions,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgCrossLineClickEvent,
    AgCrossLineListeners,
    AgPolarAxisShape,
    AgPolarChartOptions,
    AgRadiusCrossLineOptions,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import type { Chart } from 'ag-charts-community-test';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    deproxy,
    doubleClickAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { ChartAxisDirection } from 'ag-charts-core';

import { mockCssVarColorSupport, prepareEnterpriseTestOptions } from '../../test/utils';
import { PolarCrossLine } from './polarCrossLine';
import * as examples from './test/examples';

type CrossLinesPlugin = NonNullable<ReturnType<typeof _ModuleSupport.getCrossLinesPlugin>>;

type TCtx = ReturnType<typeof setupMockCanvas>;

const compare = async (chart: AgChartInstance | undefined, ctx: TCtx) => {
    expect(chart).toBeDefined();
    if (chart === undefined) return;

    await compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
};

describe('PolarCrossLine', () => {
    setupMockConsole();

    let chart: AgChartInstance | undefined;
    const ctx = setupMockCanvas();

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    describe('#create', () => {
        it.each(Object.entries(examples))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgPolarChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare(chart, ctx);
            }
        );
    });
});

describe('CrossLine colour references', () => {
    setupMockConsole();
    setupMockCanvas();

    const PARAMS = { foregroundColor: '#ff0000', backgroundColor: '#00ff00', fontFamily: 'Verdana, sans-serif' };

    let chart: Chart | undefined;
    let restoreCssVarColorSupport: (() => void) | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
        restoreCssVarColorSupport?.();
        restoreCssVarColorSupport = undefined;
    });

    // Polar axes get the enterprise `polarCrossLines` module, which the module map keys by that
    // name — so `getCrossLinesPlugin`, which looks up `crossLines`, only resolves cartesian axes.
    const crossLineInstances = (target: Chart, axisId: string) => {
        const axis = target.axes.findById(axisId);
        if (axis == null) return [];
        const plugin =
            _ModuleSupport.getCrossLinesPlugin(axis) ??
            axis.getModuleMap().getModule<CrossLinesPlugin>('polarCrossLines');
        return plugin?.getInstances() ?? [];
    };

    const crossLineFills = (target: Chart, axisId: string) => crossLineInstances(target, axisId).map((c) => c.fill);

    const crossLineStrokes = (target: Chart, axisId: string) => crossLineInstances(target, axisId).map((c) => c.stroke);

    const cartesianOptions = (crossLines: AgCartesianCrossLineOptions[]): AgCartesianChartOptions => ({
        data: [
            { x: 'a', y: 1 },
            { x: 'b', y: 3 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        axes: {
            x: { type: 'category' },
            y: { type: 'number', min: 0, max: 4, crossLines },
        },
        theme: { params: PARAMS },
    });

    it('re-resolves a var() fill when the CSS variable changes', async () => {
        const container = document.createElement('div');
        const vars: Record<string, string> = { '--my-colour': 'rgb(0, 128, 0)' };
        restoreCssVarColorSupport = mockCssVarColorSupport(container, vars);

        const options = cartesianOptions([{ type: 'range', range: [1, 3], fill: 'var(--my-colour)' }]);
        chart = deproxy(AgCharts.create(prepareEnterpriseTestOptions(options, container)));
        await waitForChartStability(chart);

        expect(crossLineFills(chart, 'y')).toEqual(['rgb(0, 128, 0)']);

        vars['--my-colour'] = 'rgb(0, 0, 255)';
        // `chart.update` with identical options diffs to `{}` and takes the fast path, which never
        // re-runs processCSSVariables; only a refresh request rebuilds options with
        // refreshCSSVariables set. In production the trigger is the DOMManager transition sensor,
        // which jsdom cannot fire — the end-to-end path is covered by the website css-variables e2e.
        chart.ctx.eventsHub.emit('chart:request-refresh', null);
        await waitForChartStability(chart);

        expect(crossLineFills(chart, 'y')).toEqual(['rgb(0, 0, 255)']);
    });

    it('resolves var() on a cartesian range fill and a line stroke', async () => {
        const container = document.createElement('div');
        restoreCssVarColorSupport = mockCssVarColorSupport(container, { '--my-colour': 'rgb(0, 128, 0)' });

        const options = cartesianOptions([
            { type: 'range', range: [1, 3], fill: 'var(--my-colour)' },
            { type: 'line', value: 2, stroke: 'var(--my-colour)' },
        ]);
        chart = deproxy(AgCharts.create(prepareEnterpriseTestOptions(options, container)));
        await waitForChartStability(chart);

        const [range, line] = crossLineInstances(chart, 'y');
        expect(range.fill).toBe('rgb(0, 128, 0)');
        expect(line.stroke).toBe('rgb(0, 128, 0)');
    });

    it('resolves colour references and var() on polar cross lines', async () => {
        const container = document.createElement('div');
        restoreCssVarColorSupport = mockCssVarColorSupport(container, { '--my-colour': 'rgb(0, 128, 0)' });

        const options: AgPolarChartOptions = {
            data: [
                { quarter: "Q1'22", revenue: 1 },
                { quarter: "Q2'22", revenue: 3 },
            ],
            series: [{ type: 'radar-line', angleKey: 'quarter', radiusKey: 'revenue' }],
            axes: {
                angle: {
                    type: 'angle-category',
                    crossLines: [{ type: 'line', value: "Q1'22", stroke: { ref: 'foregroundColor', mix: 0.5 } }],
                },
                radius: {
                    type: 'radius-number',
                    crossLines: [
                        { type: 'range', range: [0, 1], fill: { ref: 'foregroundColor' } },
                        {
                            type: 'range',
                            range: [1, 2],
                            fill: { ref: 'foregroundColor', mix: 0.2, onto: 'backgroundColor' },
                        },
                        { type: 'range', range: [2, 3], fill: 'var(--my-colour)' },
                    ],
                },
            },
            theme: { params: PARAMS },
        };
        chart = deproxy(AgCharts.create(prepareEnterpriseTestOptions(options, container)));
        await waitForChartStability(chart);

        expect(crossLineFills(chart, 'radius')).toEqual(['#ff0000', '#33cc00', 'rgb(0, 128, 0)']);
        expect(crossLineStrokes(chart, 'angle')).toEqual(['rgba(255, 0, 0, 0.5)']);
    });
});

describe('PolarCrossLine listeners', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const polarOptions = (
        shape: AgPolarAxisShape,
        angleCrossLines: AgAngleCrossLineOptions[],
        radiusCrossLines: AgRadiusCrossLineOptions[],
        rest: Partial<AgPolarChartOptions> = {}
    ): AgPolarChartOptions => ({
        data: [
            { q: 'Q1', v: 2 },
            { q: 'Q2', v: 4 },
            { q: 'Q3', v: 6 },
            { q: 'Q4', v: 8 },
        ],
        series: [{ type: 'radar-line', angleKey: 'q', radiusKey: 'v' }],
        axes: {
            angle: { type: 'angle-category', shape, crossLines: angleCrossLines },
            radius: { type: 'radius-number', shape, min: 0, max: 10, crossLines: radiusCrossLines },
        },
        ...rest,
    });

    const createChart = async (options: AgPolarChartOptions) => {
        const created = deproxy(AgCharts.create(prepareEnterpriseTestOptions(options)));
        await waitForChartStability(created);
        return created;
    };

    const instanceOf = (target: Chart, axisId: string, index = 0): PolarCrossLine => {
        const axis = target.axes.findById(axisId)!;
        const plugin = axis.getModuleMap().getModule<CrossLinesPlugin>('polarCrossLines')!;
        return plugin.getInstances()[index] as PolarCrossLine;
    };

    const canvasPoint = (instance: PolarCrossLine, radius: number, angle: number) =>
        _ModuleSupport.Transformable.toCanvasPoint(
            instance.type === 'range' ? instance.rangeGroup : instance.lineGroup,
            radius * Math.cos(angle),
            radius * Math.sin(angle)
        );

    // A point on the drawn geometry of each cross-line kind, derived from the instance's own layout.
    const pointOn = (instance: PolarCrossLine) => {
        const { scale, axisInnerRadius, axisOuterRadius } = instance;
        const midRadius = (axisInnerRadius + axisOuterRadius) / 2;
        if (instance.direction === ChartAxisDirection.Angle) {
            const angle =
                instance.type === 'line'
                    ? scale!.convert(instance.value)
                    : (scale!.convert(instance.range![0]) + scale!.convert(instance.range![1])) / 2;
            return canvasPoint(instance, midRadius, angle);
        }
        const toRadius = (value: unknown) => axisOuterRadius + axisInnerRadius - scale!.convert(value);
        const radius =
            instance.type === 'line'
                ? toRadius(instance.value)
                : (toRadius(instance.range![0]) + toRadius(instance.range![1])) / 2;
        return canvasPoint(instance, radius, instance.gridAngles![0]);
    };

    const labelCentre = (instance: PolarCrossLine) => {
        const box = instance.getLabelBox()!;
        return { canvasX: box.x + box.width / 2, canvasY: box.y + box.height / 2 };
    };

    const click = async (target: Chart, { canvasX, canvasY }: { canvasX: number; canvasY: number }) =>
        clickAction(canvasX, canvasY)(target);

    it('AC1: clicking an angle range fill fires `click` with the cross-line params', async () => {
        const listener = vi.fn();
        chart = await createChart(
            polarOptions(
                'polygon',
                [{ type: 'range', range: ['Q1', 'Q2'], id: 'band', listeners: { click: listener } }],
                []
            )
        );

        await click(chart, pointOn(instanceOf(chart, 'angle')));

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'crossLineClick',
                crossLineId: 'band',
                axisId: 'angle',
                direction: 'angle',
                crossLineType: 'range',
                value: undefined,
                range: ['Q1', 'Q2'],
            }) satisfies AgCrossLineClickEvent
        );
    });

    it('AC2: double-clicking a radius line fires `doubleClick`', async () => {
        const listeners: AgCrossLineListeners = { click: vi.fn(), doubleClick: vi.fn() };
        chart = await createChart(polarOptions('polygon', [], [{ type: 'line', value: 5, listeners }]));

        const { canvasX, canvasY } = pointOn(instanceOf(chart, 'radius'));
        await doubleClickAction(canvasX, canvasY)(chart);

        expect(listeners.doubleClick).toHaveBeenCalledTimes(1);
        expect(listeners.doubleClick).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'crossLineDoubleClick',
                axisId: 'radius',
                direction: 'radius',
                crossLineType: 'line',
                value: 5,
            })
        );
        expect(listeners.click).toHaveBeenCalledTimes(2);
    });

    it('AC4: clicking a cross-line label fires `click`', async () => {
        const listener = vi.fn();
        chart = await createChart(
            polarOptions(
                'polygon',
                [{ type: 'line', value: 'Q3', label: { text: 'Third' }, listeners: { click: listener } }],
                []
            )
        );

        await click(chart, labelCentre(instanceOf(chart, 'angle')));

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ crossLineType: 'line', value: 'Q3' }));
    });

    it('AC5: cross lines on both axes are distinguished by `crossLineId`', async () => {
        const listener = vi.fn();
        chart = await createChart(
            polarOptions(
                'polygon',
                [{ type: 'line', value: 'Q3', id: 'angle-line', listeners: { click: listener } }],
                [{ type: 'range', range: [1, 3], id: 'radius-band', listeners: { click: listener } }]
            )
        );

        await click(chart, pointOn(instanceOf(chart, 'angle')));
        await click(chart, pointOn(instanceOf(chart, 'radius')));

        expect(listener.mock.calls.map(([event]) => event.crossLineId)).toEqual(['angle-line', 'radius-band']);
    });

    it('AC6: with no cross-line listener the click falls through to the chart `click` listener', async () => {
        const chartClick = vi.fn();
        chart = await createChart(
            polarOptions('polygon', [{ type: 'range', range: ['Q1', 'Q2'] }], [], { listeners: { click: chartClick } })
        );

        await click(chart, pointOn(instanceOf(chart, 'angle')));

        expect(chartClick).toHaveBeenCalledTimes(1);
    });

    it('AC7: a chart-level `crossLineClick` listener receives the cross-line event', async () => {
        const chartClick = vi.fn();
        chart = await createChart(
            polarOptions('polygon', [], [{ type: 'range', range: [1, 3], id: 'band' }], {
                listeners: { crossLineClick: chartClick },
            })
        );

        await click(chart, pointOn(instanceOf(chart, 'radius')));

        expect(chartClick).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'crossLineClick', crossLineId: 'band', axisId: 'radius' })
        );
    });

    describe('TC1: every axis, type and shape combination is a click target', () => {
        const shapes: AgPolarAxisShape[] = ['polygon', 'circle'];
        const cases = shapes.flatMap((shape) => [
            { shape, axisId: 'angle', crossLine: { type: 'line', value: 'Q2' } as AgAngleCrossLineOptions },
            { shape, axisId: 'angle', crossLine: { type: 'range', range: ['Q3', 'Q4'] } as AgAngleCrossLineOptions },
            { shape, axisId: 'radius', crossLine: { type: 'line', value: 7 } as AgRadiusCrossLineOptions },
            { shape, axisId: 'radius', crossLine: { type: 'range', range: [2, 6] } as AgRadiusCrossLineOptions },
        ]);

        it.each(cases)('$shape $axisId $crossLine.type', async ({ shape, axisId, crossLine }) => {
            const listener = vi.fn();
            const withListener = { ...crossLine, listeners: { click: listener } };
            chart = await createChart(
                polarOptions(
                    shape,
                    axisId === 'angle' ? [withListener as AgAngleCrossLineOptions] : [],
                    axisId === 'radius' ? [withListener as AgRadiusCrossLineOptions] : []
                )
            );

            await click(chart, pointOn(instanceOf(chart, axisId)));

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ axisId, crossLineType: crossLine.type }));
        });
    });
});

import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
    AgAngleCrossLineOptions,
    AgAxisCrossLineListeners,
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgCrossLineListeners,
    AgPolarAxisShape,
    AgPolarChartOptions,
    AgRadiusCrossLineOptions,
} from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import type { Chart } from 'ag-charts-community-test';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    compareImageSnapshot,
    deproxy,
    doubleClickAction,
    expectWarningMessages,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import {
    crossLineInstances,
    pointOnPolarCrossLine,
    polarCanvasPoint,
    polarCrossLineAt,
} from '../../test/polarCrossLines';
import { createEnterpriseChart, mockCssVarColorSupport, prepareEnterpriseTestOptions } from '../../test/utils';
import { PolarCrossLine } from './polarCrossLine';
import * as examples from './test/examples';

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

    const labelCentre = (instance: PolarCrossLine) => {
        const { x, y } = instance.getLabelBox()!.computeCenter();
        return { canvasX: x, canvasY: y };
    };

    const click = async (target: Chart, { canvasX, canvasY }: { canvasX: number; canvasY: number }) =>
        clickAction(canvasX, canvasY)(target);

    it('AC3: clicking an angle range fill fires `click` with the cross-line params', async () => {
        const listener = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions(
                'polygon',
                [{ type: 'range', range: ['Q1', 'Q2'], id: 'band', listeners: { click: listener } }],
                []
            )
        );

        await click(chart, pointOnPolarCrossLine(polarCrossLineAt(chart, 'angle')));

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
            })
        );
    });

    it('AC2: double-clicking a radius line fires `doubleClick`', async () => {
        const listeners: AgCrossLineListeners = { click: vi.fn(), doubleClick: vi.fn() };
        chart = await createEnterpriseChart(polarOptions('polygon', [], [{ type: 'line', value: 5, listeners }]));

        const { canvasX, canvasY } = pointOnPolarCrossLine(polarCrossLineAt(chart, 'radius'));
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

    it('a near miss on a labelled radius line does not fire the cross-line listener', async () => {
        const listener = vi.fn();
        const chartClick = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions(
                'polygon',
                [],
                [{ type: 'line', value: 5, label: { text: 'Mid' }, listeners: { click: listener } }],
                {
                    listeners: { click: chartClick },
                }
            )
        );
        const instance = polarCrossLineAt(chart, 'radius');
        const { scale, axisInnerRadius, axisOuterRadius } = instance;
        const missRadius = axisOuterRadius + axisInnerRadius - scale!.convert(3);

        await click(chart, polarCanvasPoint(instance, missRadius, instance.gridAngles![0]));

        expect(listener).not.toHaveBeenCalled();
        expect(chartClick).toHaveBeenCalledTimes(1);
    });

    it.each(['polygon', 'circle'] as AgPolarAxisShape[])(
        'the hole of a %s radius range is not a click target',
        async (shape) => {
            const listener = vi.fn();
            chart = await createEnterpriseChart(
                polarOptions(shape, [], [{ type: 'range', range: [4, 8], listeners: { click: listener } }])
            );
            const instance = polarCrossLineAt(chart, 'radius');
            const { scale, axisInnerRadius, axisOuterRadius } = instance;
            const holeRadius = axisOuterRadius + axisInnerRadius - scale!.convert(1);

            await click(chart, polarCanvasPoint(instance, holeRadius, instance.gridAngles![0]));

            expect(listener).not.toHaveBeenCalled();
        }
    );

    it('the outer edge of a circle radius range is a click target within tolerance', async () => {
        const listener = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions('circle', [], [{ type: 'range', range: [4, 8], listeners: { click: listener } }])
        );
        const instance = polarCrossLineAt(chart, 'radius');
        const { scale, axisInnerRadius, axisOuterRadius } = instance;
        const outerEdge = axisOuterRadius + axisInnerRadius - scale!.convert(8);

        await click(chart, polarCanvasPoint(instance, outerEdge + 2, instance.gridAngles![0]));

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('a thick radius line widens its hit region to half the stroke width', async () => {
        const listener = vi.fn();
        const build = (strokeWidth: number) =>
            polarOptions('polygon', [], [{ type: 'line', value: 5, strokeWidth, listeners: { click: listener } }]);
        chart = await createEnterpriseChart(build(20));

        const instance = polarCrossLineAt(chart, 'radius');
        const { scale, axisInnerRadius, axisOuterRadius } = instance;
        const point = polarCanvasPoint(
            instance,
            axisOuterRadius + axisInnerRadius - scale!.convert(5) + 8,
            instance.gridAngles![0]
        );
        await click(chart, point);

        expect(listener).toHaveBeenCalledTimes(1);

        listener.mockClear();
        await chart.publicApi!.update(prepareEnterpriseTestOptions(build(1)));
        await waitForChartStability(chart);
        await click(chart, point);

        expect(listener).not.toHaveBeenCalled();
    });

    it('a near miss on an angle line falls through to the chart `click` listener', async () => {
        const listener = vi.fn();
        const chartClick = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions(
                'polygon',
                [{ type: 'line', value: 'Q3', label: { text: 'Third' }, listeners: { click: listener } }],
                [],
                {
                    listeners: { click: chartClick },
                }
            )
        );
        const instance = polarCrossLineAt(chart, 'angle');
        const midRadius = (instance.axisInnerRadius + instance.axisOuterRadius) / 2;

        await click(chart, polarCanvasPoint(instance, midRadius, instance.scale!.convert('Q3') + 0.5));

        expect(listener).not.toHaveBeenCalled();
        expect(chartClick).toHaveBeenCalledTimes(1);
    });

    it('AC4: clicking a cross-line label fires `click`', async () => {
        const listener = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions(
                'polygon',
                [{ type: 'line', value: 'Q3', label: { text: 'Third' }, listeners: { click: listener } }],
                []
            )
        );

        await click(chart, labelCentre(polarCrossLineAt(chart, 'angle')));

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ crossLineType: 'line', value: 'Q3' }));
    });

    it('AC5: cross lines on both axes are distinguished by `crossLineId`', async () => {
        const listener = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions(
                'polygon',
                [{ type: 'line', value: 'Q3', id: 'angle-line', listeners: { click: listener } }],
                [{ type: 'range', range: [1, 3], id: 'radius-band', listeners: { click: listener } }]
            )
        );

        await click(chart, pointOnPolarCrossLine(polarCrossLineAt(chart, 'angle')));
        await click(chart, pointOnPolarCrossLine(polarCrossLineAt(chart, 'radius')));

        expect(listener.mock.calls.map(([event]) => event.crossLineId)).toEqual(['angle-line', 'radius-band']);
    });

    it('AC6: with no cross-line listener the click falls through to the chart `click` listener', async () => {
        const chartClick = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions('polygon', [{ type: 'range', range: ['Q1', 'Q2'] }], [], { listeners: { click: chartClick } })
        );

        await click(chart, pointOnPolarCrossLine(polarCrossLineAt(chart, 'angle')));

        expect(chartClick).toHaveBeenCalledTimes(1);
    });

    it.each(['angle', 'radius'] as const)(
        'a %s cross line disabled on update is neither drawn nor a click target',
        async (axisId) => {
            const listener = vi.fn();
            const chartClick = vi.fn();
            const options = (enabled: boolean) => {
                const crossLine = { type: 'range' as const, enabled, listeners: { click: listener } };
                return polarOptions(
                    'polygon',
                    axisId === 'angle' ? [{ ...crossLine, range: ['Q1', 'Q2'] }] : [],
                    axisId === 'radius' ? [{ ...crossLine, range: [2, 6] }] : [],
                    { listeners: { click: chartClick } }
                );
            };
            chart = await createEnterpriseChart(options(true));
            const point = pointOn(crossLineAt(chart, axisId));

            await chart.publicApi!.update(prepareEnterpriseTestOptions(options(false)));
            await waitForChartStability(chart);
            const instance = crossLineAt(chart, axisId);
            expect(instance.rangeGroup.visible).toBe(false);
            expect(instance.labelGroup.visible).toBe(false);

            await click(chart, point);

            expect(listener).not.toHaveBeenCalled();
            expect(chartClick).toHaveBeenCalledTimes(1);
        }
    );

    it('AC7: the same event reaches the axis-level and chart-level `crossLineClick` listeners', async () => {
        const axisClick = vi.fn();
        const chartClick = vi.fn();
        const options = polarOptions('polygon', [], [{ type: 'range', range: [1, 3], id: 'band' }], {
            listeners: { crossLineClick: chartClick },
        });
        options.axes!.radius = { ...options.axes!.radius, listeners: { crossLineClick: axisClick } };
        chart = await createEnterpriseChart(options);

        await click(chart, pointOnPolarCrossLine(polarCrossLineAt(chart, 'radius')));

        const expected = expect.objectContaining({ type: 'crossLineClick', crossLineId: 'band', axisId: 'radius' });
        expect(axisClick).toHaveBeenCalledTimes(1);
        expect(axisClick).toHaveBeenCalledWith(expected);
        expect(chartClick).toHaveBeenCalledTimes(1);
        expect(chartClick).toHaveBeenCalledWith(expected);
    });

    it('polar axes reject axis click listeners', async () => {
        const options = polarOptions('polygon', [{ type: 'line', value: 'Q2' }], []);
        options.axes!.angle = { ...options.axes!.angle, listeners: { click: vi.fn() } as AgAxisCrossLineListeners };
        chart = await createEnterpriseChart(options);

        expectWarningMessages([
            'AG Charts - Option `axes.angle.listeners.click` is not supported by `radar-line` series, ignoring.',
        ]);
    });

    it('AC7: a chart-level `crossLineClick` listener receives the cross-line event', async () => {
        const chartClick = vi.fn();
        chart = await createEnterpriseChart(
            polarOptions('polygon', [], [{ type: 'range', range: [1, 3], id: 'band' }], {
                listeners: { crossLineClick: chartClick },
            })
        );

        await click(chart, pointOnPolarCrossLine(polarCrossLineAt(chart, 'radius')));

        expect(chartClick).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'crossLineClick', crossLineId: 'band', axisId: 'radius' })
        );
    });

    describe('TC1: every axis, type and shape combination is a click target', () => {
        const shapes: AgPolarAxisShape[] = ['polygon', 'circle'];
        const angleCases: AgAngleCrossLineOptions[] = [
            { type: 'line', value: 'Q2' },
            { type: 'range', range: ['Q3', 'Q4'] },
        ];
        const radiusCases: AgRadiusCrossLineOptions[] = [
            { type: 'line', value: 7 },
            { type: 'range', range: [2, 6] },
        ];

        const expectClickTarget = async (target: Chart, axisId: string, listener: ReturnType<typeof vi.fn>) => {
            const instance = polarCrossLineAt(target, axisId);
            await click(target, pointOnPolarCrossLine(instance));
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith(expect.objectContaining({ axisId, crossLineType: instance.type }));
        };

        it.each(shapes.flatMap((shape) => angleCases.map((crossLine) => ({ shape, crossLine }))))(
            '$shape angle $crossLine.type',
            async ({ shape, crossLine }) => {
                const listener = vi.fn();
                chart = await createEnterpriseChart(
                    polarOptions(shape, [{ ...crossLine, listeners: { click: listener } }], [])
                );
                await expectClickTarget(chart, 'angle', listener);
            }
        );

        it.each(shapes.flatMap((shape) => radiusCases.map((crossLine) => ({ shape, crossLine }))))(
            '$shape radius $crossLine.type',
            async ({ shape, crossLine }) => {
                const listener = vi.fn();
                chart = await createEnterpriseChart(
                    polarOptions(shape, [], [{ ...crossLine, listeners: { click: listener } }])
                );
                await expectClickTarget(chart, 'radius', listener);
            }
        );
    });
});

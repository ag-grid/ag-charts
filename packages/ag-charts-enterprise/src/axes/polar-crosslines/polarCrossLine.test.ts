import { afterEach, describe, expect, it } from 'vitest';

import type {
    AgCartesianChartOptions,
    AgCartesianCrossLineOptions,
    AgChartInstance,
    AgPolarChartOptions,
} from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import type { Chart } from 'ag-charts-community-test';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { mockCssVarColorSupport, prepareEnterpriseTestOptions } from '../../test/utils';
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

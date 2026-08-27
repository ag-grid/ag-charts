import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AgCharts, _ModuleSupport } from 'ag-charts-community';
import {
    type ChartTestCase,
    cartesianChartAssertions,
    compareImageSnapshot,
    contextMenuAction,
    deproxy,
    expectNonBlank,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartOptions, AgQuadrantChartOptions, AgQuadrantRegion } from 'ag-charts-types';

import { DEFAULT_CONTEXT_MENU_CLASS } from '../../features/context-menu/contextMenuStyles';
import { prepareEnterpriseTestOptions } from '../../test/utils';

const NUMERIC: AgQuadrantChartOptions = {
    data: [
        { label: 'One', x: -100, y: -100, size: 1 },
        { label: 'Two', x: -75, y: -75, size: 2 },
        { label: 'Three', x: -75, y: 75, size: 3 },
        { label: 'Four', x: 75, y: 75, size: 4 },
        { label: 'Five', x: 75, y: -75, size: 5 },
        { label: 'Six', x: 100, y: 100, size: 6 },
    ],
    xKey: 'x',
    yKey: 'y',
    label: { enabled: true },
    labelKey: 'label',
    xName: 'X Name',
    yName: 'Y Name',
    xAxis: { title: { text: 'X Axis' } },
    yAxis: { title: { text: 'Y Axis' } },
};

const NO_PIVOT_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
};

const PIVOT_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    pivot: { x: 25, y: -25 },
};

const UNALIGNED_AXES_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    pivot: { x: 25, y: -25 },
    alignAxesToPivot: false,
};

const BUBBLE_SIZED_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    sizeKey: 'size',
};

const ITEM_STYLERS_NUMERIC: AgQuadrantChartOptions = {
    ...NUMERIC,
    itemStyler: (params) => {
        switch (params.region) {
            case 'top-left':
                return { fill: 'red', stroke: 'black' };
            case 'top-right':
                return { fill: 'white', stroke: 'green', strokeWidth: 4, size: 20 };
            case 'bottom-left':
                return { fill: 'blue', stroke: 'black', shape: 'star', size: 20 };
            case 'bottom-right':
                return {
                    fill: {
                        type: 'pattern',
                        pattern: 'squares',
                        fill: 'sandybrown',
                        stroke: 'maroon',
                        strokeWidth: 2,
                        width: 20,
                        height: 20,
                        backgroundFill: 'bisque',
                    },
                    size: 40,
                    stroke: 'black',
                };
        }
    },
};

const STYLED: AgQuadrantChartOptions = {
    ...NUMERIC,
    label: {
        color: 'purple',
        fontSize: 14,
        fontWeight: 'bold',
    },
    regions: {
        topLeft: {
            fill: 'red',
            fillOpacity: 0.5,
            marker: { strokeWidth: 1 },
            stroke: 'red',
            strokeWidth: 4,
            label: {
                text: 'Top Left',
                color: 'white',
                fontSize: 20,
            },
        },
        topRight: {
            fill: 'green',
            marker: { fill: 'white', strokeWidth: 4, size: 20 },
            stroke: 'green',
            strokeWidth: 8,
            label: {
                text: 'Top Right',
                position: 'inside-bottom-left',
                color: 'white',
                fontSize: 20,
            },
        },
        bottomLeft: {
            fill: {
                type: 'gradient',
                rotation: 225,
                colorStops: [
                    { color: 'navy', stop: 0 },
                    { color: 'powderblue', stop: 1 },
                ],
            },
            fillOpacity: 0.5,
            marker: { fill: 'navy', strokeWidth: 0, size: 20, shape: 'star' },
            label: {
                text: 'Bottom Left',
                color: 'red',
                rotation: 45,
                fontSize: 20,
            },
        },
        bottomRight: {
            fill: {
                type: 'pattern',
                pattern: 'squares',
                fill: 'sandybrown',
                stroke: 'maroon',
                width: 20,
                height: 20,
                backgroundFill: 'bisque',
            },
            fillOpacity: 0.5,
            marker: { strokeWidth: 1, size: 40 },
            stroke: 'yellow',
            strokeWidth: 4,
            label: {
                text: 'Bottom Right',
                position: 'left' as const,
                fontSize: 20,
                fontWeight: 'bold',
            },
        },
    },
};

const THEMED: AgQuadrantChartOptions = {
    ...NUMERIC,
    theme: {
        overrides: {
            scatter: {
                seriesArea: {
                    backgroundRegions: {
                        fill: {
                            type: 'gradient' as const,
                            colorStops: [{ color: 'orangered' }, { color: 'lightsalmon' }],
                        },
                        fillOpacity: 0.8,
                        stroke: 'crimson',
                        strokeOpacity: 0.8,
                        strokeWidth: 8,
                        label: {
                            border: {
                                enabled: true,
                                stroke: 'indigo',
                                strokeOpacity: 0.8,
                                strokeWidth: 4,
                            },
                            color: 'indigo',
                            cornerRadius: 8,
                            fill: {
                                type: 'gradient' as const,
                                colorStops: [{ color: 'mediumpurple' }, { color: 'thistle' }],
                            },
                            fontSize: 14,
                            fontWeight: 'bold' as const,
                            padding: { top: 12, right: 20, bottom: 12, left: 20 },
                            position: 'inside' as const,
                        },
                    },
                },
            },
        },
    },
};

const assertions = cartesianChartAssertions({ seriesTypes: ['scatter'], axisTypes: { x: 'number', y: 'number' } });

interface QuadrantTestCase extends ChartTestCase {
    options: AgQuadrantChartOptions;
}

const EXAMPLES: Record<string, QuadrantTestCase> = {
    NO_PIVOT_NUMERIC: { options: NO_PIVOT_NUMERIC, assertions },
    PIVOT_NUMERIC: { options: PIVOT_NUMERIC, assertions },
    UNALIGNED_AXES_NUMERIC: { options: UNALIGNED_AXES_NUMERIC, assertions },
    ITEM_STYLERS_NUMERIC: { options: ITEM_STYLERS_NUMERIC, assertions },
    BUBBLE_SIZED_NUMERIC: {
        options: BUBBLE_SIZED_NUMERIC,
        assertions: cartesianChartAssertions({ seriesTypes: ['bubble'], axisTypes: { x: 'number', y: 'number' } }),
    },
    STYLED: { options: STYLED, assertions },
    THEMED: { options: THEMED, assertions },
};

describe('Quadrant Preset', () => {
    setupMockConsole();
    let chart: any;

    afterEach(async () => {
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    it.each(Object.entries(EXAMPLES))(
        'for %s it should create chart instance as expected',
        async (_exampleName, example) => {
            const options: AgQuadrantChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.createQuadrantChart(options);
            await waitForChartStability(chart);
            await example.assertions(chart);

            if (example.warnings) {
                for (const [index, message] of example.warnings.entries()) {
                    expect(console.warn).toHaveBeenNthCalledWith(
                        index + 1,
                        ...(Array.isArray(message) ? message : [message])
                    );
                }
            }
            if (!example.warnings?.length) {
                expect(console.warn).not.toHaveBeenCalled();
            }
        }
    );

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            const options: AgQuadrantChartOptions = { ...example.options };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.createQuadrantChart(options);
            await compare();

            if (example.extraScreenshotActions) {
                await example.extraScreenshotActions(chart);
                await compare();
            }
        }
    );

    it.each([false, true])(
        'starting from alignAxesToPivot %s it should render identically after toggling twice',
        async (alignAxesToPivot) => {
            const options: AgQuadrantChartOptions = { ...PIVOT_NUMERIC, alignAxesToPivot };
            prepareEnterpriseTestOptions(options);

            // The mock canvas only backs the first chart created in a test, so reuse one chart.
            chart = AgCharts.createQuadrantChart(options);
            await waitForChartStability(chart);
            const initialImage = ctx.snapshot();
            expectNonBlank(initialImage);

            for (const toggled of [!alignAxesToPivot, alignAxesToPivot]) {
                await chart.update({ ...options, alignAxesToPivot: toggled });
                await waitForChartStability(chart);
            }

            expect(ctx.snapshot()).toMatchImage(initialImage);
        }
    );
});

// The preset `themeTemplate` is baked into the resolved `ChartTheme`, so charts sharing a theme
// value must not inherit each other's preset template.
describe('Quadrant Preset theme isolation', () => {
    const DATA = NUMERIC.data;

    const resolveAxes = (options: AgChartOptions, presetType?: 'quadrant') => {
        const { processedOptions } = new _ModuleSupport.ChartOptions(
            options,
            {} as AgChartOptions,
            {},
            {},
            presetType == null ? {} : { presetType }
        ) as unknown as { processedOptions: { axes: Record<'x' | 'y', Record<string, any>> } };
        return processedOptions.axes;
    };

    const quadrantOptions = () => ({ data: DATA, xKey: 'x', yKey: 'y' }) as unknown as AgChartOptions;
    const plainOptions = () =>
        ({ data: DATA, series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }] }) as unknown as AgChartOptions;

    const expectQuadrantStyling = (axes: Record<'x' | 'y', Record<string, any>>) => {
        expect(axes.x.label.enabled).toBe(false);
        expect(axes.x.line.width).toBe(2);
    };

    const expectPlainStyling = (axes: Record<'x' | 'y', Record<string, any>>) => {
        expect(axes.x.label.enabled).toBe(true);
        expect(axes.x.line.width).toBe(1);
    };

    it('does not leak the preset template to a plain chart created afterwards', () => {
        expectQuadrantStyling(resolveAxes(quadrantOptions(), 'quadrant'));
        expectPlainStyling(resolveAxes(plainOptions()));
    });

    it('does not lose the preset template to a plain chart created beforehand', () => {
        expectPlainStyling(resolveAxes(plainOptions()));
        expectQuadrantStyling(resolveAxes(quadrantOptions(), 'quadrant'));
    });
});

// `region` must reach the two plot-area scopes and no others. These are compile-time assertions; the
// `@ts-expect-error` directives fail the build if the generic threading regresses.
const CONTEXT_MENU_TYPE_CHECK: AgQuadrantChartOptions = {
    xKey: 'x',
    yKey: 'y',
    contextMenu: {
        getItems: (params) => {
            if (params.showOn === 'series-node') {
                const region: AgQuadrantRegion | undefined = params.region;
                void region;
            }
            if (params.showOn === 'series-area') {
                const region: AgQuadrantRegion | undefined = params.region;
                void region;
            }
            if (params.showOn === 'axis') {
                // @ts-expect-error an axis click does not fall in a region
                void params.region;
            }
            for (const scope of params.allShowOnParams) {
                if (scope.showOn === 'series-node') {
                    const region: AgQuadrantRegion | undefined = scope.region;
                    void region;
                }
                if (scope.showOn === 'legend-item') {
                    // @ts-expect-error a legend item does not fall in a region
                    void scope.region;
                }
            }
            return undefined;
        },
    },
};

const PLAIN_CONTEXT_MENU_TYPE_CHECK: AgChartOptions = {
    contextMenu: {
        getItems: (params) => {
            if (params.showOn === 'series-node') {
                // @ts-expect-error region is a quadrant preset addition, not part of the shared API
                void params.region;
            }
            return undefined;
        },
    },
};

describe('Quadrant Preset context menu region', () => {
    setupMockConsole();
    setupMockCanvas();

    // Away from the origin, so a pass proves the region comes from the pivot and not the sign of the value.
    const PIVOT = { x: 25, y: -25 };

    const CONTEXT_MENU_OPTIONS: AgQuadrantChartOptions = {
        data: [
            { label: 'bottom-left', x: -100, y: -100 },
            { label: 'top-left', x: -75, y: 75 },
            { label: 'top-right', x: 75, y: 75 },
            { label: 'bottom-right', x: 75, y: -75 },
        ],
        xKey: 'x',
        yKey: 'y',
        labelKey: 'label',
        pivot: PIVOT,
    };

    let chart: any;
    let tmpPointerEvent: typeof globalThis.PointerEvent;

    beforeEach(() => {
        // Node.js has no PointerEvent constructor, which the synthetic 'contextmenu' events need.
        tmpPointerEvent = globalThis.PointerEvent;
        globalThis.PointerEvent = class extends MouseEvent {} as typeof globalThis.PointerEvent;
    });

    afterEach(async () => {
        globalThis.PointerEvent = tmpPointerEvent;
        if (chart) {
            await waitForChartStability(chart);
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const prepareChart = async (
        contextMenu: AgQuadrantChartOptions['contextMenu'],
        overrides?: Partial<AgQuadrantChartOptions>
    ) => {
        const options: AgQuadrantChartOptions = { ...CONTEXT_MENU_OPTIONS, ...overrides, contextMenu };
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = AgCharts.createQuadrantChart(options);
        await waitForChartStability(chart);
    };

    /** Canvas point of the marker whose datum carries `label`. */
    const markerPoint = (label: string) => {
        const series = deproxy(chart).series[0] as any;
        const node = series.getNodeData().find((n: any) => n.datum.label === label);
        expect(node).toBeDefined();
        return _ModuleSupport.Transformable.toCanvasPoint(series.contentGroup, node.point.x, node.point.y);
    };

    /**
     * A point inside the series area in the named quadrant, clear of both the markers and the crossing axes.
     * x increases rightwards and y increases upwards, so the plot rect corners map onto the quadrants.
     */
    const seriesAreaPoint = (quadrant: AgQuadrantRegion) => {
        const { x, y, width, height } = deproxy(chart).seriesRect!;
        const left = quadrant === 'top-left' || quadrant === 'bottom-left';
        const top = quadrant === 'top-left' || quadrant === 'top-right';
        return {
            canvasX: x + width * (left ? 0.15 : 0.85),
            canvasY: y + height * (top ? 0.15 : 0.85),
        };
    };

    const rightClick = async (point: { canvasX: number; canvasY: number }) => {
        await contextMenuAction(point.canvasX, point.canvasY)(chart);
        await waitForChartStability(chart);
    };

    const QUADRANTS: AgQuadrantRegion[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

    it.each(QUADRANTS)('reports the %s region for a series-node click', async (quadrant) => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick(markerPoint(quadrant));

        expect(getItems).toHaveBeenCalledTimes(1);
        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('series-node');
        expect(params.region).toBe(quadrant);
    });

    it.each(QUADRANTS)('reports the %s region for a series-area click', async (quadrant) => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick(seriesAreaPoint(quadrant));

        expect(getItems).toHaveBeenCalledTimes(1);
        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('series-area');
        expect(params.region).toBe(quadrant);
    });

    it('derives the series-area region from the pivot rather than from zero', async () => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        const { x, y } = deproxy(chart).seriesRect!;
        const axes = deproxy(chart).axes as any[];
        const xAxis = axes.find((a) => a.direction === 'x');
        const yAxis = axes.find((a) => a.direction === 'y');
        expect(xAxis).toBeDefined();
        expect(yAxis).toBeDefined();

        // Positive x and negative y: a zero-based split would call this 'bottom-right', the pivot puts it top-left.
        await rightClick({ canvasX: x + xAxis.scale.convert(10), canvasY: y + yAxis.scale.convert(-10) });

        const params = getItems.mock.calls[0][0];
        expect(params.coordinates.x.value).toBeGreaterThan(0);
        expect(params.coordinates.y.value).toBeLessThan(0);
        expect(params.region).toBe('top-left');
    });

    it('enriches the series-node and series-area entries in allShowOnParams', async () => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick(markerPoint('top-right'));

        const params = getItems.mock.calls[0][0];
        const node = params.allShowOnParams.find((p: any) => p.showOn === 'series-node');
        const area = params.allShowOnParams.find((p: any) => p.showOn === 'series-area');
        expect(node).toBeDefined();
        expect(area).toBeDefined();
        expect(node.region).toBe('top-right');
        expect(node.region).toBe(params.region);
        expect(area.region).toBe('top-right');
    });

    it('leaves a click outside the plot area without a region', async () => {
        const getItems = vi.fn((_params: any) => []);
        await prepareChart({ enabled: true, getItems });

        await rightClick({ canvasX: 1, canvasY: 1 });

        expect(getItems).toHaveBeenCalledTimes(1);
        const params = getItems.mock.calls[0][0];
        expect(params.showOn).toBe('always');
        expect('region' in params).toBe(false);
    });

    it('exposes region only on the plot-area scopes', () => {
        expect(CONTEXT_MENU_TYPE_CHECK.contextMenu?.getItems).toBeDefined();
        expect(PLAIN_CONTEXT_MENU_TYPE_CHECK.contextMenu?.getItems).toBeDefined();
    });

    it('falls back to items when the composed getItems returns undefined', async () => {
        const getItems = vi.fn((_params: any) => undefined);
        await prepareChart({ enabled: true, getItems, items: ['download'] });

        await rightClick(seriesAreaPoint('top-right'));

        expect(getItems).toHaveBeenCalledTimes(1);
        expect(getItems.mock.results[0].value).toBeUndefined();
        const menus = document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS);
        expect(menus).toHaveLength(1);
        expect(menus[0].textContent).toContain('Download');
    });
});

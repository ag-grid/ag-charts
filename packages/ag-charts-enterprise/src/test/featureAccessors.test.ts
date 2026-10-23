import { afterEach, describe, expect, it } from 'vitest';

import type { AgCartesianChartOptions, AgChartInstance, AgLineSeriesOptions } from 'ag-charts-community';
import {
    deproxy,
    getAxisLayoutState,
    hoverAction,
    mouseDownAction,
    mouseMoveAction,
    mouseUpAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import { Rect } from 'ag-charts-core';

import { DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS } from '../features/annotations/axisButton';
import {
    dragNavigatorHandle,
    findSceneNodes,
    getAnnotationAxisButtonElement,
    getAnnotationOptionsToolbarButtons,
    getAnnotationToolbarsEnabled,
    getAnnotationYAxisDomain,
    getAxisGrantedLabelWidth,
    getAxisLabelThickness,
    getCrosshairLine,
    getErrorBarGroupOpacity,
    getMiniChart,
    getMiniChartSeriesNodeData,
    getMiniChartSeriesOptions,
    getNavigator,
    getNavigatorRange,
    getRangesDropdownMinWidth,
    getScrollbarState,
    getSelectionDragRect,
    getSeriesPlacedLabels,
    hasAnnotationAxisButton,
    setRangesDropdownMinWidth,
    setScrollbarHovered,
} from './featureAccessors';
import { createEnterpriseChart } from './utils';

const DATA = Array.from({ length: 10 }, (_, i) => ({
    x: i,
    y: (i * 7) % 11,
    lo: ((i * 7) % 11) - 1,
    hi: ((i * 7) % 11) + 1,
}));

const BASE_OPTIONS: AgCartesianChartOptions = {
    width: 600,
    height: 400,
    data: DATA,
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'number', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

describe('enterprise feature test accessors', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    const create = async (options: Partial<AgCartesianChartOptions> = {}) => {
        chart = await createEnterpriseChart({ ...BASE_OPTIONS, ...options } as AgCartesianChartOptions);
        return chart;
    };

    describe('ranges', () => {
        const withRanges = () =>
            create({
                ranges: { enabled: true, dropdown: { visible: 'always' }, buttons: [{ label: 'All', value: [0, 9] }] },
            });

        it('sets and reads the dropdown minimum width the module keeps', async () => {
            const c = await withRanges();

            setRangesDropdownMinWidth(c, 123);
            expect(getRangesDropdownMinWidth(c)).toBe(123);

            setRangesDropdownMinWidth(c, undefined);
            expect(getRangesDropdownMinWidth(c)).toBeUndefined();
        });
    });

    describe('getErrorBarGroupOpacity', () => {
        it('reads the opacity of the group the error bars draw into', async () => {
            const c = await create({
                series: [{ type: 'line', xKey: 'x', yKey: 'y', errorBar: { yLowerKey: 'lo', yUpperKey: 'hi' } }],
            });

            expect(getErrorBarGroupOpacity(c)).toBe(1);
        });

        it('reads the dimmed opacity once another datum is selected', async () => {
            const c = await create({
                selection: { enabled: true },
                series: [{ type: 'line', xKey: 'x', yKey: 'y', errorBar: { yLowerKey: 'lo', yUpperKey: 'hi' } }],
            });
            const series = deproxy(c).series[0];

            c.setSelection([{ seriesId: series.id, itemId: series.data!.getItemIdFromIndex(2) }]);
            await waitForChartStability(c);

            expect(getErrorBarGroupOpacity(c)).toBeLessThan(1);
        });
    });

    describe('getSelectionDragRect', () => {
        it('reads the rectangle of a drag in progress', async () => {
            const c = await create({ selection: { enabled: true, enableDrag: true, enableClick: false } });
            const { x, y } = deproxy(c).seriesAreaBoundingBox;

            await mouseDownAction(x + 10, y + 10)(c);
            await mouseMoveAction(x + 40, y + 30)(c);

            expect(getSelectionDragRect(c)).toEqual({ x: x + 10, y: y + 10, width: 30, height: 20 });

            await mouseUpAction(x + 40, y + 30)(c);
        });
    });

    describe('getSeriesPlacedLabels', () => {
        it('lists the labels a series placed, with the datum of each', async () => {
            const c = await create({
                series: [{ type: 'line', xKey: 'x', yKey: 'y', label: { enabled: true } } as AgLineSeriesOptions],
            });

            const labels = getSeriesPlacedLabels<{ datum: { x: number } }>(c);

            expect(labels.length).toBeGreaterThan(0);
            for (const label of labels) {
                expect(label.width).toBeGreaterThan(0);
                expect(label.height).toBeGreaterThan(0);
                expect(DATA).toContain(label.datum.datum);
            }
        });

        it('lists no label for a series whose labels are disabled', async () => {
            const c = await create();

            expect(getSeriesPlacedLabels(c)).toEqual([]);
        });
    });

    describe('annotations', () => {
        const withAnnotations = (annotations: AgCartesianChartOptions['annotations']) => create({ annotations });

        it('reports which of the two toolbars the module enabled', async () => {
            const c = await withAnnotations({ enabled: true, toolbar: { enabled: false } });

            expect(getAnnotationToolbarsEnabled(c)).toEqual({ toolbar: false, optionsToolbar: true });
        });

        it.each([
            ['x', true, false],
            ['y', false, true],
            ['xy', true, true],
        ] as const)('reports the axis buttons `axesButtons.axes: %s` creates', async (axes, x, y) => {
            const c = await withAnnotations({ enabled: true, axesButtons: { enabled: true, axes } });

            expect(hasAnnotationAxisButton(c, 'x')).toBe(x);
            expect(hasAnnotationAxisButton(c, 'y')).toBe(y);
        });

        it('returns the element of each axis button, and fails where there is none', async () => {
            const both = await withAnnotations({ enabled: true, axesButtons: { enabled: true, axes: 'xy' } });

            const xButton = getAnnotationAxisButtonElement(both, 'x');
            const yButton = getAnnotationAxisButtonElement(both, 'y');
            expect(xButton.classList).toContain(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
            expect(yButton.classList).toContain(DEFAULT_ANNOTATION_AXIS_BUTTON_CLASS);
            expect(yButton).not.toBe(xButton);
            expect(xButton.isConnected).toBe(true);

            both.destroy();
            const xOnly = await withAnnotations({ enabled: true, axesButtons: { enabled: true, axes: 'x' } });

            expect(() => getAnnotationAxisButtonElement(xOnly, 'y')).toThrow();
        });

        it('reads the domain of the y scale annotations are placed on', async () => {
            const c = await withAnnotations({ enabled: true });

            const [min, max] = getAnnotationYAxisDomain(c);

            expect(min).toBeLessThanOrEqual(0);
            expect(max).toBeGreaterThanOrEqual(10);
        });

        it('builds the options toolbar buttons of the first annotation', async () => {
            const c = await create({
                annotations: { enabled: true },
                initialState: { annotations: [{ type: 'horizontal-line', value: 5 }] },
            });

            expect(getAnnotationOptionsToolbarButtons(c).length).toBeGreaterThan(0);
        });
    });

    describe('findSceneNodes', () => {
        it('returns the nodes the predicate accepts, and none when it accepts nothing', async () => {
            const c = await create();

            const rects = findSceneNodes(c, (node): node is Rect => node instanceof Rect);

            expect(rects.length).toBeGreaterThan(0);
            expect(rects.every((rect) => rect instanceof Rect)).toBe(true);
            expect(findSceneNodes(c, () => false)).toEqual([]);
        });
    });

    describe('scrollbar', () => {
        const withScrollbar = () =>
            create({
                scrollbar: {
                    enabled: true,
                    visible: 'always',
                    thumb: { strokeWidth: 1, hoverStyle: { strokeWidth: 3 } },
                },
                initialState: { zoom: { ratioX: { start: 0.2, end: 0.6 } } },
            });

        it('reads the nodes and layout the scrollbar keeps for an orientation', async () => {
            const c = await withScrollbar();

            const horizontal = getScrollbarState(c, 'horizontal');

            expect(horizontal.group.visible).toBe(true);
            expect(horizontal.track.width).toBeGreaterThan(horizontal.thumb.width);
            expect(horizontal.layoutRect).toBeDefined();
            expect(horizontal.axisId).toEqual(expect.any(String));
            expect(horizontal.properties.thickness).toBeGreaterThan(0);
            expect(getScrollbarState(c, 'vertical').axisId).not.toBe(horizontal.axisId);
        });

        it('keeps the scrollbar hidden while it is disabled', async () => {
            const c = await create();

            expect(getScrollbarState(c, 'horizontal').group.visible).toBe(false);
        });

        it('hovers and un-hovers the scrollbar thumb', async () => {
            const c = await withScrollbar();
            const { thumb } = getScrollbarState(c, 'horizontal');

            setScrollbarHovered(c, 'horizontal', true);
            expect(thumb.strokeWidth).toBe(3);

            setScrollbarHovered(c, 'horizontal', false);
            expect(thumb.strokeWidth).toBe(1);
        });
    });

    describe('axis label room', () => {
        const withLeftLabel = (label: { fontSize?: number; spacing?: number }) =>
            create({
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left', label },
                },
            });

        it('reads the room the labels need, which follows the layout state and the label font size', async () => {
            const small = await withLeftLabel({ fontSize: 10 });
            const smallThickness = getAxisLabelThickness(small, 'left');
            expect(smallThickness).toBe(getAxisLayoutState(small, 'left').labelThickness);
            small.destroy();

            const large = await withLeftLabel({ fontSize: 30 });

            expect(getAxisLabelThickness(large, 'left')).toBe(getAxisLayoutState(large, 'left').labelThickness);
            expect(getAxisLabelThickness(large, 'left')).toBeGreaterThan(smallThickness);
        });

        it('reads the room the layout granted, which includes the label spacing and so does not move with it', async () => {
            const narrow = await withLeftLabel({ spacing: 5 });
            const grantedNarrow = getAxisGrantedLabelWidth(narrow, 'left');
            narrow.destroy();

            const wide = await withLeftLabel({ spacing: 25 });

            // The layout grants a width for the spacing and the labels together, so widening the spacing narrows the
            // limit on the labels by as much and leaves their sum alone.
            expect(getAxisGrantedLabelWidth(wide, 'left')).toBe(grantedNarrow);
            expect(grantedNarrow - 5).toBeGreaterThan(0);
            expect(grantedNarrow - 5).toBeLessThanOrEqual(BASE_OPTIONS.width!);
        });

        it('fails for an axis that does not exist', async () => {
            const c = await create();

            expect(() => getAxisLabelThickness(c, 'top')).toThrow();
            expect(() => getAxisGrantedLabelWidth(c, 'top')).toThrow();
        });
    });

    describe('getCrosshairLine', () => {
        it('moves the line with the pointer', async () => {
            const c = await create({
                axes: {
                    x: { type: 'number', position: 'bottom', crosshair: { enabled: true, snap: false } },
                    y: { type: 'number', position: 'left', crosshair: { enabled: true, snap: false } },
                },
            });
            const { x, y, width, height } = deproxy(c).seriesAreaBoundingBox;
            const hoverAt = async (fraction: number) => {
                await hoverAction(x + width / 2, y + height * fraction)(c);
                await waitForChartStability(c);
                return getCrosshairLine(c, 'left');
            };

            const lower = await hoverAt(0.75);
            const upper = await hoverAt(0.25);

            expect(lower.visible).toBe(true);
            expect(upper.visible).toBe(true);
            expect(upper.y1).toBeLessThan(lower.y1);
        });

        it('reports a line that is not shown while nothing is hovered', async () => {
            const c = await create();

            expect(getCrosshairLine(c, 'left').visible).toBe(false);
        });
    });

    describe('navigator', () => {
        const withMiniChart = () => create({ navigator: { enabled: true, miniChart: { enabled: true } } });

        it('reads the navigator and its mini chart', async () => {
            const c = await withMiniChart();

            expect(getNavigator(c).miniChart).toBe(getMiniChart(c));
            expect(getMiniChart(c).axes.length).toBeGreaterThan(0);
        });

        it('reads the range the navigator shows, and moves a handle along its track', async () => {
            const c = await create({
                navigator: { enabled: true },
                initialState: { zoom: { ratioX: { start: 0.2, end: 0.6 } } },
            });
            await waitForChartStability(c);
            expect(getNavigatorRange(c)).toEqual({ min: 0.2, max: 0.6 });

            dragNavigatorHandle(c, 'min', 0.1);
            expect(getNavigatorRange(c).min).toBeCloseTo(0.1, 5);
            expect(getNavigatorRange(c).max).toBe(0.6);

            dragNavigatorHandle(c, 'max', 0.9);
            expect(getNavigatorRange(c).max).toBeCloseTo(0.9, 5);
        });

        it('reads the datums and the resolved options of a mini chart series', async () => {
            const c = await create({
                navigator: { enabled: true, miniChart: { enabled: true, series: [{ type: 'line', strokeWidth: 3 }] } },
            });

            expect(getMiniChartSeriesNodeData(c)).toHaveLength(DATA.length);
            expect(getMiniChartSeriesOptions<AgLineSeriesOptions>(c).strokeWidth).toBe(3);
        });
    });
});

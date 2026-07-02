import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import { fromPairs, getDocument, mapValues } from 'ag-charts-core';
import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    type MockEvent,
    type MockTouch,
    type MockTouchTypes,
    WheelDeltaMode,
    clickEvent,
    contextMenuEvent,
    dispatchEvent,
    doubleClickEvent,
    keydownEvent,
    mouseDownEvent,
    mouseEnterEvent,
    mouseLeaveEvent,
    mouseMoveEvent,
    mouseUpEvent,
    touchAverage,
    touchEvent,
    wheelEvent,
} from 'ag-charts-test';
import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgChartOptions,
    AgChartTheme,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgPolarChartOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { type IAnimation, PHASE_METADATA } from '../../motion/animation';
import { BBox } from '../../scene/bbox';
import { Selection } from '../../scene/selection';
import { Rect } from '../../scene/shape/rect';
import { Sector } from '../../scene/shape/sector';
import { SegmentedPath } from '../../scene/shape/segmentedPath';
import type { Chart } from '../chart';
import type { AgChartProxy } from '../chartProxy';
import { AnimationManager } from '../interaction/animationManager';
import { findChartTarget } from './findTarget';

export type { Chart } from '../chart';
export type { AgChartProxy } from '../chartProxy';
export * from '../../util/test/mockConsole';

export type ChartOrProxy<
    O extends AgChartOptions | AgGaugeOptions | AgFinancialChartOptions | AgSparklineOptions = AgChartOptions,
> = AgChartInstance<O> | AgChartProxy | Chart;

export interface ChartTestCase {
    options: AgChartOptions;
    assertions: (chart: ChartOrProxy) => Promise<void> | void;
    extraScreenshotActions?: (chart: ChartOrProxy) => Promise<void>;
    warnings?: Array<string | Array<string>>;
    imageSnapshotDefaults?: MatchImageSnapshotOptions;
}

export interface CartesianOrPolarTestCase extends ChartTestCase {
    options: AgCartesianChartOptions | AgPolarChartOptions;
}

export interface CartesianTestCase extends ChartTestCase {
    options: AgCartesianChartOptions;
}

export interface PolarTestCase extends ChartTestCase {
    options: AgPolarChartOptions;
}

const FAILURE_THRESHOLD = Number(process.env.SNAPSHOT_FAILURE_THRESHOLD ?? 0);
export const IMAGE_SNAPSHOT_DEFAULTS: MatchImageSnapshotOptions = {
    failureThreshold: FAILURE_THRESHOLD,
    failureThresholdType: 'percent',
    customDiffConfig: {
        threshold: 0.05, // 0.5x the default of 0.1 - this is the per pixel threshold for colour/opacity difference.
    },
};

export const PATTERN_SNAPSHOT_DEFAULTS: MatchImageSnapshotOptions = {
    ...IMAGE_SNAPSHOT_DEFAULTS,
    customDiffConfig: {
        ...IMAGE_SNAPSHOT_DEFAULTS.customDiffConfig,
        threshold: 0.075,
    },
};

export function looserSnapshotDefaults(
    pixelThreshold: number = 0.06,
    pixelCountThreshold: number = 40
): MatchImageSnapshotOptions {
    return {
        ...IMAGE_SNAPSHOT_DEFAULTS,
        failureThreshold: pixelCountThreshold,
        failureThresholdType: 'pixel',
        customDiffConfig: {
            ...IMAGE_SNAPSHOT_DEFAULTS.customDiffConfig,
            threshold: pixelThreshold,
        },
    };
}

export async function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function prepareFinancialTestOptions(options: AgFinancialChartOptions, container = getDocument('body')) {
    options.width = CANVAS_WIDTH;
    options.height = CANVAS_HEIGHT;
    options.container = container;

    if (typeof options.theme === 'object' && options.theme.params) {
        options.theme.params.fontFamily = 'Verdana, sans-serif';
    }

    options.theme ??= {
        params: {
            fontFamily: 'Verdana, sans-serif',
        },
    };

    return options;
}

export function prepareTestOptions<T extends AgChartOptions<any, any>>(options: T, container?: HTMLElement): T;
export function prepareTestOptions<T extends AgGaugeOptions>(options: T, container?: HTMLElement): T;
export function prepareTestOptions<T extends AgSparklineOptions<any>>(options: T, container?: HTMLElement): T;
export function prepareTestOptions<T extends AgChartOptions<any, any> | AgGaugeOptions | AgSparklineOptions<any>>(
    options: T,
    container = getDocument('body')
) {
    options.width = CANVAS_WIDTH;
    options.height = CANVAS_HEIGHT;
    options.container = container;

    let baseTestTheme: AgChartTheme = {
        baseTheme: 'ag-default',
        palette: {
            fills: ['#f3622d', '#fba71b', '#57b757', '#41a9c9', '#4258c9', '#9a42c8', '#c84164', '#888888'],
            strokes: ['#aa4520', '#b07513', '#3d803d', '#2d768d', '#2e3e8d', '#6c2e8c', '#8c2d46', '#5f5f5f'],
        },
        params: {
            axisLineColor: '#c3c3c3',
            backgroundColor: 'white',
            borderColor: '#dddddd',
            focusShadow: '0 0 0 3px var(--ag-charts-accent-color)',
            foregroundColor: '#464646',
            fontFamily: 'Verdana, sans-serif',
            gridLineColor: '#e0eaf2',
            popupShadow: '0 2px 8px 0 color-mix(in srgb, black 8%, transparent)',
            subtleTextColor: '#8c8c8c',
            textColor: '#464646',

            chromeBackgroundColor: '#fafafa',

            buttonTextColor: '#464646',

            inputTextColor: '#464646',

            menuBackgroundColor: '#fafafa',

            panelBackgroundColor: '#fafafa',

            tooltipBackgroundColor: '#fafafa',

            crosshairLabelBackgroundColor: '#464646',
            crosshairLabelTextColor: 'white',
        },
    };

    let baseThemeString = options?.theme;
    if (typeof baseThemeString !== 'string') {
        baseThemeString = baseThemeString?.baseTheme as any;
        while (typeof baseThemeString === 'object') {
            baseThemeString = baseThemeString.baseTheme;
        }
    }

    if (typeof options?.theme === 'object') {
        // Override palette and params only if not provided. In dark mode let the dark theme supply
        // colours, but still pin fontFamily to the bundled test font — the default font stack is
        // unregistered and resolves to different system fonts per platform, breaking snapshots.
        baseTestTheme = {
            ...options.theme,
            baseTheme: options.theme.baseTheme ?? baseTestTheme.baseTheme,
            palette: options.theme.palette ?? baseTestTheme.palette,
            params:
                baseThemeString === 'ag-default-dark'
                    ? { fontFamily: baseTestTheme.params!.fontFamily }
                    : (options.theme.params ?? baseTestTheme.params),
        };
    } else if (typeof options?.theme === 'string') {
        // Override colours.
        baseTestTheme.baseTheme = options.theme;
    }

    options.theme = baseTestTheme;

    return options;
}

function isChartInstance(chartOrProxy: ChartOrProxy): chartOrProxy is Chart {
    return !chartOrProxy.constructor.name.endsWith('AgChartInstanceProxy') || (chartOrProxy as Chart).className != null;
}

export function deproxy(chartOrProxy: ChartOrProxy<any>): Chart {
    return isChartInstance(chartOrProxy) ? chartOrProxy : ((chartOrProxy as any).chart as Chart);
}

/**
 * Typed accessor for series internals used by aggregation/data-selection tests.
 * Centralises the shape so renames in the production code don't require sweeping
 * the test suite.
 */
export interface SeriesAggregationInternals {
    id: string;
    data: { getItemIdFromIndex(datumIndex: number): string | number } | undefined;
    dataAggregation: object | undefined;
    aggregateIndexSet?: Map<number, number[]>;
    contextNodeData?: { nodeData?: ReadonlyArray<unknown> };
    ensureBucketLookupFeature():
        | {
              isBucketSelected(datumIndex: number): boolean | undefined;
              getRangeReader(): ((sampledDatumIndex: number) => [number, number] | undefined) | undefined;
              getIndexSet(datumIndex: number): Iterable<number> | undefined;
              setActiveFilter(processedData: unknown, filter: unknown): void;
          }
        | undefined;
}

export function getSeriesAggregationInternals(
    chartOrProxy: ChartOrProxy<any>,
    seriesIndex = 0
): SeriesAggregationInternals {
    return deproxy(chartOrProxy).series[seriesIndex] as unknown as SeriesAggregationInternals;
}

export function repeat<T>(value: T, count: number): T[] {
    return new Array(count).fill(value);
}

/**
 * Get the tooltip DOM element rendered for `chart`, or `null` if the tooltip has not been
 * attached. Scoped to the chart's container so concurrent charts in the same test environment
 * don't interfere.
 */
export function getTooltipElement(chart: Chart): Element | null {
    return chart.container?.querySelector('.ag-charts-tooltip') ?? null;
}

/**
 * Returns whether the tooltip is currently presented (visible). Checks the DOM
 * attribute the tooltip layer toggles, rather than reaching into chart internals.
 */
export function isTooltipVisible(chart: Chart): boolean {
    return getTooltipElement(chart)?.hasAttribute('data-presented-as-popover') ?? false;
}

/**
 * Assert that `series.getTooltipContent` returns `undefined` for every datum the predicate flags
 * as missing, and a defined result for at least one non-missing datum. Consolidates the recurring
 * `data.map(...).filter(i => i >= 0)` + per-index `expect` block used across colour-scale series
 * tests.
 *
 * `indexFor` adapts the datum index to the series-specific shape: a plain number for cartesian /
 * heatmap / map-marker, a path tuple for hierarchy series.
 */
export function assertTooltipSuppressedForMissing<T, K>(
    series: { getTooltipContent(index: K): unknown },
    data: readonly T[],
    missingPredicate: (datum: T) => boolean,
    indexFor: (i: number, datum: T) => K
): void {
    const missing: K[] = [];
    let presentIndex = -1;
    for (let i = 0; i < data.length; i++) {
        const datum = data[i];
        if (missingPredicate(datum)) {
            missing.push(indexFor(i, datum));
        } else if (presentIndex === -1) {
            presentIndex = i;
        }
    }
    expect(missing.length).toBeGreaterThan(0);
    expect(presentIndex).toBeGreaterThanOrEqual(0);
    for (const k of missing) {
        expect(series.getTooltipContent(k)).toBeUndefined();
    }
    expect(series.getTooltipContent(indexFor(presentIndex, data[presentIndex]))).toBeDefined();
}

/**
 * Tier-2 colour-scale series (treemap leaves, sunburst, map-line, map-marker, scatter, bubble)
 * keep the tooltip on missing-colour datums — the shape, label and geometry exist independently
 * of colour, so the mark stays queryable. Asserts defined tooltips for both missing and present
 * datums.
 */
export function assertTooltipPresentForAll<T, K>(
    series: { getTooltipContent(index: K): unknown },
    data: readonly T[],
    missingPredicate: (datum: T) => boolean,
    indexFor: (i: number, datum: T) => K
): void {
    const missing: K[] = [];
    let presentIndex = -1;
    for (let i = 0; i < data.length; i++) {
        const datum = data[i];
        if (missingPredicate(datum)) {
            missing.push(indexFor(i, datum));
        } else if (presentIndex === -1) {
            presentIndex = i;
        }
    }
    expect(missing.length).toBeGreaterThan(0);
    expect(presentIndex).toBeGreaterThanOrEqual(0);
    for (const k of missing) {
        expect(series.getTooltipContent(k)).toBeDefined();
    }
    expect(series.getTooltipContent(indexFor(presentIndex, data[presentIndex]))).toBeDefined();
}

export function range(start: number, end: number, step = 1): number[] {
    const result = new Array(Math.floor((end - start) / step));

    let resultIndex = 0;
    for (let index = start; index <= end; index += step) {
        result[resultIndex++] = index;
    }

    return result;
}

export function dateRange(start: Date, end: Date, step = 24 * 60 * 60 * 1000): Date[] {
    const result: Date[] = [];

    let next = start.getTime();
    const endTime = end.getTime();
    while (next <= endTime) {
        result.push(new Date(next));

        next += step;
    }

    return result;
}

export async function waitForChartStability<
    O extends AgChartOptions | AgGaugeOptions | AgFinancialChartOptions | AgSparklineOptions,
>(chartOrProxy: ChartOrProxy<O>, animationAdvanceMs = 0): Promise<void> {
    const timeoutMs = 5000;
    const chart = deproxy(chartOrProxy);
    const chartAny = chart as any; // to access private properties
    await chart.waitForUpdate(timeoutMs, true);
    if ((chart.width == null || chart.height == null) && !chartAny._lastAutoSize) {
        // Bypass wait for SizeObservable callback - it's never going to be invoked.
        const width = chart.width ?? chart.ctx.scene.canvas.width;
        const height = chart.height ?? chart.ctx.scene.canvas.height;
        chartAny._lastAutoSize = [width, height];
        chartAny.resize(width, height);
        await chart.waitForUpdate(timeoutMs, true);
    }

    if (activeAnimateCb) {
        activeAnimateCb(0, 1);
        if (animationAdvanceMs > 0) {
            activeAnimateCb(animationAdvanceMs, 1);
        }
        await chart.waitForUpdate(timeoutMs, true);
    } else if (animationAdvanceMs > 0) {
        // No animation mocks present - treat as real-time delay
        await delay(animationAdvanceMs);
        await chart.waitForUpdate(timeoutMs, true);
    }
}

export function cartesianChartAssertions(params?: {
    type?: string;
    axisTypes?: Record<string, string>;
    seriesTypes?: string[];
}) {
    const { axisTypes = { x: 'category', y: 'number' }, seriesTypes = ['bar', 'bar'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('CartesianChart');
        expect(chart.axes).toHaveLength(Object.keys(axisTypes).length);
        expect(fromPairs(chart.axes.map((a) => [a.id, a.type]))).toEqual(axisTypes);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function polarChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['pie'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('PolarChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function hierarchyChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['treemap'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('StandaloneChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function topologyChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['map-shape'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('TopologyChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function flowProportionChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['flow-proportion'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('StandaloneChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function standaloneChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['standalone'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('StandaloneChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function gaugeAssertions() {
    return (chartOrProxy: ChartOrProxy<AgGaugeOptions>) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toContain('StandaloneChart');
    };
}

const checkTargetValid = ({ target }: MockEvent) => {
    if (!target.isConnected) throw new Error('Chart must be configured with a container for event testing to work');
};

export function hoverAction(
    canvasX: number,
    canvasY: number,
    modifiers?: EventModifierInit
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        // Implement 'mouseenter' and 'mouseleave' events on this chart.
        // TODO: the testLastMouseMoveBubbleChain property should be correctly set up & torn down by test fixtures.
        const testChart = chartOrProxy as unknown as { testLastMouseMoveBubbleChain: MockEvent['bubbleChain'] };
        const enterChain: MockEvent['bubbleChain'] = [];
        const leaveChain: MockEvent['bubbleChain'] = [];
        testChart.testLastMouseMoveBubbleChain ??= [];
        for (const element of testTarget.bubbleChain) {
            if (!testChart.testLastMouseMoveBubbleChain.includes(element)) {
                enterChain.push(element);
            }
        }
        for (const element of testChart.testLastMouseMoveBubbleChain) {
            if (!testTarget.bubbleChain.includes(element)) {
                leaveChain.push(element);
            }
        }
        const leaveTarget: MockEvent = { ...testTarget, bubbleChain: leaveChain };
        const enterTarget: MockEvent = { ...testTarget, bubbleChain: enterChain };
        testChart.testLastMouseMoveBubbleChain = testTarget.bubbleChain;

        dispatchEvent(leaveTarget, mouseLeaveEvent(leaveTarget, canvasX, canvasY, modifiers));
        dispatchEvent(enterTarget, mouseEnterEvent(enterTarget, canvasX, canvasY, modifiers));
        dispatchEvent(testTarget, mouseMoveEvent(testTarget, canvasX, canvasY, modifiers));
        return delay(50);
    };
}

export const mouseMoveAction = hoverAction;

export function mouseDownAction(
    canvasX: number,
    canvasY: number,
    modifiers?: EventModifierInit
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, mouseDownEvent(testTarget, canvasX, canvasY, modifiers));
        return delay(50);
    };
}

export function mouseUpAction(
    canvasX: number,
    canvasY: number,
    modifiers?: EventModifierInit
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, mouseUpEvent(testTarget, canvasX, canvasY, modifiers));
        return delay(50);
    };
}

export function clickAction(
    canvasX: number,
    canvasY: number,
    opts?: { mousedown?: { offsetX: number; offsetY: number } } & EventModifierInit
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(
            chart,
            opts?.mousedown?.offsetX ?? canvasX,
            opts?.mousedown?.offsetY ?? canvasY
        );
        checkTargetValid(testTarget);

        const mousedownOffset = opts?.mousedown ? { ...testTarget, ...opts.mousedown } : testTarget;
        dispatchEvent(testTarget, mouseDownEvent(mousedownOffset, canvasX, canvasY, opts));
        dispatchEvent(testTarget, mouseUpEvent(testTarget, canvasX, canvasY, opts));
        dispatchEvent(testTarget, clickEvent(testTarget, canvasX, canvasY, opts));
        return delay(50);
    };
}

export function doubleClickAction(canvasX: number, canvasY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        // A double click is always preceded by two single clicks, simulate here to ensure correct handling
        dispatchEvent(testTarget, mouseDownEvent(testTarget, canvasX, canvasY));
        dispatchEvent(testTarget, mouseUpEvent(testTarget, canvasX, canvasY));
        dispatchEvent(testTarget, clickEvent(testTarget, canvasX, canvasY));
        dispatchEvent(testTarget, mouseDownEvent(testTarget, canvasX, canvasY));
        dispatchEvent(testTarget, mouseUpEvent(testTarget, canvasX, canvasY));
        dispatchEvent(testTarget, clickEvent(testTarget, canvasX, canvasY));
        await delay(50);
        await waitForChartStability(chart);
        dispatchEvent(testTarget, doubleClickEvent(testTarget, canvasX, canvasY));
        return delay(50);
    };
}

export function contextMenuAction(canvasX: number, canvasY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, contextMenuEvent(testTarget, canvasX, canvasY));
        return delay(50);
    };
}

export function dragAction(
    from: { x: number; y: number },
    to: { x: number; y: number }
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const fromTarget = findChartTarget(chart, from.x, from.y);
        const toTarget = findChartTarget(chart, to.x, to.y);
        checkTargetValid(fromTarget);
        checkTargetValid(toTarget);

        dispatchEvent(fromTarget, mouseDownEvent(fromTarget, from.x, from.y));
        await delay(500);
        dispatchEvent(fromTarget, mouseMoveEvent(fromTarget, from.x, from.y));
        dispatchEvent(toTarget, mouseMoveEvent(toTarget, to.x, to.y));
        dispatchEvent(toTarget, mouseUpEvent(toTarget, to.x, to.y));
        return delay(50);
    };
}

export function scrollAction(
    canvasX: number,
    canvasY: number,
    deltaY: number,
    delayMs = 50,
    deltaMode: WheelDeltaMode = WheelDeltaMode.Lines,
    deltaX: number = 0
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        dispatchEvent(testTarget, wheelEvent(testTarget, { deltaY, deltaX, deltaMode }));
        await delay(delayMs);
    };
}

export function touchAction(type: MockTouchTypes, touches: MockTouch[]): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const { clientX, clientY } = touchAverage(touches);
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, clientX, clientY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, touchEvent(type, testTarget, touches));
        await delay(50);
    };
}

export function tapAction(clientX: number, clientY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, clientX, clientY);
        let event: TouchEvent;

        event = touchEvent('touchstart', testTarget, [{ identifier: 1, clientX, clientY, states: ['target'] }]);
        dispatchEvent(testTarget, event);

        event = touchEvent('touchend', testTarget, [{ identifier: 1, clientX, clientY, states: ['changed'] }]);
        dispatchEvent(testTarget, event);

        if (!event.defaultPrevented) {
            dispatchEvent(testTarget, mouseDownEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, mouseUpEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, clickEvent(testTarget, clientX, clientY));
        }

        await delay(50);
    };
}

export function doubleTapAction(clientX: number, clientY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, clientX, clientY);
        let event: TouchEvent;

        event = touchEvent('touchstart', testTarget, [{ identifier: 1, clientX, clientY, states: ['target'] }]);
        dispatchEvent(testTarget, event);

        event = touchEvent('touchend', testTarget, [{ identifier: 1, clientX, clientY, states: ['changed'] }]);
        dispatchEvent(testTarget, event);

        if (!event.defaultPrevented) {
            dispatchEvent(testTarget, mouseDownEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, mouseUpEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, clickEvent(testTarget, clientX, clientY));
        }

        event = touchEvent('touchstart', testTarget, [{ identifier: 2, clientX, clientY, states: ['target'] }]);
        dispatchEvent(testTarget, event);

        event = touchEvent('touchend', testTarget, [{ identifier: 2, clientX, clientY, states: ['changed'] }]);
        dispatchEvent(testTarget, event);

        if (!event.defaultPrevented) {
            dispatchEvent(testTarget, mouseDownEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, mouseUpEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, clickEvent(testTarget, clientX, clientY));
            dispatchEvent(testTarget, doubleClickEvent(testTarget, clientX, clientY));
        }

        await delay(50);
    };
}

export function longTapAction(clientX: number, clientY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, clientX, clientY);
        let event: TouchEvent;

        event = touchEvent('touchstart', testTarget, [{ identifier: 1, clientX, clientY, states: ['target'] }]);
        dispatchEvent(testTarget, event);
        await delay(501);

        event = touchEvent('touchend', testTarget, [{ identifier: 1, clientX, clientY, states: ['changed'] }]);
        dispatchEvent(testTarget, event);
        await delay(50);
    };
}

export function touchDragAction(
    from: { x: number; y: number },
    to: { x: number; y: number }
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, from.x, to.x);

        const identifier = 1;
        let clientX: number;
        let clientY: number;
        let event: TouchEvent;

        clientX = from.x;
        clientY = from.y;
        event = touchEvent('touchstart', testTarget, [{ identifier, clientX, clientY, states: ['target'] }]);
        dispatchEvent(testTarget, event);

        clientX = to.x;
        clientY = to.y;
        event = touchEvent('touchmove', testTarget, [{ identifier, clientX, clientY, states: ['target'] }]);
        dispatchEvent(testTarget, event);
        event = touchEvent('touchend', testTarget, [{ identifier, clientX, clientY, states: ['changed'] }]);
        dispatchEvent(testTarget, event);

        await delay(50);
    };
}

export function twoFingerStart(
    identifier1: number,
    clientX1: number,
    clientY1: number,
    identifier2: number,
    clientX2: number,
    clientY2: number
): (chart: ChartOrProxy) => Promise<void> {
    return touchAction('touchstart', [
        { identifier: identifier1, clientX: clientX1, clientY: clientY1, states: ['target'] },
        { identifier: identifier2, clientX: clientX2, clientY: clientY2, states: ['target'] },
    ]);
}

export function twoFingerMove(
    identifier1: number,
    clientX1: number,
    clientY1: number,
    identifier2: number,
    clientX2: number,
    clientY2: number
): (chart: ChartOrProxy) => Promise<void> {
    return touchAction('touchmove', [
        { identifier: identifier1, clientX: clientX1, clientY: clientY1, states: ['target'] },
        { identifier: identifier2, clientX: clientX2, clientY: clientY2, states: ['target'] },
    ]);
}

export function twoFingerEnd(
    identifier1: number,
    clientX1: number,
    clientY1: number,
    identifier2: number,
    clientX2: number,
    clientY2: number
): (chart: ChartOrProxy) => Promise<void> {
    return touchAction('touchend', [
        { identifier: identifier1, clientX: clientX1, clientY: clientY1, states: ['changed'] },
        { identifier: identifier2, clientX: clientX2, clientY: clientY2, states: ['changed'] },
    ]);
}

export function keyDownAction(
    canvasX: number,
    canvasY: number,
    input: { key: string; code: string }
): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, keydownEvent(input));
        return delay(50);
    };
}

export async function createChart(options: AgChartOptions<any, any>) {
    options = prepareTestOptions({ ...options });
    const chart = deproxy(AgCharts.create(options) as AgChartProxy);
    await waitForChartStability(chart);
    return chart;
}

// Minimum delays for delayed removal features (100ms delay + 50ms buffer)
export const MIN_UNHIGHLIGHT_DELAY = 150;
export const MIN_TOOLTIP_HIDE_DELAY = 150;

let activeAnimateCb: ((totalDuration: number, ratio: number) => void) | undefined;
export function spyOnAnimationManager() {
    const mocks: { mockRestore: () => void }[] = [];
    const rafCbs: Map<number, Parameters<typeof requestAnimationFrame>[0]> = new Map();
    let nextRafId = 1;
    const animateParameters = [0, 0];

    let time = Date.now();
    const animateCb = (totalDuration: number, ratio: number) => {
        time += totalDuration * ratio;
        const cbs = [...rafCbs.values()];
        rafCbs.clear();

        for (const cb of cbs) {
            cb(time);
        }
    };

    beforeEach(() => {
        const skippedMock = vi.spyOn(AnimationManager.prototype, 'isSkipped');
        skippedMock.mockImplementation(() => false);

        const forceTimeJumpMock = vi.spyOn(AnimationManager.prototype, 'forceTimeJump');
        forceTimeJumpMock.mockImplementation((controller: IAnimation, defaultDuration: number) => {
            if (!controller.isComplete) {
                // Convert test timing info to phase-relative execution timing.
                const { phase } = controller;
                const { animationDelay } = PHASE_METADATA[phase];

                // Account for phase notional starting offset.
                let updateBy = Math.max(animateParameters[0] * animateParameters[1], 0.0001);
                updateBy -= animationDelay * defaultDuration;

                controller.update(updateBy);
            }
            return true;
        });
        const skippingFramesMock = vi.spyOn(AnimationManager.prototype, 'isSkippingFrames');
        skippingFramesMock.mockImplementation(() => false);

        const safMock = vi.spyOn(AnimationManager.prototype, 'scheduleAnimationFrame');
        safMock.mockImplementation(function (this: AnimationManager, cb) {
            (this as any).requestId = nextRafId++;

            const rafId = nextRafId++;
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            rafCbs.set(rafId, cb);
        });
        mocks.push(skippedMock, forceTimeJumpMock, skippingFramesMock, safMock);

        if (activeAnimateCb) throw new Error('activeAnimateCb already initialized - something is very wrong!');
        activeAnimateCb = animateCb;
    });

    afterEach(() => {
        activeAnimateCb = undefined;
        for (const mock of mocks) {
            mock.mockRestore();
        }
        rafCbs.clear();
    });

    return (totalDuration: number, ratio: number) => {
        animateParameters[0] = totalDuration;
        animateParameters[1] = ratio;
    };
}

/**
 * Frame-stepping animation harness — a sibling to {@link spyOnAnimationManager}.
 *
 * Where `spyOnAnimationManager` mocks `forceTimeJump` to JUMP each animation to an absolute ratio (for
 * per-ratio image snapshots), this harness leaves `forceTimeJump` at its default (returns `false`). As a
 * result animations are added to the batch and progress INCREMENTALLY: firing the captured
 * requestAnimationFrame callbacks with monotonically advancing timestamps steps the real
 * `AnimationBatch.progress()`, exactly as a browser would render successive frames.
 *
 * This enables asserting invariants over the whole animation trajectory (geometry sampled every frame),
 * rather than pixel-comparing a handful of frozen ratios. Interpolated geometry is written to the scene
 * nodes by each series' `applyFn`, so samplers such as {@link sampleRectGeometry} read the live per-frame
 * values directly.
 */
export function spyOnAnimationFrames() {
    const mocks: { mockRestore: () => void }[] = [];
    const rafCbs: Map<number, (time: number) => Promise<void> | void> = new Map();
    let nextRafId = 1;
    let time = Date.now();

    const fireFrame = async (deltaMs: number) => {
        time += deltaMs;
        // Snapshot and clear first: the awaited callback re-registers the next frame's callback.
        const cbs = [...rafCbs.values()];
        rafCbs.clear();
        for (const cb of cbs) {
            await cb(time);
        }
    };

    const settle = async (chartOrProxy: ChartOrProxy<any>) => {
        await deproxy(chartOrProxy).waitForUpdate(5000, true);
    };

    beforeEach(() => {
        const isSkippedMock = vi.spyOn(AnimationManager.prototype, 'isSkipped').mockImplementation(() => false);
        const skippingFramesMock = vi
            .spyOn(AnimationManager.prototype, 'isSkippingFrames')
            .mockImplementation(() => false);
        const safMock = vi.spyOn(AnimationManager.prototype, 'scheduleAnimationFrame');
        safMock.mockImplementation(function (this: AnimationManager, cb) {
            (this as any).requestId = nextRafId++;
            rafCbs.set(nextRafId++, cb);
        });
        // NOTE: `forceTimeJump` is deliberately NOT mocked — its default `false` keeps animations in the
        // batch so they progress frame-by-frame as `fireFrame` is called.
        mocks.push(isSkippedMock, skippingFramesMock, safMock);
    });

    afterEach(() => {
        for (const mock of mocks) {
            mock.mockRestore();
        }
        mocks.length = 0;
        rafCbs.clear();
    });

    /** Fire frames until the animation batch is idle (safety-capped), establishing a stable rendered state. */
    const runToEnd = async (chartOrProxy: ChartOrProxy<any>, maxFrames = 1000) => {
        await settle(chartOrProxy);
        let i = 0;
        while (rafCbs.size > 0 && i < maxFrames) {
            await fireFrame(16);
            i++;
        }
    };

    /**
     * Step a just-triggered animation across `frames` evenly-spaced frames, invoking `sampler()` after
     * each. Returns `frames + 1` samples (index 0 = start state, index `frames` = end state). `duration`
     * should comfortably exceed the batch's total run time so the final frame reaches the end state; the
     * default (1600ms) covers the default 1s animation and its phase delays. If the batch settles early,
     * later samples simply repeat the final geometry.
     */
    const captureAnimationFrames = async <T>(
        chartOrProxy: ChartOrProxy<any>,
        sampler: () => T,
        { frames = 30, duration = 1600 }: { frames?: number; duration?: number } = {}
    ): Promise<T[]> => {
        await settle(chartOrProxy);
        const step = duration / frames;
        const samples: T[] = [sampler()];
        for (let i = 0; i < frames; i++) {
            if (rafCbs.size > 0) {
                await fireFrame(step);
            }
            samples.push(sampler());
        }
        return samples;
    };

    return { runToEnd, captureAnimationFrames };
}

export interface RectGeometry {
    x: number;
    y: number;
    width: number;
    height: number;
    opacity: number;
}

/**
 * Enumerate a series' animatable {@link Rect} scene nodes and read their CURRENT geometry. During
 * animation these hold the interpolated per-frame values (bar/column/histogram/waterfall/etc.), written
 * by the series' `applyFn` — see `prepareBarAnimationFunctions` in `barUtil.ts`. Not to be confused with
 * `series.getNodeData()`, which only ever holds the final target layout.
 */
export function sampleRectGeometry(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0): RectGeometry[] {
    const series = deproxy(chartOrProxy).series[seriesIndex] as any;
    return Selection.selectByClass(series.contentGroup, Rect).map((rect) => ({
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: rect.opacity ?? 1,
    }));
}

export interface SectorGeometry {
    startAngle: number;
    endAngle: number;
    innerRadius: number;
    outerRadius: number;
}

/** Enumerate a polar series' {@link Sector} scene nodes (pie/donut) and read their current angular geometry. */
export function sampleSectorGeometry(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0): SectorGeometry[] {
    const series = deproxy(chartOrProxy).series[seriesIndex] as any;
    return Selection.selectByClass(series.contentGroup, Sector).map((sector) => ({
        startAngle: sector.startAngle,
        endAngle: sector.endAngle,
        innerRadius: sector.innerRadius,
        outerRadius: sector.outerRadius,
    }));
}

export interface PathBBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Read the bounding box of each {@link SegmentedPath} node of a line/area series. Unlike bar/pie nodes,
 * a path's animated geometry lives inside its `Path2D` (re-plotted every frame by the path motion), so
 * there is no per-point property to read; the bbox is the coarse-but-real per-frame signal. `getBBox()`
 * recomputes from the live (dirtied) path on each call.
 */
export function samplePathBBoxes(chartOrProxy: ChartOrProxy<any>, seriesIndex = 0): PathBBox[] {
    const series = deproxy(chartOrProxy).series[seriesIndex] as any;
    return Selection.selectByClass(series.contentGroup, SegmentedPath).map((path) => {
        const bbox = path.getBBox();
        return {
            x: bbox?.x ?? Number.NaN,
            y: bbox?.y ?? Number.NaN,
            width: bbox?.width ?? Number.NaN,
            height: bbox?.height ?? Number.NaN,
        };
    });
}

/**
 * Assert a numeric series never reverses direction (monotonic non-strict). With `direction` omitted the
 * dominant direction is inferred from the endpoints; a flat series (all-equal) satisfies either direction.
 */
export function expectMonotonic(values: number[], direction?: 'increasing' | 'decreasing', tol = 1e-6): void {
    expect(values.length).toBeGreaterThan(1);
    const inferred = direction ?? (values.at(-1)! >= values[0] ? 'increasing' : 'decreasing');
    for (let i = 1; i < values.length; i++) {
        const delta = values[i] - values[i - 1];
        if (inferred === 'increasing') {
            expect(
                delta,
                `frame ${i}: expected non-decreasing, got ${values[i - 1]} -> ${values[i]}`
            ).toBeGreaterThanOrEqual(-tol);
        } else {
            expect(
                delta,
                `frame ${i}: expected non-increasing, got ${values[i - 1]} -> ${values[i]}`
            ).toBeLessThanOrEqual(tol);
        }
    }
}

/**
 * Assert a numeric series is constant across all frames (dimension isolation, e.g. x/width during a
 * vertical grow). The default half-pixel tolerance absorbs sub-pixel `crisp` rounding, which shifts
 * coordinates slightly between the crisp endpoints and the non-crisp intermediate frames.
 */
export function expectConstant(values: number[], tol = 0.5): void {
    expect(values.length).toBeGreaterThan(0);
    const first = values[0];
    for (let i = 1; i < values.length; i++) {
        expect(Math.abs(values[i] - first), `frame ${i}: expected ~${first}, got ${values[i]}`).toBeLessThanOrEqual(
            tol
        );
    }
}

/** Assert every frame lies within the closed interval bounded by the two endpoints (no overshoot). */
export function expectWithinBounds(values: number[], from: number, to: number, tol = 1e-3): void {
    const lo = Math.min(from, to) - tol;
    const hi = Math.max(from, to) + tol;
    for (let i = 0; i < values.length; i++) {
        expect(values[i], `frame ${i}: ${values[i]} outside [${lo}, ${hi}]`).toBeGreaterThanOrEqual(lo);
        expect(values[i], `frame ${i}: ${values[i]} outside [${lo}, ${hi}]`).toBeLessThanOrEqual(hi);
    }
}

/**
 * Assert the animation actually progressed: the series is not flat, AND at least one intermediate frame
 * differs from BOTH endpoints. Catches the no-op / instantly-jumped / visually-blank class of bug (e.g.
 * CRT-1043) that per-ratio image snapshots miss.
 */
export function expectProgresses(values: number[], tol = 1e-3): void {
    expect(values.length).toBeGreaterThan(2);
    const spread = Math.max(...values) - Math.min(...values);
    expect(spread, 'trajectory is flat — animation did not progress').toBeGreaterThan(tol);
    const start = values[0];
    const end = values.at(-1)!;
    const hasMidTransition = values.slice(1, -1).some((v) => Math.abs(v - start) > tol && Math.abs(v - end) > tol);
    expect(hasMidTransition, 'no intermediate frame between the endpoints — animation jumped').toBe(true);
}

export function reverseAxes<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, reverse: boolean): T {
    return {
        ...opts,
        axes: opts.axes ? mapValues(opts.axes, (axis) => ({ ...axis, reverse })) : undefined,
    };
}

export function mixinReversedAxesCases(
    baseCases: Record<string, CartesianOrPolarTestCase & { skip?: boolean; skipWarningsReversed?: boolean }>
): Record<string, CartesianOrPolarTestCase> {
    const result = { ...baseCases };

    for (const name of Object.keys(baseCases)) {
        const baseCase = baseCases[name];
        result[name + '_REVERSED_AXES'] = {
            ...baseCase,
            options: reverseAxes(baseCase.options, true),
            warnings: baseCase.skipWarningsReversed === false ? baseCase.warnings : [],
        };
    }

    return result;
}

export function computeLegendBBox(chart: Chart): BBox {
    const legendModule: any = chart.modulesManager.getModule('legend');
    const { x = 0, y = 0, width = 0, height = 0 } = legendModule?.group.getBBox() ?? {};
    return new BBox(x, y, width, height);
}

export interface LegendTestInternals {
    itemSelection: { nodes(): { datum?: { id: string; itemId?: string | number } }[] };
    onHover(event: FocusEvent | MouseEvent, node: unknown, fromKeyboardFocus?: boolean): void;
    onLeave(fromKeyboardFocus?: boolean): void;
}

export function getLegendModule(chart: Chart): LegendTestInternals {
    return chart.modulesManager.getModule('legend') as LegendTestInternals;
}

export function getCursor(chart: Chart | AgChartProxy): string {
    const ctx = deproxy(chart).getModuleContext();
    return ctx.domManager.getCursor();
}

export function withPreventDefault<E>(partial: Omit<E, 'preventDefault'> & { preventDefault?: never }) {
    return expect.objectContaining({
        ...partial,
        preventDefault: expect.any(Function),
    });
}

export { toMatchImage } from 'ag-charts-test';
export { CANVAS_TO_BUFFER_DEFAULTS, extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';

import { afterEach, beforeEach, expect, jest } from '@jest/globals';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';

import { type AnyFn, getDocument } from 'ag-charts-core';
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
            axisColor: '#c3c3c3',
            borderColor: '#dddddd',
            foregroundColor: '#464646',
            gridLineColor: '#e0eaf2',
            popupShadow: '0 2px 8px 0 color-mix(in srgb, black 8%, transparent)',
            textColor: '#464646',
            subtleTextColor: '#8c8c8c',
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
        // Only override palette and params if not provided, and use default params when in dark mode.
        baseTestTheme = {
            ...options.theme,
            baseTheme: options.theme.baseTheme ?? baseTestTheme.baseTheme,
            palette: options.theme.palette ?? baseTestTheme.palette,
            params: baseThemeString === 'ag-default-dark' ? undefined : options.theme.params ?? baseTestTheme.params,
        };
    } else if (typeof options?.theme === 'string') {
        // Override colours.
        baseTestTheme.baseTheme = options.theme;
    }

    options.theme = baseTestTheme;

    return options;
}

function isChartInstance(chartOrProxy: ChartOrProxy): chartOrProxy is Chart {
    return chartOrProxy.constructor.name !== 'AgChartInstanceProxy' || (chartOrProxy as Chart).className != null;
}

export function deproxy(chartOrProxy: ChartOrProxy<any>): Chart {
    return isChartInstance(chartOrProxy) ? chartOrProxy : ((chartOrProxy as any).chart as Chart);
}

export function repeat<T>(value: T, count: number): T[] {
    return new Array(count).fill(value);
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
        throw new Error(`animationAdvancedMs is non-zero, but no animation mocks are present.`);
    }
}

export function cartesianChartAssertions(params?: { type?: string; axisTypes?: string[]; seriesTypes?: string[] }) {
    const { axisTypes = ['category', 'number'], seriesTypes = ['bar', 'bar'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('CartesianChart');
        expect(chart.axes).toHaveLength(axisTypes.length);
        expect(chart.axes.map((a) => a.type)).toEqual(axisTypes);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function polarChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['pie'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('PolarChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function hierarchyChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['treemap'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('StandaloneChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function topologyChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['map-shape'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('TopologyChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function flowProportionChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['flow-proportion'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('StandaloneChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function standaloneChartAssertions(params?: { seriesTypes?: string[] }) {
    const { seriesTypes = ['standalone'] } = params ?? {};

    return (chartOrProxy: ChartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('StandaloneChart');
        expect(chart.axes).toHaveLength(0);
        expect(chart.series.map((s) => s.type)).toEqual(seriesTypes);
    };
}

export function gaugeAssertions() {
    return (chartOrProxy: ChartOrProxy<AgGaugeOptions>) => {
        const chart = deproxy(chartOrProxy);
        expect(chart?.constructor?.name).toEqual('StandaloneChart');
    };
}

const checkTargetValid = ({ target }: MockEvent) => {
    if (!target.isConnected) throw new Error('Chart must be configured with a container for event testing to work');
};

export function hoverAction(canvasX: number, canvasY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        // Implement 'mouseenter' and 'mouseleave' events on this chart.
        // TODO: the testLastMouseMoveBubbleChain property should be correct setup & teared out by test fixtures.
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

        dispatchEvent(leaveTarget, mouseLeaveEvent(leaveTarget, canvasX, canvasY));
        dispatchEvent(enterTarget, mouseEnterEvent(enterTarget, canvasX, canvasY));
        dispatchEvent(testTarget, mouseMoveEvent(testTarget, canvasX, canvasY));
        return delay(50);
    };
}

export const mouseMoveAction = hoverAction;

export function mouseDownAction(canvasX: number, canvasY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, mouseDownEvent(testTarget, canvasX, canvasY));
        return delay(50);
    };
}

export function mouseUpAction(canvasX: number, canvasY: number): (chart: ChartOrProxy) => Promise<void> {
    return async (chartOrProxy) => {
        const chart = deproxy(chartOrProxy);
        const testTarget = findChartTarget(chart, canvasX, canvasY);
        checkTargetValid(testTarget);

        dispatchEvent(testTarget, mouseUpEvent(testTarget, canvasX, canvasY));
        return delay(50);
    };
}

export function clickAction(
    canvasX: number,
    canvasY: number,
    opts?: { mousedown?: { offsetX: number; offsetY: number } }
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
        dispatchEvent(testTarget, mouseDownEvent(mousedownOffset, canvasX, canvasY));
        dispatchEvent(testTarget, mouseUpEvent(testTarget, canvasX, canvasY));
        dispatchEvent(testTarget, clickEvent(testTarget, canvasX, canvasY));
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

export async function createChart(options: AgChartOptions<any, any>) {
    options = prepareTestOptions({ ...options });
    const chart = deproxy(AgCharts.create(options) as AgChartProxy);
    await waitForChartStability(chart);
    return chart;
}

let activeAnimateCb: ((totalDuration: number, ratio: number) => void) | undefined;
export function spyOnAnimationManager() {
    const mocks: jest.SpiedFunction<AnyFn>[] = [];
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
        const skippedMock = jest.spyOn(AnimationManager.prototype, 'isSkipped');
        skippedMock.mockImplementation(() => false);

        const forceTimeJumpMock = jest.spyOn(AnimationManager.prototype, 'forceTimeJump');
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
        const skippingFramesMock = jest.spyOn(AnimationManager.prototype, 'isSkippingFrames');
        skippingFramesMock.mockImplementation(() => false);

        const safMock = jest.spyOn(AnimationManager.prototype, 'scheduleAnimationFrame');
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

export function reverseAxes<T extends AgCartesianChartOptions | AgPolarChartOptions>(opts: T, reverse: boolean): T {
    return {
        ...opts,
        axes: opts.axes?.map((axis) => ({ ...axis, reverse })),
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

export function getCursor(chart: Chart | AgChartProxy): string {
    const ctx = deproxy(chart).getModuleContext();
    return ctx.domManager.getCursor();
}

export { toMatchImage } from 'ag-charts-test';
export { CANVAS_TO_BUFFER_DEFAULTS, extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';

import {
    CANVAS_HEIGHT,
    CANVAS_WIDTH,
    type MockEvent,
    type MockTouch,
    type MockTouchTypes,
    type SceneGeometrySample,
    type SceneNodeAccessor,
    WheelDeltaMode,
    clickEvent,
    contextMenuEvent,
    createSceneWalk,
    dispatchEvent,
    doubleClickEvent,
    keydownEvent,
    mouseDownEvent,
    mouseEnterEvent,
    mouseLeaveEvent,
    mouseMoveEvent,
    mouseUpEvent,
    sceneSampleToJSON,
    touchAverage,
    touchEvent,
    wheelEvent,
} from '_ag-charts-test';
import type { MatchImageSnapshotOptions } from 'jest-image-snapshot';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, expect, vi } from 'vitest';

import { type OffsetPoint, fromPairs, getDocument, mapValues } from 'ag-charts-core';
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
import { type AnimationPhase, type IAnimation, PHASE_METADATA, PHASE_ORDER } from '../../motion/animation';
import { BBox } from '../../scene/bbox';
import { Group } from '../../scene/group';
import type { Node } from '../../scene/node';
import { alignCentre, snapDeviceCentre } from '../../scene/util/pixel';
import { extractImageData, type setupMockCanvas } from '../../util/test/mockCanvas';
import type { Chart } from '../chart';
import type { AgChartProxy } from '../chartProxy';
import { AnimationManager } from '../interaction/animationManager';
import { findChartTarget } from './findTarget';

export type { Chart } from '../chart';
export type { AgChartProxy } from '../chartProxy';
export * from '../../util/test/mockConsole';
export {
    type SceneGeometrySample,
    type SceneNodeGeometry,
    type SerializedSceneNode,
    type SerializedSceneRoots,
    flattenPathPolylines,
    sampleSerializedRoots,
    sceneSampleToJSON,
} from '_ag-charts-test';

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

const SCENE_SNAPSHOTS_DIR = '__scene_snapshots__';
const IMAGE_SNAPSHOTS_DIR = '__image_snapshots__';

/** Counters jest-image-snapshot mutates on the (vitest) snapshot state; used to detect image diffs
 * in both fail mode and `--update` mode. */
interface ImageSnapshotState {
    updated?: number;
    unmatched?: number;
    added?: number;
}

type SceneSnapshotMode = 'diff' | 'all' | 'off';

function sceneSnapshotMode(): SceneSnapshotMode {
    const mode = process.env.AG_SCENE_SNAPSHOTS;
    return mode === 'all' || mode === 'off' ? mode : 'diff';
}

function writeSceneSnapshot(
    chartOrProxy: ChartOrProxy<any>,
    options: MatchImageSnapshotOptions,
    resolvedIdentifier: string
): void {
    const { testPath } = expect.getState();
    // Mirror jest-image-snapshot's truthiness fallback (`customSnapshotsDir || default`): an empty
    // string must fall back to the default so the JSON lands beside the PNG, not in the CWD.
    const { customSnapshotsDir } = options;
    const imageSnapshotsDir =
        customSnapshotsDir != null && customSnapshotsDir.length > 0
            ? customSnapshotsDir
            : path.join(path.dirname(testPath ?? ''), IMAGE_SNAPSHOTS_DIR);
    const sceneSnapshotsDir = path.join(path.dirname(imageSnapshotsDir), SCENE_SNAPSHOTS_DIR);
    const sample = createSceneGeometrySampler(chartOrProxy, { includeChrome: true })();
    mkdirSync(sceneSnapshotsDir, { recursive: true });
    writeFileSync(
        path.join(sceneSnapshotsDir, `${resolvedIdentifier}.json`),
        JSON.stringify(sceneSampleToJSON(sample), null, 2)
    );
}

/**
 * Shared image-snapshot comparison: waits for chart stability, compares the mock canvas against the
 * image baseline, and captures a machine-readable scene-graph JSON alongside the PNG for CI diff
 * verification. The JSON is written to a gitignored `__scene_snapshots__` dir (sibling of
 * `__image_snapshots__`, sharing the PNG's identifier as its filename) when the image differed or a
 * new baseline was written — detected in both fail mode and `--update` mode. `AG_SCENE_SNAPSHOTS=all`
 * forces capture for every comparison (set on CI pushes to baseline branches: latest, next, release);
 * `AG_SCENE_SNAPSHOTS=off` disables capture.
 *
 * The JSON always captures the whole scene graph. For bbox-cropped comparisons (`canvasCtx.bbox` set,
 * e.g. axis suites) the paired PNG shows only the cropped region, so the JSON is a superset of it.
 */
export async function compareImageSnapshot(
    chartOrProxy: ChartOrProxy<any>,
    canvasCtx: ReturnType<typeof setupMockCanvas> & { bbox?: { x: number; y: number; width: number; height: number } },
    options: MatchImageSnapshotOptions = IMAGE_SNAPSHOT_DEFAULTS
): Promise<void> {
    await waitForChartStability(chartOrProxy);
    const image = extractImageData(canvasCtx);

    const mode = sceneSnapshotMode();
    const state = expect.getState().snapshotState as unknown as ImageSnapshotState;
    const before = { updated: state.updated ?? 0, unmatched: state.unmatched ?? 0, added: state.added ?? 0 };

    // The scene JSON must share the exact identifier jest-image-snapshot resolves for the PNG. Rather
    // than reconstruct that identifier (which would duplicate its kebab-casing and counter logic, and
    // re-invoke a caller's customSnapshotIdentifier — doubling side effects, desyncing on a
    // non-idempotent callback), inject a wrapper that reproduces the matcher's own resolution from the
    // `defaultIdentifier` it supplies, then captures the single result for the JSON filename.
    let resolvedIdentifier = '';
    const { customSnapshotIdentifier } = options;
    const matcherOptions: MatchImageSnapshotOptions = {
        ...options,
        customSnapshotIdentifier: (parameters) => {
            if (typeof customSnapshotIdentifier === 'function') {
                resolvedIdentifier = customSnapshotIdentifier(parameters) || parameters.defaultIdentifier;
            } else if (typeof customSnapshotIdentifier === 'string' && customSnapshotIdentifier.length > 0) {
                resolvedIdentifier = customSnapshotIdentifier;
            } else {
                resolvedIdentifier = `${parameters.defaultIdentifier}-snap`;
            }
            return resolvedIdentifier;
        },
    };

    let threw = false;
    try {
        expect(image).toMatchImageSnapshot(matcherOptions);
    } catch (error) {
        threw = true;
        throw error;
    } finally {
        const differed =
            threw ||
            (state.updated ?? 0) > before.updated ||
            (state.unmatched ?? 0) > before.unmatched ||
            (state.added ?? 0) > before.added;
        if (mode === 'all' || (mode === 'diff' && differed)) {
            try {
                writeSceneSnapshot(chartOrProxy, options, resolvedIdentifier);
            } catch (captureError) {
                // Scene capture is an auxiliary CI artifact: a failure here must never replace the
                // image-diff result it accompanies (a `finally` throw would mask the primary error).
                // Report via stderr, not console.* — setupMockConsole() fails tests on console output.
                process.stderr.write(`AG_SCENE_SNAPSHOTS: scene capture failed: ${String(captureError)}\n`);
            }
        }
    }
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

/** A label node as drawn, carrying the datum the placement engine wrote its resolved placement onto. */
export interface DrawnLabelNode<TDatum = any> {
    visible: boolean;
    text: string;
    x: number;
    y: number;
    datum: TDatum;
}

/** The label nodes a series actually drew, so a label its styler disabled is absent. */
export function getVisibleLabelNodes<TDatum = any>(
    chartOrProxy: ChartOrProxy<any>,
    seriesIndex = 0
): DrawnLabelNode<TDatum>[] {
    const { labelSelection } = deproxy(chartOrProxy).series[seriesIndex] as unknown as {
        labelSelection: { nodes(): DrawnLabelNode<TDatum>[] };
    };
    return labelSelection.nodes().filter((node) => node.visible);
}

/** A series' placed label geometry, enough to measure a label's offset from its marker anchor. */
export interface PlacedLabelGeometry {
    placedLabelData: { y: number; height: number; datum: { point: { y: number } } }[];
}

/**
 * Vertical gap between a marker anchor and the bottom edge of its first placed label, for a label
 * placed above the marker ('top'). Asserts a label was actually placed.
 */
export function topLabelAnchorGap(series: PlacedLabelGeometry): number {
    const [label] = series.placedLabelData;
    expect(label).toBeDefined();
    return label.datum.point.y - (label.y + label.height);
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

/**
 * Object-form axes placing category gridlines on the category centre, for asserting that bars align
 * with their gridlines (AG-17856). Spread into a chart options `axes` field.
 */
export const CATEGORY_CENTRE_GRIDLINE_AXES = {
    x: { type: 'category', position: 'bottom', interval: { placement: 'on' }, gridLine: { enabled: true } },
    y: { type: 'number', position: 'left' },
} as const;

function categoryGridlineOffsets(chart: any): number[] {
    const xAxis = chart.axes.find((a: any) => a.direction === 'x');
    return (xAxis?.tickLayout?.gridLines ?? []).map((g: any) => Number(g.offset));
}

/** Logical bar centres along the category (x) axis, before device-pixel snapping, ascending. */
function categoryBarCentresX(chart: any): number[] {
    const nodeData = chart.series[0].contextNodeData?.nodeData ?? [];
    return nodeData
        .map((d: any) => d.x + d.width / 2)
        .filter((v: number) => Number.isFinite(v))
        .sort((a: number, b: number) => a - b);
}

/**
 * Assert every category-axis bar centre coincides with a gridline. The bar centre and the gridline
 * derive from one unrounded coordinate, so they are numerically identical regardless of DPR.
 */
export function expectBarCentresOnCategoryGridlines(chartOrProxy: ChartOrProxy<any>, expectedBars?: number) {
    const chart = deproxy(chartOrProxy) as any;
    const gridlines = categoryGridlineOffsets(chart);
    const centres = categoryBarCentresX(chart);

    if (expectedBars == null) {
        expect(centres.length).toBeGreaterThan(0);
    } else {
        expect(centres.length).toBe(expectedBars);
    }
    expect(gridlines.length).toBeGreaterThanOrEqual(centres.length);

    for (const centre of centres) {
        const nearest = gridlines.reduce((min, g) => Math.min(min, Math.abs(g - centre)), Infinity);
        expect(nearest).toBeLessThan(1e-6);
    }
}

/** Mirror of `Line.render`'s stroke snap — a gridline is a vertical `Line` and has no exported snap. */
function lineStrokeSnapDev(pixelRatio: number, coord: number, strokeWidth: number): number {
    return snapDeviceCentre(coord * pixelRatio, Math.trunc(strokeWidth * pixelRatio));
}

/**
 * Assert every bar renders on its gridline in DEVICE space — the check {@link expectBarCentresOnCategoryGridlines}
 * cannot make, since equal logical centres can still snap to different device pixels (AG-17856). Applies the
 * production {@link alignCentre} to each bar and compares against the gridline's snapped position. Bars whose
 * device width matches the gridline stroke parity land exactly; otherwise they sit within the unavoidable
 * half-device-pixel parity gap.
 */
export function expectBarCentresRenderedOnCategoryGridlines(
    chartOrProxy: ChartOrProxy<any>,
    pixelRatio: number,
    expectedBars?: number
) {
    const chart = deproxy(chartOrProxy) as any;
    const xAxis = chart.axes.find((a: any) => a.direction === 'x');

    // The gridline group and the series content are translated by the same floored origin, so a locally
    // snapped bar centre and gridline compare directly. A drift here would offset every bar from its grid.
    expect(chart.seriesRoot.translationX).toBe(xAxis.gridGroup.translationX);

    const gridlines = categoryGridlineOffsets(chart);
    const gridStrokeWidth = xAxis.gridLine?.style?.[0]?.strokeWidth ?? 1;
    const nodeData = chart.series[0].contextNodeData?.nodeData ?? [];
    const bars = nodeData.filter((d: any) => Number.isFinite(d.x) && Number.isFinite(d.width) && d.width > 0);

    if (expectedBars == null) {
        expect(bars.length).toBeGreaterThan(0);
    } else {
        expect(bars.length).toBe(expectedBars);
    }

    const gridParity = Math.trunc(gridStrokeWidth * pixelRatio) % 2;
    for (const d of bars) {
        const logicalCentre = d.x + d.width / 2;
        const { start, length } = alignCentre(pixelRatio, d.x, d.width);
        const barCentreDev = (start + length / 2) * pixelRatio;
        const nearestGrid = gridlines.reduce(
            (best, g) => (Math.abs(g - logicalCentre) < Math.abs(best - logicalCentre) ? g : best),
            gridlines[0]
        );
        const gridCentreDev = lineStrokeSnapDev(pixelRatio, nearestGrid, gridStrokeWidth);
        const deviceWidth = Math.round(length * pixelRatio);
        const parityMatches = deviceWidth % 2 === gridParity;
        expect(Math.abs(barCentreDev - gridCentreDev)).toBeLessThanOrEqual(parityMatches ? 1e-6 : 0.5 + 1e-6);
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
    opts?: { mousedown?: OffsetPoint } & EventModifierInit
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
 * nodes by each series' `applyFn`, so {@link createSceneGeometrySampler} reads the live per-frame
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
        // Drop the environment terms (`!rafAvailable`, `skipAnimations`) but preserve batch-level
        // skips: product snap paths (resize, skipCurrentBatch) must still skip.
        const isSkippedMock = vi.spyOn(AnimationManager.prototype, 'isSkipped').mockImplementation(function (
            this: AnimationManager
        ) {
            return (this as unknown as { batch: { isSkipped(): boolean } }).batch.isSkipped();
        });
        const skippingFramesMock = vi
            .spyOn(AnimationManager.prototype, 'isSkippingFrames')
            .mockImplementation(() => false);
        const safMock = vi.spyOn(AnimationManager.prototype, 'scheduleAnimationFrame');
        safMock.mockImplementation(function (this: AnimationManager, cb) {
            const id = nextRafId++;
            (this as any).requestId = id;
            rafCbs.set(id, cb);
        });
        // Mirror browser cancelAnimationFrame semantics: a mid-animation update cancels the pending
        // frame, so its mock callback must leave the queue too.
        const animationManagerProto = AnimationManager.prototype as unknown as {
            cancelAnimation: (this: AnimationManager) => void;
        };
        const originalCancelAnimation = animationManagerProto.cancelAnimation;
        const cancelMock = vi.spyOn(animationManagerProto, 'cancelAnimation').mockImplementation(function (
            this: AnimationManager
        ) {
            const id = (this as any).requestId;
            if (id != null) {
                rafCbs.delete(id);
            }
            originalCancelAnimation.call(this);
        });
        // NOTE: `forceTimeJump` is deliberately NOT mocked — its default `false` keeps animations in the
        // batch so they progress frame-by-frame as `fireFrame` is called.
        mocks.push(isSkippedMock, skippingFramesMock, safMock, cancelMock);
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

    // Centralised private-state accessor (see testing guide): the batch's phase index drives the
    // `during` phase-window assertions of expectSceneTrajectory.
    const currentPhaseIndex = (chartOrProxy: ChartOrProxy<any>): number => {
        const batch = (deproxy(chartOrProxy) as any).ctx?.animationManager?.batch;
        return batch?.isActive() ? (batch.currentPhase ?? PHASE_ORDER.length) : PHASE_ORDER.length;
    };

    /**
     * Step a just-triggered animation across `frames` evenly-spaced frames, invoking `sampler()` after
     * each. Returns `frames + 1` samples (index 0 = start state, index `frames` = end state). `duration`
     * should comfortably exceed the batch's total run time so the final frame reaches the end state; the
     * default (1600ms) covers the default 1s animation and its phase delays. If the batch settles early,
     * later samples simply repeat the final geometry.
     *
     * The result also carries `phaseIntervals`: for each inter-sample interval, the contiguous range of
     * `AnimationPhase`s the batch passed through while producing it (empty once the batch is idle). This
     * is what lets {@link expectSceneTrajectory} scope expectations with `during`. Phase attribution is
     * per-interval, so an interval spanning a phase boundary (or the batch finishing) accepts movement
     * from any phase it touched — the `during` guarantee is coarsest exactly at phase boundaries.
     */
    const captureAnimationFrames = async <T>(
        chartOrProxy: ChartOrProxy<any>,
        sampler: () => T,
        {
            frames = 30,
            duration = 1600,
            onFrame,
        }: {
            frames?: number;
            duration?: number;
            /**
             * Invoked before firing frame `frameIndex` (0-based) — the hook for mid-capture chart
             * updates (streaming/rapid-update scenarios). Await the update inside the hook so the
             * interrupted batch has re-scheduled before the next frame fires.
             */
            onFrame?: (frameIndex: number) => void | Promise<void>;
        } = {}
    ): Promise<T[] & PhasedTrajectory> => {
        await settle(chartOrProxy);
        const step = duration / frames;
        const samples: T[] = [sampler()];
        const phaseIntervals: AnimationPhase[][] = [];
        for (let i = 0; i < frames; i++) {
            await onFrame?.(i);
            const from = currentPhaseIndex(chartOrProxy);
            if (rafCbs.size > 0) {
                await fireFrame(step);
            }
            const to = currentPhaseIndex(chartOrProxy);
            phaseIntervals.push(
                from >= PHASE_ORDER.length ? [] : PHASE_ORDER.slice(from, Math.min(to, PHASE_ORDER.length - 1) + 1)
            );
            samples.push(sampler());
        }
        return Object.assign(samples, { phaseIntervals });
    };

    type Capture = {
        trajectory: SceneGeometrySample[] & PhasedTrajectory;
        before: SceneGeometrySample;
        after: SceneGeometrySample;
    };

    /** Settle, sample `before`, apply `action`, capture the animation, settle, sample `after`. */
    const captureAround = async (
        chartOrProxy: ChartOrProxy<any>,
        sampler: () => SceneGeometrySample,
        action: () => void | Promise<void>,
        options: { frames?: number; duration?: number } = {}
    ): Promise<Capture> => {
        await runToEnd(chartOrProxy);
        const before = sampler();
        await action();
        const trajectory = await captureAnimationFrames(chartOrProxy, sampler, options);
        await runToEnd(chartOrProxy);
        const after = sampler();
        return { trajectory, before, after };
    };

    /**
     * The standard single-action capture flow shared by trajectory CASEs: settle, sample the before
     * state, apply `action` (a chart update or API call), capture the resulting animation, run it to
     * completion and sample the after state. Asserts the trajectory endpoints equal the before/after
     * scenes, so callers only assert what moves in between.
     */
    const captureUpdate = async (
        chartOrProxy: ChartOrProxy<any>,
        sampler: () => SceneGeometrySample,
        action: () => void | Promise<void>,
        options: { frames?: number; duration?: number } = {}
    ): Promise<Capture> => {
        const capture = await captureAround(chartOrProxy, sampler, action, options);
        const { trajectory, before, after } = capture;
        // A structural update adds/removes nodes at frame 0, so the start check is scoped to nodes
        // present on both sides: surviving geometry must not jump when the update lands.
        const common = new Map([...before].filter(([key]) => trajectory[0].has(key)));
        expectSceneSamplesMatch(new Map([...trajectory[0]].filter(([key]) => common.has(key))), common);
        expectSceneSamplesMatch(trajectory.at(-1)!, after);
        return capture;
    };

    /**
     * The capture flow for actions that SNAP structurally at frame 0 — a series that skips its
     * animation batch, a category reshuffle, a marker-set swap. The whole layout lands on the first
     * captured frame, so (unlike {@link captureUpdate}) frame 0 is NOT anchored to the before scene;
     * only the settled end anchor is asserted. Callers then prove the captured frames held constant.
     */
    const captureSnap = async (
        chartOrProxy: ChartOrProxy<any>,
        sampler: () => SceneGeometrySample,
        action: () => void | Promise<void>,
        options: { frames?: number; duration?: number } = {}
    ): Promise<Capture> => {
        const capture = await captureAround(chartOrProxy, sampler, action, options);
        expectSceneSamplesMatch(capture.trajectory.at(-1)!, capture.after);
        return capture;
    };

    return { runToEnd, captureAnimationFrames, captureUpdate, captureSnap };
}

// Guards against a vacuously-identical comparison: a chart that failed to render leaves the
// snapshot canvas uniform, and two uniform snapshots always match.
export function expectNonBlank(image: ImageData): void {
    const [r, g, b, a] = image.data;
    let uniform = true;
    for (let i = 4; uniform && i < image.data.length; i += 4) {
        uniform = image.data[i] === r && image.data[i + 1] === g && image.data[i + 2] === b && image.data[i + 3] === a;
    }
    expect(uniform, 'expected the rendered chart to produce a non-uniform snapshot').toBe(false);
}

/**
 * Endpoint sanity guard for trajectory suites: the animated routes into `before` (the initial reveal)
 * and `after` (the transition) must settle at exactly the pixels a non-animated (snapped) render of the
 * same options produces, compared in memory via `toMatchImage`.
 *
 * Must run on the suite's single snapshot-backed chart: create the chart with `before` immediately
 * beforehand and pass the un-mutated option objects here. The static legs snap via the public
 * `chart.skipAnimations()` — `animation: { enabled: false }` is inert under `spyOnAnimationFrames`,
 * which preserves only batch-level skips. A static-start mismatch has two readings: the animated
 * reveal not settling at the static render, or the `after` → `before` update not round-tripping.
 */
export async function expectAnimatedEndpointsMatchStatic(
    frames: Pick<ReturnType<typeof spyOnAnimationFrames>, 'runToEnd'>,
    snapshot: () => ImageData,
    chart: AgChartInstance,
    before: AgChartOptions,
    after: AgChartOptions,
    { transition, writeDiff = true }: { transition?: () => void | Promise<void>; writeDiff?: boolean } = {}
): Promise<void> {
    await frames.runToEnd(chart);
    const animatedStart = snapshot();
    expectNonBlank(animatedStart);

    await (transition ? transition() : chart.update(after));
    await frames.runToEnd(chart);
    const animatedEnd = snapshot();
    expectNonBlank(animatedEnd);
    // A transition that changes no pixels would let all four comparisons pass vacuously.
    expect(animatedEnd).not.toMatchImage(animatedStart, { writeDiff: false });

    chart.skipAnimations();
    await chart.update(before);
    await frames.runToEnd(chart);
    expect(snapshot()).toMatchImage(animatedStart, { writeDiff });

    chart.skipAnimations();
    await chart.update(after);
    await frames.runToEnd(chart);
    expect(snapshot()).toMatchImage(animatedEnd, { writeDiff });
}

/**
 * Assert a numeric series never reverses direction (monotonic non-strict). With `direction` omitted the
 * dominant direction is inferred from the endpoints; a flat series (all-equal) satisfies either direction.
 */
export function expectMonotonic(values: number[], direction?: 'increasing' | 'decreasing', tol = 1e-6): void {
    expect(values.length).toBeGreaterThan(1);
    const inferred = direction ?? (values.at(-1)! >= values[0] ? 'increasing' : 'decreasing');
    const failure = checkPropertyTrajectory(values, inferred === 'increasing' ? 'increases' : 'decreases', {
        constant: 0,
        monotonic: tol,
        progress: 0,
    });
    expect(failure).toBeUndefined();
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
 * differs from BOTH endpoints. Catches the no-op / instantly-jumped / visually-blank class of bug that
 * per-ratio image snapshots miss.
 */
export function expectProgresses(values: number[], tol = 1e-3): void {
    expect(values.length).toBeGreaterThan(2);
    const failure = checkPropertyTrajectory(values, 'progresses', { constant: 0, monotonic: 0, progress: tol });
    expect(failure).toBeUndefined();
}

/**
 * Resolve the human-readable datum identity from a live scene node, matching the in-browser e2e
 * capture. Reads only the live datum; the serialised-state fallbacks live in the shared sampler.
 */
function datumIdOfLiveNode(node: Node<any>): string | undefined {
    const datum: any = node.datum;
    if (datum != null && typeof datum !== 'object') return String(datum);
    const value = datum?.xValue ?? datum?.angleValue ?? datum?.itemId ?? datum?.tickId ?? datum?.index;
    return value == null ? undefined : String(value);
}

const liveSceneAccessor: SceneNodeAccessor<Node<any>> = {
    state: (node) => node.serialize(),
    children: (node) => (node instanceof Group ? node.children() : []),
    name: (node) => node.name,
    datumId: (node) => datumIdOfLiveNode(node),
};

/**
 * Whole-scene geometry sampler for frame-trajectory tests (see {@link spyOnAnimationFrames}).
 *
 * Walks every series content/label group and every axis/grid group, reading the animatable properties
 * of each shape node into a map keyed by a stable, human-readable node path such as
 * `series[0]/rect[B]` or `axis[left]/text[100]`. Keys are assigned on first sight and pinned to the
 * node INSTANCE (via WeakMap), so a node keeps its key across frames even if its datum mutates;
 * colliding names are disambiguated with a `#n` suffix. The walk itself is shared with the serialised
 * e2e capture ({@link sampleSerializedRoots}) so both produce identical keys and geometry.
 *
 * Sampling the whole scene (rather than hand-picking nodes) is what lets {@link expectSceneTrajectory}
 * default every unnamed node to "must not move" — the class of regression (axis wobble, label flicker,
 * sibling disturbance) that per-ratio image snapshots caught incidentally.
 */
export function createSceneGeometrySampler(
    chartOrProxy: ChartOrProxy<any>,
    { includeChrome = false }: { includeChrome?: boolean } = {}
): () => SceneGeometrySample {
    // One walk per sampler so its key WeakMap pins node keys across the frames a trajectory capture samples.
    const sampleInto = createSceneWalk(liveSceneAccessor);

    return function sampleSceneGeometry(): SceneGeometrySample {
        const chart = deproxy(chartOrProxy);
        const sample: SceneGeometrySample = new Map();
        for (const [i, series] of ((chart.series ?? []) as any[]).entries()) {
            sampleInto(sample, `series[${i}]`, series.contentGroup);
            sampleInto(sample, `series[${i}]/labels`, series.labelGroup);
            // Some series paint outside contentGroup (e.g. area fills render behind in backgroundGroup).
            if (series.backgroundGroup != null) {
                sampleInto(sample, `series[${i}]/background`, series.backgroundGroup);
            }
        }
        for (const axis of (chart as any).axes ?? []) {
            const position = axis.position ?? 'unknown';
            sampleInto(sample, `axis[${position}]`, axis.axisGroup);
            sampleInto(sample, `axis[${position}]/grid`, axis.gridGroup);
        }
        if (includeChrome) {
            // Chart chrome (captions, legends) is excluded by default so frame-trajectory suites keep
            // their existing "unnamed node must not move" surface; scene-snapshot capture opts in.
            const titleGroup = (chart as any).titleGroup;
            if (titleGroup != null) {
                sampleInto(sample, 'captions', titleGroup);
            }
            for (const { legendType, legend } of chart.modulesManager.legends()) {
                const legendGroup = (legend as any).group;
                if (legendGroup != null) {
                    sampleInto(sample, `legend[${legendType}]`, legendGroup);
                }
            }
        }
        // Cartesian charts clip the series area to an animated rect (the `clip-rect` motion group).
        const clipRect = (chart as any).lastUpdateClipRect;
        if (clipRect != null) {
            sample.set('chart/clipRect', {
                x: clipRect.x,
                y: clipRect.y,
                width: clipRect.width,
                height: clipRect.height,
            });
        }
        return sample;
    };
}

/**
 * `degenerate` opts a property into legitimately non-finite frames (e.g. a line gap where a datum is
 * `undefined` leaves stations with no crossing): non-finite samples are treated as absent instead of
 * failing, and any other expectations in the same list are checked over the finite frames only.
 */
export type TrajectoryExpectation =
    | 'constant'
    | 'increases'
    | 'decreases'
    /** Monotonic in the direction inferred from the endpoints — for updates where each node may
     * legitimately move either way (e.g. randomised data). A flat trajectory satisfies it. */
    | 'monotonic'
    | 'progresses'
    | 'bounded'
    | 'degenerate'
    | 'any';
/**
 * Scopes a property expectation to the animation phase(s) it may change in: outside `during`, the
 * property must hold constant frame-to-frame; the `expect` trajectory checks still apply to the whole
 * trajectory. Requires phase data captured by {@link spyOnAnimationFrames}' `captureAnimationFrames`.
 */
export type PhasedPropertyExpectation = {
    during?: AnimationPhase | readonly AnimationPhase[];
    expect?: TrajectoryExpectation | readonly TrajectoryExpectation[];
    /** The value the property must have settled at by the final frame (within constantTol) — for
     * targets that directional checks cannot pin, e.g. "fades to the DIMMED opacity, not to 1". */
    settlesAt?: number;
};
export type ScenePropertyExpectation =
    | TrajectoryExpectation
    | readonly TrajectoryExpectation[]
    | PhasedPropertyExpectation;
export type SceneNodeExpectation = 'constant' | 'any' | Partial<Record<string, ScenePropertyExpectation>>;
export type PhasedTrajectory = { phaseIntervals: AnimationPhase[][] };

export type AxisShiftDirection = 'left' | 'right' | 'up' | 'down';

/**
 * General axis expectations for a data change that reflows an axis, for tests that exercise an axis
 * incidentally and only need it bounded (tests that care about exact per-tick behaviour should name
 * nodes individually instead). The returned spec fragment asserts:
 * - tick labels and tick/axis lines MOVE only during the `update` phase, and only in the `shift`
 *   direction (non-strict, so unmoved nodes matched by the globs also pass);
 * - opacity FADES only during the `remove`/`update`/`add` phases, bounded by its endpoints (stale
 *   ticks fade out and leave, entering ticks fade in; the axis line fades during `update`);
 * - with `translate`, the axis sub-groups shift that way during `update` (gutter reflow);
 * - with `plotEdge`, the far end of the axis/grid lines tracks the plot edge during `update`;
 * - every other property of every matched node must not change.
 */
export function axisReflowSpec(
    position: 'top' | 'bottom' | 'left' | 'right',
    {
        shift,
        translate,
        plotEdge,
        grid = false,
    }: {
        shift?: AxisShiftDirection;
        translate?: AxisShiftDirection;
        plotEdge?: 'grows' | 'shrinks';
        grid?: boolean;
    }
): Record<string, SceneNodeExpectation> {
    const directionOf = (d: AxisShiftDirection): TrajectoryExpectation =>
        d === 'left' || d === 'up' ? 'decreases' : 'increases';
    const coordOf = (d: AxisShiftDirection) => (d === 'left' || d === 'right' ? 'x' : 'y');
    const duringUpdate = (expectation: TrajectoryExpectation): PhasedPropertyExpectation => ({
        during: 'update',
        expect: expectation,
    });

    const fades: Record<string, ScenePropertyExpectation> = {
        opacity: { during: ['remove', 'update', 'add'], expect: 'bounded' },
    };
    const slide: Record<string, ScenePropertyExpectation> = {};
    const lineSlide: Record<string, ScenePropertyExpectation> = {};
    if (shift != null) {
        const coord = coordOf(shift);
        slide[coord] = duringUpdate(directionOf(shift));
        lineSlide[`${coord}1`] = duringUpdate(directionOf(shift));
        lineSlide[`${coord}2`] = duringUpdate(directionOf(shift));
    }
    // Grid/axis lines span the plot, so their far end is perpendicular to the axis direction.
    const edge: Record<string, ScenePropertyExpectation> = {};
    if (plotEdge != null) {
        const perpendicular = position === 'left' || position === 'right' ? 'x2' : 'y2';
        edge[perpendicular] = duringUpdate(plotEdge === 'grows' ? 'increases' : 'decreases');
    }

    const spec: Record<string, SceneNodeExpectation> = {
        [`axis[${position}]/text[*]`]: { ...fades, ...slide },
        [`axis[${position}]/line[*]`]: { ...fades, ...lineSlide, ...edge },
    };
    if (translate != null) {
        const translation = coordOf(translate) === 'x' ? 'translationX' : 'translationY';
        spec[`axis[${position}]/group[*]`] = { [translation]: duringUpdate(directionOf(translate)) };
    }
    if (grid) {
        spec[`axis[${position}]/grid/line[*]`] = { ...fades, ...lineSlide, ...edge };
    }
    return spec;
}

/**
 * Assert a captured trajectory shows NO animation: no batch phase ran on any interval, and every
 * node property holds constant across all frames (a skipped batch must SNAP to the end state before
 * the first frame, not tween towards it). The complement of {@link expectSceneTrajectory} specs —
 * use it for skipped-animation paths (animation disabled, resize).
 */
export function expectNoAnimation(trajectory: SceneGeometrySample[]): void {
    // A skipped batch still advances through its phases (they just do no work), so phase data can't
    // distinguish a snap from a tween — full-scene constancy from the first frame is the signal.
    expectSceneTrajectory(trajectory, {});
}

// Flag/range properties whose whole domain fits inside a 1px geometry tolerance — compare exactly.
const EXACT_MATCH_PROPS = new Set(['opacity', 'visible', 'clip', 'cutout', 'subpaths']);
// The Rect clip window duplicates the painted bounds it is intersected with (clipX0/clipY0 track
// x/y, clipX1/clipY1 track x+width/y+height), so on a revealing rect it moves in lock-step with the
// already-checked geometry. Treating it as default-`constant` would make every rect-reveal suite fail
// on a redundant signal, so it is opt-in: asserted only when a node's spec names it (as the gauge
// bar-reveal CASE does to exercise this reader), and otherwise left unchecked.
const OPT_IN_PROPS = new Set(['clipX0', 'clipY0', 'clipX1', 'clipY1']);
// These props live on a 0..1 (or 0/1) scale, so the pixel-scaled constant tolerance would let a value
// drift halfway across its whole range unnoticed. Judge their constancy/bounds against a scale-honest
// epsilon instead — loose enough to absorb interpolation float noise, tight enough to catch a stalled
// fade or a drifting opacity.
const EXACT_MATCH_TRAJECTORY_TOL = 1e-3;

/**
 * Endpoint sanity: two whole-scene samples describe the same scene within a pixel tolerance. Strict
 * deep-equality is too brittle for drawn geometry — the crisp-pixel snap when an animation settles
 * shifts values fractionally depending on when the scene last rendered. Flag/range props
 * ({@link EXACT_MATCH_PROPS}) are compared exactly.
 */
export function expectSceneSamplesMatch(actual: SceneGeometrySample, expected: SceneGeometrySample, tol = 1): void {
    const byName = (a: string, b: string) => a.localeCompare(b);
    expect([...actual.keys()].sort(byName)).toEqual([...expected.keys()].sort(byName));
    for (const [key, expectedProps] of expected) {
        const actualProps = actual.get(key)!;
        expect(Object.keys(actualProps).sort(byName), key).toEqual(Object.keys(expectedProps).sort(byName));
        for (const prop of Object.keys(expectedProps)) {
            const expectedValue = expectedProps[prop];
            const actualValue = actualProps[prop];
            if (Number.isFinite(expectedValue)) {
                const propTol = EXACT_MATCH_PROPS.has(prop) ? 1e-6 : tol;
                expect(
                    Math.abs(actualValue - expectedValue),
                    `${key}.${prop}: ${actualValue} vs ${expectedValue}`
                ).toBeLessThanOrEqual(propTol);
            } else {
                expect(actualValue, `${key}.${prop}`).toBe(expectedValue);
            }
        }
    }
}

/**
 * A cross-node check evaluated on every captured frame — for relationships no per-node/per-property
 * expectation can express (e.g. "stacked layer N's far edge equals layer N+1's near edge on every
 * frame"). Return a message to fail, undefined to pass; only the first failing frame per invariant is
 * reported.
 */
export interface SceneFrameInvariant {
    name: string;
    check(frame: SceneGeometrySample, frameIndex: number): string | undefined;
}

interface TrajectoryViolation {
    key: string;
    prop?: string;
    message: string;
    values?: (number | undefined)[];
}

const SPARK_CHARS = '▁▂▃▄▅▆▇█';

function sparkline(values: (number | undefined)[]): string {
    const present = values.filter((v): v is number => v != null && Number.isFinite(v));
    if (present.length === 0) return '(no finite values)';
    const min = Math.min(...present);
    const max = Math.max(...present);
    const spread = max - min;
    return values
        .map((v) => {
            if (v == null || !Number.isFinite(v)) return '·';
            if (spread === 0) return SPARK_CHARS[0];
            return SPARK_CHARS[Math.min(SPARK_CHARS.length - 1, Math.floor(((v - min) / spread) * SPARK_CHARS.length))];
        })
        .join('');
}

function formatValue(v: number | undefined): string {
    if (v == null) return '∅';
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

function formatValues(values: (number | undefined)[]): string {
    return values.map(formatValue).join(', ');
}

function checkPropertyTrajectory(
    values: number[],
    // 'degenerate' is a presence modifier handled by the caller, not a trajectory shape.
    expectation: Exclude<TrajectoryExpectation, 'degenerate'>,
    tolerances: { constant: number; monotonic: number; progress: number }
): string | undefined {
    switch (expectation) {
        case 'any':
            return undefined;
        case 'constant': {
            const first = values[0];
            const badFrame = values.findIndex((v) => Math.abs(v - first) > tolerances.constant);
            return badFrame < 0
                ? undefined
                : `expected constant ~${first.toFixed(2)}, moved to ${values[badFrame].toFixed(2)} at frame ${badFrame}`;
        }
        case 'increases':
        case 'decreases':
        case 'monotonic': {
            const inferredIncreasing = values.at(-1)! >= values[0];
            const increasing = expectation === 'monotonic' ? inferredIncreasing : expectation === 'increases';
            const sign = increasing ? 1 : -1;
            const inferredDirection = inferredIncreasing ? 'increasing' : 'decreasing';
            const description =
                expectation === 'monotonic'
                    ? `monotonic (${inferredDirection} by endpoints)`
                    : `${expectation.replace(/es$/, 'ing')} monotonically`;
            for (let i = 1; i < values.length; i++) {
                if (sign * (values[i] - values[i - 1]) < -tolerances.monotonic) {
                    return `expected ${description}, reversed at frame ${i} (${values[i - 1].toFixed(2)} -> ${values[i].toFixed(2)})`;
                }
            }
            return undefined;
        }
        case 'bounded': {
            // Overshoot tolerance uses the pixel-scale constant tolerance: crisp-pixel rounding can land
            // a mid-frame value fractionally outside the endpoint interval without being a real overshoot.
            const lo = Math.min(values[0], values.at(-1)!) - tolerances.constant;
            const hi = Math.max(values[0], values.at(-1)!) + tolerances.constant;
            const badFrame = values.findIndex((v) => v < lo || v > hi);
            return badFrame < 0
                ? undefined
                : `expected within endpoint bounds [${lo.toFixed(2)}, ${hi.toFixed(2)}], got ${values[badFrame].toFixed(2)} at frame ${badFrame}`;
        }
        case 'progresses': {
            const spread = Math.max(...values) - Math.min(...values);
            if (spread <= tolerances.progress) return 'expected progression, but trajectory is flat';
            const start = values[0];
            const end = values.at(-1)!;
            const hasMidTransition = values
                .slice(1, -1)
                .some((v) => Math.abs(v - start) > tolerances.progress && Math.abs(v - end) > tolerances.progress);
            return hasMidTransition ? undefined : 'no intermediate frame between the endpoints — animation jumped';
        }
        default:
            // Exhaustive: an unrecognised expectation must fail loudly, never silently pass.
            return expectation satisfies never;
    }
}

/**
 * Enforce a `during` phase window: the property may only change across intervals whose traversed
 * phase range intersects `during`. Outside those windows the value must stay anchored (within
 * tolerance) to where the last allowed window left it — anchoring catches slow cumulative drift that
 * per-interval deltas would slip under the tolerance. Intervals where the node is absent at either
 * end are skipped (presence is checked separately).
 */
function checkPhaseWindows(
    rawValues: (number | undefined)[],
    during: AnimationPhase[],
    phaseIntervals: AnimationPhase[][] | undefined,
    constantTol: number
): string | undefined {
    if (phaseIntervals == null) return undefined;
    let anchor: number | undefined;
    for (let i = 0; i < rawValues.length - 1; i++) {
        const from = rawValues[i];
        const to = rawValues[i + 1];
        if (from == null || to == null) {
            anchor = undefined;
            continue;
        }
        anchor ??= from;
        const interval = phaseIntervals[i] ?? [];
        if (interval.some((phase) => during.includes(phase))) {
            anchor = to;
        } else if (Math.abs(to - anchor) > constantTol) {
            const phases = interval.length > 0 ? interval.join('/') : 'idle';
            return `moved outside its phase window (${during.join('/')}): ${anchor.toFixed(2)} -> ${to.toFixed(2)} by frame ${i + 1} during ${phases}`;
        }
    }
    return undefined;
}

/**
 * Assert invariants over a whole-scene animation trajectory (frames from {@link spyOnAnimationFrames}
 * sampled by {@link createSceneGeometrySampler}).
 *
 * `spec` names the nodes EXPECTED to change and what each property should do; every node not matched by
 * the spec must hold every property constant on every frame ("nothing else moved" is the default, not an
 * opt-in). Spec keys are node paths; `*` acts as a glob wildcard (exact keys win over globs, then
 * longest glob wins).
 * Values are either `'any'`/`'constant'` for the whole node, or a per-property map — properties omitted
 * from the map default to constant. A property expectation may be wrapped as
 * `{ during: <phase(s)>, expect: ... }` to additionally pin WHEN it may change: outside the named
 * animation phase(s) the value must stay anchored to where the last allowed window left it. This
 * requires the trajectory's `phaseIntervals` captured by `captureAnimationFrames`.
 *
 * Nodes may legitimately enter/leave the scene mid-trajectory (add/remove animations); such nodes must be
 * matched by a non-default spec entry, and property expectations are evaluated over the frames where the
 * node is present. Spec entries that match no sampled node fail the assertion (typo guard).
 *
 * On failure, every violation is reported together (one wobbling axis moves many labels — the cluster
 * identifies the culprit), each with a sparkline and the full per-frame values.
 */
export function expectSceneTrajectory(
    trajectory: SceneGeometrySample[],
    spec: Record<string, SceneNodeExpectation> = {},
    {
        constantTol = 0.5,
        // Drawn geometry snaps to crisp pixels when an animation settles, so a sub-pixel "reversal"
        // on the final frame is rounding, not a direction change.
        monotonicTol = 0.5,
        progressTol = 1e-3,
        frameInvariants = [],
    }: {
        constantTol?: number;
        monotonicTol?: number;
        progressTol?: number;
        frameInvariants?: readonly SceneFrameInvariant[];
    } = {}
): void {
    expect(trajectory.length).toBeGreaterThan(1);
    const tolerances = { constant: constantTol, monotonic: monotonicTol, progress: progressTol };

    const phaseIntervals = (trajectory as Partial<PhasedTrajectory>).phaseIntervals;
    const usesPhases = Object.values(spec).some(
        (nodeExpectation) =>
            typeof nodeExpectation === 'object' &&
            Object.values(nodeExpectation).some(
                (p) => typeof p === 'object' && !Array.isArray(p) && (p as PhasedPropertyExpectation).during != null
            )
    );
    if (usesPhases && phaseIntervals == null) {
        throw new Error(
            'spec uses `during` phase windows but the trajectory carries no phase data — capture it with spyOnAnimationFrames().captureAnimationFrames'
        );
    }

    const allKeys = new Set<string>();
    for (const frame of trajectory) {
        for (const key of frame.keys()) allKeys.add(key);
    }

    const globToRegExp = (glob: string) =>
        new RegExp(
            `^${glob
                .split('*')
                .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
                .join('.*')}$`
        );
    const wildcardSpecs = Object.keys(spec)
        .filter((k) => k.includes('*'))
        .sort((a, b) => b.length - a.length)
        .map((k) => ({ specKey: k, regexp: globToRegExp(k) }));
    const matchedSpecKeys = new Set<string>();
    const specFor = (key: string): { specKey?: string; expectation: SceneNodeExpectation } => {
        if (spec[key] != null && !key.includes('*')) {
            matchedSpecKeys.add(key);
            return { specKey: key, expectation: spec[key] };
        }
        const wildcard = wildcardSpecs.find((w) => w.regexp.test(key));
        if (wildcard != null) {
            matchedSpecKeys.add(wildcard.specKey);
            return { specKey: wildcard.specKey, expectation: spec[wildcard.specKey] };
        }
        return { expectation: 'constant' };
    };

    const violations: TrajectoryViolation[] = [];

    for (const key of allKeys) {
        const { specKey, expectation } = specFor(key);
        if (expectation === 'any') continue;

        const rawValuesFor = (prop: string) => trajectory.map((frame) => frame.get(key)?.[prop]);
        const presentFrames = trajectory.filter((frame) => frame.has(key)).length;

        if (presentFrames < trajectory.length && specKey == null) {
            violations.push({
                key,
                message: `present in only ${presentFrames}/${trajectory.length} frames but not named in the spec — nodes entering/leaving the scene must be expected explicitly`,
            });
            continue;
        }

        const props = new Set<string>();
        for (const frame of trajectory) {
            for (const prop of Object.keys(frame.get(key) ?? {})) props.add(prop);
        }

        // Property-level typo guard, mirroring the node-level one: a spec-named property the sampler
        // never emitted would otherwise pass vacuously.
        if (typeof expectation === 'object') {
            for (const specProp of Object.keys(expectation)) {
                if (!props.has(specProp)) {
                    violations.push({
                        key,
                        prop: specProp,
                        message: 'spec names a property never sampled on this node (typo?)',
                    });
                }
            }
        }

        for (const prop of props) {
            const explicitlyNamed = typeof expectation === 'object' && (expectation as any)[prop] != null;
            // Opt-in props (the clip window) are only asserted when a node's spec names them; otherwise
            // they are left unchecked rather than defaulting to constant (see OPT_IN_PROPS).
            if (OPT_IN_PROPS.has(prop) && !explicitlyNamed) continue;
            const raw = expectation === 'constant' ? 'constant' : ((expectation as any)[prop] ?? 'constant');
            // Flag/range props must be judged on their native 0..1 scale for constancy AND direction:
            // at the pixel-scaled monotonic tolerance every per-frame opacity step fits both
            // `increases` and `decreases`, making direction assertions vacuous. `progresses` keeps its
            // own scale-free spread tolerance.
            const propTolerances = EXACT_MATCH_PROPS.has(prop)
                ? { ...tolerances, constant: EXACT_MATCH_TRAJECTORY_TOL, monotonic: EXACT_MATCH_TRAJECTORY_TOL }
                : tolerances;
            const isPhased = typeof raw === 'object' && !Array.isArray(raw);
            const propExpectations: TrajectoryExpectation[] = [isPhased ? (raw.expect ?? []) : raw].flat();
            const rawValues = rawValuesFor(prop);
            const values = rawValues.filter((v): v is number => v != null);
            if (values.length < 2) continue;
            // NaN compares false against everything, so it would sail through every check below.
            const allowsDegenerate = propExpectations.includes('degenerate');
            const nonFinite = values.findIndex((v) => !Number.isFinite(v));
            if (nonFinite >= 0 && !allowsDegenerate) {
                violations.push({ key, prop, message: `non-finite value at frame ${nonFinite}`, values: rawValues });
                continue;
            }
            // `degenerate` must not pass vacuously: it asserts the property actually collapses.
            if (allowsDegenerate && nonFinite < 0) {
                violations.push({
                    key,
                    prop,
                    message: 'expected degenerate (non-finite) samples but every value was finite',
                    values: rawValues,
                });
            }
            const checkedValues = allowsDegenerate ? values.filter((v) => Number.isFinite(v)) : values;
            const checkedRawValues = allowsDegenerate
                ? rawValues.map((v) => (v != null && Number.isFinite(v) ? v : undefined))
                : rawValues;
            if (checkedValues.length < 2) continue;
            for (const propExpectation of propExpectations) {
                if (propExpectation === 'degenerate') continue;
                const failure = checkPropertyTrajectory(checkedValues, propExpectation, propTolerances);
                if (failure != null) {
                    violations.push({ key, prop, message: failure, values: rawValues });
                }
            }
            if (isPhased && raw.during != null) {
                const failure = checkPhaseWindows(checkedRawValues, [raw.during].flat(), phaseIntervals, constantTol);
                if (failure != null) {
                    violations.push({ key, prop, message: failure, values: rawValues });
                }
            }
            if (isPhased && raw.settlesAt != null) {
                const finalValue = checkedValues.at(-1)!;
                if (Math.abs(finalValue - raw.settlesAt) > propTolerances.constant) {
                    violations.push({
                        key,
                        prop,
                        message: `expected to settle at ${raw.settlesAt}, ended at ${finalValue.toFixed(2)}`,
                        values: rawValues,
                    });
                }
            }
        }
    }

    for (const specKey of Object.keys(spec)) {
        if (!matchedSpecKeys.has(specKey)) {
            violations.push({ key: specKey, message: 'spec entry matched no sampled scene node (typo?)' });
        }
    }

    for (const invariant of frameInvariants) {
        for (const [frameIndex, frame] of trajectory.entries()) {
            const failure = invariant.check(frame, frameIndex);
            if (failure != null) {
                violations.push({
                    key: `frameInvariant[${invariant.name}]`,
                    message: `frame ${frameIndex}: ${failure}`,
                });
                break;
            }
        }
    }

    if (violations.length > 0) {
        const details = violations
            .map((v) => {
                const prop = v.prop ? '.' + v.prop : '';
                const header = `  ${v.key}${prop} — ${v.message}`;
                if (v.values == null) return header;
                return `${header}\n    ${sparkline(v.values)}  [${formatValues(v.values)}]`;
            })
            .join('\n');
        throw new Error(`Scene trajectory violations (${violations.length}):\n${details}`);
    }
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

export { toMatchImage } from '_ag-charts-test';
export { CANVAS_TO_BUFFER_DEFAULTS, extractImageData, setupMockCanvas } from '../../util/test/mockCanvas';

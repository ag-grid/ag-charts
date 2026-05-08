// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    CategoryAxisModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    ScatterSeriesModule,
    SelectionModule,
    TimeAxisModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performZoom } from './benchmarkUtils';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    ScatterSeriesModule,
    SelectionModule,
    TimeAxisModule,
    ZoomModule,
    CategoryAxisModule,
]);

const DATAPOINTS = 1_000_000;
const ZOOM_REPS = 20;

const baseData = getData(DATAPOINTS);

const timeAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'ordinal-time', parentLevel: { enabled: true } },
};

const SERIES_TYPES = [
    'line',
    'area',
    'bar',
    'stacked-bar',
    'stacked-area',
    'range-area',
    'range-bar',
    'candlestick',
    'ohlc',
    'scatter',
    'bubble',
    'histogram',
] as const;
type SeriesType = (typeof SERIES_TYPES)[number];

function buildSeries(type: SeriesType): AgCartesianChartOptions['series'] {
    switch (type) {
        case 'line':
        case 'area':
        case 'bar':
            return [{ type, xKey: 'timestamp', yKey: 'high', selection: { enabled: true } }];
        case 'stacked-bar':
        case 'stacked-area': {
            const t = type === 'stacked-bar' ? 'bar' : 'area';
            return [
                { type: t, xKey: 'timestamp', yKey: 'open', stacked: true, selection: { enabled: true } },
                { type: t, xKey: 'timestamp', yKey: 'close', stacked: true, selection: { enabled: true } },
            ];
        }
        case 'range-area':
        case 'range-bar':
            return [
                {
                    type,
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    selection: { enabled: true },
                },
            ];
        case 'candlestick':
        case 'ohlc':
            return [
                {
                    type,
                    xKey: 'timestamp',
                    lowKey: 'low',
                    highKey: 'high',
                    openKey: 'open',
                    closeKey: 'close',
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                },
            ];
        case 'scatter':
            return [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                },
            ];
        case 'bubble':
            return [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                },
            ];
        case 'histogram':
            return [{ type, xKey: 'close', selection: { enabled: true } }];
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: baseData,
    animation: { enabled: false },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        minVisibleItems: 0,
    },
    navigator: {
        enabled: true,
        miniChart: { enabled: true },
    },
    series: buildSeries('line'),
    axes: timeAxes,
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

const numberAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'number' },
};

function applySeriesType(type: SeriesType) {
    options.series = buildSeries(type);
    if (type === 'bubble' || type === 'scatter' || type === 'histogram') {
        options.zoom!.axes = 'xy';
        options.navigator!.enabled = false;
        options.axes = numberAxes;
    } else {
        options.zoom!.axes = 'x';
        options.navigator!.enabled = true;
        options.axes = timeAxes;
    }
}

function getSeriesAreaElement(): HTMLElement {
    const el = container.querySelector<HTMLElement>('.ag-charts-series-area');
    if (!el) throw new Error('series area not found');
    return el;
}

function makeMouseEvent(type: string, x: number, y: number, rect: DOMRect, isUp: boolean): MouseEvent {
    const ev = new MouseEvent(type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: isUp ? 0 : 1,
        clientX: rect.left + x,
        clientY: rect.top + y,
        view: window,
    });
    Object.defineProperty(ev, 'offsetX', { value: x, writable: false });
    Object.defineProperty(ev, 'offsetY', { value: y, writable: false });
    Object.defineProperty(ev, 'pageX', { value: rect.left + x, writable: false });
    Object.defineProperty(ev, 'pageY', { value: rect.top + y, writable: false });
    return ev;
}

/**
 * Simulates a drag-select gesture across the series area.
 * All events dispatch on the series-area element. The widget MouseDragger's
 * capture-phase listeners on window pick them up via DOM event capture even
 * though the event target is the series-area — keeps `event.target` a real
 * Node so downstream click/contains checks work.
 */
function dragSelect(x1: number, y1: number, x2: number, y2: number) {
    const seriesArea = getSeriesAreaElement();
    const rect = seriesArea.getBoundingClientRect();
    seriesArea.dispatchEvent(makeMouseEvent('mousedown', x1, y1, rect, false));

    const steps = 12;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        seriesArea.dispatchEvent(makeMouseEvent('mousemove', x, y, rect, false));
    }
    seriesArea.dispatchEvent(makeMouseEvent('mouseup', x2, y2, rect, true));
}

/**
 * Simulates a no-op mousedown+mouseup at the same point — the DragInterpreter
 * recognises this as a click rather than a drag (movement is below the drag
 * threshold) and the SelectionModule clears the selection on a bare click.
 */
function clickAt(x: number, y: number) {
    const seriesArea = getSeriesAreaElement();
    const rect = seriesArea.getBoundingClientRect();
    seriesArea.dispatchEvent(makeMouseEvent('mousedown', x, y, rect, false));
    seriesArea.dispatchEvent(makeMouseEvent('mouseup', x, y, rect, true));
}

async function resetZoom(): Promise<void> {
    if (!chartRef.current) return;
    const state = chartRef.current.getState();
    await chartRef.current.setState({
        ...state,
        zoom: { ratioX: { start: 0, end: 1 }, ratioY: { start: 0, end: 1 } },
    });
    await chartRef.current.waitForUpdate();
}

async function selectFiftyPercent(): Promise<void> {
    const seriesArea = getSeriesAreaElement();
    const rect = seriesArea.getBoundingClientRect();
    const margin = 5;
    // Drag a horizontal band across the left half of the series area, full height.
    dragSelect(margin, margin, rect.width / 2, rect.height - margin);
    await chartRef.current!.waitForUpdate();
}

async function clearSelection(): Promise<void> {
    clickAt(2, 2);
    await chartRef.current!.waitForUpdate();
}

async function applySeriesAndUpdate(type: SeriesType): Promise<void> {
    applySeriesType(type);
    await chartRef.current!.update(options);
    await chartRef.current!.waitForUpdate();
}

// HTML control handlers — these need to be at module scope and globally callable
// from inline onclick attributes, so they're attached to window explicitly.
declare const window: Window & {
    setSeries?: (type: string) => void;
    selectHalf?: () => void;
    selectClear?: () => void;
};
window.setSeries = (type: string) => void applySeriesAndUpdate(type as SeriesType);
window.selectHalf = () => void selectFiftyPercent();
window.selectClear = () => void clearSelection();

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const testCases = SERIES_TYPES.map((seriesType) => ({
        id: seriesType,
        label: seriesType,
        setup: () => applySeriesAndUpdate(seriesType),
        variants: [
            {
                params: { Selection: 'none' },
                run: async () => {
                    await resetZoom();
                    await clearSelection();
                    return performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, ZOOM_REPS);
                },
            },
            {
                params: { Selection: '50%' },
                run: async () => {
                    await resetZoom();
                    await selectFiftyPercent();
                    return performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, ZOOM_REPS);
                },
            },
        ],
    }));

    return {
        testCases,
        config: {
            updatesPerTest: 5,
            maxCollectionTimeMs: 60000,
            warmupUpdates: 1,
        },
        metadata: {
            dataPoints: DATAPOINTS,
            zoomReps: ZOOM_REPS,
            version: VERSION,
        },
        onComplete: clearSelection,
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
/* @ag-skip-clone */

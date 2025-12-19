/**
 * Shared utilities for benchmark examples.
 * Symlinked into each benchmark example folder for direct import.
 */
import type { AgChartInstance, AgChartOptions } from 'ag-charts-types';

// Type for chart reference that allows reassignment (for performInitialLoad)
export interface ChartRef {
    current: AgChartInstance | null;
}

// Type for mutable data reference (for high-frequency operations)
export interface DataRef<T = unknown> {
    data: T[];
}

// Type for data generator with take() method
export interface DataGenerator<T = unknown> {
    take(count: number): T[];
}

// Type for series visibility state
export interface SeriesVisibilityState {
    visible: boolean[];
}

/**
 * Dispatch a scroll/wheel event to trigger zoom (matches Jest benchmark approach)
 */
export function scroll(
    container: HTMLElement,
    x: number,
    y: number,
    deltaY: number,
    deltaMode: number = 1, // 1 = lines (matches Jest)
    deltaX: number = 0
): void {
    const seriesArea = container.querySelector('.ag-charts-series-area') as HTMLElement;
    const element = seriesArea || (container.querySelector('canvas') as HTMLElement);
    if (!element) throw new Error('No chart element found');

    const rect = element.getBoundingClientRect();
    const event = new WheelEvent('wheel', {
        bubbles: true,
        clientX: rect.left + x,
        clientY: rect.top + y,
        deltaX,
        deltaY,
        deltaMode,
        offsetX: x,
        offsetY: y,
    } as WheelEventInit);
    element.dispatchEvent(event);
}

/**
 * Dispatch a mousemove event for hover/highlight
 */
export function hover(container: HTMLElement, x: number, y: number): void {
    const seriesArea = container.querySelector('.ag-charts-series-area') as HTMLElement;
    const element = seriesArea || (container.querySelector('canvas') as HTMLElement);
    if (!element) throw new Error('No chart element found');

    const rect = element.getBoundingClientRect();
    const event = new MouseEvent('mousemove', {
        bubbles: true,
        clientX: rect.left + x,
        clientY: rect.top + y,
        offsetX: x,
        offsetY: y,
    } as MouseEventInit);
    element.dispatchEvent(event);
}

/**
 * Click legend item to toggle visibility
 */
export function legendToggle(container: HTMLElement, index: number = 0): void {
    const buttons = container.querySelectorAll('.ag-charts-proxy-legend-toolbar button');
    if (buttons[index]) {
        buttons[index].dispatchEvent(new Event('click'));
    }
}

/**
 * Parse version string to [major, minor, patch]
 */
export function parseVersion(version: string): [number, number, number] {
    const parts = version.split('-')[0].split('.');
    return [parseInt(parts[0] || '0', 10), parseInt(parts[1] || '0', 10), parseInt(parts[2] || '0', 10)];
}

/**
 * Check if version meets minimum requirement
 */
export function isVersionAtOrAfter(currentVersion: string, major: number, minor: number, patch: number): boolean {
    const [curMajor, curMinor, curPatch] = parseVersion(currentVersion);
    if (curMajor > major) return true;
    if (curMajor < major) return false;
    if (curMinor > minor) return true;
    if (curMinor < minor) return false;
    return curPatch >= patch;
}

// ============================================================================
// Performance Benchmark Functions
// ============================================================================

/**
 * Perform initial chart load benchmark.
 * Destroys and recreates the chart to measure true creation time.
 * (Matches the original Jest benchmark approach.)
 *
 * @param options - Chart options to create with
 * @param chartRef - Mutable reference to chart instance (will be updated)
 * @param createFn - Function to create chart (default: AgCharts.create)
 * @returns Elapsed time in milliseconds (excludes destroy time)
 */
export async function performInitialLoad<T extends AgChartOptions>(
    options: T,
    chartRef: ChartRef,
    createFn: (opts: T) => AgChartInstance
): Promise<number> {
    // Destroy existing chart BEFORE timing starts (not measured)
    if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
    }

    // Time only the creation
    const start = performance.now();
    chartRef.current = createFn(options);
    await chartRef.current.waitForUpdate();
    return performance.now() - start;
}

/**
 * Perform zoom benchmark by dispatching wheel events.
 * Recreates the chart before each zoom sequence to match original Jest benchmarks
 * which use beforeEach() to create a fresh chart before each test iteration.
 *
 * @param options - Chart options for recreation
 * @param chartRef - Mutable reference to chart instance (will be updated)
 * @param createFn - Function to create chart
 * @param container - Chart container element
 * @param count - Number of zoom steps to perform
 * @returns Elapsed time in milliseconds (excludes chart recreation time)
 */
export async function performZoom<T extends AgChartOptions>(
    options: T,
    chartRef: ChartRef,
    createFn: (opts: T) => AgChartInstance,
    container: HTMLElement,
    count: number
): Promise<number> {
    // Recreate chart before zoom (like Jest beforeEach) - NOT timed
    if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
    }
    chartRef.current = createFn(options);
    await chartRef.current.waitForUpdate();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Time only the zoom operations
    const start = performance.now();
    for (let i = 0; i < count; i++) {
        // Dispatch wheel event to trigger zoom (matches Jest benchmark approach)
        scroll(container, width / 2, height / 2, -1, 1); // deltaMode=1 for lines
        await chartRef.current.waitForUpdate();
    }
    return performance.now() - start;
}

/**
 * Perform legend toggle benchmark by toggling series visibility.
 *
 * @param chart - Chart instance
 * @param options - Chart options (series array will be read)
 * @param visibilityState - Mutable visibility state object
 * @param count - Number of toggles to perform
 * @returns Elapsed time in milliseconds
 */
export async function performLegendToggle(
    chart: AgChartInstance,
    options: AgChartOptions,
    visibilityState: SeriesVisibilityState,
    count: number
): Promise<number> {
    const seriesCount = options.series?.length ?? 0;
    if (seriesCount === 0) return 0;

    const start = performance.now();

    for (let i = 0; i < count; i++) {
        const seriesIndex = i % seriesCount;
        visibilityState.visible[seriesIndex] = !visibilityState.visible[seriesIndex];

        const updatedSeries = options.series!.map((s, idx) => ({
            ...s,
            visible: visibilityState.visible[idx],
        }));

        await chart.updateDelta({ series: updatedSeries as any });
        await chart.waitForUpdate();
    }

    return performance.now() - start;
}

/**
 * Perform datum highlight benchmark by simulating mouse movement.
 *
 * @param chart - Chart instance
 * @param container - Chart container element
 * @param count - Number of highlight positions
 * @returns Elapsed time in milliseconds
 */
export async function performDatumHighlight(
    chart: AgChartInstance,
    container: HTMLElement,
    count: number
): Promise<number> {
    const seriesArea = container.querySelector('.ag-charts-series-area') as HTMLElement;
    const rect = seriesArea.getBoundingClientRect();
    const { width, height } = rect;

    const start = performance.now();

    for (let i = 0; i < count; i++) {
        // Simulate hover at different positions across the chart
        const x = rect.left + (width * 0.1 + width * 0.9) * (i / count);
        const y = rect.top + height * 0.5;

        await hover(container, x, y);

        // Small delay to allow rendering
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await chart.waitForUpdate();
    }

    // Clear highlight
    const leaveEvent = new MouseEvent('mouseleave', { bubbles: true });
    container.dispatchEvent(leaveEvent);

    return performance.now() - start;
}

/**
 * Perform data append benchmark using applyTransaction.
 *
 * @param chart - Chart instance
 * @param dataRef - Mutable reference to data array (will be updated)
 * @param generator - Data generator with take() method
 * @param batchSize - Number of items to append
 * @returns Elapsed time in milliseconds
 */
export async function performAppend<T>(
    chart: AgChartInstance,
    dataRef: DataRef<T>,
    generator: DataGenerator<T>,
    batchSize: number
): Promise<number> {
    const append = generator.take(batchSize);
    dataRef.data = dataRef.data.concat(append);

    const start = performance.now();
    await (chart as any).applyTransaction({ append });
    await chart.waitForUpdate();
    return performance.now() - start;
}

/**
 * Perform data removal benchmark using applyTransaction.
 *
 * @param chart - Chart instance
 * @param dataRef - Mutable reference to data array (will be updated)
 * @param batchSize - Number of items to remove from the beginning
 * @returns Elapsed time in milliseconds
 */
export async function performRemove<T>(
    chart: AgChartInstance,
    dataRef: DataRef<T>,
    batchSize: number
): Promise<number> {
    const remove = dataRef.data.slice(0, batchSize);
    dataRef.data = dataRef.data.slice(batchSize);

    const start = performance.now();
    await (chart as any).applyTransaction({ remove });
    await chart.waitForUpdate();
    return performance.now() - start;
}

/**
 * Perform rolling window benchmark (remove old + append new).
 *
 * @param chart - Chart instance
 * @param dataRef - Mutable reference to data array (will be updated)
 * @param generator - Data generator with take() method
 * @param batchSize - Number of items to remove/append
 * @param method - Update method: 'applyTransaction' or 'updateDelta'
 * @returns Elapsed time in milliseconds
 */
export async function performRollingWindow<T>(
    chart: AgChartInstance,
    dataRef: DataRef<T>,
    generator: DataGenerator<T>,
    batchSize: number,
    method: 'applyTransaction' | 'updateDelta'
): Promise<number> {
    const remove = dataRef.data.slice(0, batchSize);
    const append = generator.take(batchSize);
    dataRef.data = dataRef.data.slice(batchSize).concat(append);

    const start = performance.now();
    if (method === 'applyTransaction') {
        await (chart as any).applyTransaction({ append, remove });
    } else {
        await chart.updateDelta({ data: dataRef.data });
    }
    await chart.waitForUpdate();
    return performance.now() - start;
}

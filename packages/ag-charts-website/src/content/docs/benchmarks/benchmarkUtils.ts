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
 * Wait for async event-triggered chart update.
 * Yields to the event loop before waiting for the chart update,
 * ensuring dispatched events are processed.
 */
async function waitForAsyncEventTriggeredUpdate(chart: AgChartInstance): Promise<void> {
    await new Promise((r) => setTimeout(r, 0));
    await chart.waitForUpdate();
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
    const clientX = rect.left + x;
    const clientY = rect.top + y;
    const event = new WheelEvent('wheel', {
        bubbles: true,
        clientX,
        clientY,
        deltaX,
        deltaY,
        deltaMode,
    });
    // offsetX/offsetY are read-only getters in real browsers - must use defineProperty
    // (Jest's jsdom allows Object.assign, but real browsers don't)
    Object.defineProperty(event, 'offsetX', { value: x, writable: false });
    Object.defineProperty(event, 'offsetY', { value: y, writable: false });
    Object.defineProperty(event, 'pageX', { value: clientX, writable: false });
    Object.defineProperty(event, 'pageY', { value: clientY, writable: false });
    const result = element.dispatchEvent(event);

    if (!result) throw new Error('wheel event not consumed?');
}

/**
 * Dispatch a mousemove event for hover/highlight
 */
export function hover(container: HTMLElement, x: number, y: number): void {
    const seriesArea = container.querySelector('.ag-charts-series-area') as HTMLElement;
    const element = seriesArea || (container.querySelector('canvas') as HTMLElement);
    if (!element) throw new Error('No chart element found');

    const rect = element.getBoundingClientRect();
    const clientX = rect.left + x;
    const clientY = rect.top + y;
    const event = new MouseEvent('mousemove', {
        bubbles: true,
        clientX,
        clientY,
    });
    // offsetX/offsetY are read-only getters in real browsers - must use defineProperty
    // (Jest's jsdom allows Object.assign, but real browsers don't)
    Object.defineProperty(event, 'offsetX', { value: x, writable: false });
    Object.defineProperty(event, 'offsetY', { value: y, writable: false });
    Object.defineProperty(event, 'pageX', { value: clientX, writable: false });
    Object.defineProperty(event, 'pageY', { value: clientY, writable: false });
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
 * Check if version meets minimum requirement (numeric arguments)
 */
export function isVersionAtOrAfter(currentVersion: string, major: number, minor: number, patch: number): boolean {
    const [curMajor, curMinor, curPatch] = parseVersion(currentVersion);
    if (curMajor > major) return true;
    if (curMajor < major) return false;
    if (curMinor > minor) return true;
    if (curMinor < minor) return false;
    return curPatch >= patch;
}

/**
 * Check if currentVersion >= minVersion (string arguments)
 */
export function isVersionStringAtOrAfter(currentVersion: string, minVersion: string): boolean {
    const [curMajor, curMinor, curPatch] = parseVersion(currentVersion);
    const [minMajor, minMinor, minPatch] = parseVersion(minVersion);
    if (curMajor > minMajor) return true;
    if (curMajor < minMajor) return false;
    if (curMinor > minMinor) return true;
    if (curMinor < minMinor) return false;
    return curPatch >= minPatch;
}

/**
 * Check if currentVersion < maxVersion (string arguments)
 */
export function isVersionStringBefore(currentVersion: string, maxVersion: string): boolean {
    const [curMajor, curMinor, curPatch] = parseVersion(currentVersion);
    const [maxMajor, maxMinor, maxPatch] = parseVersion(maxVersion);
    if (curMajor < maxMajor) return true;
    if (curMajor > maxMajor) return false;
    if (curMinor < maxMinor) return true;
    if (curMinor > maxMinor) return false;
    return curPatch < maxPatch;
}

/**
 * Check if version is within range [minVersion, maxVersion)
 */
export function isVersionInRange(currentVersion: string, minVersion?: string, maxVersion?: string): boolean {
    if (currentVersion === 'unknown') return true; // Can't filter if version unknown
    if (minVersion && !isVersionStringAtOrAfter(currentVersion, minVersion)) return false;
    if (maxVersion && !isVersionStringBefore(currentVersion, maxVersion)) return false;
    return true;
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
 * Uses the existing chart from chartRef, or creates one if needed.
 * Typically called after performInitialLoad which sets up the chart.
 *
 * @param options - Chart options for creation if needed
 * @param chartRef - Mutable reference to chart instance (will be created if null)
 * @param createFn - Function to create chart
 * @param container - Chart container element
 * @param count - Number of zoom steps to perform
 * @returns Elapsed time in milliseconds (excludes chart creation time if chart was null)
 */
export async function performZoom<T extends AgChartOptions>(
    options: T,
    chartRef: ChartRef,
    createFn: (opts: T) => AgChartInstance,
    container: HTMLElement,
    count: number
): Promise<number> {
    // Ensure chart exists (typically already created by performInitialLoad) - NOT timed
    chartRef.current ??= createFn(options);
    await chartRef.current.waitForUpdate();

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Time only the zoom operations
    const start = performance.now();
    for (let i = 0; i < count / 2; i++) {
        // Dispatch wheel event to trigger zoom (matches Jest benchmark approach)
        scroll(container, width / 2, height / 2, -1, 1); // deltaMode=1 for lines
        await waitForAsyncEventTriggeredUpdate(chartRef.current);
    }
    for (let i = 0; i < count / 2; i++) {
        // Dispatch wheel event to trigger zoom (matches Jest benchmark approach)
        scroll(container, width / 2, height / 2, 1, 1); // deltaMode=1 for lines
        await waitForAsyncEventTriggeredUpdate(chartRef.current);
    }
    return performance.now() - start;
}

/**
 * Perform legend toggle benchmark by clicking legend items.
 * Uses DOM-based legend clicks to match the original Jest benchmark approach.
 *
 * @param chart - Chart instance
 * @param options - Chart options (container and series array will be read)
 * @param visibilityState - Mutable visibility state object (updated to track toggles)
 * @param count - Number of toggles to perform
 * @returns Elapsed time in milliseconds
 */
export async function performLegendToggle(
    chart: AgChartInstance,
    options: AgChartOptions,
    visibilityState: SeriesVisibilityState,
    count: number
): Promise<number> {
    const container = options.container;
    if (!container) return 0;

    const seriesCount = options.series?.length ?? 0;
    if (seriesCount === 0) return 0;

    // Ensure chart is stable before timing (matches performZoom pattern)
    await chart.waitForUpdate();

    const start = performance.now();

    for (let i = 0; i < count; i++) {
        const seriesIndex = i % seriesCount;
        // Update visibility state to track what we're toggling (for consistency)
        visibilityState.visible[seriesIndex] = !visibilityState.visible[seriesIndex];

        // Click the legend button (matches Jest benchmark approach)
        legendToggle(container, seriesIndex);
        await waitForAsyncEventTriggeredUpdate(chart);
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
        // Simulate hover at different positions across the chart (element-relative coordinates)
        const x = width * 0.1 + width * 0.8 * (i / count);
        const y = height * 0.5;

        hover(container, x, y);
        await waitForAsyncEventTriggeredUpdate(chart);
    }

    // Clear highlight — must target the inner element the chart listens on, same as hover()
    const leaveTarget =
        (container.querySelector('.ag-charts-series-area') as HTMLElement) ??
        (container.querySelector('canvas') as HTMLElement) ??
        container;
    leaveTarget.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

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
    const newItems = generator.take(batchSize);
    dataRef.data = dataRef.data.concat(newItems);

    const start = performance.now();
    await chart.applyTransaction({ add: newItems });
    await waitForAsyncEventTriggeredUpdate(chart);
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
    const itemsToRemove = dataRef.data.slice(0, batchSize);
    dataRef.data = dataRef.data.slice(batchSize);

    const start = performance.now();
    await chart.applyTransaction({ remove: itemsToRemove });
    await waitForAsyncEventTriggeredUpdate(chart);
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
    const itemsToRemove = dataRef.data.slice(0, batchSize);
    const newItems = generator.take(batchSize);
    dataRef.data = dataRef.data.slice(batchSize).concat(newItems);

    const start = performance.now();
    if (method === 'applyTransaction') {
        await chart.applyTransaction({ add: newItems, remove: itemsToRemove });
    } else {
        await chart.updateDelta({ data: dataRef.data });
    }
    await waitForAsyncEventTriggeredUpdate(chart);
    return performance.now() - start;
}

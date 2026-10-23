import type { BBox, ChartAxisDirection, Mutex } from 'ag-charts-core';

import type { PreSeriesUpdateEvent } from '../../core/eventsHub';
import type { ChartCaption } from '../chartCaption';
import { type ChartOrProxy, deproxy } from './utils';

// The state `Chart.preSeriesUpdate` reads is private, and the method itself is protected.
interface PreSeriesUpdateHost {
    _requiredRange: number;
    _requiredRangeDirection: ChartAxisDirection;
    preSeriesUpdate(): void;
}

export interface PreSeriesUpdateInput {
    seriesRect: BBox;
    requiredRange: number;
    requiredRangeDirection: ChartAxisDirection;
}

/**
 * Puts the chart in the state described by `input` and runs its pre-series update, which tells the modules listening
 * to `update:pre-series` how much of the series area a required range takes. Returns the event they received, or
 * `undefined` if the chart emitted none.
 */
export function firePreSeriesUpdate(
    chartOrProxy: ChartOrProxy<any>,
    { seriesRect, requiredRange, requiredRangeDirection }: PreSeriesUpdateInput
): PreSeriesUpdateEvent | undefined {
    const chart = deproxy(chartOrProxy);
    let received: PreSeriesUpdateEvent | undefined;
    const off = chart.ctx.eventsHub.on('update:pre-series', (event) => {
        received = event;
    });

    const host = chart as unknown as PreSeriesUpdateHost;
    chart.seriesRect = seriesRect;
    host._requiredRange = requiredRange;
    host._requiredRangeDirection = requiredRangeDirection;
    host.preSeriesUpdate();

    off();
    return received;
}

// The chart serialises its updates behind a private mutex.
interface UpdateMutexHost {
    updateMutex: Pick<Mutex, 'acquire' | 'waitForClearAcquireQueue'>;
}

/**
 * Resolves once every update the chart has queued behind its update mutex, including the teardown `destroy()` defers
 * to it, has run.
 */
export function waitForUpdateQueueDrain(chartOrProxy: ChartOrProxy<any>): Promise<void> {
    return (deproxy(chartOrProxy) as unknown as UpdateMutexHost).updateMutex.waitForClearAcquireQueue();
}

/**
 * Takes the chart's update mutex, as a running update does, so anything the chart queues behind it (an update, the
 * teardown `destroy()` defers) waits. Returns a release function that lets the held update finish and resolves once
 * it has.
 */
export function holdUpdateMutex(chartOrProxy: ChartOrProxy<any>): () => Promise<void> {
    const { updateMutex } = deproxy(chartOrProxy) as unknown as UpdateMutexHost;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const held = updateMutex.acquire(() => gate);
    return () => {
        release();
        return held;
    };
}

// The caption's accessibility proxy element is private to the caption.
interface CaptionProxyElementHost {
    proxyText?: { getElement(): HTMLElement };
}

/** The DOM element a caption exposes as its accessibility proxy (its click target), or `undefined` if it has none. */
export function getCaptionProxyElement(caption: ChartCaption): HTMLElement | undefined {
    return (caption as unknown as CaptionProxyElementHost).proxyText?.getElement();
}

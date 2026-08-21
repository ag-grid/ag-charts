import {
    ChartAxisDirection,
    ChartUpdateType,
    CleanupRegistry,
    isDate,
    isFiniteNumber,
    isNumber,
    isString,
    pickDirectionZoom,
} from 'ag-charts-core';
import type { DynamicContext, ZoomMinMax } from 'ag-charts-core';
import type { AgDataSourceCallbackParams, AgZoomEventSource } from 'ag-charts-types';

import type { UpdateCompleteEvent, ZoomChangeCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import type { AxisLike, ChartLike, UpdateProcessor } from './processor';

const DEFAULT_ZOOM: ZoomMinMax = { min: 0, max: 1 };

function isWindowBound(value: unknown): value is string | number | Date {
    return isString(value) || isNumber(value) || isDate(value);
}

export class DataWindowProcessor implements UpdateProcessor {
    private dirtyZoom = false;
    private dirtyDataSource = false;
    private zoomSource: AgZoomEventSource | undefined;
    private readonly lastAxisZooms = new Map<string, ZoomMinMax>();
    private lastWindow: AgDataSourceCallbackParams | undefined;
    private requestCounter = 0;
    private latestRequestId: number | undefined;
    private readonly errorRollbacks = new Map<
        number,
        {
            window: AgDataSourceCallbackParams | undefined;
            axisId: string | undefined;
            axisZoom: ZoomMinMax | undefined;
        }
    >();

    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly chart: ChartLike,
        private readonly ctx: DynamicContext<ChartRegistry>
    ) {
        this.cleanup.register(
            ctx.eventsHub.on('data:source-change', () => this.onDataSourceChange()),
            ctx.eventsHub.on('data:load', () => this.onDataLoad()),
            ctx.eventsHub.on('data:error', (e) => this.onDataError(e)),
            ctx.eventsHub.on('data:render-verdict', (e) => this.onRenderVerdict(e)),
            ctx.eventsHub.on('update:complete', (e) => this.onUpdateComplete(e)),
            ctx.eventsHub.on('zoom:change-complete', (e) => this.onZoomChange(e))
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    private onDataLoad() {
        // A renderable-shaped load can still fail against the series keys, so its rollback state
        // must survive until `data:render-verdict` confirms the render.
        this.ctx.animationManager.skip();
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.UPDATE_DATA });
    }

    private onDataError(event: { requestId?: number } | null) {
        this.applyRollback(event?.requestId);
        this.discardRollbacksUpTo(event?.requestId);
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
    }

    private onRenderVerdict({ requestId, rendered }: { requestId?: number; rendered: boolean }) {
        // A load that rendered nothing is retained-not-committed by the chart; restore the gate state
        // it advanced past so an identical re-zoom re-issues the request, mirroring the error path.
        if (!rendered) {
            this.applyRollback(requestId);
        }
        this.discardRollbacksUpTo(requestId);
    }

    private applyRollback(requestId: number | undefined) {
        const rollback = requestId == null ? undefined : this.errorRollbacks.get(requestId);

        // Only the latest outstanding request may roll back the live gates: a stale rollback (an older
        // overlapping request that resolved late) must not clobber a newer request's advance.
        if (rollback && requestId === this.latestRequestId) {
            this.lastWindow = rollback.window;
            if (rollback.axisId != null) {
                if (rollback.axisZoom) {
                    this.lastAxisZooms.set(rollback.axisId, rollback.axisZoom);
                } else {
                    this.lastAxisZooms.delete(rollback.axisId);
                }
            }
        }
    }

    private discardRollbacksUpTo(requestId: number | undefined) {
        if (requestId == null) return;
        for (const id of this.errorRollbacks.keys()) {
            if (id <= requestId) {
                this.errorRollbacks.delete(id);
            }
        }
    }

    private onDataSourceChange() {
        this.dirtyDataSource = true;
    }

    private onUpdateComplete(event: UpdateCompleteEvent) {
        if (!event.apiUpdate && !this.dirtyZoom && !this.dirtyDataSource) return;

        // If the update was shortcut, skip the window update as we are expecting another update shortly.
        if (event.wasShortcut) return;

        this.updateWindow(event);
    }

    private onZoomChange(event: ZoomChangeCompleteEvent) {
        this.dirtyZoom = true;
        this.zoomSource = event.source;
    }

    private updateWindow(event: UpdateCompleteEvent) {
        if (!this.ctx.dataService.isLazy()) return;

        const axis = this.chart.axes.find(({ direction }) => direction === ChartAxisDirection.X);

        const priorWindow = this.lastWindow;
        const priorAxisZoom = axis ? this.lastAxisZooms.get(axis.id) : undefined;

        let window: AgDataSourceCallbackParams | undefined;
        let shouldRefresh = true;

        if (axis) {
            const zoom = pickDirectionZoom(this.ctx.chartState.getValue('zoom'), axis.direction) ?? DEFAULT_ZOOM;
            window = this.getPendingWindow() ?? this.getAxisWindow(axis, zoom);
            shouldRefresh = this.shouldRefresh(event, axis, zoom, window);
        }

        const source: AgZoomEventSource = this.dirtyZoom && this.zoomSource ? this.zoomSource : 'chart-update';

        this.dirtyZoom = false;
        this.dirtyDataSource = false;
        this.zoomSource = undefined;
        this.lastWindow = window;

        if (!shouldRefresh) return;

        // Snapshot the gate state per request id so a failure can restore it (see onDataError)
        // without overlapping requests corrupting each other's rollback.
        const requestId = this.requestCounter++;
        this.latestRequestId = requestId;
        this.errorRollbacks.set(requestId, { window: priorWindow, axisId: axis?.id, axisZoom: priorAxisZoom });

        this.ctx.dataService.load(
            { windowStart: window?.windowStart, windowEnd: window?.windowEnd, source },
            requestId
        );
    }

    private shouldRefresh(
        event: UpdateCompleteEvent,
        axis: AxisLike,
        zoom: ZoomMinMax,
        window: AgDataSourceCallbackParams | undefined
    ) {
        const { lastAxisZooms, lastWindow } = this;

        if (event.apiUpdate) return true;
        if (this.dirtyDataSource) return true;
        if (!this.dirtyZoom) return false;

        const lastZoom = lastAxisZooms.get(axis.id);
        if (zoom.min === lastZoom?.min && zoom.max === lastZoom?.max) {
            return false;
        }

        lastAxisZooms.set(axis.id, zoom);

        if (
            window &&
            lastWindow &&
            window.windowStart?.valueOf() === lastWindow.windowStart?.valueOf() &&
            window.windowEnd?.valueOf() === lastWindow.windowEnd?.valueOf()
        ) {
            return false;
        }

        return true;
    }

    /**
     * The window an unresolved `initialState.zoom.rangeX` asks for, stated in data space so it needs
     * no domain to interpret. Requesting it directly both honours the request on the first fetch and
     * gives the axis the domain it needs to resolve the memento.
     */
    private getPendingWindow(): AgDataSourceCallbackParams | undefined {
        const range = this.ctx.zoomManager?.getPendingRangeX();
        if (!range) return;

        const { start, end } = range;
        if (!isWindowBound(start) || !isWindowBound(end)) return;

        return { windowStart: start, windowEnd: end };
    }

    private getAxisWindow(axis: AxisLike, zoom: ZoomMinMax): AgDataSourceCallbackParams | undefined {
        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        if (axis.scale.domainMin == null || axis.scale.domainMax == null) return;

        const [d0, d1] = extents;

        let windowStart;
        let windowEnd;

        if (d0 <= d1) {
            windowStart = axis.scale.invert(0, true); // 0 is the start of the visible axis
            windowEnd = axis.scale.invert(d0 + (d1 - d0) * zoom.max, true);
        } else {
            windowStart = axis.scale.invert(d0 - (d0 - d1) * zoom.min, true);
            windowEnd = axis.scale.invert(0, true);
        }

        return { windowStart, windowEnd };
    }

    private getDomainPixelExtents(axis: AxisLike) {
        const [d0, d1] = axis.scale.range;

        if (!isFiniteNumber(d0) || !isFiniteNumber(d1)) return;

        return [d0, d1];
    }
}

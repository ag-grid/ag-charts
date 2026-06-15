import {
    ChartAxisDirection,
    ChartUpdateType,
    CleanupRegistry,
    isFiniteNumber,
    pickDirectionZoom,
} from 'ag-charts-core';
import type { DynamicContext, ZoomMinMax } from 'ag-charts-core';
import type { AgDataSourceCallbackParams, AgZoomEventSource } from 'ag-charts-types';

import type { UpdateCompleteEvent, ZoomChangeCompleteEvent } from '../../core/eventsHub';
import type { ChartRegistry } from '../../module/moduleContext';
import type { AxisLike, ChartLike, UpdateProcessor } from './processor';

const DEFAULT_ZOOM: ZoomMinMax = { min: 0, max: 1 };

export class DataWindowProcessor implements UpdateProcessor {
    private dirtyZoom = false;
    private dirtyDataSource = false;
    private zoomSource: AgZoomEventSource | undefined;
    private readonly lastAxisZooms = new Map<string, ZoomMinMax>();
    private lastWindow: AgDataSourceCallbackParams | undefined;

    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly chart: ChartLike,
        private readonly ctx: DynamicContext<ChartRegistry>
    ) {
        this.cleanup.register(
            ctx.eventsHub.on('data:source-change', () => this.onDataSourceChange()),
            ctx.eventsHub.on('data:load', () => this.onDataLoad()),
            ctx.eventsHub.on('data:error', () => this.onDataError()),
            ctx.eventsHub.on('update:complete', (e) => this.onUpdateComplete(e)),
            ctx.eventsHub.on('zoom:change-complete', (e) => this.onZoomChange(e))
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    private onDataLoad() {
        this.ctx.animationManager.skip();
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.UPDATE_DATA });
    }

    private onDataError() {
        this.ctx.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
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

        let window: AgDataSourceCallbackParams | undefined;
        let shouldRefresh = true;

        if (axis) {
            const zoom = pickDirectionZoom(this.ctx.chartState.getValue('zoom'), axis.direction) ?? DEFAULT_ZOOM;
            window = this.getAxisWindow(axis, zoom);
            shouldRefresh = this.shouldRefresh(event, axis, zoom, window);
        }

        const source: AgZoomEventSource = this.dirtyZoom && this.zoomSource ? this.zoomSource : 'chart-update';

        this.dirtyZoom = false;
        this.dirtyDataSource = false;
        this.zoomSource = undefined;
        this.lastWindow = window;

        if (!shouldRefresh) return;

        this.ctx.dataService.load({ windowStart: window?.windowStart, windowEnd: window?.windowEnd, source });
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

    private getAxisWindow(axis: AxisLike, zoom: ZoomMinMax): AgDataSourceCallbackParams | undefined {
        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

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

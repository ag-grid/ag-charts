import { ChartAxisDirection, ChartUpdateType, CleanupRegistry, isFiniteNumber } from 'ag-charts-core';
import type { ZoomMinMax } from 'ag-charts-core';

import type { EventsHub } from '../../core/eventsHub';
import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { ZoomManager } from '../interaction/zoomManager';
import type { UpdateCompleteEvent, UpdateService } from '../updateService';
import type { AxisLike, ChartLike, UpdateProcessor } from './processor';

export class DataWindowProcessor<D extends object> implements UpdateProcessor {
    private dirtyZoom = false;
    private dirtyDataSource = false;
    private readonly lastAxisZooms = new Map<string, ZoomMinMax>();

    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly chart: ChartLike,
        private readonly eventsHub: EventsHub,
        private readonly dataService: DataService<D>,
        private readonly updateService: UpdateService,
        private readonly zoomManager: ZoomManager,
        private readonly animationManager: AnimationManager
    ) {
        this.cleanup.register(
            this.eventsHub.on('data:source-change', () => this.onDataSourceChange()),
            this.eventsHub.on('data:load', () => this.onDataLoad()),
            this.eventsHub.on('data:error', () => this.onDataError()),
            this.updateService.addListener('update-complete', (e) => this.onUpdateComplete(e)),
            this.eventsHub.on('zoom:change-complete', () => this.onZoomChange())
        );
    }

    public destroy() {
        this.cleanup.flush();
    }

    private onDataLoad() {
        this.animationManager.skip();
        this.eventsHub.emit('chart:request-update', { type: ChartUpdateType.UPDATE_DATA });
    }

    private onDataError() {
        this.eventsHub.emit('chart:request-update', { type: ChartUpdateType.PERFORM_LAYOUT });
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

    private onZoomChange() {
        this.dirtyZoom = true;
    }

    private updateWindow(event: UpdateCompleteEvent) {
        if (!this.dataService.isLazy()) return;

        const axis = this.chart.axes.find(({ direction }) => direction === ChartAxisDirection.X);

        let window;
        let shouldRefresh = true;

        if (axis) {
            const zoom = this.zoomManager.getAxisZoom(axis.id);
            window = this.getAxisWindow(axis, zoom);
            shouldRefresh = this.shouldRefresh(event, axis, zoom);
        }

        this.dirtyZoom = false;
        this.dirtyDataSource = false;

        if (!shouldRefresh) return;

        this.dataService.load({ windowStart: window?.start, windowEnd: window?.end });
    }

    private shouldRefresh(event: UpdateCompleteEvent, axis: AxisLike, zoom: ZoomMinMax) {
        if (event.apiUpdate) return true;
        if (this.dirtyDataSource) return true;
        if (!this.dirtyZoom) return false;

        const lastZoom = this.lastAxisZooms.get(axis.id);
        if (lastZoom && zoom.min === lastZoom.min && zoom.max === lastZoom.max) {
            return false;
        }

        this.lastAxisZooms.set(axis.id, zoom);

        return true;
    }

    private getAxisWindow(axis: AxisLike, zoom: ZoomMinMax) {
        const extents = this.getDomainPixelExtents(axis);
        if (!extents) return;

        const [d0, d1] = extents;

        let start;
        let end;

        if (d0 <= d1) {
            start = axis.scale.invert(0, true); // 0 is the start of the visible axis
            end = axis.scale.invert(d0 + (d1 - d0) * zoom.max, true);
        } else {
            start = axis.scale.invert(d0 - (d0 - d1) * zoom.min, true);
            end = axis.scale.invert(0, true);
        }

        return { start, end };
    }

    private getDomainPixelExtents(axis: AxisLike) {
        const [d0, d1] = axis.scale.range;

        if (!isFiniteNumber(d0) || !isFiniteNumber(d1)) return;

        return [d0, d1];
    }
}

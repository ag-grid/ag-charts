import { CleanupRegistry } from 'ag-charts-core';

import type { EventsHub, ZoomState } from '../../core/eventsHub';
import { ChartUpdateType } from '../chartUpdateType';
import type { DataService } from '../data/dataService';
import type { AnimationManager } from '../interaction/animationManager';
import type { ZoomManager } from '../interaction/zoomManager';
import type { UpdateCompleteEvent, UpdateService } from '../updateService';
import type { AxisLike, ChartLike, UpdateProcessor } from './processor';

export class DataWindowProcessor<D extends object> implements UpdateProcessor {
    private dirtyZoom = false;
    private dirtyDataSource = false;
    private readonly lastAxisZooms = new Map<string, ZoomState>();

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
        this.updateService.update(ChartUpdateType.UPDATE_DATA);
    }

    private onDataError() {
        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT);
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

        const axis = this.getValidAxis();

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

        this.dataService.load({ windowStart: window?.min, windowEnd: window?.max });
    }

    private getValidAxis() {
        return this.chart.axes.find((axis) => axis.type === 'time');
    }

    private shouldRefresh(event: UpdateCompleteEvent, axis: AxisLike, zoom: ZoomState) {
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

    private getAxisWindow(axis: AxisLike, zoom: ZoomState) {
        const { domain } = axis.scale;

        if (!zoom || domain.length === 0 || Number.isNaN(Number(domain[0]))) return;

        const diff = Number(domain[1]) - Number(domain[0]);

        const min = new Date(Number(domain[0]) + diff * zoom.min);
        const max = new Date(Number(domain[0]) + diff * zoom.max);

        return { min, max };
    }
}

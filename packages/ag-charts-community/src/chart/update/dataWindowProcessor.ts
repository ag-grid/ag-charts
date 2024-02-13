import { ChartUpdateType } from '../chartUpdateType';
import type { DataService } from '../data/dataService';
import type { ZoomManager } from '../interaction/zoomManager';
import type { UpdateService } from '../updateService';
import type { AxisLike, ChartLike, UpdateProcessor } from './processor';

export class DataWindowProcessor<D extends object> implements UpdateProcessor {
    private dirtyZoom = false;
    private dirtyDataSource = false;
    private lastAxisZooms = new Map();

    private destroyFns: (() => void)[] = [];

    constructor(
        private readonly chart: ChartLike,
        private readonly dataService: DataService<D>,
        private readonly updateService: UpdateService,
        private readonly zoomManager: ZoomManager
    ) {
        this.destroyFns.push(
            this.dataService.addListener('data-source-change', () => this.onDataSourceChange()),
            this.dataService.addListener('data-load', () => this.onDataLoad()),
            this.updateService.addListener('update-complete', () => this.onUpdateComplete()),
            this.zoomManager.addListener('zoom-change', () => this.onZoomChange())
        );
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private onDataLoad() {
        this.updateService.update(ChartUpdateType.UPDATE_DATA);
    }

    private onDataSourceChange() {
        this.dirtyDataSource = true;
    }

    private onUpdateComplete() {
        if (!this.dirtyZoom && !this.dirtyDataSource) return;
        this.updateWindow();
    }

    private onZoomChange() {
        this.dirtyZoom = true;
    }

    private async updateWindow() {
        if (!this.dataService.isLazy()) return;

        const axis = this.getValidAxis();
        const window = axis ? this.getAxisWindow(axis) : null;

        this.dirtyZoom = false;
        this.dirtyDataSource = false;
        this.dataService.load({ windowStart: window?.min, windowEnd: window?.max });
    }

    private getValidAxis() {
        return this.chart.axes.find((axis) => axis.type === 'time');
    }

    private getAxisWindow(axis: AxisLike) {
        const zoom = this.zoomManager.getAxisZoom(axis.id);
        const domain = axis.scale.getDomain?.();

        if (!zoom || !domain || domain.length === 0 || isNaN(Number(domain[0]))) return;

        if (!this.dirtyDataSource) {
            // Only run the callback if the zoom has changed on this axis, ignoring invalid axes
            const lastZoom = this.lastAxisZooms.get(axis.id);
            if (lastZoom && zoom.min === lastZoom.min && zoom.max === lastZoom.max) return;
        }

        this.lastAxisZooms.set(axis.id, zoom);

        const diff = Number(domain[1]) - Number(domain[0]);

        const min = new Date(Number(domain[0]) + diff * zoom.min);
        const max = new Date(Number(domain[0]) + diff * zoom.max);

        return { min, max };
    }
}

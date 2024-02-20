import { ChartUpdateType } from '../chartUpdateType';
import type { DataService } from '../data/dataService';
import type { ZoomManager, ZoomState } from '../interaction/zoomManager';
import type { LayoutCompleteEvent, LayoutService } from '../layout/layoutService';
import type { UpdateService } from '../updateService';
import type { AxisLike, ChartLike, UpdateProcessor } from './processor';

type Window = {
    min: Date;
    max: Date;
};

export class DataWindowProcessor<D extends object> implements UpdateProcessor {
    private dirtyZoom = false;
    private dirtyDataSource = false;
    private dirtyLayout = false;
    private lastChartSize: { width: number; height: number } | undefined = undefined;
    private lastAxisWindows = new Map<string, Window>();

    private destroyFns: (() => void)[] = [];

    constructor(
        private readonly chart: ChartLike,
        private readonly dataService: DataService<D>,
        private readonly updateService: UpdateService,
        private readonly layoutService: LayoutService,
        private readonly zoomManager: ZoomManager
    ) {
        this.destroyFns.push(
            this.dataService.addListener('data-source-change', () => this.onDataSourceChange()),
            this.dataService.addListener('data-load', () => this.onDataLoad()),
            this.dataService.addListener('data-error', () => this.onDataError()),
            this.updateService.addListener('update-complete', () => this.onUpdateComplete()),
            this.layoutService.addListener('layout-complete', (e) => this.onLayoutChange(e)),
            this.zoomManager.addListener('zoom-change', () => this.onZoomChange())
        );
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private onDataLoad() {
        this.updateService.update(ChartUpdateType.UPDATE_DATA);
    }

    private onDataError() {
        this.updateService.update(ChartUpdateType.PERFORM_LAYOUT);
    }

    private onDataSourceChange() {
        this.dirtyDataSource = true;
    }

    private onUpdateComplete() {
        if (!this.dirtyZoom && !this.dirtyDataSource && !this.dirtyLayout) return;
        this.updateWindow();
    }

    private onZoomChange() {
        this.dirtyZoom = true;
    }

    private onLayoutChange(e: LayoutCompleteEvent) {
        if (
            this.lastChartSize == null ||
            this.lastChartSize.width !== e.chart.width ||
            this.lastChartSize.width !== e.chart.width
        ) {
            this.dirtyLayout = true;
        }
        this.lastChartSize = e.chart;
    }

    private async updateWindow() {
        if (!this.dataService.isLazy()) return;

        const axis = this.getValidAxis();

        let window;
        let shouldRefresh = true;

        if (axis) {
            const zoom = this.zoomManager.getAxisZoom(axis.id);
            window = this.getAxisWindow(axis, zoom);
            shouldRefresh = window != null ? this.shouldRefresh(axis, window) : true;
        }

        this.dirtyZoom = false;
        this.dirtyDataSource = false;
        this.dirtyLayout = false;

        if (!shouldRefresh) return;

        this.dataService.load({ windowStart: window?.min, windowEnd: window?.max });
    }

    private getValidAxis() {
        return this.chart.axes.find((axis) => axis.type === 'time');
    }

    private shouldRefresh(axis: AxisLike, window: Window) {
        if (this.dirtyDataSource) return true;
        if (!this.dirtyZoom && !this.dirtyLayout) return false;

        const lastWindow = this.lastAxisWindows.get(axis.id);
        if (lastWindow != null && window.min === lastWindow.min && window.max === lastWindow.max) {
            return false;
        }

        this.lastAxisWindows.set(axis.id, window);

        return true;
    }

    private getAxisWindow(axis: AxisLike, zoom: ZoomState): Window | undefined {
        const domain = axis.scale.getDomain?.();

        if (!zoom || !domain || domain.length === 0 || isNaN(Number(domain[0]))) return;

        const diff = Number(domain[1]) - Number(domain[0]);

        const min = new Date(Number(domain[0]) + diff * zoom.min);
        const max = new Date(Number(domain[0]) + diff * zoom.max);

        return { min, max };
    }
}

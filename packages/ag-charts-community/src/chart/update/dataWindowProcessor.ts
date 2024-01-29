import { ChartUpdateType } from '../chartUpdateType';
import type { DataService } from '../data/dataService';
import type { ZoomManager } from '../interaction/zoomManager';
import type { UpdateService } from '../updateService';
import type { ChartLike, UpdateProcessor } from './processor';

interface AxisDomain {
    id: string;
    type: string;
    min: any;
    max: any;
}

export class DataWindowProcessor<D extends object> implements UpdateProcessor {
    // Flags if a zoom change has come in before the initial full data load, in which case we need to refetch the data
    // with the new zoom state after the update has completed.
    private isDirty = false;

    private destroyFns: (() => void)[] = [];

    constructor(
        private readonly chart: ChartLike,
        private readonly dataService: DataService<D>,
        private readonly updateService: UpdateService,
        private readonly zoomManager: ZoomManager
    ) {
        this.destroyFns.push(
            this.updateService.addListener('update-complete', () => this.onUpdateComplete()),
            this.zoomManager.addListener('zoom-change', () => this.onZoomChange())
        );
    }

    public destroy() {
        this.destroyFns.forEach((cb) => cb());
    }

    private onUpdateComplete() {
        if (!this.isDirty) return;
        this.updateWindow();
    }

    private onZoomChange() {
        this.isDirty = true;
        this.updateWindow();
    }

    private async updateWindow() {
        if (!this.dataService.isLazy()) {
            return;
        }
        this.isDirty = false;
        const domains = this.getValidAxisDomains();
        const data = await this.dataService.fetchFullAndWindow(domains);
        this.dataService.update(data);
        this.updateService.update(ChartUpdateType.UPDATE_DATA);
    }

    private getValidAxisDomains() {
        const domains: Array<AxisDomain> = [];

        for (const axis of this.chart.axes) {
            if (axis.type !== 'time') continue;

            const zoom = this.zoomManager.getAxisZoom(axis.id);
            const domain = axis.scale.getDomain?.();

            if (!domain || !zoom) continue;

            const diff = Number(domain[1]) - Number(domain[0]);

            domains.push({
                id: axis.id,
                type: axis.type,
                min: new Date(Number(domain[0]) + diff * zoom.min),
                max: new Date(Number(domain[0]) + diff * zoom.max),
            });
        }

        return domains;
    }
}

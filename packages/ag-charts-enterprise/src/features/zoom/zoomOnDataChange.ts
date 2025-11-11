import { _ModuleSupport } from 'ag-charts-community';
import { BaseProperties, Logger, Property } from 'ag-charts-core';
import type { CleanupRegistry, DeepRequired } from 'ag-charts-core';
import type { AgZoomOnDataChange, AgZoomOnDataChangeStrategy } from 'ag-charts-types';

type ModuleContext = Pick<_ModuleSupport.ModuleContext, 'dataService' | 'eventsHub' | 'zoomManager'>;

// `chart.zoom.onDataChange` options
export class ZoomOnDataChangeProperties extends BaseProperties implements DeepRequired<AgZoomOnDataChange> {
    @Property
    // TODO(olegat): change default to 'preserveDomain'
    strategy: AgZoomOnDataChangeStrategy = 'resize';
}

export class ZoomOnDataChange {
    constructor(
        private readonly properties: ZoomOnDataChangeProperties,
        private readonly ctx: ModuleContext,
        eventsCleanup: CleanupRegistry
    ) {
        eventsCleanup.register(ctx.eventsHub.on('data:load', (e) => this.onDataLoad(e)));
        eventsCleanup.register(ctx.eventsHub.on('data:update', (e) => this.onDataUpdate(e)));
    }

    destroy(): void {}

    private onDataLoad(_e: _ModuleSupport.EventsHubMap['data:load']): void {
        this.performUpdateStrategy();
    }

    private onDataUpdate(_e: _ModuleSupport.EventsHubMap['data:update']): void {
        this.performUpdateStrategy();
    }

    private performUpdateStrategy() {
        switch (this.properties.strategy) {
            case 'reset':
                return this.ctx.zoomManager.resetZoom('zoom-on-data-change');
            case 'resize':
                return; // do nothing (keep ZoomManager min/max ratios unchanged).
            case 'preserveDomain':
            case 'preserveData':
                return Logger.error(`unimplemented strategy: ${this.properties.strategy}`);
            default:
                const unreachable = (a: never): never => a;
                return unreachable(this.properties.strategy);
        }
    }
}

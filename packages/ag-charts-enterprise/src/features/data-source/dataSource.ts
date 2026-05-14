import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, type DynamicContext } from 'ag-charts-core';

export class DataSource extends AbstractModuleInstance {
    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();

        const { dataService } = ctx;

        let dirty: boolean = false;
        this.cleanup.register(
            ctx.eventsHub.on('data:load', () => {
                dirty = true;
            }),
            ctx.eventsHub.on('layout:complete', () => {
                if (dirty) {
                    ctx.zoomManager?.updateZoom({ source: 'data-update', sourceDetail: 'dataSource' });
                }
            }),
            ctx.chartState.observe((get) => {
                const enabled = get('options', 'dataSource.enabled') ?? true;
                const getData = get('options', 'dataSource.getData');
                if (enabled && getData != null) {
                    dataService.updateCallback(getData);
                } else {
                    dataService.clearCallback();
                }
            }),
            ctx.chartState.observe((get) => {
                const requestThrottle = get('options', 'dataSource.requestThrottle');
                if (requestThrottle != null) dataService.requestThrottle = requestThrottle;
            }),
            ctx.chartState.observe((get) => {
                const updateThrottle = get('options', 'dataSource.updateThrottle');
                if (updateThrottle != null) dataService.dispatchThrottle = updateThrottle;
            }),
            ctx.chartState.observe((get) => {
                const updateDuringInteraction = get('options', 'dataSource.updateDuringInteraction');
                if (updateDuringInteraction != null) dataService.dispatchOnlyLatest = !updateDuringInteraction;
            })
        );
    }
}

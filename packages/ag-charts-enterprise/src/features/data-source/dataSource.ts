import { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, ActionOnSet, type DynamicContext, Property } from 'ag-charts-core';
import type { AgDataSourceCallbackParams } from 'ag-charts-types';

export class DataSource extends AbstractModuleInstance {
    @ActionOnSet<DataSource>({
        newValue(enabled) {
            this.updateCallback(enabled, this.getData);
        },
    })
    @Property
    public enabled = true;

    @ActionOnSet<DataSource>({
        newValue(getData) {
            this.updateCallback(this.enabled, getData);
        },
    })
    @Property
    public getData: (params: AgDataSourceCallbackParams) => Promise<unknown> = () => Promise.resolve();

    @ActionOnSet<DataSource>({
        newValue(requestThrottle) {
            this.dataService.requestThrottle = requestThrottle;
        },
    })
    public requestThrottle?: number;

    @ActionOnSet<DataSource>({
        newValue(updateThrottle) {
            this.dataService.dispatchThrottle = updateThrottle;
        },
    })
    public updateThrottle?: number;

    @ActionOnSet<DataSource>({
        newValue(updateDuringInteraction) {
            this.dataService.dispatchOnlyLatest = !updateDuringInteraction;
        },
    })
    public updateDuringInteraction?: boolean;

    private readonly dataService: DynamicContext<_ModuleSupport.ChartRegistry>['dataService'];

    constructor(ctx: DynamicContext<_ModuleSupport.ChartRegistry>) {
        super();
        this.dataService = ctx.dataService;

        let dirty: boolean = false;
        this.cleanup.register(
            ctx.eventsHub.on('data:load', () => {
                dirty = true;
            }),
            ctx.eventsHub.on('layout:complete', () => {
                if (dirty) {
                    ctx.zoomManager?.updateZoom({ source: 'data-update', sourceDetail: 'dataSource' });
                }
            })
        );
    }

    private updateCallback(enabled: boolean, getData: (params: AgDataSourceCallbackParams) => Promise<unknown>) {
        if (!this.dataService) return;

        if (enabled && getData != null) {
            this.dataService.updateCallback(getData);
        } else {
            this.dataService.clearCallback();
        }
    }
}

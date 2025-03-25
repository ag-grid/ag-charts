import { _ModuleSupport } from 'ag-charts-community';

const { ActionOnSet, Property } = _ModuleSupport;

interface DataSourceGetDataCallbackParams {
    windowStart?: Date;
    windowEnd?: Date;
}

export class DataSource extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<DataSource>({
        newValue(enabled) {
            this.updateCallback(enabled, this.getData);
        },
    })
    @Property
    public enabled = false;

    @ActionOnSet<DataSource>({
        newValue(getData) {
            this.updateCallback(this.enabled, getData);
        },
    })
    @Property
    public getData: (params: DataSourceGetDataCallbackParams) => Promise<unknown> = () => Promise.resolve();

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

    private readonly dataService: _ModuleSupport.ModuleContext['dataService'];

    constructor(ctx: _ModuleSupport.ModuleContext) {
        super();
        this.dataService = ctx.dataService;
    }

    private updateCallback(enabled: boolean, getData: (params: DataSourceGetDataCallbackParams) => Promise<unknown>) {
        if (!this.dataService) return;

        if (enabled && getData != null) {
            this.dataService.updateCallback(getData);
        } else {
            this.dataService.clearCallback();
        }
    }
}

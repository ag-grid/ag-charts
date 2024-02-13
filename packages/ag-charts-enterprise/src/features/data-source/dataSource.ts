import { _ModuleSupport } from 'ag-charts-community';

const { BOOLEAN, FUNCTION, ActionOnSet, Validate } = _ModuleSupport;

export interface DataSourceGetDataCallbackParams {
    windowStart?: Date;
    windowEnd?: Date;
}

export class DataSource extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    @ActionOnSet<DataSource>({
        newValue(enabled) {
            this.updateCallback(enabled, this.getData);
        },
    })
    @Validate(BOOLEAN)
    public enabled = false;

    @ActionOnSet<DataSource>({
        newValue(getData) {
            this.updateCallback(this.enabled, getData);
        },
    })
    @Validate(FUNCTION)
    public getData: (params: DataSourceGetDataCallbackParams) => Promise<unknown> = () => Promise.resolve();

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

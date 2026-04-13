import type { _ModuleSupport } from 'ag-charts-community';
import { AbstractModuleInstance, Property } from 'ag-charts-core';

function unused(_val: unknown): void {
    // TODO - remove this;
}

export class DataSelection extends AbstractModuleInstance {
    @Property
    enabled: boolean = false;

    @Property
    enableClick: boolean = true;

    constructor(private readonly ctx: _ModuleSupport.ModuleContext) {
        super();
        unused(this.ctx);
    }
}
